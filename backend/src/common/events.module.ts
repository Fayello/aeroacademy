
import { Global, Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { ActivityService } from './activity.service';

@Global()
@Module({
  providers: [EventsService, ActivityService],
  exports: [EventsService, ActivityService],
})
export class EventsModule {}
