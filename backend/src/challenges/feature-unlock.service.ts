import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_UNLOCKS = [
  {
    feature: 'CORE_LEARNING',
    requiredLevel: 1,
    description: 'Access courses and labs',
  },
  {
    feature: 'DAILY_MISSIONS',
    requiredLevel: 2,
    description: 'Daily missions with XP rewards',
  },
  {
    feature: 'SKILL_PROFILE',
    requiredLevel: 4,
    description: 'View your skill progression',
  },
  {
    feature: 'ACHIEVEMENTS',
    requiredLevel: 5,
    description: 'Unlock achievements',
  },
  {
    feature: 'LEADERBOARD',
    requiredLevel: 7,
    description: 'Compete on the leaderboard',
  },
  {
    feature: 'RANKED_CHALLENGES',
    requiredLevel: 10,
    description: 'Ranked competitive challenges',
  },
  {
    feature: 'TEAM_CHALLENGES',
    requiredLevel: 15,
    description: 'Challenge your team',
  },
  {
    feature: 'ADVANCED_LABS',
    requiredLevel: 20,
    description: 'Access advanced labs',
  },
  {
    feature: 'SEASONAL',
    requiredLevel: 25,
    description: 'Seasonal competitions',
  },
];

@Injectable()
export class FeatureUnlockService {
  constructor(private prisma: PrismaService) {}

  async isFeatureUnlocked(userId: string, feature: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true },
    });
    if (!user) return false;
    const level = Math.floor(user.xp / 1000) + 1;
    const unlock = await this.prisma.featureUnlock.findUnique({
      where: { feature },
    });
    if (!unlock) return true;
    return level >= unlock.requiredLevel;
  }

  async getUnlockedFeatures(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true },
    });
    const level = user ? Math.floor(user.xp / 1000) + 1 : 1;
    const unlocks = await this.prisma.featureUnlock.findMany();
    return unlocks.map((u) => ({
      feature: u.feature,
      unlocked: level >= u.requiredLevel,
      requiredLevel: u.requiredLevel,
      description: u.description,
    }));
  }

  async seedDefaults() {
    for (const u of DEFAULT_UNLOCKS) {
      await this.prisma.featureUnlock.upsert({
        where: { feature: u.feature },
        update: { requiredLevel: u.requiredLevel, description: u.description },
        create: u,
      });
    }
    return { seeded: DEFAULT_UNLOCKS.length };
  }
}
