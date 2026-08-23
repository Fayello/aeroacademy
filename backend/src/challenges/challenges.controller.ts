import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { MissionService } from './mission.service';
import { FeatureUnlockService } from './feature-unlock.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Audit } from '../common/audit.decorator';
import type { RequestWithUser } from '../common/request-with-user';

@ApiTags('challenges')
@ApiBearerAuth('JWT-auth')
@Controller('v1/challenges')
@UseGuards(AuthGuard('jwt'))
export class ChallengesController {
  constructor(
    private challengesService: ChallengesService,
    private missionService: MissionService,
    private featureUnlockService: FeatureUnlockService,
  ) {}

  @Get()
  async findAll() {
    return this.challengesService.findAll();
  }

  @Get('missions')
  async getDailyMissions(@Request() req: RequestWithUser) {
    return this.challengesService.getDailyMissions(req.user.id);
  }

  @Post('missions/:challengeId/claim')
  @Audit('MISSION_REWARD_CLAIMED')
  async claimReward(
    @Request() req: RequestWithUser,
    @Param('challengeId') challengeId: string,
  ) {
    return this.challengesService.claimReward(req.user.id, challengeId);
  }

  @Get('skills')
  async getSkillProfile(@Request() req: RequestWithUser) {
    return this.challengesService.getSkillProfile(req.user.id);
  }

  @Get('features')
  async getFeatureUnlocks(@Request() req: RequestWithUser) {
    return this.featureUnlockService.getUnlockedFeatures(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.challengesService.findOne(id);
  }

  @Get(':id/leaderboard')
  async getLeaderboard(@Param('id') id: string) {
    return this.challengesService.getLeaderboard(id);
  }
}
