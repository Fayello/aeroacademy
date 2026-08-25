import { Controller, Get, Post, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TeamEnrollmentsService } from './team-enrollments.service';

@Controller('v1/teams')
@UseGuards(AuthGuard('jwt'))
export class TeamEnrollmentsController {
  constructor(private teamEnrollmentsService: TeamEnrollmentsService) {}

  @Get()
  getTeams() {
    return this.teamEnrollmentsService.getTeams();
  }

  @Get('mine')
  getMyTeam(@Req() req: any) {
    return this.teamEnrollmentsService.getMyTeam(req.user.id);
  }

  @Get(':teamId')
  getTeam(@Param('teamId') teamId: string) {
    return this.teamEnrollmentsService.getTeam(teamId);
  }

  @Get(':teamId/leaderboard')
  getTeamLeaderboard(@Param('teamId') teamId: string) {
    return this.teamEnrollmentsService.getTeamLeaderboard(teamId);
  }

  @Get(':teamId/invite-code')
  getInviteCode(@Param('teamId') teamId: string, @Req() req: any) {
    return this.teamEnrollmentsService.getInviteCode(teamId, req.user.id);
  }

  @Post('create')
  createTeam(
    @Req() req: any,
    @Body() body: { name: string; description?: string; visibility?: string },
  ) {
    return this.teamEnrollmentsService.createTeam(req.user.id, body.name, body.description, body.visibility);
  }

  @Post('join')
  joinTeam(
    @Req() req: any,
    @Body() body: { inviteCode: string },
  ) {
    return this.teamEnrollmentsService.joinTeam(req.user.id, body.inviteCode);
  }

  @Post('join-by-name')
  joinTeamByName(
    @Req() req: any,
    @Body() body: { teamName: string },
  ) {
    return this.teamEnrollmentsService.joinTeamByName(req.user.id, body.teamName);
  }

  @Delete('leave')
  leaveTeam(@Req() req: any) {
    return this.teamEnrollmentsService.leaveTeam(req.user.id);
  }

  @Delete(':teamId/members/:userId')
  removeMember(
    @Param('teamId') teamId: string,
    @Param('userId') userId: string,
    @Req() req: any,
  ) {
    return this.teamEnrollmentsService.removeMember(teamId, userId, req.user.id);
  }

  @Delete(':teamId/disband')
  disbandTeam(@Param('teamId') teamId: string, @Req() req: any) {
    return this.teamEnrollmentsService.disbandTeam(teamId, req.user.id);
  }

  @Post(':teamId/refresh-invite')
  refreshInviteCode(@Param('teamId') teamId: string, @Req() req: any) {
    return this.teamEnrollmentsService.refreshInviteCode(teamId, req.user.id);
  }

  @Post(':teamId/enroll/:courseId')
  enrollTeam(
    @Req() req: any,
    @Param('teamId') teamId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.teamEnrollmentsService.enrollTeamInCourse(teamId, courseId, req.user.id);
  }

  @Delete(':teamId/unenroll/:courseId')
  unenrollTeam(@Param('teamId') teamId: string, @Param('courseId') courseId: string) {
    return this.teamEnrollmentsService.unenrollTeamFromCourse(teamId, courseId);
  }

  @Get('course/:courseId')
  getCourseTeams(@Param('courseId') courseId: string) {
    return this.teamEnrollmentsService.getCourseTeams(courseId);
  }

  @Post('course/:courseId/bulk-enroll')
  bulkEnroll(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Body() body: { teamIds: string[] },
  ) {
    return this.teamEnrollmentsService.bulkEnrollTeams(courseId, body.teamIds, req.user.id);
  }
}
