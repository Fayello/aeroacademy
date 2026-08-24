import { Global, Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { ActivityService } from './activity.service';
import { ProgressionService } from './progression.service';
import { MasteryService } from './mastery.service';
import { MasteryCron } from './mastery-cron';

@Global()
@Module({
  providers: [EventsService, ActivityService, ProgressionService, MasteryService, MasteryCron],
  exports: [EventsService, ActivityService, ProgressionService, MasteryService],
})
export class EventsModule {}
