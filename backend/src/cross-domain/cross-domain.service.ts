import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressionService } from '../common/progression.service';

@Injectable()
export class CrossDomainService {
  private readonly logger = new Logger(CrossDomainService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly progressionService: ProgressionService,
  ) {}

  async getActiveMissions() {
    const now = new Date();
    return this.prisma.crossDomainMission.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        expiresAt: { gte: now },
      },
      orderBy: { expiresAt: 'asc' },
    });
  }

  async getAllMissions() {
    return this.prisma.crossDomainMission.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMission(data: {
    title: string;
    description: string;
    requiredDomains: Array<{ domainId: string; minSkillXp: number }>;
    xpReward: number;
    badgeRewardId?: string;
    startsAt: string;
    expiresAt: string;
  }) {
    const mission = await this.prisma.crossDomainMission.create({
      data: {
        ...data,
        startsAt: new Date(data.startsAt),
        expiresAt: new Date(data.expiresAt),
      },
    });
    this.logger.log(`Cross-domain mission created: ${mission.title}`);
    return mission;
  }

  async joinMission(userId: string, missionId: string) {
    const mission = await this.prisma.crossDomainMission.findUnique({
      where: { id: missionId },
    });
    if (!mission) throw new NotFoundException('Mission not found');

    const now = new Date();
    if (now > mission.expiresAt)
      throw new BadRequestException('Mission has expired');

    const existing = await this.prisma.crossDomainProgress.findUnique({
      where: { userId_missionId: { userId, missionId } },
    });
    if (existing) throw new BadRequestException('Already participating');

    const requiredDomains = mission.requiredDomains as Array<{
      domainId: string;
      minSkillXp: number;
    }>;
    const progress: Record<string, number> = {};
    for (const rd of requiredDomains) {
      progress[rd.domainId] = 0;
    }

    return this.prisma.crossDomainProgress.create({
      data: { userId, missionId, progress },
    });
  }

  async updateDomainProgress(
    userId: string,
    missionId: string,
    domainId: string,
    xp: number,
  ) {
    const participant = await this.prisma.crossDomainProgress.findUnique({
      where: { userId_missionId: { userId, missionId } },
    });
    if (!participant) throw new NotFoundException('Not participating');

    const mission = await this.prisma.crossDomainMission.findUnique({
      where: { id: missionId },
    });
    if (!mission) throw new NotFoundException('Mission not found');

    const progress = (participant.progress as Record<string, number>) ?? {};
    progress[domainId] = xp;

    const requiredDomains = mission.requiredDomains as Array<{
      domainId: string;
      minSkillXp: number;
    }>;
    const allMet = requiredDomains.every(
      (rd) => (progress[rd.domainId] ?? 0) >= rd.minSkillXp,
    );

    return this.prisma.crossDomainProgress.update({
      where: { id: participant.id },
      data: {
        progress,
        ...(allMet && !participant.completed
          ? { completed: true, completedAt: new Date() }
          : {}),
      },
    });
  }

  async claimReward(userId: string, missionId: string) {
    const participant = await this.prisma.crossDomainProgress.findUnique({
      where: { userId_missionId: { userId, missionId } },
    });
    if (!participant) throw new NotFoundException('Not participating');
    if (!participant.completed)
      throw new BadRequestException('Mission not yet completed');

    const mission = await this.prisma.crossDomainMission.findUnique({
      where: { id: missionId },
    });
    if (!mission) throw new NotFoundException('Mission not found');

    await this.progressionService.awardXP(userId, {
      amount: mission.xpReward,
      source: 'CROSS_DOMAIN_MISSION',
      sourceId: missionId,
    });

    this.logger.log(
      `User ${userId} claimed cross-domain reward: ${mission.xpReward} XP`,
    );
    return { success: true, xpAwarded: mission.xpReward };
  }

  async getMissionLeaderboard(missionId: string) {
    const participants = await this.prisma.crossDomainProgress.findMany({
      where: { missionId },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
      },
      orderBy: [{ completed: 'desc' }, { createdAt: 'asc' }],
      take: 50,
    });

    return participants.map((p, i) => ({
      position: i + 1,
      userId: p.user.id,
      name: p.user.name ?? p.user.username,
      avatarUrl: p.user.avatarUrl,
      progress: p.progress,
      completed: p.completed,
      completedAt: p.completedAt,
    }));
  }
}
