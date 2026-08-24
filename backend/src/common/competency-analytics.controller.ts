import { Controller, Get, Param, Query } from '@nestjs/common';
import { CompetencyAnalyticsService } from './competency-analytics.service';

@Controller('v1/competency-analytics')
export class CompetencyAnalyticsController {
  constructor(private readonly service: CompetencyAnalyticsService) {}

  @Get('radar/:userId')
  async getRadarData(@Param('userId') userId: string) {
    return this.service.getRadarData(userId);
  }

  @Get('trajectory/:userId')
  async getGrowthTrajectory(
    @Param('userId') userId: string,
    @Query('days') days?: string,
  ) {
    return this.service.getGrowthTrajectory(userId, days ? parseInt(days) : 30);
  }

  @Get('correlation/:userId')
  async getCrossDomainCorrelation(@Param('userId') userId: string) {
    return this.service.getCrossDomainCorrelation(userId);
  }

  @Get('trends/:userId')
  async getCompetencyTrends(@Param('userId') userId: string) {
    return this.service.getCompetencyTrends(userId);
  }
}
