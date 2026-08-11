import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LeaderboardService } from './leaderboard.service';
import { DashboardService } from './dashboard.service';
import { ActivityService } from '../common/activity.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private leaderboardService: LeaderboardService,
    private dashboardService: DashboardService,
    private activityService: ActivityService,
    private prisma: PrismaService,
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

  @UseGuards(AuthGuard('jwt'))
  @Get('activity')
  async getMyActivity(@Request() req: any) {
    return this.activityService.getUserActivity(req.user.id, 20);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('active-labs')
  async getMyActiveLabs(@Request() req: any) {
    return this.prisma.labInstance.findMany({
      where: { userId: req.user.id, status: 'RUNNING' },
      include: {
        lab: { select: { id: true, title: true, difficulty: true, imageUrl: true, dockerImage: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('user-stats')
  async getUserStats(@Request() req: any) {
    return this.activityService.getUserStats(req.user.id);
  }

  @Get('global-activity')
  async getGlobalActivity() {
    return this.activityService.getRecentActivity(30);
  }

  @Get('active-users')
  async getActiveLabUsers() {
    return this.activityService.getActiveLabUsers();
  }
}
