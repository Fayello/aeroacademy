import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecruitmentService {
  constructor(private prisma: PrismaService) {}

  async getTalentPool(filters: {
    city?: string;
    organizationId?: string;
    minXp?: number;
  }) {
    const { city, organizationId, minXp } = filters;

    return this.prisma.user.findMany({
      where: {
        role: 'STUDENT',
        city: city || undefined,
        organizationId: organizationId || undefined,
        xp: { gte: minXp || 0 },
      },
      select: {
        id: true,
        name: true,
        email: true,
        city: true,
        xp: true,
        rank: true,
        division: true,
        bio: true,
        organization: {
          select: {
            name: true,
            type: true,
          },
        },
        achievements: {
          include: {
            achievement: true,
          },
        },
        _count: {
          select: {
            labSubmissions: { where: { isCorrect: true } },
          },
        },
      },
      orderBy: {
        xp: 'desc',
      },
    });
  }

  async getCandidateProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        city: true,
        xp: true,
        rank: true,
        division: true,
        bio: true,
        createdAt: true,
        organization: true,
        achievements: { include: { achievement: true } },
        _count: {
          select: {
            labSubmissions: { where: { isCorrect: true } },
            progress: { where: { completed: true } },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('Candidate not found');

    const xp = user.xp;
    const rank = user.rank || 1200;
    const level = Math.floor(xp / 1000) + 1;
    const division = user.division || 'BRONZE';
    const clearance =
      level > 10 ? 'EXPERT_STUDENT' : level > 5 ? 'CERTIFIED_L2' : 'STUDENT_L1';

    return {
      ...user,
      level,
      division,
      clearance,
      rank,
    };
  }

  async toggleShortlist(recruiterId: string, studentId: string) {
    const existing = await this.prisma.shortlist.findUnique({
      where: {
        recruiterId_studentId: { recruiterId, studentId },
      },
    });

    if (existing) {
      await this.prisma.shortlist.delete({
        where: { id: existing.id },
      });
      return { shortlisted: false };
    }

    await this.prisma.shortlist.create({
      data: { recruiterId, studentId },
    });
    return { shortlisted: true };
  }

  async getShortlistedCandidates(recruiterId: string) {
    return this.prisma.shortlist.findMany({
      where: { recruiterId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            city: true,
            xp: true,
            organization: { select: { name: true } },
          },
        },
      },
    });
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

    // Hydrate university names
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
