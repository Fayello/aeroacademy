import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressionService } from '../common/progression.service';
import { DomainRankingService } from '../domain-ranking/domain-ranking.service';

@Injectable()
export class BossMissionsService {
  private readonly logger = new Logger(BossMissionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly progressionService: ProgressionService,
    private readonly domainRankingService: DomainRankingService,
  ) {}

  async getActiveBossMissions() {
    const now = new Date();
    return this.prisma.bossMission.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        expiresAt: { gte: now },
      },
      include: { season: true },
      orderBy: { expiresAt: 'asc' },
    });
  }

  async getAllBossMissions() {
    return this.prisma.bossMission.findMany({
      include: { season: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createBossMission(data: {
    seasonId?: string;
    title: string;
    description: string;
    difficulty?: string;
    maxAttempts?: number;
    xpReward: number;
    ratingReward?: number;
    prerequisiteLabIds?: string[];
    requiredDomains?: any[];
    domainId?: string;
    theme?: string;
    labId?: string;
    startsAt: string;
    expiresAt: string;
  }) {
    const boss = await this.prisma.bossMission.create({
      data: {
        ...data,
        difficulty: data.difficulty ?? 'BOSS',
        maxAttempts: data.maxAttempts ?? 3,
        ratingReward: data.ratingReward ?? 200,
        prerequisiteLabIds: data.prerequisiteLabIds ?? [],
        requiredDomains: data.requiredDomains ?? [],
        startsAt: new Date(data.startsAt),
        expiresAt: new Date(data.expiresAt),
      },
    });
    this.logger.log(`Boss mission created: ${boss.title}`);
    return boss;
  }

  async checkDomainRequirements(userId: string, bossId: string) {
    const boss = await this.prisma.bossMission.findUnique({
      where: { id: bossId },
    });
    if (!boss) throw new NotFoundException('Boss mission not found');

    const requiredDomains = boss.requiredDomains as any[];
    if (!requiredDomains || requiredDomains.length === 0) {
      return { eligible: true, requirements: [] };
    }

    const activeSeason = await this.prisma.season.findFirst({
      where: { isActive: true },
    });
    if (!activeSeason) return { eligible: true, requirements: [] };

    const requirements = await Promise.all(
      requiredDomains.map(async (req: any) => {
        const domainRank = await this.prisma.domainRank.findUnique({
          where: {
            userId_domainId_seasonId: {
              userId,
              domainId: req.domainId,
              seasonId: activeSeason.id,
            },
          },
          include: { domain: { select: { displayName: true } } },
        });

        return {
          domainId: req.domainId,
          domainName: domainRank?.domain?.displayName || 'Unknown',
          minRating: req.minRating || 0,
          currentRating: domainRank?.rating || 1000,
          met: (domainRank?.rating || 1000) >= (req.minRating || 0),
        };
      }),
    );

    const eligible = requirements.every((r) => r.met);
    return { eligible, requirements };
  }

  async getUserAttempts(userId: string, bossId: string) {
    const boss = await this.prisma.bossMission.findUnique({
      where: { id: bossId },
    });
    if (!boss) throw new NotFoundException('Boss mission not found');

    const attempts = await this.prisma.bossMissionAttempt.findMany({
      where: { userId, bossId },
      orderBy: { createdAt: 'desc' },
    });

    const completed = attempts.some((a) => a.isCompleted);
    const domainCheck = await this.checkDomainRequirements(userId, bossId);

    return {
      boss: {
        id: boss.id,
        title: boss.title,
        description: boss.description,
        difficulty: boss.difficulty,
        maxAttempts: boss.maxAttempts,
        xpReward: boss.xpReward,
        ratingReward: boss.ratingReward,
        requiredDomains: boss.requiredDomains,
        domainId: boss.domainId,
        theme: boss.theme,
        labId: boss.labId,
        prerequisiteLabIds: boss.prerequisiteLabIds,
        expiresAt: boss.expiresAt,
      },
      domainRequirements: domainCheck,
      attempts: attempts.map((a) => ({
        id: a.id,
        score: a.score,
        maxScore: a.maxScore,
        isCompleted: a.isCompleted,
        feedback: a.feedback,
        createdAt: a.createdAt,
      })),
      attemptsRemaining: boss.maxAttempts - attempts.length,
      completed,
    };
  }

  async submitAttempt(
    userId: string,
    bossId: string,
    score: number,
    maxScore: number,
    feedback?: any,
  ) {
    const boss = await this.prisma.bossMission.findUnique({
      where: { id: bossId },
    });
    if (!boss) throw new NotFoundException('Boss mission not found');

    const now = new Date();
    if (now > boss.expiresAt)
      throw new BadRequestException('Boss mission has expired');

    const domainCheck = await this.checkDomainRequirements(userId, bossId);
    if (!domainCheck.eligible) {
      throw new BadRequestException(
        `Domain requirements not met: ${domainCheck.requirements
          .filter((r) => !r.met)
          .map(
            (r) =>
              `${r.domainName} (need ${r.minRating}, have ${r.currentRating})`,
          )
          .join(', ')}`,
      );
    }

    const existingAttempts = await this.prisma.bossMissionAttempt.findMany({
      where: { userId, bossId },
    });

    if (existingAttempts.length >= boss.maxAttempts) {
      throw new BadRequestException('Maximum attempts reached');
    }

    const completed = score >= maxScore * 0.7;

    const attempt = await this.prisma.bossMissionAttempt.create({
      data: {
        userId,
        bossId,
        score,
        maxScore,
        isCompleted: completed,
        completedAt: completed ? now : null,
        feedback,
      },
    });

    if (completed) {
      const previousCompleted = existingAttempts.some((a) => a.isCompleted);
      if (!previousCompleted) {
        await this.progressionService.awardXP(userId, {
          amount: boss.xpReward,
          source: 'BOSS_MISSION',
          sourceId: bossId,
        });
        this.logger.log(
          `User ${userId} completed boss "${boss.title}" for ${boss.xpReward} XP`,
        );

        if (boss.domainId && boss.ratingReward > 0) {
          const activeSeason = await this.prisma.season.findFirst({
            where: { isActive: true },
          });
          if (activeSeason) {
            try {
              const ratingPerf = Math.min(1.0, score / maxScore);
              await this.domainRankingService.awardDomainRating({
                userId,
                domainId: boss.domainId,
                seasonId: activeSeason.id,
                activityType: 'BOSS_MISSION',
                activityId: bossId,
                difficulty: boss.difficulty,
                performance: ratingPerf,
                quality: ratingPerf,
                timeEfficiency: 0.8,
                independence: 0.9,
              });
              this.logger.log(
                `Awarded domain rating for boss "${boss.title}" in domain ${boss.domainId}`,
              );
            } catch (err) {
              this.logger.error(
                `Failed to award domain rating for boss: ${err?.message}`,
              );
            }
          }
        }
      }
    }

    return {
      attempt,
      isCompleted: completed,
      attemptsRemaining: boss.maxAttempts - existingAttempts.length - 1,
      ratingAwarded: completed && boss.domainId ? boss.ratingReward : 0,
    };
  }

  async getLeaderboard(bossId: string) {
    const attempts = await this.prisma.bossMissionAttempt.findMany({
      where: { bossId, isCompleted: true },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
      },
      orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
      take: 50,
    });

    return attempts.map((a, i) => ({
      position: i + 1,
      userId: a.user.id,
      name: a.user.name ?? a.user.username,
      avatarUrl: a.user.avatarUrl,
      score: a.score,
      maxScore: a.maxScore,
      completedAt: a.completedAt,
    }));
  }
}
