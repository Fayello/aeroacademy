import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
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
import { IsString, MaxLength, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
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

class CreateChallengeDto {
  @IsString()
  type: string;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  description: string;

  @IsString()
  difficulty: string;

  @IsString()
  objectiveType: string;

  @IsNumber()
  objectiveTarget: number;

  @IsNumber()
  xpReward: number;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;

  @IsString()
  @IsOptional()
  domainId?: string;

  @IsString()
  @IsOptional()
  skillId?: string;
}

class UpdateChallengeDto {
  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  difficulty?: string;

  @IsString()
  @IsOptional()
  objectiveType?: string;

  @IsNumber()
  @IsOptional()
  objectiveTarget?: number;

  @IsNumber()
  @IsOptional()
  xpReward?: number;

  @IsDateString()
  @IsOptional()
  startAt?: string;

  @IsDateString()
  @IsOptional()
  endAt?: string;

  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  domainId?: string;

  @IsString()
  @IsOptional()
  skillId?: string;
}

@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
@Controller('v1/admin')
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

  @Post('challenges')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Audit('CHALLENGE_CREATED')
  async createChallenge(@Body() dto: CreateChallengeDto) {
    return this.adminService.createChallenge(dto);
  }

  @Get('challenges')
  @ApiQuery({ name: 'type', required: false, type: String })
  async getAllChallenges(@Query('type') type?: string) {
    return this.adminService.getAllChallenges(type);
  }

  @Patch('challenges/:id')
  @Audit('CHALLENGE_UPDATED')
  async updateChallenge(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateChallengeDto,
  ) {
    return this.adminService.updateChallenge(id, dto);
  }

  @Delete('challenges/:id')
  @Audit('CHALLENGE_DELETED')
  async deleteChallenge(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteChallenge(id);
  }

  @Get('analytics/overview')
  async getAnalyticsOverview() {
    return this.adminService.getAnalyticsOverview();
  }
}
