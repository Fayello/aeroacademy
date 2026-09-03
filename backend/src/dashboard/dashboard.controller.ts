import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LeaderboardService } from './leaderboard.service';
import type { TimeFilter, DomainFilter } from './leaderboard.service';
import { DashboardService } from './dashboard.service';
import { ActivityService } from '../common/activity.service';
import { AchievementService } from './achievement.service';
import { PersonalizationService } from '../common/personalization.service';
import { PrismaService } from '../prisma/prisma.service';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { RequestWithUser } from '../common/request-with-user';

@ApiTags('dashboard')
@Controller('v1/dashboard')
export class DashboardController {
  constructor(
    private leaderboardService: LeaderboardService,
    private dashboardService: DashboardService,
    private activityService: ActivityService,
    private achievementService: AchievementService,
    private personalizationService: PersonalizationService,
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
  @ApiQuery({
    name: 'domain',
    required: false,
    enum: [
      'all',
      'SECURITY',
      'NETWORKING',
      'DEVOPS',
      'DATABASES',
      'SYSTEMS',
      'QA',
    ],
  })
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

  // V2: Achievement progress for current user
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Get('achievements')
  async getMyAchievements(@Request() req: RequestWithUser) {
    return this.achievementService.getAchievementProgress(req.user.id);
  }

  // V2: Team leaderboard
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Get('team-leaderboard')
  async getTeamLeaderboard(@Query('limit') limit?: string) {
    return this.leaderboardService.getTeamLeaderboard(
      limit ? parseInt(limit, 10) : 50,
    );
  }

  // V2: Head-to-head comparison
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Get('head-to-head/:userId1/:userId2')
  async getHeadToHead(
    @Param('userId1') userId1: string,
    @Param('userId2') userId2: string,
  ) {
    return this.leaderboardService.getHeadToHead(userId1, userId2);
  }

  // V2: Leaderboard snapshots
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Get('snapshots')
  async getSnapshots(
    @Query('period') period?: string,
    @Query('limit') limit?: string,
  ) {
    return this.leaderboardService.getSnapshotHistory(
      period || 'WEEKLY',
      limit ? parseInt(limit, 10) : 10,
    );
  }

  // V2: Streak data
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Get('streak')
  async getStreak(@Request() req: RequestWithUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        currentStreak: true,
        longestStreak: true,
        lastActivityDate: true,
        streakFreezes: true,
        dailyMissionCombo: true,
      },
    });
    return user;
  }

  // V2: Learning path with prerequisites
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Get('learning-paths')
  async getLearningPaths() {
    return this.prisma.learningPath.findMany({
      include: {
        courses: { include: { course: true }, orderBy: { order: 'asc' } },
        enrollments: true,
        prerequisitePath: { select: { id: true, title: true } },
      },
    });
  }

  // V2: Personalized recommendations
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Get('recommendations')
  async getRecommendations(
    @Request() req: RequestWithUser,
    @Query('limit') limit?: string,
  ) {
    const result = await Promise.race([
      this.personalizationService.getRecommendations(
        req.user.id,
        limit ? parseInt(limit, 10) : 5,
      ),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
    ]);
    return result ?? { courses: [], labs: [], paths: [], insights: { journeySummary: '', personalizationMode: 'rules' } };
  }

  // V2: User preferences
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Get('preferences')
  async getPreferences(@Request() req: RequestWithUser) {
    return this.personalizationService.getPreferences(req.user.id);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Post('preferences')
  async updatePreferences(
    @Request() req: RequestWithUser,
    @Body()
    body: {
      interests?: string[];
      weakSkills?: string[];
      preferredDifficulty?: string;
      notificationsEnabled?: boolean;
      weeklyDigestEnabled?: boolean;
    },
  ) {
    return this.personalizationService.updatePreferences(req.user.id, body);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Get('home')
  async getDashboardHome(@Request() req: RequestWithUser) {
    return this.dashboardService.getDashboardHome(req.user.id);
  }
}
