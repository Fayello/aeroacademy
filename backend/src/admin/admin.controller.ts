import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { IsString, MaxLength, IsOptional } from 'class-validator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Audit } from '../common/audit.decorator';
import type { RequestWithUser } from '../common/request-with-user';

class CreateTeamDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}

@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN, Role.RECRUITER)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('teams')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Audit('TEAM_CREATED')
  async createTeam(
    @Request() req: RequestWithUser,
    @Body() dto: CreateTeamDto,
  ) {
    return this.adminService.createTeam(req.user.id, dto.name, dto.description);
  }

  @Get('teams')
  async getTeams(@Request() req: RequestWithUser) {
    return this.adminService.getMyTeams(req.user.id);
  }

  @Post('teams/:teamId/members/:userId')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Audit('TEAM_MEMBER_ADDED')
  async addMember(
    @Request() req: RequestWithUser,
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.adminService.addMemberToTeam(teamId, userId, req.user.id);
  }

  @Get('teams/:teamId/progress')
  async getTeamProgress(@Request() req: RequestWithUser, @Param('teamId', ParseUUIDPipe) teamId: string) {
    return this.adminService.getTeamProgress(teamId, req.user.id);
  }

  @Post('classroom/launch')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Audit('CLASSROOM_LAUNCHED')
  async classroomLaunch(
    @Body('teamId', ParseUUIDPipe) teamId: string,
    @Body('labId', ParseUUIDPipe) labId: string,
  ) {
    return this.adminService.bulkProvisionLab(teamId, labId);
  }

  @Post('classroom/terminate')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Audit('CLASSROOM_TERMINATED')
  async classroomTerminate(
    @Body('teamId', ParseUUIDPipe) teamId: string,
    @Body('labId', ParseUUIDPipe) labId: string,
  ) {
    return this.adminService.bulkTerminateLab(teamId, labId);
  }
}
