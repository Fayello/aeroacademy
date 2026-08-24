import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { DomainRankingService } from './domain-ranking.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('v2/domain-ranking')
export class DomainRankingController {
  constructor(
    private readonly domainRankingService: DomainRankingService,
    private readonly prisma: PrismaService,
  ) {}

  private async getActiveSeason() {
    return this.prisma.season.findFirst({ where: { isActive: true } });
  }

  private async resolveSeasonId(seasonId?: string): Promise<string | null> {
    if (seasonId) return seasonId;
    const season = await this.getActiveSeason();
    return season?.id || null;
  }

  @Get('my-ranks/:userId')
  async getMyDomainRanks(
    @Param('userId') userId: string,
    @Query('seasonId') seasonId?: string,
  ) {
    const sid = await this.resolveSeasonId(seasonId);
    if (!sid) return [];
    return this.domainRankingService.getUserDomainRanks(userId, sid);
  }

  @Get('domain/:domainId/leaderboard')
  async getDomainLeaderboard(
    @Param('domainId') domainId: string,
    @Query('seasonId') seasonId?: string,
    @Query('limit') limit?: string,
  ) {
    const sid = await this.resolveSeasonId(seasonId);
    if (!sid) return [];
    return this.domainRankingService.getDomainLeaderboard(
      domainId,
      sid,
      limit ? parseInt(limit) : 100,
    );
  }

  @Get('leaderboard')
  async getGlobalLeaderboard(
    @Query('seasonId') seasonId?: string,
    @Query('limit') limit?: string,
  ) {
    const sid = await this.resolveSeasonId(seasonId);
    if (!sid) return [];
    return this.domainRankingService.getGlobalLeaderboard(
      sid,
      limit ? parseInt(limit) : 100,
    );
  }

  @Get('history/:userId/:domainId')
  async getRatingHistory(
    @Param('userId') userId: string,
    @Param('domainId') domainId: string,
    @Query('seasonId') seasonId?: string,
  ) {
    const sid = await this.resolveSeasonId(seasonId);
    if (!sid) return [];
    return this.domainRankingService.getUserRatingHistory(userId, domainId, sid);
  }

  @Get('tiers')
  async getTiers() {
    return [
      { name: 'BRONZE', min: 0, max: 1499, tiers: 4 },
      { name: 'SILVER', min: 1500, max: 2999, tiers: 4 },
      { name: 'GOLD', min: 3000, max: 4999, tiers: 4 },
      { name: 'PLATINUM', min: 5000, max: 7499, tiers: 4 },
      { name: 'DIAMOND', min: 7500, max: 10999, tiers: 4 },
      { name: 'MASTER', min: 11000, max: 14999, tiers: 4 },
      { name: 'GRANDMASTER', min: 15000, max: 999999, tiers: 4 },
    ];
  }

  @Post('award')
  async awardRating(
    @Body()
    body: {
      userId: string;
      domainId: string;
      seasonId?: string;
      activityType: string;
      activityId?: string;
      difficulty: string;
      performance: number;
      quality: number;
      timeEfficiency: number;
      independence: number;
    },
  ) {
    const sid = await this.resolveSeasonId(body.seasonId);
    if (!sid) return { error: 'No active season' };
    return this.domainRankingService.awardDomainRating({
      ...body,
      seasonId: sid,
    });
  }

  @Post('soft-reset/:seasonId')
  async softReset(@Param('seasonId') seasonId: string) {
    return this.domainRankingService.softResetSeason(seasonId);
  }

  @Post('initialize/:userId')
  async initializeRanks(
    @Param('userId') userId: string,
    @Query('seasonId') seasonId?: string,
  ) {
    const sid = await this.resolveSeasonId(seasonId);
    if (!sid) return { error: 'No active season' };
    await this.domainRankingService.initializeDomainRanks(userId, sid);
    return { message: 'Domain ranks initialized' };
  }

  @Get('profile/:userId')
  async getRankedProfile(@Param('userId') userId: string) {
    return this.domainRankingService.getRankedProfile(userId);
  }
  }
}
