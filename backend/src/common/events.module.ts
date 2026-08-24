import { Global, Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { ActivityService } from './activity.service';
import { ProgressionService } from './progression.service';
import { MasteryService } from './mastery.service';

@Global()
@Module({
  providers: [EventsService, ActivityService, ProgressionService, MasteryService],
  exports: [EventsService, ActivityService, ProgressionService, MasteryService],
})
export class EventsModule {}
