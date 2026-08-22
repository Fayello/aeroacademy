import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LeaderboardService } from './leaderboard.service';
import type { TimeFilter, DomainFilter } from './leaderboard.service';
import { DashboardService } from './dashboard.service';
import { ActivityService } from '../common/activity.service';
import { PrismaService } from '../prisma/prisma.service';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { RequestWithUser } from '../common/request-with-user';

@ApiTags('dashboard')
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

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Get('leaderboard')
  @ApiQuery({ name: 'time', required: false, enum: ['all', 'month', 'week'] })
  @ApiQuery({ name: 'domain', required: false, enum: ['all', 'SECURITY', 'NETWORKING', 'DEVOPS', 'DATABASES', 'SYSTEMS', 'QA'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getLeaderboard(
    @Query('time') time?: TimeFilter,
    @Query('domain') domain?: DomainFilter,
    @Query('limit') limit?: string,
  ) {
    return this.leaderboardService.getFilteredLeaderboard({
      limit: limit ? parseInt(limit, 10) : 50,
      time: time || 'all',
      domain: domain || 'all',
    });
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Get('leagues')
  async getLeagues() {
    return this.leaderboardService.getLeagues();
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Get('activity')
  async getMyActivity(@Request() req: RequestWithUser) {
    return this.activityService.getUserActivity(req.user.id, 20);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Get('activity/yearly')
  async getYearlyActivity(@Request() req: RequestWithUser) {
    return this.activityService.getYearlyActivity(req.user.id);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Get('active-labs')
  async getMyActiveLabs(@Request() req: RequestWithUser) {
    return this.prisma.labInstance.findMany({
      where: { userId: req.user.id, status: 'RUNNING' },
      include: {
        lab: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            imageUrl: true,
            dockerImage: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Get('user-stats')
  async getUserStats(@Request() req: RequestWithUser) {
    return this.activityService.getUserStats(req.user.id);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Get('global-activity')
  async getGlobalActivity() {
    return this.activityService.getRecentActivity(30);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Get('active-users')
  async getActiveLabUsers() {
    return this.activityService.getActiveLabUsers();
  }
}
