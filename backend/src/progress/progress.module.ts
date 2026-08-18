import { Module } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { EmailModule } from '../email/email.module';
import { ChallengesModule } from '../challenges/challenges.module';
import { BadgesModule } from '../badges/badges.module';

@Module({
  imports: [PrismaModule, DashboardModule, EmailModule, ChallengesModule, BadgesModule],
  providers: [ProgressService],
  controllers: [ProgressController],
})
export class ProgressModule {}
