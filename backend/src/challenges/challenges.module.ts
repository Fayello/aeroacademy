import { Module } from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { ChallengesController } from './challenges.controller';
import { MissionService } from './mission.service';
import { FeatureUnlockService } from './feature-unlock.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../common/events.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, EventsModule, EmailModule],
  controllers: [ChallengesController],
  providers: [ChallengesService, MissionService, FeatureUnlockService],
  exports: [ChallengesService, MissionService, FeatureUnlockService],
})
export class ChallengesModule {}
