import { Controller, Get, Post, Body, Query, UseGuards, Request, Param, ParseUUIDPipe } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RecruitmentService } from './recruitment.service';

@Controller('recruitment')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'RECRUITER')
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  @Get('talent-pool')
  async getTalentPool(
    @Query('city') city?: string,
    @Query('organizationId') organizationId?: string,
    @Query('minXp') minXp?: string,
  ) {
    return this.recruitmentService.getTalentPool({
      city,
      organizationId,
      minXp: minXp ? parseInt(minXp) : 0,
    });
  }

  @Get('candidate/:id')
  async getCandidateProfile(@Param('id', ParseUUIDPipe) id: string) {
    return this.recruitmentService.getCandidateProfile(id);
  }

  @Post('shortlist/toggle')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async toggleShortlist(@Request() req, @Body('studentId', ParseUUIDPipe) studentId: string) {
    return this.recruitmentService.toggleShortlist(req.user.id, studentId);
  }

  @Get('shortlisted')
  async getShortlisted(@Request() req) {
    return this.recruitmentService.getShortlistedCandidates(req.user.id);
  }

  @Get('leagues')
  async getLeagues() {
    return this.recruitmentService.getLeagues();
  }
}
