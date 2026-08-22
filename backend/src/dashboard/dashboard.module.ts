import { Module, forwardRef } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardGateway } from './dashboard.gateway';
import { DashboardController } from './dashboard.controller';
import { LeaderboardService } from './leaderboard.service';
import { AchievementService } from './achievement.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LabsModule } from '../labs/labs.module';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../common/events.module';

@Module({
  imports: [PrismaModule, forwardRef(() => LabsModule), AuthModule, EventsModule],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    DashboardGateway,
    LeaderboardService,
    AchievementService,
  ],
  exports: [DashboardService, LeaderboardService, AchievementService],
})
export class DashboardModule {}
