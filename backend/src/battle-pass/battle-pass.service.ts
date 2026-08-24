import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressionService } from '../common/progression.service';

@Injectable()
export class BattlePassService {
  private readonly logger = new Logger(BattlePassService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly progressionService: ProgressionService,
  ) {}

  async getBattlePass(seasonId?: string) {
    const where = seasonId ? { seasonId } : { isActive: true };
    return this.prisma.battlePass.findFirst({
      where,
      include: { tiers: { orderBy: { tierNumber: 'asc' } }, season: true },
    });
  }

  async createBattlePass(seasonId: string, title: string, tiers: Array<{ tierNumber: number; title: string; xpRequired: number; rewards: any; isPremium?: boolean }>) {
    const season = await this.prisma.season.findUnique({ where: { id: seasonId } });
    if (!season) throw new NotFoundException('Season not found');

    const existing = await this.prisma.battlePass.findFirst({ where: { seasonId } });
    if (existing) throw new Error('Battle pass already exists for this season');

    const totalXp = tiers.reduce((sum, t) => sum + t.xpRequired, 0);

    const battlePass = await this.prisma.battlePass.create({
      data: {
        seasonId,
        title,
        totalTiers: tiers.length,
        tiers: {
          create: tiers.map(t => ({
            tierNumber: t.tierNumber,
            title: t.title,
            xpRequired: t.xpRequired,
            rewards: t.rewards,
            isPremium: t.isPremium ?? false,
          })),
        },
      },
      include: { tiers: { orderBy: { tierNumber: 'asc' } } },
    });

    this.logger.log(`Battle pass created for season ${seasonId}: ${tiers.length} tiers, ${totalXp} total XP`);
    return battlePass;
  }

  async getUserProgress(userId: string) {
    const activeSeason = await this.prisma.season.findFirst({ where: { isActive: true } });
    if (!activeSeason) return null;

    const battlePass = await this.prisma.battlePass.findFirst({
      where: { seasonId: activeSeason.id },
      include: {
        tiers: {
          orderBy: { tierNumber: 'asc' },
          include: { progress: { where: { userId } } },
        },
      },
    });

    if (!battlePass) return null;

    let totalXpEarned = 0;
    let currentTier = 0;

    for (const tier of battlePass.tiers) {
      const progress = tier.progress[0];
      if (progress) {
        totalXpEarned += progress.currentXp;
        if (progress.unlocked) currentTier = tier.tierNumber;
      }
    }

    return {
      battlePassId: battlePass.id,
      title: battlePass.title,
      season: activeSeason.name,
      totalXpEarned,
      currentTier,
      totalTiers: battlePass.totalTiers,
      tiers: battlePass.tiers.map(t => ({
        tierNumber: t.tierNumber,
        title: t.title,
        xpRequired: t.xpRequired,
        rewards: t.rewards,
        isPremium: t.isPremium,
        unlocked: t.progress[0]?.unlocked ?? false,
        currentXp: t.progress[0]?.currentXp ?? 0,
      })),
    };
  }

  async addBattlePassXp(userId: string, amount: number, source: string) {
    const activeSeason = await this.prisma.season.findFirst({ where: { isActive: true } });
    if (!activeSeason) return null;

    const battlePass = await this.prisma.battlePass.findFirst({
      where: { seasonId: activeSeason.id },
      include: { tiers: { orderBy: { tierNumber: 'asc' } } },
    });
    if (!battlePass) return null;

    const unlockedTiers: number[] = [];

    for (const tier of battlePass.tiers) {
      const progress = await this.prisma.battlePassProgress.upsert({
        where: { userId_tierId: { userId, tierId: tier.id } },
        update: {},
        create: { userId, tierId: tier.id, currentXp: 0 },
      });

      if (progress.unlocked) continue;

      const remainingXp = tier.xpRequired - progress.currentXp;
      const xpToAdd = Math.min(amount, remainingXp);

      await this.prisma.battlePassProgress.update({
        where: { id: progress.id },
        data: {
          currentXp: progress.currentXp + xpToAdd,
          ...(progress.currentXp + xpToAdd >= tier.xpRequired
            ? { unlocked: true, unlockedAt: new Date() }
            : {}),
        },
      });

      if (progress.currentXp + xpToAdd >= tier.xpRequired) {
        unlockedTiers.push(tier.tierNumber);
        this.logger.log(`User ${userId} unlocked battle pass tier ${tier.tierNumber}`);
      }

      amount -= xpToAdd;
      if (amount <= 0) break;
    }

    return { unlockedTiers };
  }

  async getLeaderboard() {
    const activeSeason = await this.prisma.season.findFirst({ where: { isActive: true } });
    if (!activeSeason) return [];

    const battlePass = await this.prisma.battlePass.findFirst({
      where: { seasonId: activeSeason.id },
    });
    if (!battlePass) return [];

    const allProgress = await this.prisma.battlePassProgress.groupBy({
      by: ['userId'],
      where: {
        tier: { battlePassId: battlePass.id },
      },
      _sum: { currentXp: true },
      _count: { id: true },
    });

    const sorted = allProgress
      .sort((a, b) => (b._sum.currentXp ?? 0) - (a._sum.currentXp ?? 0))
      .slice(0, 50);

    return sorted.map((p, i) => ({
      position: i + 1,
      userId: p.userId,
      totalXp: p._sum.currentXp ?? 0,
      tiersUnlocked: p._count.id,
    }));
  }

  async resetSeasonProgress(seasonId: string) {
    const battlePass = await this.prisma.battlePass.findFirst({
      where: { seasonId },
    });
    if (!battlePass) return;

    await this.prisma.battlePassProgress.deleteMany({
      where: { tier: { battlePassId: battlePass.id } },
    });

    this.logger.log(`Battle pass progress reset for season ${seasonId}`);
  }
}
