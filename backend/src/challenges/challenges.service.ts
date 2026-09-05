import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MissionService } from './mission.service';
import { FeatureUnlockService } from './feature-unlock.service';
import { ProgressionService } from '../common/progression.service';

@Injectable()
export class ChallengesService {
  private readonly logger = new Logger(ChallengesService.name);

  constructor(
    private prisma: PrismaService,
    private missionService: MissionService,
    private featureUnlockService: FeatureUnlockService,
    private progressionService: ProgressionService,
  ) {}

  async findAll() {
    return this.prisma.challenge.findMany({
      where: { isActive: true },
      include: {
        domain: { select: { name: true, displayName: true } },
        skill: { select: { name: true, displayName: true } },
        _count: { select: { userChallenges: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id },
      include: {
        domain: { select: { name: true, displayName: true } },
        skill: { select: { name: true, displayName: true } },
        userChallenges: {
          include: { user: { select: { id: true, name: true, xp: true } } },
          orderBy: { progress: 'desc' },
        },
      },
    });
    if (!challenge) throw new NotFoundException('Challenge not found');
    return challenge;
  }

  async getDailyMissions(userId: string) {
    const unlocked = await this.featureUnlockService.isFeatureUnlocked(
      userId,
      'DAILY_MISSIONS',
    );
    if (!unlocked) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { xp: true },
      });
      const level = Math.floor((user?.xp || 0) / 1000) + 1;
      throw new BadRequestException(
        `Daily missions unlock at Level 2. You are Level ${level}.`,
      );
    }
    return this.missionService.getDailyMissions(userId);
  }

  async claimReward(userId: string, challengeId: string) {
    return this.missionService.claimReward(userId, challengeId);
  }

  async getSkillProfile(userId: string) {
    const unlocked = await this.featureUnlockService.isFeatureUnlocked(
      userId,
      'SKILL_PROFILE',
    );
    const skills = unlocked
      ? await this.progressionService.getSkillProfile(userId)
      : [];
    return { unlocked, skills };
  }

  async getLeaderboard(challengeId: string) {
    return this.prisma.userChallenge.findMany({
      where: { challengeId },
      include: {
        user: { select: { id: true, name: true, username: true, xp: true } },
      },
      orderBy: { progress: 'desc' },
      take: 20,
    });
  }

  async sendLabChallenge(challengerId: string, opponentId: string, labId: string) {
    if (challengerId === opponentId) {
      throw new BadRequestException('Cannot challenge yourself');
    }

    const existing = await this.prisma.labChallenge.findFirst({
      where: {
        challengerId,
        opponentId,
        labId,
        status: { in: ['PENDING', 'ACCEPTED'] },
      },
    });
    if (existing) {
      throw new BadRequestException('Challenge already pending or active');
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    return this.prisma.labChallenge.create({
      data: {
        challengerId,
        opponentId,
        labId,
        expiresAt,
      },
      include: {
        challenger: { select: { id: true, name: true, username: true } },
        opponent: { select: { id: true, name: true, username: true } },
        lab: { select: { id: true, title: true, difficulty: true } },
      },
    });
  }

  async getMyLabChallenges(userId: string) {
    return this.prisma.labChallenge.findMany({
      where: {
        OR: [{ challengerId: userId }, { opponentId: userId }],
      },
      include: {
        challenger: { select: { id: true, name: true, username: true, xp: true } },
        opponent: { select: { id: true, name: true, username: true, xp: true } },
        lab: { select: { id: true, title: true, difficulty: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async acceptLabChallenge(userId: string, challengeId: string) {
    const challenge = await this.prisma.labChallenge.findUnique({ where: { id: challengeId } });
    if (!challenge) throw new NotFoundException('Challenge not found');
    if (challenge.opponentId !== userId) throw new BadRequestException('Not your challenge');
    if (challenge.status !== 'PENDING') throw new BadRequestException('Challenge is not pending');
    if (new Date() > challenge.expiresAt) throw new BadRequestException('Challenge expired');

    return this.prisma.labChallenge.update({
      where: { id: challengeId },
      data: { status: 'ACCEPTED' },
      include: {
        challenger: { select: { id: true, name: true, username: true } },
        opponent: { select: { id: true, name: true, username: true } },
        lab: { select: { id: true, title: true } },
      },
    });
  }

  async declineLabChallenge(userId: string, challengeId: string) {
    const challenge = await this.prisma.labChallenge.findUnique({ where: { id: challengeId } });
    if (!challenge) throw new NotFoundException('Challenge not found');
    if (challenge.opponentId !== userId) throw new BadRequestException('Not your challenge');

    return this.prisma.labChallenge.update({
      where: { id: challengeId },
      data: { status: 'DECLINED' },
    });
  }

  async completeLabChallenge(userId: string, challengeId: string) {
    const challenge = await this.prisma.labChallenge.findUnique({ where: { id: challengeId } });
    if (!challenge) throw new NotFoundException('Challenge not found');
    if (challenge.challengerId !== userId && challenge.opponentId !== userId) {
      throw new BadRequestException('Not part of this challenge');
    }
    if (challenge.status !== 'ACCEPTED') throw new BadRequestException('Challenge not active');

    const isChallenger = challenge.challengerId === userId;
    const timeField = isChallenger ? 'challengerTime' : 'opponentTime';

    const startTime = challenge.createdAt;
    const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);

    const updateData: Record<string, unknown> = {
      [timeField]: elapsed,
    };

    const otherTime = isChallenger ? challenge.opponentTime : challenge.challengerTime;
    if (otherTime !== null) {
      const myTime = elapsed;
      updateData.winnerId = myTime < otherTime ? userId : myTime > otherTime ? (isChallenger ? challenge.opponentId : challenge.challengerId) : null;
      updateData.status = 'COMPLETED';
    }

    return this.prisma.labChallenge.update({
      where: { id: challengeId },
      data: updateData,
      include: {
        challenger: { select: { id: true, name: true, username: true } },
        opponent: { select: { id: true, name: true, username: true } },
        lab: { select: { id: true, title: true } },
      },
    });
  }
}
