import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type DisplayMode = 'PROFESSIONAL' | 'PROGRESSION' | 'COMPETITIVE';

@Injectable()
export class DisplayModeService {
  private readonly logger = new Logger(DisplayModeService.name);

  constructor(private prisma: PrismaService) {}

  async getDisplayMode(userId: string): Promise<DisplayMode> {
    const pref = await this.prisma.userPreference.findUnique({
      where: { userId },
      select: { displayMode: true },
    });
    return (pref?.displayMode as DisplayMode) || 'PROGRESSION';
  }

  async setDisplayMode(userId: string, mode: DisplayMode): Promise<DisplayMode> {
    if (!['PROFESSIONAL', 'PROGRESSION', 'COMPETITIVE'].includes(mode)) {
      throw new Error('Invalid display mode. Must be PROFESSIONAL, PROGRESSION, or COMPETITIVE');
    }

    await this.prisma.userPreference.upsert({
      where: { userId },
      update: { displayMode: mode },
      create: { userId, displayMode: mode },
    });

    this.logger.log(`Display mode set to ${mode} for user ${userId}`);
    return mode;
  }

  async getModeConfig(mode: DisplayMode) {
    const configs: Record<DisplayMode, {
      showXp: boolean;
      showLevels: boolean;
      showRanks: boolean;
      showBadges: boolean;
      showStreaks: boolean;
      showMissions: boolean;
      showLeaderboard: boolean;
      showCompete: boolean;
      showBattlePass: boolean;
      showBossMissions: boolean;
      showSeasons: boolean;
      showGenome: boolean;
      showMastery: boolean;
      showCertifications: boolean;
      showCompetency: boolean;
    }> = {
      PROFESSIONAL: {
        showXp: false,
        showLevels: false,
        showRanks: false,
        showBadges: false,
        showStreaks: false,
        showMissions: false,
        showLeaderboard: false,
        showCompete: false,
        showBattlePass: false,
        showBossMissions: false,
        showSeasons: false,
        showGenome: true,
        showMastery: true,
        showCertifications: true,
        showCompetency: true,
      },
      PROGRESSION: {
        showXp: true,
        showLevels: true,
        showRanks: false,
        showBadges: true,
        showStreaks: true,
        showMissions: true,
        showLeaderboard: false,
        showCompete: false,
        showBattlePass: true,
        showBossMissions: false,
        showSeasons: false,
        showGenome: true,
        showMastery: true,
        showCertifications: true,
        showCompetency: true,
      },
      COMPETITIVE: {
        showXp: true,
        showLevels: true,
        showRanks: true,
        showBadges: true,
        showStreaks: true,
        showMissions: true,
        showLeaderboard: true,
        showCompete: true,
        showBattlePass: true,
        showBossMissions: true,
        showSeasons: true,
        showGenome: true,
        showMastery: true,
        showCertifications: true,
        showCompetency: true,
      },
    };

    return configs[mode];
  }
}
