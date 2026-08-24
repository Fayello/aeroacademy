import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const PLACEMENT_MATCHES = 5;
const K_FACTOR_PROVISIONAL = 48;
const K_FACTOR_NORMAL = 24;
const SOFT_RESET_DECAY = 0.3;

const DIVISION_THRESHOLDS = [
  { name: 'BRONZE', min: 0, max: 1499, tiers: 4 },
  { name: 'SILVER', min: 1500, max: 2999, tiers: 4 },
  { name: 'GOLD', min: 3000, max: 4999, tiers: 4 },
  { name: 'PLATINUM', min: 5000, max: 7499, tiers: 4 },
  { name: 'DIAMOND', min: 7500, max: 10999, tiers: 4 },
  { name: 'MASTER', min: 11000, max: 14999, tiers: 4 },
  { name: 'GRANDMASTER', min: 15000, max: 999999, tiers: 4 },
];

const DIFFICULTY_MULTIPLIER: Record<string, number> = {
  BEGINNER: 1.0,
  EASY: 1.0,
  MEDIUM: 1.5,
  HARD: 2.0,
  ADVANCED: 2.5,
  BOSS: 3.0,
  EXPERT: 3.5,
};

@Injectable()
export class DomainRankingService {
  private readonly logger = new Logger(DomainRankingService.name);

  constructor(private prisma: PrismaService) {}

  getDivisionFromRating(rating: number): { name: string; tier: number } {
    for (const div of DIVISION_THRESHOLDS) {
      if (rating >= div.min && rating <= div.max) {
        const range = div.max - div.min + 1;
        const tierSize = range / div.tiers;
        const tier = Math.min(
          div.tiers,
          Math.floor((rating - div.min) / tierSize) + 1,
        );
        return { name: div.name, tier };
      }
    }
    const last = DIVISION_THRESHOLDS[DIVISION_THRESHOLDS.length - 1];
    return { name: last.name, tier: last.tiers };
  }

  calculateRatingDelta(params: {
    difficulty: string;
    performance: number;
    quality: number;
    timeEfficiency: number;
    independence: number;
    isProvisional: boolean;
    opponentRating?: number;
  }): number {
    const diffMult = DIFFICULTY_MULTIPLIER[params.difficulty.toUpperCase()] || 1.0;
    const rawScore =
      params.performance *
      0.35 +
      params.quality *
      0.25 +
      params.timeEfficiency *
      0.20 +
      params.independence *
      0.20;

    const baseDelta = Math.round(rawScore * 100 * diffMult);
    const kFactor = params.isProvisional ? K_FACTOR_PROVISIONAL : K_FACTOR_NORMAL;

    if (params.opponentRating !== undefined) {
      const expected = 1 / (1 + Math.pow(10, (params.opponentRating - 1000) / 400));
      const actualScore = rawScore;
      return Math.round(kFactor * (actualScore - expected));
    }

    return Math.round(baseDelta * (kFactor / K_FACTOR_NORMAL));
  }

  async initializeDomainRanks(userId: string, seasonId: string): Promise<void> {
    const domains = await this.prisma.skillDomain.findMany();

    for (const domain of domains) {
      const existing = await this.prisma.domainRank.findUnique({
        where: {
          userId_domainId_seasonId: {
            userId,
            domainId: domain.id,
            seasonId,
          },
        },
      });

      if (!existing) {
        await this.prisma.domainRank.create({
          data: {
            userId,
            domainId: domain.id,
            seasonId,
            rating: 1000,
            division: 'BRONZE',
            divisionTier: 1,
            isProvisional: true,
            placementMatchesLeft: PLACEMENT_MATCHES,
            careerHighRating: 1000,
            careerHighDivision: 'BRONZE',
            careerHighTier: 1,
          },
        });
      }
    }
  }

  async awardDomainRating(params: {
    userId: string;
    domainId: string;
    seasonId: string;
    activityType: string;
    activityId?: string;
    difficulty: string;
    performance: number;
    quality: number;
    timeEfficiency: number;
    independence: number;
  }): Promise<{
    ratingDelta: number;
    newRating: number;
    newDivision: string;
    newTier: number;
    divisionChanged: boolean;
    placementComplete: boolean;
  }> {
    const domainRank = await this.prisma.domainRank.findUnique({
      where: {
        userId_domainId_seasonId: {
          userId: params.userId,
          domainId: params.domainId,
          seasonId: params.seasonId,
        },
      },
    });

    if (!domainRank) {
      await this.initializeDomainRanks(params.userId, params.seasonId);
      return this.awardDomainRating(params);
    }

    const ratingDelta = this.calculateRatingDelta({
      ...params,
      isProvisional: domainRank.isProvisional,
    });

    const newRating = Math.max(0, domainRank.rating + ratingDelta);
    const { name: newDivision, tier: newTier } = this.getDivisionFromRating(newRating);
    const divisionChanged =
      newDivision !== domainRank.division || newTier !== domainRank.divisionTier;

    const newCareerHigh = newRating > domainRank.careerHighRating;
    const newPlacementLeft = domainRank.isProvisional
      ? Math.max(0, domainRank.placementMatchesLeft - 1)
      : 0;
    const placementJustCompleted =
      domainRank.isProvisional && newPlacementLeft === 0;

    await this.prisma.domainRank.update({
      where: {
        userId_domainId_seasonId: {
          userId: params.userId,
          domainId: params.domainId,
          seasonId: params.seasonId,
        },
      },
      data: {
        rating: newRating,
        division: newDivision,
        divisionTier: newTier,
        gamesPlayed: { increment: 1 },
        wins: ratingDelta > 0 ? { increment: 1 } : undefined,
        losses: ratingDelta < 0 ? { increment: 1 } : undefined,
        isProvisional: placementJustCompleted ? false : domainRank.isProvisional,
        placementMatchesLeft: newPlacementLeft,
        careerHighRating: newCareerHigh ? newRating : domainRank.careerHighRating,
        careerHighDivision: newCareerHigh ? newDivision : domainRank.careerHighDivision,
        careerHighTier: newCareerHigh ? newTier : domainRank.careerHighTier,
      },
    });

    await this.prisma.domainRatingEvent.create({
      data: {
        userId: params.userId,
        domainId: params.domainId,
        seasonId: params.seasonId,
        activityType: params.activityType,
        activityId: params.activityId,
        difficulty: params.difficulty,
        performance: params.performance,
        quality: params.quality,
        timeEfficiency: params.timeEfficiency,
        independence: params.independence,
        ratingDelta,
        ratingBefore: domainRank.rating,
        ratingAfter: newRating,
      },
    });

    if (domainRank.isProvisional) {
      await this.prisma.placementMatch.create({
        data: {
          userId: params.userId,
          domainId: params.domainId,
          seasonId: params.seasonId,
          activityType: params.activityType,
          activityId: params.activityId,
          difficulty: params.difficulty,
          performance: params.performance,
          quality: params.quality,
          timeEfficiency: params.timeEfficiency,
          independence: params.independence,
          ratingDelta,
          ratingBefore: domainRank.rating,
          ratingAfter: newRating,
        },
      });
    }

    return {
      ratingDelta,
      newRating,
      newDivision,
      newTier,
      divisionChanged,
      placementComplete: placementJustCompleted,
    };
  }

  async getUserDomainRanks(userId: string, seasonId: string) {
    return this.prisma.domainRank.findMany({
      where: { userId, seasonId },
      include: {
        domain: { select: { name: true, displayName: true, icon: true } },
      },
      orderBy: { rating: 'desc' },
    });
  }

  async getDomainLeaderboard(
    domainId: string,
    seasonId: string,
    limit = 100,
  ) {
    return this.prisma.domainRank.findMany({
      where: { domainId, seasonId, isProvisional: false },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { rating: 'desc' },
      take: limit,
    });
  }

  async getGlobalLeaderboard(seasonId: string, limit = 100) {
    const results = await this.prisma.domainRank.groupBy({
      by: ['userId'],
      where: { seasonId, isProvisional: false },
      _sum: { rating: true },
      _count: { _all: true },
      orderBy: { _sum: { rating: 'desc' } },
      take: limit,
    });

    const userIds = results.map((r) => r.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatarUrl: true, xp: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return results.map((r, i) => ({
      position: i + 1,
      userId: r.userId,
      user: userMap.get(r.userId),
      totalRating: r._sum.rating,
      domainsPlayed: r._count._all,
    }));
  }

  async getUserRatingHistory(userId: string, domainId: string, seasonId: string) {
    return this.prisma.domainRatingEvent.findMany({
      where: { userId, domainId, seasonId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async softResetSeason(seasonId: string) {
    const allRanks = await this.prisma.domainRank.findMany({
      where: { seasonId },
    });

    const season = await this.prisma.season.findUnique({ where: { id: seasonId } });
    const seasonNumber = season?.seasonNumber || 1;

    const snapshots = allRanks.map((rank) => ({
      userId: rank.userId,
      domainId: rank.domainId,
      seasonId,
      seasonNumber,
      finalRating: rank.rating,
      finalDivision: rank.division,
      finalTier: rank.divisionTier,
      gamesPlayed: rank.gamesPlayed,
      wins: rank.wins,
      losses: rank.losses,
      placementRating: rank.isProvisional ? rank.rating : null,
    }));

    await this.prisma.seasonRankSnapshot.createMany({ data: snapshots });

    const nextSeason = await this.prisma.season.findFirst({
      where: { seasonNumber: seasonNumber + 1 },
    });

    if (nextSeason) {
      for (const rank of allRanks) {
        const compressedRating = Math.round(
          rank.rating - (rank.rating - 1000) * SOFT_RESET_DECAY,
        );
        const { name: division, tier } = this.getDivisionFromRating(compressedRating);

        await this.prisma.domainRank.create({
          data: {
            userId: rank.userId,
            domainId: rank.domainId,
            seasonId: nextSeason.id,
            rating: compressedRating,
            division,
            divisionTier: tier,
            isProvisional: true,
            placementMatchesLeft: PLACEMENT_MATCHES,
            careerHighRating: rank.careerHighRating,
            careerHighDivision: rank.careerHighDivision,
            careerHighTier: rank.careerHighTier,
          },
        });
      }
    }

    await this.prisma.season.update({
      where: { id: seasonId },
      data: { softResetCompleted: true },
    });

    this.logger.log(
      `Soft reset completed for season ${seasonId}: ${allRanks.length} domain ranks snapshotted and carried forward`,
    );

    return { snapshotted: allRanks.length };
  }

  computeGlobalRank(domainRanks: { rating: number; gamesPlayed: number; wins: number; losses: number; division: string; divisionTier: number }[]) {
    if (domainRanks.length === 0) {
      return { rating: 1000, division: 'BRONZE', divisionTier: 1, gamesPlayed: 0, totalWins: 0, totalLosses: 0, winRate: 0, domainCount: 0 };
    }

    const totalGames = domainRanks.reduce((sum, r) => sum + r.gamesPlayed, 0);

    let weightedRating: number;
    if (totalGames > 0) {
      weightedRating = domainRanks.reduce((sum, r) => sum + r.rating * r.gamesPlayed, 0) / totalGames;
    } else {
      weightedRating = domainRanks.reduce((sum, r) => sum + r.rating, 0) / domainRanks.length;
    }

    const globalRating = Math.round(weightedRating);
    const { name: division, tier: divisionTier } = this.getDivisionFromRating(globalRating);
    const totalWins = domainRanks.reduce((sum, r) => sum + r.wins, 0);
    const totalLosses = domainRanks.reduce((sum, r) => sum + r.losses, 0);

    return {
      rating: globalRating,
      division,
      divisionTier,
      gamesPlayed: totalGames,
      totalWins,
      totalLosses,
      winRate: totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0,
      domainCount: domainRanks.length,
    };
  }

  async getRankedProfile(userId: string) {
    const activeSeason = await this.prisma.season.findFirst({ where: { isActive: true } });
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, avatarUrl: true, xp: true },
    });
    if (!user) return null;

    const level = Math.floor(user.xp / 1000) + 1;

    const currentRanks = activeSeason
      ? await this.prisma.domainRank.findMany({
          where: { userId, seasonId: activeSeason.id },
          include: { domain: { select: { name: true, displayName: true, icon: true } } },
          orderBy: { rating: 'desc' },
        })
      : [];

    const seasonHistory = await this.prisma.seasonRankSnapshot.findMany({
      where: { userId },
      orderBy: { seasonNumber: 'desc' },
      take: 20,
      include: {
        season: { select: { name: true, seasonNumber: true } },
      },
    });

    const bossAttempts = await this.prisma.bossMissionAttempt.count({
      where: { userId, isCompleted: true },
    });

    const labsCompleted = await this.prisma.progress.count({
      where: { userId, completed: true },
    });

    const globalRank = this.computeGlobalRank(
      currentRanks.map((r) => ({
        rating: r.rating,
        gamesPlayed: r.gamesPlayed,
        wins: r.wins,
        losses: r.losses,
        division: r.division,
        divisionTier: r.divisionTier,
      })),
    );

    return {
      user,
      level,
      activeSeason: activeSeason
        ? { id: activeSeason.id, name: activeSeason.name, seasonNumber: activeSeason.seasonNumber }
        : null,
      globalRank,
      domainRanks: currentRanks.map((r) => ({
        domain: r.domain.displayName,
        domainId: r.domainId,
        rating: r.rating,
        division: r.division,
        divisionTier: r.divisionTier,
        gamesPlayed: r.gamesPlayed,
        wins: r.wins,
        losses: r.losses,
        isProvisional: r.isProvisional,
        placementMatchesLeft: r.placementMatchesLeft,
        careerHighRating: r.careerHighRating,
        careerHighDivision: r.careerHighDivision,
      })),
      seasonHistory: seasonHistory.map((s) => ({
        seasonNumber: s.seasonNumber,
        seasonName: s.season?.name,
        finalRating: s.finalRating,
        finalDivision: s.finalDivision,
        finalTier: s.finalTier,
        gamesPlayed: s.gamesPlayed,
        wins: s.wins,
        losses: s.losses,
      })),
      stats: {
        bossMissionsCompleted: bossAttempts,
        labsCompleted,
      },
    };
  }
}
