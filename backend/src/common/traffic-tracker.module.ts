import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TrafficTrackerService } from './traffic-tracker.service';
import { TrafficTrackerMiddleware } from './traffic-tracker.middleware';
import { TrafficTrackerController } from './traffic-tracker.controller';

@Module({
  providers: [TrafficTrackerService],
  controllers: [TrafficTrackerController],
  exports: [TrafficTrackerService],
})
export class TrafficTrackerModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TrafficTrackerMiddleware).forRoutes('*');
  }
}
