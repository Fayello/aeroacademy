import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressionService } from '../common/progression.service';

@Injectable()
export class BossMissionsService {
  private readonly logger = new Logger(BossMissionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly progressionService: ProgressionService,
  ) {}

  async getActiveBossMissions() {
    const now = new Date();
    return this.prisma.bossMission.findMany({
      where: { isActive: true, startsAt: { lte: now }, expiresAt: { gte: now } },
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
    prerequisiteLabIds?: string[];
    labId?: string;
    startsAt: string;
    expiresAt: string;
  }) {
    const boss = await this.prisma.bossMission.create({
      data: {
        ...data,
        difficulty: data.difficulty ?? 'BOSS',
        maxAttempts: data.maxAttempts ?? 3,
        prerequisiteLabIds: data.prerequisiteLabIds ?? [],
        startsAt: new Date(data.startsAt),
        expiresAt: new Date(data.expiresAt),
      },
    });
    this.logger.log(`Boss mission created: ${boss.title}`);
    return boss;
  }

  async getUserAttempts(userId: string, bossId: string) {
    const boss = await this.prisma.bossMission.findUnique({ where: { id: bossId } });
    if (!boss) throw new NotFoundException('Boss mission not found');

    const attempts = await this.prisma.bossMissionAttempt.findMany({
      where: { userId, bossId },
      orderBy: { createdAt: 'desc' },
    });

    const completed = attempts.some(a => a.isCompleted);

    return {
      boss: {
        id: boss.id,
        title: boss.title,
        description: boss.description,
        difficulty: boss.difficulty,
        maxAttempts: boss.maxAttempts,
        xpReward: boss.xpReward,
        labId: boss.labId,
        prerequisiteLabIds: boss.prerequisiteLabIds,
        expiresAt: boss.expiresAt,
      },
      attempts: attempts.map(a => ({
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

  async submitAttempt(userId: string, bossId: string, score: number, maxScore: number, feedback?: any) {
    const boss = await this.prisma.bossMission.findUnique({ where: { id: bossId } });
    if (!boss) throw new NotFoundException('Boss mission not found');

    const now = new Date();
    if (now > boss.expiresAt) throw new BadRequestException('Boss mission has expired');

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
      const previousCompleted = existingAttempts.some(a => a.isCompleted);
      if (!previousCompleted) {
        await this.progressionService.awardXP(userId, {
          amount: boss.xpReward,
          source: 'BOSS_MISSION',
          sourceId: bossId,
        });
        this.logger.log(`User ${userId} completed boss "${boss.title}" for ${boss.xpReward} XP`);
      }
    }

    return {
      attempt,
      isCompleted: completed,
      attemptsRemaining: boss.maxAttempts - existingAttempts.length - 1,
    };
  }

  async getLeaderboard(bossId: string) {
    const attempts = await this.prisma.bossMissionAttempt.findMany({
      where: { bossId, isCompleted: true },
      include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } },
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
