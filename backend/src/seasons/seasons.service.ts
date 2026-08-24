import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DomainRankingService } from '../domain-ranking/domain-ranking.service';
import { BattlePassService } from '../battle-pass/battle-pass.service';

const DOMAIN_THEME_MAP: Record<string, string[]> = {
  SECURITY: ['SECURITY', 'NETWORKING', 'SYSTEMS'],
  DEVOPS: ['DEVOPS', 'SYSTEMS', 'DATABASES'],
  DATABASES: ['DATABASES', 'SYSTEMS', 'QA'],
  NETWORKING: ['NETWORKING', 'SECURITY', 'SYSTEMS'],
  SYSTEMS: ['SYSTEMS', 'DEVOPS', 'NETWORKING'],
  QA: ['QA', 'DATABASES', 'SECURITY'],
};

@Injectable()
export class SeasonsService {
  private readonly logger = new Logger(SeasonsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly domainRankingService: DomainRankingService,
    private readonly battlePassService: BattlePassService,
  ) {}

  async getActiveSeason() {
    return this.prisma.season.findFirst({
      where: { isActive: true },
      include: {
        battlePass: { include: { tiers: { orderBy: { tierNumber: 'asc' } } } },
      },
    });
  }

  async getAllSeasons() {
    return this.prisma.season.findMany({ orderBy: { startDate: 'desc' } });
  }

  async createSeason(data: {
    name: string;
    theme?: string;
    domainTheme?: string;
    xpMultiplier?: number;
    startDate: string;
    endDate: string;
  }) {
    const activeSeason = await this.prisma.season.findFirst({ where: { isActive: true } });
    if (activeSeason) {
      throw new BadRequestException('A season is already active. End it before starting a new one.');
    }

    const lastSeason = await this.prisma.season.findFirst({
      orderBy: { seasonNumber: 'desc' },
    });
    const nextNumber = (lastSeason?.seasonNumber || 0) + 1;

    const season = await this.prisma.season.create({
      data: {
        name: data.name,
        theme: data.theme,
        domainTheme: data.domainTheme,
        seasonNumber: nextNumber,
        xpMultiplier: data.xpMultiplier ?? 1.0,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isActive: true,
      },
    });

    this.logger.log(`Season ${nextNumber} created: ${season.name}`);
    return season;
  }

  async endSeason(seasonId: string) {
    const season = await this.prisma.season.findUnique({ where: { id: seasonId } });
    if (!season) throw new NotFoundException('Season not found');

    await this.prisma.season.update({
      where: { id: seasonId },
      data: { isActive: false },
    });

    this.logger.log(`Season ended: ${season.name} (S${season.seasonNumber})`);
    return { message: 'Season ended successfully', seasonNumber: season.seasonNumber };
  }

  async rotateSeason() {
    const active = await this.prisma.season.findFirst({ where: { isActive: true } });
    if (active) {
      await this.domainRankingService.softResetSeason(active.id);
      await this.battlePassService.resetSeasonProgress(active.id);

      await this.prisma.season.update({
        where: { id: active.id },
        data: { isActive: false },
      });
      this.logger.log(`Ended and soft-reset season: ${active.name}`);
    }

    return {
      message: 'Season rotation complete',
      ended: active?.name ?? null,
      seasonNumber: active?.seasonNumber ?? null,
    };
  }

  getDomainThemeMapping(domainTheme: string) {
    return DOMAIN_THEME_MAP[domainTheme?.toUpperCase()] || ['SYSTEMS', 'NETWORKING', 'DEVOPS'];
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async checkSeasonExpiry() {
    const active = await this.prisma.season.findFirst({ where: { isActive: true } });
    if (!active) return;

    const now = new Date();
    if (now >= active.endDate) {
      this.logger.warn(`Season ${active.name} has expired. Running rotation...`);
      await this.rotateSeason();
    }
  }
}
