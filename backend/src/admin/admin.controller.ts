
import { Controller, Post, Get, Body, Param, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { IsString, MaxLength, IsOptional } from 'class-validator';

class CreateTeamDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN, Role.RECRUITER)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('teams')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async createTeam(@Request() req, @Body() dto: CreateTeamDto) {
    return this.adminService.createTeam(req.user.id, dto.name, dto.description);
  }

  @Get('teams')
  async getTeams(@Request() req) {
    return this.adminService.getMyTeams(req.user.id);
  }

  @Post('teams/:teamId/members/:userId')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async addMember(
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.adminService.addMemberToTeam(teamId, userId);
  }

  @Get('teams/:teamId/progress')
  async getTeamProgress(@Param('teamId', ParseUUIDPipe) teamId: string) {
    return this.adminService.getTeamProgress(teamId);
  }

  @Post('classroom/launch')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async classroomLaunch(
    @Body('teamId', ParseUUIDPipe) teamId: string,
    @Body('labId', ParseUUIDPipe) labId: string,
  ) {
    return this.adminService.bulkProvisionLab(teamId, labId);
  }

  @Post('classroom/terminate')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async classroomTerminate(
    @Body('teamId', ParseUUIDPipe) teamId: string,
    @Body('labId', ParseUUIDPipe) labId: string,
  ) {
    return this.adminService.bulkTerminateLab(teamId, labId);
  }
}
