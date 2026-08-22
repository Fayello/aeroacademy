import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
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
    const unlocked = await this.featureUnlockService.isFeatureUnlocked(userId, 'DAILY_MISSIONS');
    if (!unlocked) {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { xp: true } });
      const level = Math.floor((user?.xp || 0) / 1000) + 1;
      throw new BadRequestException(`Daily missions unlock at Level 2. You are Level ${level}.`);
    }
    return this.missionService.getDailyMissions(userId);
  }

  async claimReward(userId: string, challengeId: string) {
    return this.missionService.claimReward(userId, challengeId);
  }

  async getSkillProfile(userId: string) {
    const unlocked = await this.featureUnlockService.isFeatureUnlocked(userId, 'SKILL_PROFILE');
    const skills = unlocked ? await this.progressionService.getSkillProfile(userId) : [];
    return { unlocked, skills };
  }

  async getLeaderboard(challengeId: string) {
    return this.prisma.userChallenge.findMany({
      where: { challengeId },
      include: { user: { select: { id: true, name: true, username: true, xp: true } } },
      orderBy: { progress: 'desc' },
      take: 20,
    });
  }
}
