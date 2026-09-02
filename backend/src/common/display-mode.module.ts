import { Module } from '@nestjs/common';
import { DisplayModeService } from './display-mode.service';
import { MetricsService } from './metrics.service';
import {
  DisplayModeController,
  MetricsController,
} from './display-mode.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DisplayModeController, MetricsController],
  providers: [DisplayModeService, MetricsService],
  exports: [DisplayModeService, MetricsService],
})
export class DisplayModeModule {}
