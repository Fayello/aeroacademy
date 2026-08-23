import { Controller, Get, UseGuards, Request, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { RequestWithUser } from '../common/request-with-user';

@ApiTags('analytics')
@ApiBearerAuth('JWT-auth')
@Controller('v1/analytics')
@UseGuards(AuthGuard('jwt'))
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('email-stats')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getEmailStats() {
    return this.analyticsService.getEmailStats();
  }

  @Get('learning')
  async getLearningAnalytics(@Request() req: RequestWithUser) {
    return this.analyticsService.getLearningAnalytics(req.user.id);
  }

  @Get('learning/:userId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getUserLearningAnalytics(@Param('userId') userId: string) {
    return this.analyticsService.getLearningAnalytics(userId);
  }
}
