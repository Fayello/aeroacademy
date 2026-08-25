import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LabsModule } from '../labs/labs.module';
import { TeamEnrollmentsModule } from '../team-enrollments/team-enrollments.module';

@Module({
  imports: [PrismaModule, LabsModule, TeamEnrollmentsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
