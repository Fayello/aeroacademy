import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DomainRankingService } from '../domain-ranking/domain-ranking.service';

@Injectable()
export class RecruitmentService {
  constructor(
    private prisma: PrismaService,
    private domainRankingService: DomainRankingService,
  ) {}

  async getTalentPool(filters: {
    city?: string;
    organizationId?: string;
    minXp?: number;
    minLabs?: number;
    readiness?: string;
  }) {
    const { city, organizationId, minXp, minLabs, readiness } = filters;

    const users = await this.prisma.user.findMany({
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
            progress: { where: { completed: true } },
          },
        },
      },
      orderBy: {
        xp: 'desc',
      },
    });

    const activeSeason = await this.prisma.season.findFirst({
      where: { isActive: true },
      select: { id: true },
    });

    const domainRanks = activeSeason
      ? await this.prisma.domainRank.findMany({
          where: {
            seasonId: activeSeason.id,
            userId: { in: users.map((user) => user.id) },
          },
          include: {
            domain: { select: { id: true, name: true, displayName: true } },
          },
          orderBy: [{ userId: 'asc' }, { rating: 'desc' }],
        })
      : [];

    const domainMap = new Map<string, typeof domainRanks>();
    for (const rank of domainRanks) {
      const existing = domainMap.get(rank.userId) || [];
      existing.push(rank);
      domainMap.set(rank.userId, existing);
    }

    return users
      .map((user) => {
        const evidence = this.buildEvidenceSummary({
          labsSolved: user._count.labSubmissions,
          lessonsCompleted: user._count.progress,
          achievementsCount: user.achievements.length,
          organizationLinked: Boolean(user.organization),
          topDomains: (domainMap.get(user.id) || []).slice(0, 3).map((rank) => ({
            domainId: rank.domainId,
            name: rank.domain.displayName || rank.domain.name,
            rating: rank.rating,
          })),
        });

        return {
          ...user,
          evidence,
        };
      })
      .filter((user) => {
        if ((minLabs || 0) > user.evidence.labsSolved) return false;
        if (
          readiness &&
          ['ASSESSMENT_READY', 'BUILDING', 'FOUNDATION'].includes(readiness) &&
          user.evidence.readinessBand !== readiness
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (b.evidence.evidenceScore !== a.evidence.evidenceScore) {
          return b.evidence.evidenceScore - a.evidence.evidenceScore;
        }
        return b.xp - a.xp;
      });
  }

  async getCandidateProfile(userId: string) {
    const [user, capability, activeSeason] = await Promise.all([
      this.prisma.user.findUnique({
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
      }),
      this.domainRankingService.getCapabilityRanking(userId),
      this.prisma.season.findFirst({
        where: { isActive: true },
        select: { id: true },
      }),
    ]);

    if (!user) throw new NotFoundException('Candidate not found');

    const topDomainRanks = activeSeason
      ? await this.prisma.domainRank.findMany({
          where: { userId, seasonId: activeSeason.id },
          include: {
            domain: { select: { id: true, name: true, displayName: true } },
          },
          orderBy: { rating: 'desc' },
          take: 4,
        })
      : [];

    const evidence = this.buildEvidenceSummary({
      labsSolved: user._count.labSubmissions,
      lessonsCompleted: user._count.progress,
      achievementsCount: user.achievements.length,
      organizationLinked: Boolean(user.organization),
      topDomains: topDomainRanks.map((rank) => ({
        domainId: rank.domainId,
        name: rank.domain.displayName || rank.domain.name,
        rating: rank.rating,
      })),
    });

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
      evidence,
      capability,
    };
  }

  private buildEvidenceSummary(args: {
    labsSolved: number;
    lessonsCompleted: number;
    achievementsCount: number;
    organizationLinked: boolean;
    topDomains: Array<{ domainId: string; name: string; rating: number }>;
  }) {
    const { labsSolved, lessonsCompleted, achievementsCount, organizationLinked, topDomains } = args;

    const evidenceScore = Math.min(
      100,
      (labsSolved >= 12 ? 35 : labsSolved >= 6 ? 25 : labsSolved > 0 ? 12 : 0) +
        (lessonsCompleted >= 25
          ? 25
          : lessonsCompleted >= 10
            ? 18
            : lessonsCompleted > 0
              ? 10
              : 0) +
        (achievementsCount >= 5
          ? 18
          : achievementsCount > 0
            ? 10
            : 0) +
        (topDomains.length > 0
          ? Math.min(15, Math.round(topDomains.reduce((sum, item) => sum + item.rating, 0) / topDomains.length / 120))
          : 0) +
        (organizationLinked ? 7 : 0),
    );

    const readinessBand =
      evidenceScore >= 75
        ? 'ASSESSMENT_READY'
        : evidenceScore >= 45
          ? 'BUILDING'
          : 'FOUNDATION';

    const readinessLabel =
      readinessBand === 'ASSESSMENT_READY'
        ? 'Assessment-ready'
        : readinessBand === 'BUILDING'
          ? 'Building readiness'
          : 'Foundation stage';

    const proofLabel =
      labsSolved >= 10
        ? 'High practical proof'
        : labsSolved >= 4
          ? 'Growing practical proof'
          : 'Early practical record';

    return {
      evidenceScore,
      readinessBand,
      readinessLabel,
      proofLabel,
      labsSolved,
      lessonsCompleted,
      achievementsCount,
      topDomains,
    };
  }

  async toggleShortlist(recruiterId: string, studentId: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.shortlist.findUnique({
        where: {
          recruiterId_studentId: { recruiterId, studentId },
        },
      });

      if (existing) {
        await tx.shortlist.delete({ where: { id: existing.id } });
        return { shortlisted: false };
      }

      await tx.shortlist.create({
        data: { recruiterId, studentId },
      });
      return { shortlisted: true };
    });
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
