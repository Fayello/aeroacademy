import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { LabAnalyticsService } from './lab-analytics.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiGatewayFactory } from './ai.gateway';

@Module({
  imports: [PrismaModule],
  controllers: [AiController],
  providers: [AiService, AiGatewayFactory, LabAnalyticsService],
  exports: [AiService, AiGatewayFactory, LabAnalyticsService],
})
export class AiModule {}
