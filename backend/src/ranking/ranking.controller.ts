import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { RankingService } from './ranking.service';

@Controller({ path: 'ranking', version: '1.2' })
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get('tiers')
  getTiers() {
    return this.rankingService.getTiers();
  }

  @Get('leaderboard')
  getLeaderboard() {
    return this.rankingService.getLeaderboard();
  }

  @Get(':userId')
  getUserRank(@Param('userId') userId: string) {
    return this.rankingService.getUserRank(userId);
  }

  @Post('seed-tiers')
  seedTiers() {
    return this.rankingService.seedDefaultTiers();
  }

  @Post(':userId/update')
  updateRanking(@Param('userId') userId: string) {
    return this.rankingService.updateRanking(userId);
  }

  @Post(':userId/win-streak')
  updateWinStreak(@Param('userId') userId: string, @Body() body: { won: boolean }) {
    return this.rankingService.updateWinStreak(userId, body.won);
  }
}
