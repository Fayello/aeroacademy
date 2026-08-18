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
import { getLevel, getRequiredSectionLevel } from '../common/level.util';

const MILESTONE_THRESHOLDS = [25, 50, 75, 100];
const MILESTONE_LABELS: Record<number, string> = {
  25: '25% Complete — Quarter Way!',
  50: '50% Complete — Halfway There!',
  75: '75% Complete — Almost Done!',
  100: '100% Complete — Course Finished!',
};

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => AchievementService))
    private achievementService: AchievementService,
    private emailService: EmailService,
  ) {}

  async startLesson(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { section: { select: { courseId: true } } },
    });
    if (!lesson) throw new BadRequestException('Lesson not found');

    // Touch enrollment lastActivityAt
    await this.prisma.courseEnrollment.updateMany({
      where: { userId, courseId: lesson.section.courseId },
      data: { lastActivityAt: new Date() },
    }).catch(() => {});

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
      include: { quiz: true, lab: true, section: { include: { course: true } } },
    });

    if (!lesson) throw new BadRequestException('Lesson not found');

    // Touch enrollment lastActivityAt
    await this.prisma.courseEnrollment.updateMany({
      where: { userId, courseId: lesson.section.courseId },
      data: { lastActivityAt: new Date() },
    }).catch(() => {});

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

      if (!alreadyCompleted) {
        await tx.user.update({
          where: { id: userId },
          data: { xp: { increment: 100 } },
        });
      }

      return { progress: p, wasNew: !alreadyCompleted };
    });

    if (progress.wasNew) {
      await this.achievementService.checkAndUnlockAchievements(userId);

      // Update streak
      await this.updateStreak(userId);

      // Check milestones
      await this.checkMilestones(userId, lesson.section.courseId);

      // Level up detection
      const freshUser = await this.prisma.user.findUnique({ where: { id: userId } });
      if (freshUser) {
        const newLevel = getLevel(freshUser.xp);
        if (newLevel > oldLevel) {
          this.emailService.sendLevelUp(freshUser.email, freshUser.name, newLevel).catch(() => {});
        }

        // Lesson completion confirmation (with progress %)
        const courseProgress = await this.getCourseProgress(userId, lesson.section.courseId);
        this.emailService.sendLessonCompleted(
          freshUser.email,
          freshUser.name,
          lesson.title,
          lesson.section.course.title,
          lesson.section.courseId,
          courseProgress.percentage,
        ).catch(() => {});
      }
    }

    return progress.progress;
  }

  private async updateStreak(userId: string) {
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
    const diffDays = Math.floor((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return; // Already active today

    const newStreak = diffDays === 1 ? user.currentStreak + 1 : 1;
    const bonusXp = diffDays === 1 && newStreak % 7 === 0 ? 500 : 0; // 500 bonus every 7-day streak

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak: newStreak,
        longestStreak: Math.max(user.longestStreak, newStreak),
        lastActivityDate: today,
        ...(bonusXp > 0 ? { xp: { increment: bonusXp } } : {}),
      },
    });
  }

  private async checkMilestones(userId: string, courseId: string) {
    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) return;

    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
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
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user?.email) {
          this.emailService
            .sendMilestoneAchieved(user.email, user.name, course.title, courseId, MILESTONE_LABELS[threshold])
            .catch(() => {});
        }

        // Record milestone sent
        sentMilestones.push(threshold);
        await this.prisma.courseEnrollment.update({
          where: { userId_courseId: { userId, courseId } },
          data: { milestonesSent: sentMilestones },
        });

        this.logger.log(`Milestone ${threshold}% reached for user ${userId} in course "${course.title}"`);
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
}
