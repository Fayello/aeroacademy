import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LabsService } from '../labs/labs.service';
import { TeamEnrollmentsService } from '../team-enrollments/team-enrollments.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private labsService: LabsService,
    private teamEnrollmentsService: TeamEnrollmentsService,
  ) {}

  async createTeam(ownerId: string, name: string, description?: string) {
    return this.teamEnrollmentsService.createTeam(ownerId, name, description, 'PUBLIC');
  }

  async getMyTeams(ownerId: string) {
    return this.prisma.team.findMany({
      where: { ownerId },
      include: {
        _count: { select: { teamMembers: true } },
      },
    });
  }

  async addMemberToTeam(teamId: string, userId: string, requesterId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId }, select: { ownerId: true } });
    if (!team) throw new NotFoundException('Team not found');
    if (team.ownerId !== requesterId) throw new ForbiddenException('You do not own this team');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.teamId) throw new ForbiddenException('User is already in a team');

    await this.prisma.teamMember.create({
      data: { teamId, userId, role: 'MEMBER' },
    });
    await this.prisma.user.update({
      where: { id: userId },
      data: { teamId },
    });

    return this.prisma.team.findUnique({ where: { id: teamId }, include: { teamMembers: true } });
  }

  async getTeamProgress(teamId: string, requesterId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId }, select: { ownerId: true } });
    if (!team) throw new NotFoundException('Team not found');
    if (team.ownerId !== requesterId) throw new ForbiddenException('You do not own this team');
    return this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            xp: true,
            rank: true,
            labSubmissions: {
              where: { isCorrect: true },
              include: { flag: true },
            },
          },
        },
      },
    });
  }

  /**
   * Classroom Mode: Bulk provision labs for a team
   */
  async bulkProvisionLab(teamId: string, labId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, members: { select: { id: true } } },
    });

    if (!team) throw new NotFoundException('Team not found');

    const results = await Promise.allSettled(
      team.members.map(async (member) => {
        const instance = await this.labsService.startLab(member.id, labId);
        return { userId: member.id, status: 'SUCCESS' as const, instanceId: instance.id };
      }),
    );

    return results.map((r, i) =>
      r.status === 'fulfilled'
        ? r.value
        : { userId: team.members[i].id, status: 'FAILED' as const, error: r.reason?.message || String(r.reason) },
    );
  }

  /**
   * Classroom Mode: Bulk terminate labs for a team
   */
  async bulkTerminateLab(teamId: string, labId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, members: { select: { id: true } } },
    });

    if (!team) throw new NotFoundException('Team not found');

    for (const member of team.members) {
      await this.labsService.stopLab(member.id, labId).catch(() => {});
    }
    return { success: true, count: team.members.length };
  }

  async createChallenge(data: {
    type: string;
    title: string;
    description: string;
    difficulty: string;
    objectiveType: string;
    objectiveTarget: number;
    xpReward: number;
    startAt: string;
    endAt: string;
    domainId?: string;
    skillId?: string;
    metadata?: any;
  }) {
    return this.prisma.challenge.create({
      data: {
        type: data.type,
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        objectiveType: data.objectiveType,
        objectiveTarget: data.objectiveTarget,
        xpReward: data.xpReward,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        domainId: data.domainId || null,
        skillId: data.skillId || null,
        metadata: data.metadata || null,
      },
    });
  }

  async updateChallenge(
    id: string,
    data: {
      type?: string;
      title?: string;
      description?: string;
      difficulty?: string;
      objectiveType?: string;
      objectiveTarget?: number;
      xpReward?: number;
      startAt?: string;
      endAt?: string;
      isActive?: boolean;
      domainId?: string;
      skillId?: string;
      metadata?: any;
    },
  ) {
    const existing = await this.prisma.challenge.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Challenge not found');

    return this.prisma.challenge.update({
      where: { id },
      data: {
        ...(data.type !== undefined && { type: data.type }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.difficulty !== undefined && { difficulty: data.difficulty }),
        ...(data.objectiveType !== undefined && { objectiveType: data.objectiveType }),
        ...(data.objectiveTarget !== undefined && { objectiveTarget: data.objectiveTarget }),
        ...(data.xpReward !== undefined && { xpReward: data.xpReward }),
        ...(data.startAt !== undefined && { startAt: new Date(data.startAt) }),
        ...(data.endAt !== undefined && { endAt: new Date(data.endAt) }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.domainId !== undefined && { domainId: data.domainId || null }),
        ...(data.skillId !== undefined && { skillId: data.skillId || null }),
        ...(data.metadata !== undefined && { metadata: data.metadata }),
      },
    });
  }

  async deleteChallenge(id: string) {
    const existing = await this.prisma.challenge.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Challenge not found');

    return this.prisma.challenge.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getAllChallenges(type?: string) {
    return this.prisma.challenge.findMany({
      where: type ? { type } : {},
      include: {
        domain: { select: { id: true, name: true, displayName: true } },
        skill: { select: { id: true, name: true, displayName: true } },
        _count: { select: { userChallenges: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAnalyticsOverview() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalStudents,
      totalCourses,
      totalLessons,
      totalLabs,
      totalMasterClasses,
      totalTrainers,
      totalTeams,
      totalOrganizations,
      lessonsCompleted,
      quizSubmissions,
      flagsSolved,
      activeUsers30d,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.course.count(),
      this.prisma.lesson.count(),
      this.prisma.lab.count(),
      this.prisma.masterClass.count(),
      this.prisma.trainer.count(),
      this.prisma.team.count(),
      this.prisma.organization.count(),
      this.prisma.progress.count({ where: { completed: true } }),
      this.prisma.quizSubmission.count(),
      this.prisma.labSubmission.count({ where: { isCorrect: true } }),
      this.prisma.user.count({ where: { lastActivityDate: { gte: thirtyDaysAgo } } }),
    ]);

    const userGrowthRaw = await this.prisma.user.groupBy({
      by: ['createdAt'],
      _count: true,
      where: { createdAt: { gte: sixtyDaysAgo } },
      orderBy: { createdAt: 'asc' },
    });
    const userGrowthMap: Record<string, number> = {};
    for (const row of userGrowthRaw) {
      const date = row.createdAt.toISOString().split('T')[0];
      userGrowthMap[date] = (userGrowthMap[date] || 0) + row._count;
    }
    const userGrowth = Object.entries(userGrowthMap).map(([date, count]) => ({ date, count }));

    const roleDistribution = (await this.prisma.user.groupBy({
      by: ['role'],
      _count: true,
    })).map((r) => ({ role: r.role, count: r._count }));

    const divisionDistribution = (await this.prisma.user.groupBy({
      by: ['division'],
      _count: true,
    })).map((d) => ({ division: d.division || 'UNRANKED', count: d._count }));

    const levelDistributionRaw = await this.prisma.user.findMany({
      select: { xp: true },
    });
    const levelMap: Record<number, number> = {};
    for (const u of levelDistributionRaw) {
      const level = Math.floor((u.xp || 0) / 1000) + 1;
      levelMap[level] = (levelMap[level] || 0) + 1;
    }
    const levelDistribution = Object.entries(levelMap)
      .map(([level, count]) => ({ level: parseInt(level), count }))
      .sort((a, b) => a.level - b.level);

    const courses = await this.prisma.course.findMany({
      include: {
        sections: { include: { lessons: { select: { id: true } } } },
        enrollments: { select: { userId: true } },
      },
    });
    const courseStats = await Promise.all(
      courses.slice(0, 20).map(async (c) => {
        const lessonIds = c.sections.flatMap((s) => s.lessons.map((l) => l.id));
        const total = lessonIds.length;
        const completed = total > 0
          ? await this.prisma.progress.count({
              where: { completed: true, lessonId: { in: lessonIds } },
            })
          : 0;
        return {
          courseId: c.id,
          courseTitle: c.title,
          totalLessons: total,
          completed,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
          students: c.enrollments.length,
        };
      }),
    );

    const labs = await this.prisma.lab.findMany({
      include: {
        instances: { select: { id: true, userId: true } },
        flags: { include: { submissions: { select: { isCorrect: true, userId: true } } } },
      },
    });
    const labStats = labs.slice(0, 20).map((l) => {
      const allSubmissions = l.flags.flatMap((f) => f.submissions);
      const solvers = new Set(allSubmissions.filter((s) => s.isCorrect).map((s) => s.userId));
      return {
        labId: l.id,
        labTitle: l.title,
        difficulty: l.difficulty,
        starts: l.instances.length,
        flagsSolved: allSubmissions.filter((s) => s.isCorrect).length,
        solvers: solvers.size,
      };
    });

    const quizStatsRaw = await this.prisma.quizSubmission.findMany({
      select: { passed: true },
    });
    const quizSubs = quizStatsRaw.length;
    const quizPassed = quizStatsRaw.filter((s) => s.passed).length;

    const flagStatsRaw = await this.prisma.labSubmission.groupBy({
      by: ['isCorrect'],
      _count: true,
    });
    const flagCorrect = flagStatsRaw.find((f) => f.isCorrect)?._count || 0;
    const flagIncorrect = flagStatsRaw.find((f) => !f.isCorrect)?._count || 0;

    const topPerformers = await this.prisma.user.findMany({
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
        _count: { select: { achievements: true, labSubmissions: { where: { isCorrect: true } }, progress: { where: { completed: true } } } },
      },
    });

    return {
      totals: {
        users: totalUsers,
        students: totalStudents,
        courses: totalCourses,
        lessons: totalLessons,
        labs: totalLabs,
        masterClasses: totalMasterClasses,
        trainers: totalTrainers,
        teams: totalTeams,
        organizations: totalOrganizations,
        lessonsCompleted,
        quizSubmissions,
        flagsSolved,
        activeUsers30d,
      },
      userGrowth,
      roleDistribution,
      divisionDistribution,
      levelDistribution,
      courseStats,
      labStats,
      quizStats: { submissions: quizSubs, passed: quizPassed, failed: quizSubs - quizPassed, passRate: quizSubs > 0 ? Math.round((quizPassed / quizSubs) * 100) : 0 },
      flagStats: { correct: flagCorrect, incorrect: flagIncorrect },
      activity: [],
      topPerformers: topPerformers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        xp: u.xp,
        level: Math.floor((u.xp || 0) / 1000) + 1,
        division: u.division || 'UNRANKED',
        organization: u.organization?.name || null,
        city: u.city,
        achievements: u._count.achievements,
        flagsSolved: u._count.labSubmissions,
        lessonsCompleted: u._count.progress,
      })),
    };
  }

  async getInstitutionalInquiries(filters: { status?: string; type?: string }) {
    const where = {
      ...(filters.status ? { status: filters.status as 'NEW' | 'REVIEWING' | 'CONTACTED' | 'QUALIFIED' | 'CLOSED' } : {}),
      ...(filters.type ? { inquiryType: filters.type as 'UNIVERSITY' | 'ENTERPRISE' } : {}),
    };

    const [items, totals] = await Promise.all([
      this.prisma.institutionalInquiry.findMany({
        where,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.institutionalInquiry.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    return {
      items,
      totals: totals.reduce<Record<string, number>>((acc, row) => {
        acc[row.status] = row._count;
        return acc;
      }, {}),
    };
  }

  async updateInstitutionalInquiry(
    id: string,
    actorId: string,
    data: { status?: 'NEW' | 'REVIEWING' | 'CONTACTED' | 'QUALIFIED' | 'CLOSED'; notes?: string },
  ) {
    const existing = await this.prisma.institutionalInquiry.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Inquiry not found');

    return this.prisma.institutionalInquiry.update({
      where: { id },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        assignedToId: actorId,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async getCommunityProgramApplications(filters: { status?: string; type?: string }) {
    const where = {
      ...(filters.status
        ? { status: filters.status as 'NEW' | 'REVIEWING' | 'INTERVIEW' | 'ACCEPTED' | 'CLOSED' }
        : {}),
      ...(filters.type
        ? { programType: filters.type as 'AMBASSADOR' | 'VOLUNTEER' }
        : {}),
    };

    const [items, totals] = await Promise.all([
      this.prisma.communityProgramApplication.findMany({
        where,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.communityProgramApplication.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    return {
      items,
      totals: totals.reduce<Record<string, number>>((acc, row) => {
        acc[row.status] = row._count;
        return acc;
      }, {}),
    };
  }

  async updateCommunityProgramApplication(
    id: string,
    actorId: string,
    data: { status?: 'NEW' | 'REVIEWING' | 'INTERVIEW' | 'ACCEPTED' | 'CLOSED'; notes?: string },
  ) {
    const existing = await this.prisma.communityProgramApplication.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Community application not found');

    return this.prisma.communityProgramApplication.update({
      where: { id },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        assignedToId: actorId,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }
}
