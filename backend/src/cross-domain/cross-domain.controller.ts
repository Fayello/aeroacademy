import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CrossDomainService } from './cross-domain.service';
import type { RequestWithUser } from '../common/request-with-user';

@Controller('v1/cross-domain')
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
  createMission(
    @Body()
    body: {
      title: string;
      description: string;
      requiredDomains: Array<{ domainId: string; minSkillXp: number }>;
      xpReward: number;
      badgeRewardId?: string;
      startsAt: string;
      expiresAt: string;
    },
  ) {
    return this.crossDomainService.createMission(body);
  }

  @Post(':missionId/join')
  joinMission(
    @Request() req: RequestWithUser,
    @Param('missionId') missionId: string,
  ) {
    return this.crossDomainService.joinMission(req.user.id, missionId);
  }

  @Post(':missionId/progress')
  updateProgress(
    @Request() req: RequestWithUser,
    @Param('missionId') missionId: string,
    @Body() body: { domainId: string; xp: number },
  ) {
    return this.crossDomainService.updateDomainProgress(
      req.user.id,
      missionId,
      body.domainId,
      body.xp,
    );
  }

  @Post(':missionId/claim')
  claimReward(
    @Request() req: RequestWithUser,
    @Param('missionId') missionId: string,
  ) {
    return this.crossDomainService.claimReward(req.user.id, missionId);
  }
}
