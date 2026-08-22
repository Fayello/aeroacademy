import { Module, forwardRef } from '@nestjs/common';
import { LabsService } from './labs.service';
import { LabsController } from './labs.controller';
import { LabsGateway } from './labs.gateway';
import { LabsCron } from './labs.cron';
import { DockerManager } from './docker-manager.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { EventsModule } from '../common/events.module';
import { ChallengesModule } from '../challenges/challenges.module';
import { LeaguesModule } from '../leagues/leagues.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    forwardRef(() => DashboardModule),
    LeaguesModule,
    EventsModule,
    ChallengesModule,
  ],
  controllers: [LabsController],
  providers: [DockerManager, LabsService, LabsGateway, LabsCron],
  exports: [LabsService, DockerManager],
})
export class LabsModule {}
