import { Module, forwardRef } from '@nestjs/common';
import { LabsService } from './labs.service';
import { LabsController } from './labs.controller';
import { LabsGateway } from './labs.gateway';
import { LabsCron } from './labs.cron';
import { DockerManager } from './docker-manager.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { DashboardModule } from '../dashboard/dashboard.module';

import { LeaguesModule } from '../leagues/leagues.module';
import { ProgressModule } from '../progress/progress.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    forwardRef(() => DashboardModule),
    LeaguesModule,
    forwardRef(() => ProgressModule),
  ],
  controllers: [LabsController],
  providers: [DockerManager, LabsService, LabsGateway, LabsCron],
  exports: [LabsService, DockerManager],
})
export class LabsModule {}
