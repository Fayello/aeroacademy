import { Module } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, DashboardModule, EmailModule],
  providers: [ProgressService],
  controllers: [ProgressController],
})
export class ProgressModule {}
