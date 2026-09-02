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
    const diffMult =
      DIFFICULTY_MULTIPLIER[params.difficulty.toUpperCase()] || 1.0;
    const rawScore =
      params.performance * 0.35 +
      params.quality * 0.25 +
      params.timeEfficiency * 0.2 +
      params.independence * 0.2;

    const baseDelta = Math.round(rawScore * 100 * diffMult);
    const kFactor = params.isProvisional
      ? K_FACTOR_PROVISIONAL
      : K_FACTOR_NORMAL;

    if (params.opponentRating !== undefined) {
      const expected =
        1 / (1 + Math.pow(10, (params.opponentRating - 1000) / 400));
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
    const { name: newDivision, tier: newTier } =
      this.getDivisionFromRating(newRating);
    const divisionChanged =
      newDivision !== domainRank.division ||
      newTier !== domainRank.divisionTier;

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
        isProvisional: placementJustCompleted
          ? false
          : domainRank.isProvisional,
        placementMatchesLeft: newPlacementLeft,
        careerHighRating: newCareerHigh
          ? newRating
          : domainRank.careerHighRating,
        careerHighDivision: newCareerHigh
          ? newDivision
          : domainRank.careerHighDivision,
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

  async getDomainLeaderboard(domainId: string, seasonId: string, limit = 100) {
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

  async getUserRatingHistory(
    userId: string,
    domainId: string,
    seasonId: string,
  ) {
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

    const season = await this.prisma.season.findUnique({
      where: { id: seasonId },
    });
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

    const userIds = [...new Set(allRanks.map((r) => r.userId))];
    const globalSnapshots: {
      userId: string;
      seasonId: string;
      seasonNumber: number;
      globalRating: number;
      globalDivision: string;
      globalTier: number;
      domainCount: number;
      gamesPlayed: number;
      wins: number;
      losses: number;
      winRate: number;
    }[] = [];

    for (const uid of userIds) {
      const userRanks = allRanks.filter((r) => r.userId === uid);
      const globalRank = this.computeGlobalRank(
        userRanks.map((r) => ({
          rating: r.rating,
          gamesPlayed: r.gamesPlayed,
          wins: r.wins,
          losses: r.losses,
          division: r.division,
          divisionTier: r.divisionTier,
        })),
      );
      globalSnapshots.push({
        userId: uid,
        seasonId,
        seasonNumber,
        globalRating: globalRank.rating,
        globalDivision: globalRank.division,
        globalTier: globalRank.divisionTier,
        domainCount: globalRank.domainCount,
        gamesPlayed: globalRank.gamesPlayed,
        wins: globalRank.totalWins,
        losses: globalRank.totalLosses,
        winRate: globalRank.winRate,
      });
    }

    if (globalSnapshots.length > 0) {
      await this.prisma.globalRankSnapshot.createMany({
        data: globalSnapshots,
      });
    }

    const nextSeason = await this.prisma.season.findFirst({
      where: { seasonNumber: seasonNumber + 1 },
    });

    if (nextSeason) {
      for (const rank of allRanks) {
        const compressedRating = Math.round(
          rank.rating - (rank.rating - 1000) * SOFT_RESET_DECAY,
        );
        const { name: division, tier } =
          this.getDivisionFromRating(compressedRating);

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
      `Soft reset completed for season ${seasonId}: ${allRanks.length} domain ranks snapshotted, ${globalSnapshots.length} global ranks snapshotted`,
    );

    return {
      snapshotted: allRanks.length,
      globalSnapshots: globalSnapshots.length,
    };
  }

  computeGlobalRank(
    domainRanks: {
      rating: number;
      gamesPlayed: number;
      wins: number;
      losses: number;
      division: string;
      divisionTier: number;
    }[],
  ) {
    if (domainRanks.length === 0) {
      return {
        rating: 1000,
        division: 'BRONZE',
        divisionTier: 1,
        gamesPlayed: 0,
        totalWins: 0,
        totalLosses: 0,
        winRate: 0,
        domainCount: 0,
      };
    }

    const totalGames = domainRanks.reduce((sum, r) => sum + r.gamesPlayed, 0);

    let weightedRating: number;
    if (totalGames > 0) {
      weightedRating =
        domainRanks.reduce((sum, r) => sum + r.rating * r.gamesPlayed, 0) /
        totalGames;
    } else {
      weightedRating =
        domainRanks.reduce((sum, r) => sum + r.rating, 0) / domainRanks.length;
    }

    const globalRating = Math.round(weightedRating);
    const { name: division, tier: divisionTier } =
      this.getDivisionFromRating(globalRating);
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
    const activeSeason = await this.prisma.season.findFirst({
      where: { isActive: true },
    });
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, avatarUrl: true, xp: true },
    });
    if (!user) return null;

    const level = Math.floor(user.xp / 1000) + 1;

    const currentRanks = activeSeason
      ? await this.prisma.domainRank.findMany({
          where: { userId, seasonId: activeSeason.id },
          include: {
            domain: { select: { name: true, displayName: true, icon: true } },
          },
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

    // Fetch domain mastery averages
    const userSkills = await this.prisma.userSkill.findMany({
      where: { userId },
      include: { skill: { select: { domainId: true } } },
    });

    const domainMasteryMap = new Map<
      string,
      { total: number; count: number }
    >();
    for (const us of userSkills) {
      const domainId = us.skill.domainId;
      const existing = domainMasteryMap.get(domainId) || { total: 0, count: 0 };
      existing.total += us.mastery;
      existing.count += 1;
      domainMasteryMap.set(domainId, existing);
    }

    const domainMastery: Record<string, number> = {};
    for (const [domainId, { total, count }] of domainMasteryMap) {
      domainMastery[domainId] = count > 0 ? Math.round(total / count) : 0;
    }

    return {
      user,
      level,
      activeSeason: activeSeason
        ? {
            id: activeSeason.id,
            name: activeSeason.name,
            seasonNumber: activeSeason.seasonNumber,
          }
        : null,
      globalRank,
      domainMastery,
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
        mastery: domainMastery[r.domainId] || 0,
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

  async getCareerHistory(userId: string) {
    const globalSnapshots = await this.prisma.globalRankSnapshot.findMany({
      where: { userId },
      orderBy: { seasonNumber: 'desc' },
      include: {
        season: { select: { name: true, seasonNumber: true, theme: true } },
      },
    });

    const domainSnapshots = await this.prisma.seasonRankSnapshot.findMany({
      where: { userId },
      orderBy: { seasonNumber: 'desc' },
      include: {
        season: { select: { name: true, seasonNumber: true } },
      },
    });

    const domains = await this.prisma.skillDomain.findMany({
      select: { id: true, name: true, displayName: true },
    });
    const domainMap = new Map(
      domains.map((d) => [d.id, d.displayName || d.name]),
    );

    const seasons = new Map<
      number,
      {
        seasonNumber: number;
        seasonName: string;
        theme: string | null;
        global: {
          rating: number;
          division: string;
          tier: number;
          domainCount: number;
          gamesPlayed: number;
          wins: number;
          losses: number;
          winRate: number;
        } | null;
        domains: {
          domain: string;
          domainId: string;
          rating: number;
          division: string;
          tier: number;
          gamesPlayed: number;
          wins: number;
          losses: number;
        }[];
      }
    >();

    for (const gs of globalSnapshots) {
      const key = gs.seasonNumber;
      const gsSeason = gs.season as {
        name: string;
        theme: string | null;
      } | null;
      if (!seasons.has(key)) {
        seasons.set(key, {
          seasonNumber: gs.seasonNumber,
          seasonName: gsSeason?.name || `Season ${gs.seasonNumber}`,
          theme: gsSeason?.theme || null,
          global: {
            rating: gs.globalRating,
            division: gs.globalDivision,
            tier: gs.globalTier,
            domainCount: gs.domainCount,
            gamesPlayed: gs.gamesPlayed,
            wins: gs.wins,
            losses: gs.losses,
            winRate: gs.winRate,
          },
          domains: [],
        });
      }
    }

    for (const ds of domainSnapshots) {
      const key = ds.seasonNumber;
      const seasonData = ds.season as {
        name: string;
        seasonNumber: number;
      } | null;
      if (!seasons.has(key)) {
        seasons.set(key, {
          seasonNumber: ds.seasonNumber,
          seasonName: seasonData?.name || `Season ${ds.seasonNumber}`,
          theme: null,
          global: null,
          domains: [],
        });
      }
      const s = seasons.get(key)!;
      s.domains.push({
        domain: domainMap.get(ds.domainId) || ds.domainId,
        domainId: ds.domainId,
        rating: ds.finalRating,
        division: ds.finalDivision,
        tier: ds.finalTier,
        gamesPlayed: ds.gamesPlayed,
        wins: ds.wins,
        losses: ds.losses,
      });
    }

    return Array.from(seasons.values()).sort(
      (a, b) => b.seasonNumber - a.seasonNumber,
    );
  }

  async getAllRatingHistory(userId: string) {
    const events = await this.prisma.domainRatingEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: {
        season: { select: { name: true, seasonNumber: true } },
      },
    });

    const domains = await this.prisma.skillDomain.findMany({
      select: { id: true, name: true, displayName: true },
    });
    const domainMap = new Map(
      domains.map((d) => [d.id, d.displayName || d.name]),
    );

    return events.map((e) => ({
      date: e.createdAt,
      domainId: e.domainId,
      domain: domainMap.get(e.domainId) || e.domainId,
      ratingBefore: e.ratingBefore,
      ratingAfter: e.ratingAfter,
      ratingDelta: e.ratingDelta,
      activityType: e.activityType,
      difficulty: e.difficulty,
      seasonNumber: e.season?.seasonNumber,
    }));
  }

  // ─── PHASE 5: CAPABILITY-BASED RANKING ────────────────────────

  async getCapabilityRanking(userId: string) {
    const activeSeason = await this.prisma.season.findFirst({
      where: { isActive: true },
    });
    if (!activeSeason) return null;

    const domainRanks = await this.prisma.domainRank.findMany({
      where: { userId, seasonId: activeSeason.id },
    });

    // 1. Technical Performance (40%): assessment scores + lab quality + flag efficiency
    const assessments = await this.prisma.studentAssessment.findMany({
      where: { userId, status: 'GRADED' },
      select: { score: true, maxScore: true },
    });

    const labCompletions = await this.prisma.progress.findMany({
      where: { userId, completed: true },
    });

    const flagSolves = await this.prisma.activityEvent.findMany({
      where: { userId, type: 'FLAG_SOLVED' },
      select: { metadata: true, createdAt: true },
    });

    const avgAssessmentScore =
      assessments.length > 0
        ? assessments.reduce(
            (sum, a) => sum + ((a.score || 0) / a.maxScore) * 100,
            0,
          ) / assessments.length
        : 50;

    const labQuality =
      labCompletions.length > 0 ? Math.min(100, labCompletions.length * 5) : 50;

    const flagEfficiency =
      flagSolves.length > 0 ? Math.min(100, flagSolves.length * 5) : 0;

    const technicalPerformance =
      avgAssessmentScore * 0.4 + labQuality * 0.4 + flagEfficiency * 0.2;

    // 2. Difficulty (25%): level of challenges attempted
    const difficultyMap: Record<string, number> = {
      BEGINNER: 1,
      EASY: 1,
      MEDIUM: 2,
      HARD: 3,
      ADVANCED: 4,
      BOSS: 5,
      EXPERT: 6,
    };

    const maxDifficultyAttempted = domainRanks.reduce((max, r) => {
      // Use gamesPlayed as a proxy for difficulty exposure
      const diffScore = Math.min(100, r.gamesPlayed * 10);
      return Math.max(max, diffScore);
    }, 0);

    const bossAttempts = await this.prisma.bossMissionAttempt.count({
      where: { userId, isCompleted: true },
    });

    const difficultyScore = Math.min(
      100,
      maxDifficultyAttempted + bossAttempts * 5,
    );

    // 3. Consistency (20%): regular practice + sustained performance
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeDays = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT DATE("createdAt")) as count
      FROM "ActivityEvent"
      WHERE "userId" = ${userId} AND "createdAt" >= ${thirtyDaysAgo}
    `;

    const daysActive = Number(activeDays[0]?.count || 0);
    const consistencyScore = Math.min(100, (daysActive / 30) * 100);

    // 4. Problem Solving (15%): independent solutions + recovery + methodology
    const independentFlags = flagSolves.filter((f) => {
      const meta = f.metadata as Record<string, unknown> | null;
      return !meta?.hintUsed;
    }).length;

    const independenceRate =
      flagSolves.length > 0 ? (independentFlags / flagSolves.length) * 100 : 50;

    const problemSolvingScore = Math.min(100, independenceRate);

    // Weighted total (0-100)
    const capabilityScore = Math.round(
      technicalPerformance * 0.4 +
        difficultyScore * 0.25 +
        consistencyScore * 0.2 +
        problemSolvingScore * 0.15,
    );

    // Map to tier
    let tier = 'UNRANKED';
    if (capabilityScore >= 90) tier = 'EXPERT';
    else if (capabilityScore >= 75) tier = 'ADVANCED';
    else if (capabilityScore >= 60) tier = 'INTERMEDIATE';
    else if (capabilityScore >= 40) tier = 'DEVELOPING';
    else if (capabilityScore > 0) tier = 'NOVICE';

    return {
      capabilityScore,
      tier,
      breakdown: {
        technicalPerformance: Math.round(technicalPerformance),
        difficulty: Math.round(difficultyScore),
        consistency: Math.round(consistencyScore),
        problemSolving: Math.round(problemSolvingScore),
      },
      details: {
        assessmentsCompleted: assessments.length,
        avgAssessmentScore: Math.round(avgAssessmentScore),
        labsCompleted: labCompletions.length,
        flagsSolved: flagSolves.length,
        bossMissionsCompleted: bossAttempts,
        activeDaysLast30: daysActive,
        independenceRate: Math.round(independenceRate),
      },
    };
  }

  async getCapabilityLeaderboard(limit = 100) {
    const users = await this.prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: { id: true, name: true, avatarUrl: true, xp: true },
      take: 200,
    });

    const results: {
      userId: string;
      user: { id: string; name: string | null; avatarUrl: string | null };
      capabilityScore: number;
      tier: string;
      breakdown: {
        technicalPerformance: number;
        difficulty: number;
        consistency: number;
        problemSolving: number;
      };
      xp: number;
    }[] = [];
    for (const user of users) {
      const cap = await this.getCapabilityRanking(user.id);
      if (cap) {
        results.push({
          userId: user.id,
          user: { id: user.id, name: user.name, avatarUrl: user.avatarUrl },
          capabilityScore: cap.capabilityScore,
          tier: cap.tier,
          breakdown: cap.breakdown,
          xp: user.xp,
        });
      }
    }

    return results
      .sort((a, b) => b.capabilityScore - a.capabilityScore)
      .slice(0, limit)
      .map((r, i) => ({ position: i + 1, ...r }));
  }
}
