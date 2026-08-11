import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LeaderboardService } from './leaderboard.service';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private leaderboardService: LeaderboardService,
    private dashboardService: DashboardService,
  ) {}

  @Get('public-stats')
  async getPublicStats() {
    return this.dashboardService.getPublicStats();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('leagues')
  async getLeagues() {
    return this.leaderboardService.getLeagues();
  }
}
