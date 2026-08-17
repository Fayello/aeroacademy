import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  private bucketByDay(
    items: { createdAt: Date }[],
    days: number,
  ): { date: string; count: number }[] {
    const buckets: Record<string, number> = {};
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      buckets[d.toISOString().slice(0, 10)] = 0;
    }
    for (const item of items) {
      const key = new Date(item.createdAt).toISOString().slice(0, 10);
      if (key in buckets) buckets[key] += 1;
    }
    return Object.entries(buckets).map(([date, count]) => ({ date, count }));
  }

  private bucketByDayMulti(
    items: {
      date: string;
      lessons: number;
      flags: number;
      quizzes: number;
      registrations: number;
    }[],
    days: number,
  ) {
    const buckets: Record<
      string,
      {
        date: string;
        lessons: number;
        flags: number;
        quizzes: number;
        registrations: number;
      }
    > = {};
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      buckets[d.toISOString().slice(0, 10)] = {
        date: d.toISOString().slice(0, 10),
        lessons: 0,
        flags: 0,
        quizzes: 0,
        registrations: 0,
      };
    }
    for (const item of items) {
      if (buckets[item.date]) {
        buckets[item.date].lessons += item.lessons;
        buckets[item.date].flags += item.flags;
        buckets[item.date].quizzes += item.quizzes;
        buckets[item.date].registrations += item.registrations;
      }
    }
    return Object.values(buckets);
  }

  async getOverview() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const safeCount = (p: Promise<number>) => p.catch(() => 0);
    const safeFindMany = <T>(p: Promise<T[]>): Promise<T[]> => p.catch(() => []);
    const safeGroupBy = <T>(p: Promise<T[]>): Promise<T[]> => p.catch(() => []);

    const [
      userCount,
      studentCount,
      courseCount,
      lessonCount,
      labCount,
      masterClassCount,
      trainerCount,
      teamCount,
      organizationCount,
      lessonCompletionCount,
      quizSubmissionCount,
      quizPassedCount,
      correctFlagCount,
      incorrectFlagCount,
      recentUsers,
      recentProgress,
      recentFlags,
      recentQuizzes,
      roleDist,
      divisionDist,
      usersForLevels,
      courses,
      completedProgressRows,
      labs,
      labStarts,
      flags,
      correctByFlag,
      flagSolvers,
      topPerformers,
    ] = await Promise.all([
      safeCount(this.prisma.user.count()),
      safeCount(this.prisma.user.count({ where: { role: 'STUDENT' } })),
      safeCount(this.prisma.course.count()),
      safeCount(this.prisma.lesson.count()),
      safeCount(this.prisma.lab.count()),
      safeCount(this.prisma.masterClass.count()),
      safeCount(this.prisma.trainer.count()),
      safeCount(this.prisma.team.count()),
      safeCount(this.prisma.organization.count()),
      safeCount(this.prisma.progress.count({ where: { completed: true } })),
      safeCount(this.prisma.quizSubmission.count()),
      safeCount(this.prisma.quizSubmission.count({ where: { passed: true } })),
      safeCount(this.prisma.labSubmission.count({ where: { isCorrect: true } })),
      safeCount(this.prisma.labSubmission.count({ where: { isCorrect: false } })),
      safeFindMany(this.prisma.user.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
      })),
      safeFindMany(this.prisma.progress.findMany({
        where: { completed: true, updatedAt: { gte: fourteenDaysAgo } },
        select: { updatedAt: true },
      })),
      safeFindMany(this.prisma.labSubmission.findMany({
        where: { isCorrect: true, createdAt: { gte: fourteenDaysAgo } },
        select: { createdAt: true },
      })),
      safeFindMany(this.prisma.quizSubmission.findMany({
        where: { createdAt: { gte: fourteenDaysAgo } },
        select: { createdAt: true },
      })),
      safeGroupBy(this.prisma.user.groupBy({ by: ['role'], _count: { _all: true } })),
      safeGroupBy(this.prisma.user.groupBy({ by: ['division'], _count: { _all: true } })),
      safeFindMany(this.prisma.user.findMany({ select: { xp: true } })),
      safeFindMany(this.prisma.course.findMany({
        include: {
          sections: { include: { lessons: { select: { id: true } } } },
        },
      })),
      safeFindMany(this.prisma.progress.findMany({
        where: { completed: true },
        select: { lessonId: true, userId: true },
      })),
      safeFindMany(this.prisma.lab.findMany({
        select: { id: true, title: true, difficulty: true },
      })),
      safeGroupBy(this.prisma.labInstance.groupBy({
        by: ['labId'],
        _count: { _all: true },
      })),
      safeFindMany(this.prisma.labFlag.findMany({ select: { id: true, labId: true } })),
      safeGroupBy(this.prisma.labSubmission.groupBy({
        by: ['flagId'],
        where: { isCorrect: true },
        _count: { _all: true },
      })),
      safeGroupBy(this.prisma.labSubmission.groupBy({
        by: ['flagId', 'userId'],
        where: { isCorrect: true },
        _count: { _all: true },
      })),
      safeFindMany(this.prisma.user.findMany({
        where: { role: 'STUDENT' },
        orderBy: { xp: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          email: true,
          xp: true,
          division: true,
          city: true,
          organization: { select: { name: true } },
          _count: {
            select: {
              achievements: true,
              labSubmissions: { where: { isCorrect: true } },
              progress: { where: { completed: true } },
            },
          },
        },
      })),
    ]);

    // === Level distribution (from XP) ===
    const levelBuckets: Record<number, number> = {};
    for (const u of usersForLevels) {
      const level = Math.floor(u.xp / 1000) + 1;
      levelBuckets[level] = (levelBuckets[level] || 0) + 1;
    }
    const levelDistribution = Object.entries(levelBuckets)
      .map(([level, count]) => ({ level: parseInt(level), count }))
      .sort((a, b) => a.level - b.level);

    // === Course completion stats ===
    const lessonToCourse = new Map<
      string,
      { courseId: string; courseTitle: string }
    >();
    for (const course of courses) {
      for (const section of course.sections) {
        for (const lesson of section.lessons) {
          lessonToCourse.set(lesson.id, {
            courseId: course.id,
            courseTitle: course.title,
          });
        }
      }
    }
    const courseAgg: Record<
      string,
      {
        courseId: string;
        courseTitle: string;
        totalLessons: number;
        completed: number;
        students: Set<string>;
      }
    > = {};
    for (const course of courses) {
      const totalLessons = course.sections.reduce(
        (acc, s) => acc + s.lessons.length,
        0,
      );
      courseAgg[course.id] = {
        courseId: course.id,
        courseTitle: course.title,
        totalLessons,
        completed: 0,
        students: new Set(),
      };
    }
    for (const row of completedProgressRows) {
      const courseRef = lessonToCourse.get(row.lessonId);
      if (!courseRef) continue;
      courseAgg[courseRef.courseId].completed += 1;
      courseAgg[courseRef.courseId].students.add(row.userId);
    }
    const courseStats = Object.values(courseAgg)
      .map((c) => ({
        courseId: c.courseId,
        courseTitle: c.courseTitle,
        totalLessons: c.totalLessons,
        completed: c.completed,
        completionRate:
          c.totalLessons > 0
            ? Math.round((c.completed / c.totalLessons) * 100)
            : 0,
        students: c.students.size,
      }))
      .sort((a, b) => b.completed - a.completed);

    // === Lab usage stats ===
    const flagToLab = new Map<string, string>();
    for (const flag of flags) flagToLab.set(flag.id, flag.labId);
    const labStartsMap = new Map(
      labStarts.map((s) => [s.labId, s._count._all]),
    );
    const labSolvedMap = new Map<string, number>();
    for (const row of correctByFlag) {
      const labId = flagToLab.get(row.flagId);
      if (!labId) continue;
      labSolvedMap.set(labId, (labSolvedMap.get(labId) || 0) + row._count._all);
    }
    const labSolversMap = new Map<string, Set<string>>();
    for (const row of flagSolvers) {
      const labId = flagToLab.get(row.flagId);
      if (!labId) continue;
      if (!labSolversMap.has(labId)) labSolversMap.set(labId, new Set());
      labSolversMap.get(labId)!.add(row.userId);
    }
    const labStats = labs
      .map((lab) => ({
        labId: lab.id,
        labTitle: lab.title,
        difficulty: lab.difficulty,
        starts: labStartsMap.get(lab.id) || 0,
        flagsSolved: labSolvedMap.get(lab.id) || 0,
        solvers: labSolversMap.get(lab.id)?.size || 0,
      }))
      .sort((a, b) => b.starts - a.starts);

    // === Active users (any activity in last 30 days) ===
    const activeUserIds = new Set<string>();
    const [activeProgressUsers, activeFlagUsers, activeQuizUsers] =
      await Promise.all([
        this.prisma.progress.groupBy({
          by: ['userId'],
          where: { completed: true, updatedAt: { gte: thirtyDaysAgo } },
        }),
        this.prisma.labSubmission.groupBy({
          by: ['userId'],
          where: { isCorrect: true, createdAt: { gte: thirtyDaysAgo } },
        }),
        this.prisma.quizSubmission.groupBy({
          by: ['userId'],
          where: { createdAt: { gte: thirtyDaysAgo } },
        }),
      ]);
    for (const r of [
      ...activeProgressUsers,
      ...activeFlagUsers,
      ...activeQuizUsers,
    ])
      activeUserIds.add(r.userId);

    const userGrowth = this.bucketByDay(recentUsers, 30);

    const activity = this.bucketByDayMulti(
      [
        ...recentProgress.map((p) => ({
          date: new Date(p.updatedAt).toISOString().slice(0, 10),
          lessons: 1,
          flags: 0,
          quizzes: 0,
          registrations: 0,
        })),
        ...recentFlags.map((f) => ({
          date: new Date(f.createdAt).toISOString().slice(0, 10),
          lessons: 0,
          flags: 1,
          quizzes: 0,
          registrations: 0,
        })),
        ...recentQuizzes.map((q) => ({
          date: new Date(q.createdAt).toISOString().slice(0, 10),
          lessons: 0,
          flags: 0,
          quizzes: 1,
          registrations: 0,
        })),
        ...recentUsers.map((u) => ({
          date: new Date(u.createdAt).toISOString().slice(0, 10),
          lessons: 0,
          flags: 0,
          quizzes: 0,
          registrations: 1,
        })),
      ],
      14,
    );

    const roleDistribution = roleDist.map((r) => ({
      role: r.role,
      count: r._count._all,
    }));
    const divisionDistribution = divisionDist.map((d) => ({
      division: d.division,
      count: d._count._all,
    }));

    return {
      totals: {
        users: userCount,
        students: studentCount,
        courses: courseCount,
        lessons: lessonCount,
        labs: labCount,
        masterClasses: masterClassCount,
        trainers: trainerCount,
        teams: teamCount,
        organizations: organizationCount,
        lessonsCompleted: lessonCompletionCount,
        quizSubmissions: quizSubmissionCount,
        flagsSolved: correctFlagCount,
        activeUsers30d: activeUserIds.size,
      },
      userGrowth,
      roleDistribution,
      divisionDistribution,
      levelDistribution,
      courseStats,
      labStats,
      quizStats: {
        submissions: quizSubmissionCount,
        passed: quizPassedCount,
        failed: quizSubmissionCount - quizPassedCount,
        passRate:
          quizSubmissionCount > 0
            ? Math.round((quizPassedCount / quizSubmissionCount) * 100)
            : 0,
      },
      flagStats: {
        correct: correctFlagCount,
        incorrect: incorrectFlagCount,
      },
      activity,
      topPerformers: topPerformers.map((u) => ({
        id: u.id,
        name: u.name || u.email,
        email: u.email,
        xp: u.xp,
        level: Math.floor(u.xp / 1000) + 1,
        division: u.division,
        organization: u.organization?.name || null,
        city: u.city,
        achievements: u._count.achievements,
        flagsSolved: u._count.labSubmissions,
        lessonsCompleted: u._count.progress,
      })),
    };
  }
}
