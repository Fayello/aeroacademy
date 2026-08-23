import { Module } from '@nestjs/common';
import { GlobalEventsService } from './global-events.service';
import { GlobalEventsController } from './global-events.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GlobalEventsController],
  providers: [GlobalEventsService],
  exports: [GlobalEventsService],
})
export class GlobalEventsModule {}
