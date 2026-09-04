import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AchievementService } from '../dashboard/achievement.service';
import { EmailService } from '../email/email.service';
import { MissionService } from '../challenges/mission.service';
import { BadgesService } from '../badges/badges.service';
import { ProgressionService } from '../common/progression.service';
import { getLevel, getRequiredSectionLevel } from '../common/level.util';

const MILESTONE_THRESHOLDS = [25, 50, 75, 100];
const MILESTONE_LABELS: Record<number, string> = {
  25: '25% Complete — Quarter Way!',
  50: '50% Complete — Halfway There!',
  75: '75% Complete — Almost Done!',
  100: '100% Complete — Course Finished!',
};

const BASE_LESSON_XP = 100;
const INLINE_PRACTICE_SOURCE = 'INLINE_PRACTICE_COMPLETED';

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => AchievementService))
    private achievementService: AchievementService,
    private emailService: EmailService,
    private missionService: MissionService,
    private badgesService: BadgesService,
    private progressionService: ProgressionService,
  ) {}

  async startLesson(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { section: { select: { courseId: true } } },
    });
    if (!lesson) throw new BadRequestException('Lesson not found');

    // Touch enrollment lastActivityAt
    await this.prisma.courseEnrollment
      .updateMany({
        where: { userId, courseId: lesson.section.courseId },
        data: { lastActivityAt: new Date() },
      })
      .catch(() => {});

    const existing = await this.prisma.progress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });
    if (existing) return existing;

    return this.prisma.progress.create({
      data: { userId, lessonId, completed: false },
    });
  }

  async markAsComplete(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        quiz: true,
        lab: true,
        inlinePractices: {
          where: { required: true },
          select: { id: true, title: true },
        },
        section: { include: { course: true } },
      },
    });

    if (!lesson) throw new BadRequestException('Lesson not found');

    // Touch enrollment lastActivityAt
    await this.prisma.courseEnrollment
      .updateMany({
        where: { userId, courseId: lesson.section.courseId },
        data: { lastActivityAt: new Date() },
      })
      .catch(() => {});

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const userLevel = getLevel(user.xp);
    const requiredLevel = getRequiredSectionLevel(lesson.section.title);
    if (userLevel < requiredLevel) {
      throw new ForbiddenException(
        `Level ${requiredLevel} required. Your level: ${userLevel}`,
      );
    }

    // Sequential unlock: check that all previous lessons in the section are completed
    const previousLessons = await this.prisma.lesson.findMany({
      where: { sectionId: lesson.sectionId, order: { lt: lesson.order } },
      include: { progress: { where: { userId, completed: true } } },
      orderBy: { order: 'asc' },
    });
    const incompletePrevious = previousLessons.filter(
      (l) => l.progress.length === 0,
    );
    if (incompletePrevious.length > 0) {
      throw new BadRequestException(
        `Complete previous lessons first: ${incompletePrevious.map((l) => l.title).join(', ')}`,
      );
    }

    if (lesson?.quiz) {
      const passedSubmission = await this.prisma.quizSubmission.findFirst({
        where: {
          userId,
          quizId: lesson.quiz.id,
          passed: true,
        },
      });

      if (!passedSubmission) {
        throw new BadRequestException(
          'Technical Verification Required: You must pass the technical quiz for this module before progress can be recorded.',
        );
      }
    }

    if (lesson?.labId) {
      const labCompletion = await this.prisma.labSubmission.findFirst({
        where: {
          userId,
          flag: { labId: lesson.labId },
          isCorrect: true,
        },
      });

      if (!labCompletion) {
        throw new BadRequestException(
          'Lab Completion Required: You must complete at least one lab objective for this module before progress can be recorded.',
        );
      }
    }

    if (lesson.inlinePractices.length > 0) {
      const completedPracticeIds =
        await this.prisma.inlinePracticeSubmission.findMany({
          where: {
            userId,
            isCorrect: true,
            practiceId: { in: lesson.inlinePractices.map((p) => p.id) },
          },
          select: { practiceId: true },
          distinct: ['practiceId'],
        });
      const completedSet = new Set(
        completedPracticeIds.map((submission) => submission.practiceId),
      );
      const missingPractices = lesson.inlinePractices.filter(
        (practice) => !completedSet.has(practice.id),
      );

      if (missingPractices.length > 0) {
        throw new BadRequestException(
          `Inline Practice Required: Complete ${missingPractices.map((practice) => practice.title).join(', ')} before this lesson can be recorded.`,
        );
      }
    }

    // Capture old XP for level up detection
    const oldLevel = getLevel(user.xp);

    const progress = await this.prisma.$transaction(async (tx) => {
      const existingProgress = await tx.progress.findUnique({
        where: { userId_lessonId: { userId, lessonId } },
      });
      const alreadyCompleted = existingProgress?.completed === true;

      const p = await tx.progress.upsert({
        where: { userId_lessonId: { userId, lessonId } },
        update: { completed: true },
        create: { userId, lessonId, completed: true },
      });

      return { progress: p, wasNew: !alreadyCompleted };
    });

    if (progress.wasNew) {
      const xpToAward = this.calculateXpWithMultiplier(userId, BASE_LESSON_XP, {
        xp: user.xp,
        currentStreak: user.currentStreak || 0,
      });

      // Award XP through the progression engine
      await this.progressionService
        .awardXP(userId, {
          amount: xpToAward,
          source: 'LESSON_COMPLETED',
          sourceId: lessonId,
        })
        .catch((err) =>
          this.logger.error('ProgressionService.awardXP failed', err),
        );

      // Check mission progress
      await this.missionService
        .checkProgress(userId, 'LESSON_COMPLETIONS', lessonId)
        .catch((err) =>
          this.logger.error('MissionService.checkProgress failed', err),
        );

      // Update streak
      await this.updateStreak(userId);

      // Check milestones
      await this.checkMilestones(userId, lesson.section.courseId);

      // Check and award badges
      await this.badgesService.checkAndAwardBadges(userId).catch(() => {});

      // Level up detection
      const freshUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (freshUser) {
        const newLevel = getLevel(freshUser.xp);
        if (newLevel > oldLevel) {
          this.emailService
            .sendLevelUp(freshUser.email, freshUser.name, newLevel)
            .catch(() => {});
        }

        // Lesson completion confirmation (with progress %)
        const courseProgress = await this.getCourseProgress(
          userId,
          lesson.section.courseId,
        );
        this.emailService
          .sendLessonCompleted(
            freshUser.email,
            freshUser.name,
            lesson.title,
            lesson.section.course.title,
            lesson.section.courseId,
            courseProgress.percentage,
          )
          .catch(() => {});

        // Course completion detection
        if (courseProgress.percentage === 100) {
          this.emailService
            .sendCourseCompleted(
              freshUser.email,
              freshUser.name,
              lesson.section.course.title,
              lesson.section.courseId,
              courseProgress.completed * 100,
            )
            .catch(() => {});
        }
      }
    }

    return progress.progress;
  }

  async updateStreak(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const lastActivity = user.lastActivityDate;
    if (!lastActivity) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          currentStreak: 1,
          longestStreak: Math.max(user.longestStreak, 1),
          lastActivityDate: today,
        },
      });
      return;
    }

    const lastDay = new Date(lastActivity);
    lastDay.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(
      (today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) return; // Already active today

    // V2: Streak freeze — protect streak on 1-day gap if user has freezes
    if (diffDays === 2 && user.streakFreezes > 0) {
      const freezeUsedToday =
        user.lastStreakFreezeUsedAt &&
        new Date(user.lastStreakFreezeUsedAt).toDateString() ===
          today.toDateString();

      if (!freezeUsedToday) {
        // Use one freeze, keep streak going
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            streakFreezes: user.streakFreezes - 1,
            lastStreakFreezeUsedAt: new Date(),
            lastActivityDate: today,
            // Don't change currentStreak — it stays as-is (frozen)
          },
        });

        this.logger.log(
          `Streak freeze used for user ${userId}. ${user.streakFreezes - 1} remaining.`,
        );
        return;
      }
    }

    const newStreak = diffDays === 1 ? user.currentStreak + 1 : 1;
    const bonusXp = diffDays === 1 && newStreak % 7 === 0 ? 500 : 0; // 500 bonus every 7-day streak

    // Award streak milestone freezes: every 7-day streak grants 1 freeze
    const grantFreeze = diffDays === 1 && newStreak > 0 && newStreak % 7 === 0;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak: newStreak,
        longestStreak: Math.max(user.longestStreak, newStreak),
        lastActivityDate: today,
        ...(grantFreeze ? { streakFreezes: { increment: 1 } } : {}),
      },
    });

    if (bonusXp > 0) {
      await this.progressionService
        .awardXP(userId, {
          amount: bonusXp,
          source: 'STREAK_BONUS',
        })
        .catch((err) =>
          this.logger.error(
            'ProgressionService.awardXP failed for streak bonus',
            err,
          ),
        );
    }

    if (grantFreeze) {
      this.logger.log(
        `Streak freeze awarded to user ${userId} for ${newStreak}-day streak`,
      );
    }
  }

  async getLessonInlinePracticeProgress(userId: string, lessonId: string) {
    const practices = await this.prisma.inlinePractice.findMany({
      where: { lessonId },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        title: true,
        type: true,
        prompt: true,
        instructions: true,
        validationMode: true,
        hints: true,
        maxAttempts: true,
        xpReward: true,
        required: true,
        order: true,
        submissions: {
          where: { userId },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            isCorrect: true,
            score: true,
            feedback: true,
            attemptNumber: true,
            createdAt: true,
          },
        },
      },
    });

    return practices.map((practice) => {
      const latestSubmission = practice.submissions[0] || null;
      const passed = practice.submissions.some(
        (submission) => submission.isCorrect,
      );
      return {
        ...practice,
        submissions: undefined,
        attemptCount: practice.submissions.length,
        passed,
        latestSubmission,
      };
    });
  }

  async submitInlinePractice(
    userId: string,
    practiceId: string,
    answer: string,
  ) {
    const practice = await this.prisma.inlinePractice.findUnique({
      where: { id: practiceId },
      include: {
        lesson: {
          include: {
            section: { select: { courseId: true, title: true } },
          },
        },
      },
    });
    if (!practice) throw new BadRequestException('Inline practice not found');

    const trimmedAnswer = (answer || '').trim();
    if (!trimmedAnswer) {
      throw new BadRequestException('Answer is required');
    }

    const priorSubmissions =
      await this.prisma.inlinePracticeSubmission.findMany({
        where: { userId, practiceId },
        select: { isCorrect: true },
      });
    const alreadyPassed = priorSubmissions.some(
      (submission) => submission.isCorrect,
    );

    if (
      !alreadyPassed &&
      practice.maxAttempts > 0 &&
      priorSubmissions.length >= practice.maxAttempts
    ) {
      throw new BadRequestException(
        'Maximum attempts reached for this inline practice.',
      );
    }

    const result = this.validateInlinePracticeAnswer(
      practice.validationMode,
      practice.expectedAnswer,
      trimmedAnswer,
    );

    const submission = await this.prisma.inlinePracticeSubmission.create({
      data: {
        practiceId,
        userId,
        answer: trimmedAnswer,
        isCorrect: result.isCorrect,
        score: result.score,
        feedback: result.feedback,
        attemptNumber: priorSubmissions.length + 1,
      },
    });

    await this.prisma.courseEnrollment
      .updateMany({
        where: { userId, courseId: practice.lesson.section.courseId },
        data: { lastActivityAt: new Date() },
      })
      .catch(() => {});

    if (result.isCorrect && !alreadyPassed && practice.xpReward > 0) {
      await this.progressionService
        .awardXP(userId, {
          amount: practice.xpReward,
          source: INLINE_PRACTICE_SOURCE,
          sourceId: practice.id,
        })
        .catch((err) =>
          this.logger.error('ProgressionService.awardXP failed', err),
        );
      await this.updateStreak(userId);
    }

    return {
      id: submission.id,
      isCorrect: submission.isCorrect,
      score: submission.score,
      feedback: submission.feedback,
      attemptNumber: submission.attemptNumber,
      xpAwarded: result.isCorrect && !alreadyPassed ? practice.xpReward : 0,
    };
  }

  private validateInlinePracticeAnswer(
    validationMode: string,
    expectedAnswer: string | null,
    answer: string,
  ) {
    if (validationMode === 'MANUAL') {
      return {
        isCorrect: false,
        score: 0,
        feedback: 'Submitted for review.',
      };
    }

    if (!expectedAnswer || !expectedAnswer.trim()) {
      return {
        isCorrect: false,
        score: 0,
        feedback: 'This practice is missing a validation answer.',
      };
    }

    const expected = expectedAnswer.trim();
    const normalizedAnswer = answer.trim().toLowerCase();
    const normalizedExpected = expected.toLowerCase();
    let isCorrect = false;

    if (validationMode === 'CONTAINS') {
      isCorrect = normalizedAnswer.includes(normalizedExpected);
    } else if (validationMode === 'REGEX') {
      try {
        isCorrect = new RegExp(expected, 'i').test(answer);
      } catch {
        return {
          isCorrect: false,
          score: 0,
          feedback: 'This practice has an invalid validation pattern.',
        };
      }
    } else {
      isCorrect = normalizedAnswer === normalizedExpected;
    }

    return {
      isCorrect,
      score: isCorrect ? 100 : 0,
      feedback: isCorrect
        ? 'Correct. Practical evidence recorded.'
        : 'Not yet. Review the lesson, use a hint if available, and try again.',
    };
  }

  private async checkMilestones(userId: string, courseId: string) {
    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) return;

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) return;

    const totalLessons = await this.prisma.lesson.count({
      where: { section: { courseId } },
    });
    if (totalLessons === 0) return;

    const completedLessons = await this.prisma.progress.count({
      where: { userId, completed: true, lesson: { section: { courseId } } },
    });

    const percentage = Math.round((completedLessons / totalLessons) * 100);
    const sentMilestones = (enrollment.milestonesSent as number[]) || [];

    for (const threshold of MILESTONE_THRESHOLDS) {
      if (percentage >= threshold && !sentMilestones.includes(threshold)) {
        // Send milestone email
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
        });
        if (user?.email) {
          this.emailService
            .sendMilestoneAchieved(
              user.email,
              user.name,
              course.title,
              courseId,
              MILESTONE_LABELS[threshold],
            )
            .catch(() => {});
        }

        // Record milestone sent
        sentMilestones.push(threshold);
        await this.prisma.courseEnrollment.update({
          where: { userId_courseId: { userId, courseId } },
          data: { milestonesSent: sentMilestones },
        });

        this.logger.log(
          `Milestone ${threshold}% reached for user ${userId} in course "${course.title}"`,
        );
      }
    }
  }

  async getLatestProgress(userId: string) {
    return this.prisma.progress.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        lesson: {
          include: {
            section: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });
  }

  async getCourseProgress(userId: string, courseId: string) {
    const totalLessons = await this.prisma.lesson.count({
      where: { section: { courseId } },
    });

    const completedLessons = await this.prisma.progress.count({
      where: {
        userId,
        completed: true,
        lesson: { section: { courseId } },
      },
    });

    const startedLessons = await this.prisma.progress.count({
      where: {
        userId,
        lesson: { section: { courseId } },
      },
    });

    return {
      total: totalLessons,
      completed: completedLessons,
      started: startedLessons,
      percentage:
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0,
    };
  }

  private calculateXpWithMultiplier(
    userId: string,
    baseXp: number,
    user: { xp: number; currentStreak: number },
  ): number {
    let multiplier = 1;

    // Streak bonus: +10% per 7-day streak, max +50%
    const streakBonus = Math.min(Math.floor(user.currentStreak / 7) * 0.1, 0.5);
    multiplier += streakBonus;

    // First completion bonus: +50% if this is the user's first lesson
    if (user.xp === 0) {
      multiplier += 0.5;
    }

    return Math.round(baseXp * multiplier);
  }
}
