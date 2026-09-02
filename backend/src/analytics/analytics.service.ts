import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getEmailStats() {
    const [
      totalUsers,
      verifiedUsers,
      usersWithStreak,
      totalEnrollments,
      totalLessons,
      totalLabSessions,
      totalFlags,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { emailVerified: { not: null } } }),
      this.prisma.user.count({ where: { currentStreak: { gt: 0 } } }),
      this.prisma.courseEnrollment.count(),
      this.prisma.lesson.count(),
      this.prisma.labInstance.count(),
      this.prisma.labSubmission.count({ where: { isCorrect: true } }),
    ]);

    const activeUsers = await this.prisma.user.count({
      where: {
        lastActivityDate: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const inactiveUsers = await this.prisma.user.count({
      where: {
        role: 'STUDENT',
        lastActivityDate: {
          lt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const streakDistribution = await this.prisma.user.groupBy({
      by: ['currentStreak'],
      _count: true,
      where: { currentStreak: { gt: 0 } },
      orderBy: { currentStreak: 'asc' },
    });

    const topCourses = await this.prisma.courseEnrollment.groupBy({
      by: ['courseId'],
      _count: true,
      orderBy: { _count: { courseId: 'desc' } },
      take: 5,
    });

    const courseDetails = await Promise.all(
      topCourses.map(async (e) => {
        const course = await this.prisma.course.findUnique({
          where: { id: e.courseId },
          select: { title: true },
        });
        return {
          courseId: e.courseId,
          title: course?.title || 'Unknown',
          enrollments: e._count,
        };
      }),
    );

    return {
      users: {
        total: totalUsers,
        verified: verifiedUsers,
        active: activeUsers,
        inactive: inactiveUsers,
      },
      engagement: {
        usersWithStreak,
        totalEnrollments,
        totalLessons,
        totalLabSessions,
        totalFlags,
      },
      streakDistribution,
      topCourses: courseDetails,
    };
  }

  async getLearningAnalytics(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        xp: true,
        currentStreak: true,
        longestStreak: true,
        createdAt: true,
      },
    });
    if (!user) return null;

    const enrollments = await this.prisma.courseEnrollment.findMany({
      where: { userId },
      include: { course: { select: { id: true, title: true } } },
    });

    const courseProgress = await Promise.all(
      enrollments.map(async (e) => {
        const total = await this.prisma.lesson.count({
          where: { section: { courseId: e.courseId } },
        });
        const completed = await this.prisma.progress.count({
          where: {
            userId,
            completed: true,
            lesson: { section: { courseId: e.courseId } },
          },
        });
        return {
          courseId: e.courseId,
          title: e.course.title,
          total,
          completed,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
          enrolledAt: e.enrolledAt,
          lastActivityAt: e.lastActivityAt,
        };
      }),
    );

    const totalLessonsCompleted = courseProgress.reduce(
      (sum, c) => sum + c.completed,
      0,
    );
    const totalLabSubmissions = await this.prisma.labSubmission.count({
      where: { userId, isCorrect: true },
    });

    const weeklyActivity = await this.prisma.progress.findMany({
      where: {
        userId,
        completed: true,
        updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      select: { updatedAt: true },
      orderBy: { updatedAt: 'asc' },
    });

    const activityByDay: Record<string, number> = {};
    for (const p of weeklyActivity) {
      const day = new Date(p.updatedAt).toISOString().split('T')[0];
      activityByDay[day] = (activityByDay[day] || 0) + 1;
    }

    return {
      user,
      courseProgress,
      stats: {
        totalCoursesEnrolled: enrollments.length,
        totalLessonsCompleted,
        totalFlagsCaptured: totalLabSubmissions,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
      },
      weeklyActivity: activityByDay,
    };
  }
}
