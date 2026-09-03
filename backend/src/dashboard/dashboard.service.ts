import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Docker from 'dockerode';
import * as os from 'os';

@Injectable()
export class DashboardService implements OnModuleInit {
  private docker: Docker;
  private dockerStatsCache: {
    data: {
      containerId: string;
      labId: string | null;
      labName: string;
      cpu: number;
      memory: number;
      network: number;
      status: string;
    }[];
    timestamp: number;
  } | null = null;
  private readonly DOCKER_STATS_TTL_MS = 8000;

  constructor(private prisma: PrismaService) {
    this.docker = new Docker();
  }

  async onModuleInit() {
    // Initialization if needed
  }

  async getPublicStats() {
    const [totalStudents, totalCourses, totalLabs, totalLessons] = await Promise.all([
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.course.count(),
      this.prisma.lab.count(),
      this.prisma.lesson.count(),
    ]);
    return { totalStudents, totalCourses, totalLabs, totalLessons };
  }

  async getDashboardHome(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true, xp: true, rank: true, division: true },
    });

    const [activeLabs, enrolledCourses, notifications, unreadCount] = await Promise.all([
      this.prisma.labInstance.findMany({
        where: { userId, status: 'RUNNING' },
        include: { lab: { select: { id: true, title: true, difficulty: true, imageUrl: true, dockerImage: true } } },
        orderBy: { createdAt: 'desc' },
      }).catch(() => []),
      this.prisma.courseEnrollment.findMany({
        where: { userId },
        include: { course: { select: { id: true, title: true, description: true, imageUrl: true } } },
        orderBy: { enrolledAt: 'desc' },
        take: 5,
      }).catch(() => []),
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }).catch(() => []),
      this.prisma.notification.count({
        where: { userId, read: false },
      }).catch(() => 0),
    ]);

    return {
      streak: user?.currentStreak || 0,
      xp: user?.xp || 0,
      rank: user?.rank || 0,
      division: user?.division || 'BRONZE',
      activeLabs,
      enrolledCourses,
      notifications,
      unreadCount,
    };
  }

  async getSystemIntelligence(userId?: string) {
    // 1. Fetch latest activities (Logs)
    const latestProgress = await this.prisma.progress.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        lesson: { select: { title: true } },
      },
    });

    const latestSubmissions = await this.prisma.labSubmission.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        flag: { select: { title: true } },
      },
    });

    const logs = [
      ...latestProgress.map((p) => ({
        id: `p-${p.userId}-${p.lessonId}`,
        type: 'SUCCESS' as const,
        msg: `Operator ${p.user.name || p.user.email} completed ${p.lesson.title}`,
        time: p.updatedAt,
      })),
      ...latestSubmissions.map((s) => ({
        id: `s-${s.id}`,
        type: s.isCorrect ? 'SUCCESS' : ('ERROR' as const),
        msg: `Operator ${s.user.name || s.user.email} ${s.isCorrect ? 'captured' : 'failed'} objective: ${s.flag.title}`,
        time: s.createdAt,
      })),
    ]
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, 10);

    // 2. Fetch System Metrics (CPU/RAM)
    const cpuCount = os.cpus().length;
    const cpuUsage = Math.min(
      Math.round((os.loadavg()[0] / cpuCount) * 100),
      100,
    );
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);

    // 3. System Alerts — computed from real data
    let name = 'Operative';
    let city = 'Yaoundé';
    let orgName = 'XpertClass';

    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { organization: true },
      });
      if (user) {
        name = user.name?.split(' ')[0] || 'Operative';
        city = user.city || 'Yaoundé';
        orgName = user.organization?.name || 'XpertClass';
      }
    }

    const [totalUsers, totalLabs, activeContainers] = await Promise.all([
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.lab.count(),
      this.docker
        .listContainers({ all: true })
        .then(
          (containers) =>
            containers.filter(
              (c) =>
                c.Names.some((n) => n.includes('/lab-')) &&
                c.State === 'running',
            ).length,
        )
        .catch(() => 0),
    ]);

    const alerts = [
      {
        id: 'WELCOME',
        type: 'INFO' as const,
        title: `Welcome, ${name}`,
        message: `${totalUsers} operatives are training across ${totalLabs} labs.`,
      },
      {
        id: 'NETWORK',
        type: activeContainers > 0 ? ('WARNING' as const) : ('INFO' as const),
        title: 'Lab Network',
        message: `${activeContainers} lab instance${activeContainers !== 1 ? 's' : ''} currently active.`,
      },
      {
        id: 'LEAGUE',
        type: 'INFO' as const,
        title: `${orgName} League`,
        message: `Your regional node in ${city} is online and operational.`,
      },
    ];
    const currentAlert = alerts[Math.floor(Date.now() / 30000) % alerts.length];

    // 4. Fetch Lab/Docker Stats
    let activeLabs = 0;
    let networkLoad = 0;
    try {
      const containers = await this.docker.listContainers();
      const labContainers = containers.filter((c) =>
        c.Names.some((n) => n.includes('lab-')),
      );
      activeLabs = labContainers.length;

      // Calculate real network load from lab containers
      let totalRxBytes = 0;
      for (const container of labContainers) {
        try {
          const stats = await this.docker
            .getContainer(container.Id)
            .stats({ stream: false });
          totalRxBytes += stats.networks?.eth0?.rx_bytes || 0;
        } catch {
          /* skip */
        }
      }
      // Normalize to a 0-100 scale (1MB = ~100%)
      networkLoad = Math.min(
        Math.round((totalRxBytes / (1024 * 1024)) * 100),
        100,
      );
    } catch {
      // Ignore
    }

    const maxCapacity = parseInt(process.env.LAB_MAX_CONCURRENT || '20', 10);

    return {
      logs,
      metrics: {
        cpu: cpuUsage,
        ram: memUsage,
        activeLabs,
        networkLoad,
      },
      intelligence: currentAlert,
      stats: {
        totalUsers: await this.prisma.user.count(),
        totalLessons: await this.prisma.lesson.count(),
        completedLessons: await this.prisma.progress.count({
          where: { completed: true },
        }),
        maxCapacity,
      },
    };
  }

  async getLabTelemetry() {
    if (
      this.dockerStatsCache &&
      Date.now() - this.dockerStatsCache.timestamp < this.DOCKER_STATS_TTL_MS
    ) {
      return this.dockerStatsCache.data;
    }

    try {
      const containers = await this.docker.listContainers();
      const labContainers = containers.filter((c) =>
        c.Names.some((n) => n.includes('lab-')),
      );
      const activeInstances = await this.prisma.labInstance.findMany({
        where: {
          status: 'RUNNING',
          containerId: { not: null },
        },
        select: {
          containerId: true,
          labId: true,
          lab: {
            select: {
              title: true,
            },
          },
        },
      });
      const instanceByContainerId = new Map(
        activeInstances
          .filter((instance) => instance.containerId)
          .map((instance) => [
            instance.containerId as string,
            { labId: instance.labId, labTitle: instance.lab.title },
          ]),
      );

      const telemetry = await Promise.all(
        labContainers.map(async (container) => {
          const instanceMeta = instanceByContainerId.get(container.Id);
          try {
            const stats = await this.docker
              .getContainer(container.Id)
              .stats({ stream: false });

            const cpuDelta =
              stats.cpu_stats.cpu_usage.total_usage -
              stats.precpu_stats.cpu_usage.total_usage;
            const systemDelta =
              stats.cpu_stats.system_cpu_usage -
              stats.precpu_stats.system_cpu_usage;
            const cpuPercent =
              (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100.0;

            const memPercent =
              (stats.memory_stats.usage / stats.memory_stats.limit) * 100.0;

            return {
              containerId: container.Id,
              labId: instanceMeta?.labId || null,
              labName:
                instanceMeta?.labTitle || container.Names[0].replace(/^\//, ''),
              cpu: Math.min(Math.round(cpuPercent || 0), 100),
              memory: Math.round(memPercent || 0),
              network:
                Math.round((stats.networks?.eth0?.rx_bytes || 0) / 1024) || 0,
              status: container.Status,
            };
          } catch {
            return {
              containerId: container.Id,
              labId: instanceMeta?.labId || null,
              labName:
                instanceMeta?.labTitle || container.Names[0].replace(/^\//, ''),
              cpu: 0,
              memory: 0,
              network: 0,
              status: container.Status,
            };
          }
        }),
      );

      this.dockerStatsCache = { data: telemetry, timestamp: Date.now() };
      return telemetry;
    } catch {
      return [];
    }
  }

  async getUserMetrics(userId: string) {
    const latestProgress = await this.prisma.progress.findFirst({
      where: { userId },
      include: {
        lesson: { include: { section: { include: { course: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { achievements: { include: { achievement: true } } },
    });

    const xp = user?.xp || 0;
    const level = Math.floor(xp / 1000) + 1;

    // Calculate streak from actual activity
    const recentActivity = await this.prisma.progress.findMany({
      where: { userId, completed: true },
      orderBy: { updatedAt: 'desc' },
      take: 30,
    });
    let streak = 0;
    if (recentActivity.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (let i = 0; i < 30; i++) {
        const dayStart = new Date(today);
        dayStart.setDate(dayStart.getDate() - i);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        const hasActivity = recentActivity.some(
          (a) => a.updatedAt >= dayStart && a.updatedAt < dayEnd,
        );
        if (hasActivity) streak++;
        else break;
      }
    }

    // Calculate course progress
    let totalLessonsInCourse = 0;
    let completedInCourse = 0;

    if (latestProgress) {
      const courseId = latestProgress.lesson.section.courseId;
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: { sections: { include: { lessons: true } } },
      });

      if (course) {
        course.sections.forEach((s) => {
          totalLessonsInCourse += s.lessons.length;
        });

        completedInCourse = await this.prisma.progress.count({
          where: {
            userId,
            completed: true,
            lesson: { section: { courseId } },
          },
        });
      }
    }

    return {
      id: userId,
      xp,
      level,
      streak,
      division: user?.division || 'BRONZE',
      rank: user?.rank || 1200,
      clearance:
        level > 10
          ? 'EXPERT_STUDENT'
          : level > 5
            ? 'CERTIFIED_L2'
            : 'STUDENT_L1',
      latestProgress,
      courseProgress:
        totalLessonsInCourse > 0
          ? Math.round((completedInCourse / totalLessonsInCourse) * 100)
          : 0,
      achievements: user?.achievements.map((a) => a.achievement) || [],
    };
  }
}
