import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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
}
