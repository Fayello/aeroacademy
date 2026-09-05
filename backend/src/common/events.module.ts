import { Global, Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { ActivityService } from './activity.service';
import { ProgressionService } from './progression.service';
import { MasteryService } from './mastery.service';
import { MasteryCron } from './mastery-cron';
import { GuildsModule } from '../guilds/guilds.module';
import { CertificationsModule } from '../certifications/certifications.module';

@Global()
@Module({
  imports: [GuildsModule, CertificationsModule],
  providers: [
    EventsService,
    ActivityService,
    ProgressionService,
    MasteryService,
    MasteryCron,
  ],
  exports: [EventsService, ActivityService, ProgressionService, MasteryService],
})
export class EventsModule {}
