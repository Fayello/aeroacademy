import { Module } from '@nestjs/common';
import { DiscussionsController } from './discussions.controller';
import { DiscussionsService } from './discussions.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LabsModule } from '../labs/labs.module';

@Module({
  imports: [PrismaModule, LabsModule],
  controllers: [DiscussionsController],
  providers: [DiscussionsService],
  exports: [DiscussionsService],
})
export class DiscussionsModule {}
