import { Module } from '@nestjs/common';
import { BossMissionsService } from './boss-missions.service';
import { BossMissionsController } from './boss-missions.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BossMissionsController],
  providers: [BossMissionsService],
  exports: [BossMissionsService],
})
export class BossMissionsModule {}
