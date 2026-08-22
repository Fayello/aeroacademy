import { Controller, Get, Post, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TeamEnrollmentsService } from './team-enrollments.service';

@Controller('team-enrollments')
@UseGuards(AuthGuard('jwt'))
export class TeamEnrollmentsController {
  constructor(private teamEnrollmentsService: TeamEnrollmentsService) {}

  @Get()
  getTeams() {
    return this.teamEnrollmentsService.getTeams();
  }

  @Get(':teamId')
  getTeam(@Param('teamId') teamId: string) {
    return this.teamEnrollmentsService.getTeam(teamId);
  }

  @Get(':teamId/leaderboard')
  getTeamLeaderboard(@Param('teamId') teamId: string) {
    return this.teamEnrollmentsService.getTeamLeaderboard(teamId);
  }

  @Get('course/:courseId')
  getCourseTeams(@Param('courseId') courseId: string) {
    return this.teamEnrollmentsService.getCourseTeams(courseId);
  }

  // V2: Self-service team creation
  @Post('create')
  createTeam(
    @Req() req: any,
    @Body() body: { name: string; description?: string },
  ) {
    return this.teamEnrollmentsService.createTeam(req.user.id, body.name, body.description);
  }

  // V2: Join team
  @Post('join')
  joinTeam(
    @Req() req: any,
    @Body() body: { teamName: string },
  ) {
    return this.teamEnrollmentsService.joinTeam(req.user.id, body.teamName);
  }

  // V2: Leave team
  @Delete('leave')
  leaveTeam(@Req() req: any) {
    return this.teamEnrollmentsService.leaveTeam(req.user.id);
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

  @Post('course/:courseId/bulk-enroll')
  bulkEnroll(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Body() body: { teamIds: string[] },
  ) {
    return this.teamEnrollmentsService.bulkEnrollTeams(courseId, body.teamIds, req.user.id);
  }
}
