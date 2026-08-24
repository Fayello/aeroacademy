import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CompetencyAnalyticsService } from './competency-analytics.service';
import { CompetencyAnalyticsController } from './competency-analytics.controller';

@Module({
  controllers: [CompetencyAnalyticsController],
  providers: [PrismaService, CompetencyAnalyticsService],
  exports: [CompetencyAnalyticsService],
})
export class CompetencyAnalyticsModule {}
