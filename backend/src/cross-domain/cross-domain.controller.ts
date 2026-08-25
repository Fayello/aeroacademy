import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CrossDomainService } from './cross-domain.service';

@Controller('v2/cross-domain')
@UseGuards(AuthGuard('jwt'))
export class CrossDomainController {
  constructor(private readonly crossDomainService: CrossDomainService) {}

  @Get('active')
  getActiveMissions() {
    return this.crossDomainService.getActiveMissions();
  }

  @Get()
  getAllMissions() {
    return this.crossDomainService.getAllMissions();
  }

  @Get(':missionId/leaderboard')
  getMissionLeaderboard(@Param('missionId') missionId: string) {
    return this.crossDomainService.getMissionLeaderboard(missionId);
  }

  @Post()
  createMission(@Body() body: { title: string; description: string; requiredDomains: Array<{ domainId: string; minSkillXp: number }>; xpReward: number; badgeRewardId?: string; startsAt: string; expiresAt: string }) {
    return this.crossDomainService.createMission(body);
  }

  @Post(':missionId/join')
  joinMission(@Param('missionId') missionId: string, @Body() body: { userId: string }) {
    return this.crossDomainService.joinMission(body.userId, missionId);
  }

  @Post(':missionId/progress')
  updateProgress(@Param('missionId') missionId: string, @Body() body: { userId: string; domainId: string; xp: number }) {
    return this.crossDomainService.updateDomainProgress(body.userId, missionId, body.domainId, body.xp);
  }

  @Post(':missionId/claim')
  claimReward(@Param('missionId') missionId: string, @Body() body: { userId: string }) {
    return this.crossDomainService.claimReward(body.userId, missionId);
  }
}
