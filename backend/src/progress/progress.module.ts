import { Module, forwardRef } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { ChallengesModule } from '../challenges/challenges.module';
import { BadgesModule } from '../badges/badges.module';
import { EventsModule } from '../common/events.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => DashboardModule),
    ChallengesModule,
    BadgesModule,
    EventsModule,
  ],
  providers: [ProgressService],
  controllers: [ProgressController],
  exports: [ProgressService],
})
export class ProgressModule {}
