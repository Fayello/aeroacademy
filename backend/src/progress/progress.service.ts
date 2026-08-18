import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AchievementService } from '../dashboard/achievement.service';
import { getLevel, getRequiredSectionLevel } from '../common/level.util';

@Injectable()
export class ProgressService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => AchievementService))
    private achievementService: AchievementService,
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
    }

    return progress.progress;
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
