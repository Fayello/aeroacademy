import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BossMissionsService } from './boss-missions.service';

@Controller('v2/boss-missions')
@UseGuards(AuthGuard('jwt'))
export class BossMissionsController {
  constructor(private readonly bossMissionsService: BossMissionsService) {}

  @Get('active')
  getActiveBossMissions() {
    return this.bossMissionsService.getActiveBossMissions();
  }

  @Get()
  getAllBossMissions() {
    return this.bossMissionsService.getAllBossMissions();
  }

  @Get(':bossId/requirements/:userId')
  checkRequirements(
    @Param('userId') userId: string,
    @Param('bossId') bossId: string,
  ) {
    return this.bossMissionsService.checkDomainRequirements(userId, bossId);
  }

  @Get(':bossId/attempts/:userId')
  getUserAttempts(
    @Param('userId') userId: string,
    @Param('bossId') bossId: string,
  ) {
    return this.bossMissionsService.getUserAttempts(userId, bossId);
  }

  @Get(':bossId/leaderboard')
  getLeaderboard(@Param('bossId') bossId: string) {
    return this.bossMissionsService.getLeaderboard(bossId);
  }

  @Post()
  createBossMission(
    @Body()
    body: {
      seasonId?: string;
      title: string;
      description: string;
      difficulty?: string;
      maxAttempts?: number;
      xpReward: number;
      ratingReward?: number;
      prerequisiteLabIds?: string[];
      requiredDomains?: any[];
      domainId?: string;
      theme?: string;
      labId?: string;
      startsAt: string;
      expiresAt: string;
    },
  ) {
    return this.bossMissionsService.createBossMission(body);
  }

  @Post(':bossId/submit')
  submitAttempt(
    @Param('bossId') bossId: string,
    @Body()
    body: { userId: string; score: number; maxScore: number; feedback?: any },
  ) {
    return this.bossMissionsService.submitAttempt(
      body.userId,
      bossId,
      body.score,
      body.maxScore,
      body.feedback,
    );
  }
}
