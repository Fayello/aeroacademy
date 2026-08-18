import { Controller, Get, Post, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Audit } from '../common/audit.decorator';
import type { RequestWithUser } from '../common/request-with-user';

@ApiTags('challenges')
@ApiBearerAuth('JWT-auth')
@Controller('challenges')
@UseGuards(AuthGuard('jwt'))
export class ChallengesController {
  constructor(private challengesService: ChallengesService) {}

  @Get()
  async findAll() {
    return this.challengesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.challengesService.findOne(id);
  }

  @Get(':id/leaderboard')
  async getLeaderboard(@Param('id') id: string) {
    return this.challengesService.getLeaderboard(id);
  }

  @Post(':id/join')
  @Audit('CHALLENGE_JOINED')
  async joinChallenge(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    return this.challengesService.joinChallenge(req.user.id, id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Audit('CHALLENGE_CREATED')
  async createChallenge(
    @Body() body: {
      title: string;
      description: string;
      type?: string;
      goalType: string;
      goalCount: number;
      xpReward?: number;
      startDate: string;
      endDate: string;
    },
  ) {
    return this.challengesService.createChallenge(body);
  }
}
