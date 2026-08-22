import { Global, Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { ActivityService } from './activity.service';
import { ProgressionService } from './progression.service';

@Global()
@Module({
  providers: [EventsService, ActivityService, ProgressionService],
  exports: [EventsService, ActivityService, ProgressionService],
})
export class EventsModule {}
