import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressionService } from '../common/progression.service';

@Injectable()
export class RankingService {
  private readonly logger = new Logger(RankingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly progressionService: ProgressionService,
  ) {}

  async getTiers() {
    return this.prisma.rankingTier.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  async seedDefaultTiers() {
    const count = await this.prisma.rankingTier.count();
    if (count > 0) return { message: 'Tiers already seeded' };

    const tiers = [
      { name: 'BRONZE', displayName: 'Bronze', icon: 'shield', minXp: 0, maxXp: 4999, kFactor: 40, decayRate: 0, order: 1 },
      { name: 'SILVER', displayName: 'Silver', icon: 'award', minXp: 5000, maxXp: 14999, kFactor: 36, decayRate: 0, order: 2 },
      { name: 'GOLD', displayName: 'Gold', icon: 'trophy', minXp: 15000, maxXp: 34999, kFactor: 32, decayRate: 0, order: 3 },
      { name: 'PLATINUM', displayName: 'Platinum', icon: 'crown', minXp: 35000, maxXp: 69999, kFactor: 28, decayRate: 0, order: 4 },
      { name: 'DIAMOND', displayName: 'Diamond', icon: 'gem', minXp: 70000, maxXp: 119999, kFactor: 24, decayRate: 0, order: 5 },
      { name: 'MASTER', displayName: 'Master', icon: 'star', minXp: 120000, maxXp: 199999, kFactor: 20, decayRate: 0, order: 6 },
      { name: 'GRANDMASTER', displayName: 'Grandmaster', icon: 'flame', minXp: 200000, maxXp: 999999, kFactor: 16, decayRate: 0, order: 7 },
    ];

    for (const tier of tiers) {
      await this.prisma.rankingTier.create({ data: tier });
    }
    this.logger.log(`Seeded ${tiers.length} ranking tiers`);
    return { message: `Seeded ${tiers.length} tiers` };
  }

  async getTierForXp(xp: number) {
    return this.prisma.rankingTier.findFirst({
      where: { minXp: { lte: xp }, maxXp: { gte: xp }, isActive: true },
    });
  }

  async updateRanking(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    const tier = await this.getTierForXp(user.xp);
    if (!tier) return null;

    const divisionChanged = user.division !== tier.name;

    if (divisionChanged) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { division: tier.name },
      });

      await this.prisma.rankingHistory.create({
        data: {
          userId,
          fromTier: user.division,
          toTier: tier.name,
          reason: 'XP_REACH',
        },
      });

      this.logger.log(`User ${userId} promoted from ${user.division} to ${tier.name}`);
    }

    return {
      userId,
      previousDivision: user.division,
      currentDivision: tier.name,
      tier: {
        name: tier.name,
        displayName: tier.displayName,
        kFactor: tier.kFactor,
        minXp: tier.minXp,
        maxXp: tier.maxXp,
      },
      xp: user.xp,
      divisionChanged,
    };
  }

  async updateWinStreak(userId: string, won: boolean) {
    const streak = await this.prisma.winStreak.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    const now = new Date();
    const lastWin = streak.lastWinDate;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastWinDay = lastWin ? new Date(lastWin.getFullYear(), lastWin.getMonth(), lastWin.getDate()) : null;

    const isConsecutive = lastWinDay && today.getTime() - lastWinDay.getTime() <= 86400000;

    let newStreak: number;
    let newMultiplier: number;

    if (won) {
      if (isConsecutive) {
        newStreak = streak.currentStreak + 1;
      } else {
        newStreak = 1;
      }
      newMultiplier = 1 + (newStreak - 1) * 0.1; // 10% per win, max 2.0x
      newMultiplier = Math.min(newMultiplier, 2.0);
    } else {
      newStreak = 0;
      newMultiplier = 1.0;
    }

    const longestStreak = Math.max(streak.longestStreak, newStreak);

    const updated = await this.prisma.winStreak.update({
      where: { id: streak.id },
      data: {
        currentStreak: newStreak,
        longestStreak,
        lastWinDate: won ? now : streak.lastWinDate,
        streakMultiplier: newMultiplier,
      },
    });

    return {
      currentStreak: updated.currentStreak,
      longestStreak: updated.longestStreak,
      streakMultiplier: updated.streakMultiplier,
      won,
    };
  }

  async getLeaderboard() {
    const users = await this.prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
        xp: true,
        division: true,
        rank: true,
      },
      orderBy: { xp: 'desc' },
      take: 100,
    });

    return users.map((u, i) => ({
      position: i + 1,
      userId: u.id,
      name: u.name ?? u.username,
      avatarUrl: u.avatarUrl,
      xp: u.xp,
      division: u.division,
    }));
  }

  async getUserRank(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    const rank = await this.prisma.user.count({
      where: { xp: { gt: user.xp }, role: 'STUDENT' },
    });

    const tier = await this.getTierForXp(user.xp);
    const streak = await this.prisma.winStreak.findUnique({ where: { userId } });

    return {
      userId,
      position: rank + 1,
      xp: user.xp,
      division: user.division,
      tier: tier ? { name: tier.name, displayName: tier.displayName, minXp: tier.minXp, maxXp: tier.maxXp } : null,
      winStreak: streak ? { current: streak.currentStreak, longest: streak.longestStreak, multiplier: streak.streakMultiplier } : null,
    };
  }
}
