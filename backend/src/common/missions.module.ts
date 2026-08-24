import { Module } from '@nestjs/common';
import { MissionsController } from './personalized-mission.controller';
import { PersonalizedMissionService } from './personalized-mission.service';

@Module({
  controllers: [MissionsController],
  providers: [PersonalizedMissionService],
  exports: [PersonalizedMissionService],
})
export class MissionsModule {}
