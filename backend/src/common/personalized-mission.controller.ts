import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PersonalizedMissionService } from '../common/personalized-mission.service';

@Controller('v2/missions')
@UseGuards(AuthGuard('jwt'))
export class MissionsController {
  constructor(private readonly missionsService: PersonalizedMissionService) {}

  @Get('available')
  async getAvailable(@Request() req: any) {
    return this.missionsService.getAvailableMissions(req.user.id);
  }

  @Post(':missionId/accept')
  async acceptMission(@Request() req: any, @Param('missionId') missionId: string) {
    return this.missionsService.acceptMission(req.user.id, missionId);
  }

  @Post(':missionId/complete')
  async completeMission(@Request() req: any, @Param('missionId') missionId: string) {
    return this.missionsService.completeMission(req.user.id, missionId);
  }

  @Get('history')
  async getHistory(@Request() req: any) {
    return this.missionsService.getMissionHistory(req.user.id);
  }
}
