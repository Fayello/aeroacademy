import { Module } from '@nestjs/common';
import { TeamEnrollmentsController } from './team-enrollments.controller';
import { TeamEnrollmentsService } from './team-enrollments.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TeamEnrollmentsController],
  providers: [TeamEnrollmentsService],
  exports: [TeamEnrollmentsService],
})
export class TeamEnrollmentsModule {}
