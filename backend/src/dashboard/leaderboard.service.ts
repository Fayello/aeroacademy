import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type TimeFilter = 'all' | 'month' | 'week';
export type DomainFilter = 'all' | 'SECURITY' | 'NETWORKING' | 'DEVOPS' | 'DATABASES' | 'SYSTEMS' | 'QA';

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService) {}

  async getGlobalLeaderboard(
    limit = 10,
    organizationId?: string,
    city?: string,
  ) {
    const where: Prisma.UserWhereInput = {};
    if (organizationId) where.organizationId = organizationId;
    if (city) where.city = city;

    const users = await this.prisma.user.findMany({
      where,
      take: limit,
      orderBy: { xp: 'desc' }, // XP is the primary measure
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
        xp: true,
        rank: true,
        division: true,
        city: true,
        organization: {
          select: {
            name: true,
            type: true,
          },
        },
        achievements: {
          include: { achievement: true },
        },
      },
    });

    return users.map((user, index) => ({
      position: index + 1,
      id: user.id,
      name: user.username || user.name || 'Operative',
      username: user.username,
      avatarUrl: user.avatarUrl,
      xp: user.xp,
      rank: user.rank || 1200,
      level: Math.floor(user.xp / 1000) + 1,
      achievementsCount: user.achievements.length,
      division: user.division || 'BRONZE',
      organization: user.organization,
      city: user.city,
    }));
  }

  async getFilteredLeaderboard(params: {
    limit?: number;
    time?: TimeFilter;
    domain?: DomainFilter;
    organizationId?: string;
    city?: string;
  }) {
    const { limit = 50, time = 'all', domain = 'all', organizationId, city } = params;

    const now = new Date();
    let timeStart: Date | undefined;
    if (time === 'month') {
      timeStart = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (time === 'week') {
      const day = now.getDay();
      timeStart = new Date(now);
      timeStart.setDate(now.getDate() - day);
      timeStart.setHours(0, 0, 0, 0);
    }

    const baseWhere: Prisma.UserWhereInput = { role: 'STUDENT' };
    if (organizationId) baseWhere.organizationId = organizationId;
    if (city) baseWhere.city = city;

    if (time === 'all' && domain === 'all') {
      const users = await this.prisma.user.findMany({
        where: baseWhere,
        take: limit,
        orderBy: { xp: 'desc' },
        select: {
          id: true, name: true, username: true, xp: true, rank: true,
          division: true, city: true,
          organization: { select: { name: true, type: true } },
          achievements: { include: { achievement: true } },
        },
      });

      return users.map((user, index) => ({
        position: index + 1,
        id: user.id,
        name: user.username || user.name || 'Operative',
        username: user.username,
        xp: user.xp,
        rank: user.rank || 1200,
        level: Math.floor(user.xp / 1000) + 1,
        achievementsCount: user.achievements.length,
        division: user.division || 'BRONZE',
        organization: user.organization,
        city: user.city,
      }));
    }

    if (time !== 'all' && domain === 'all') {
      const progressions = await this.prisma.progressionEvent.groupBy({
        by: ['userId'],
        where: {
          type: 'XP_AWARDED',
          createdAt: { gte: timeStart! },
        },
        _sum: { amount: true },
      });

      const xpMap = new Map<string, number>();
      for (const p of progressions) {
        xpMap.set(p.userId, p._sum.amount || 0);
      }

      const userIds = [...xpMap.keys()];
      if (userIds.length === 0) return [];

      const users = await this.prisma.user.findMany({
        where: { ...baseWhere, id: { in: userIds } },
        select: {
          id: true, name: true, username: true, rank: true,
          division: true, city: true,
          organization: { select: { name: true, type: true } },
          achievements: { include: { achievement: true } },
        },
      });

      return users
        .map((user) => ({
          position: 0,
          id: user.id,
          name: user.username || user.name || 'Operative',
          username: user.username,
          xp: xpMap.get(user.id) || 0,
          rank: user.rank || 1200,
          level: Math.floor((xpMap.get(user.id) || 0) / 1000) + 1,
          achievementsCount: user.achievements.length,
          division: user.division || 'BRONZE',
          organization: user.organization,
          city: user.city,
        }))
        .sort((a, b) => b.xp - a.xp)
        .slice(0, limit)
        .map((entry, index) => ({ ...entry, position: index + 1 }));
    }

    if (domain !== 'all') {
      const domainRecord = await this.prisma.skillDomain.findFirst({
        where: { name: domain },
        select: { id: true },
      });
      if (!domainRecord) return [];

      const userSkills = await this.prisma.userSkill.findMany({
        where: {
          skill: { domainId: domainRecord.id },
        },
        select: { userId: true, xp: true },
      });

      const domainXpMap = new Map<string, number>();
      for (const us of userSkills) {
        domainXpMap.set(us.userId, (domainXpMap.get(us.userId) || 0) + us.xp);
      }

      if (time !== 'all') {
        const progressions = await this.prisma.progressionEvent.findMany({
          where: {
            type: 'SKILL_XP_AWARDED',
            createdAt: { gte: timeStart! },
          },
          select: { userId: true, amount: true, metadata: true },
        });

        const timeXpMap = new Map<string, number>();
        for (const p of progressions) {
          const meta = p.metadata as Record<string, unknown> | null;
          const skillDomain = meta?.domain as string | undefined;
          if (skillDomain === domain) {
            timeXpMap.set(p.userId, (timeXpMap.get(p.userId) || 0) + (p.amount || 0));
          }
        }

        const userIds = [...timeXpMap.keys()];
        if (userIds.length === 0) return [];

        const users = await this.prisma.user.findMany({
          where: { ...baseWhere, id: { in: userIds } },
          select: {
            id: true, name: true, username: true, rank: true,
            division: true, city: true,
            organization: { select: { name: true, type: true } },
            achievements: { include: { achievement: true } },
          },
        });

        return users
          .map((user) => ({
            position: 0,
            id: user.id,
            name: user.username || user.name || 'Operative',
            username: user.username,
            xp: timeXpMap.get(user.id) || 0,
            rank: user.rank || 1200,
            level: Math.floor((timeXpMap.get(user.id) || 0) / 1000) + 1,
            achievementsCount: user.achievements.length,
            division: user.division || 'BRONZE',
            organization: user.organization,
            city: user.city,
          }))
          .sort((a, b) => b.xp - a.xp)
          .slice(0, limit)
          .map((entry, index) => ({ ...entry, position: index + 1 }));
      }

      const userIds = [...domainXpMap.keys()];
      const users = await this.prisma.user.findMany({
        where: { ...baseWhere, id: { in: userIds } },
        select: {
          id: true, name: true, username: true, rank: true,
          division: true, city: true,
          organization: { select: { name: true, type: true } },
          achievements: { include: { achievement: true } },
        },
      });

      return users
        .map((user) => ({
          position: 0,
          id: user.id,
          name: user.username || user.name || 'Operative',
          username: user.username,
          xp: domainXpMap.get(user.id) || 0,
          rank: user.rank || 1200,
          level: Math.floor((domainXpMap.get(user.id) || 0) / 1000) + 1,
          achievementsCount: user.achievements.length,
          division: user.division || 'BRONZE',
          organization: user.organization,
          city: user.city,
        }))
        .sort((a, b) => b.xp - a.xp)
        .slice(0, limit)
        .map((entry, index) => ({ ...entry, position: index + 1 }));
    }

    return [];
  }

  async getLeagues() {
    const regionalStats = await this.prisma.user.groupBy({
      by: ['city'],
      _sum: { xp: true },
      _count: { id: true },
      where: { role: 'STUDENT' },
      orderBy: { _sum: { xp: 'desc' } },
    });

    const universityStats = await this.prisma.user.groupBy({
      by: ['organizationId'],
      _sum: { xp: true },
      _count: { id: true },
      where: {
        role: 'STUDENT',
        organization: { type: 'UNIVERSITY' },
      },
      orderBy: { _sum: { xp: 'desc' } },
    });

    const universities = await this.prisma.organization.findMany({
      where: {
        id: {
          in: universityStats
            .map((u) => u.organizationId)
            .filter(Boolean) as string[],
        },
      },
    });

    const activeSeason = await this.prisma.season.findFirst({
      where: { isActive: true },
      orderBy: { startDate: 'desc' },
    });

    return {
      regional: regionalStats.map((r) => ({
        name: r.city || 'Unknown',
        totalXp: r._sum.xp || 0,
        studentCount: r._count.id,
      })),
      university: universityStats.map((u) => ({
        id: u.organizationId,
        name:
          universities.find((v) => v.id === u.organizationId)?.name ||
          'Unknown',
        totalXp: u._sum.xp || 0,
        studentCount: u._count.id,
      })),
      season: activeSeason,
    };
  }

  // V2: Team leaderboard
  async getTeamLeaderboard(limit = 50) {
    const teams = await this.prisma.team.findMany({
      include: {
        members: {
          select: { xp: true },
        },
      },
    });

    return teams
      .map((team) => ({
        id: team.id,
        name: team.name,
        description: team.description,
        memberCount: team.members.length,
        totalXp: team.members.reduce((sum, m) => sum + m.xp, 0),
        avgXp: team.members.length > 0 ? Math.round(team.members.reduce((sum, m) => sum + m.xp, 0) / team.members.length) : 0,
      }))
      .sort((a, b) => b.totalXp - a.totalXp)
      .slice(0, limit)
      .map((team, index) => ({ ...team, position: index + 1 }));
  }

  // V2: Season snapshot
  async createSnapshot(period: 'WEEKLY' | 'MONTHLY' | 'SEASONAL') {
    const leaderboard = await this.getGlobalLeaderboard(100);
    const snapshot = await this.prisma.leaderboardSnapshot.create({
      data: {
        period,
        data: leaderboard as any,
      },
    });
    return snapshot;
  }

  async getSnapshotHistory(period: string, limit = 10) {
    return this.prisma.leaderboardSnapshot.findMany({
      where: { period },
      orderBy: { snapshotAt: 'desc' },
      take: limit,
    });
  }

  // V2: Head-to-head comparison
  async getHeadToHead(userId1: string, userId2: string) {
    const [user1, user2] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId1 },
        select: {
          id: true, name: true, username: true, xp: true, rank: true,
          division: true, currentStreak: true, longestStreak: true,
          achievements: { include: { achievement: true } },
        },
      }),
      this.prisma.user.findUnique({
        where: { id: userId2 },
        select: {
          id: true, name: true, username: true, xp: true, rank: true,
          division: true, currentStreak: true, longestStreak: true,
          achievements: { include: { achievement: true } },
        },
      }),
    ]);

    if (!user1 || !user2) return null;

    const [flags1, flags2, labs1, labs2] = await Promise.all([
      this.prisma.labSubmission.count({ where: { userId: userId1, isCorrect: true } }),
      this.prisma.labSubmission.count({ where: { userId: userId2, isCorrect: true } }),
      this.prisma.labSubmission.findMany({ where: { userId: userId1, isCorrect: true }, select: { flag: { select: { labId: true } } } }).then((s) => new Set(s.map((x) => x.flag.labId)).size),
      this.prisma.labSubmission.findMany({ where: { userId: userId2, isCorrect: true }, select: { flag: { select: { labId: true } } } }).then((s) => new Set(s.map((x) => x.flag.labId)).size),
    ]);

    return {
      user1: {
        ...user1,
        level: Math.floor(user1.xp / 1000) + 1,
        flagsCaptured: flags1,
        labsCompleted: labs1,
        achievementsCount: user1.achievements.length,
      },
      user2: {
        ...user2,
        level: Math.floor(user2.xp / 1000) + 1,
        flagsCaptured: flags2,
        labsCompleted: labs2,
        achievementsCount: user2.achievements.length,
      },
    };
  }
}
