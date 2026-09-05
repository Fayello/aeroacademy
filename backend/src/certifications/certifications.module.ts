import { Module } from '@nestjs/common';
import { CertificationsService } from './certifications.service';
import { CertificationsController } from './certifications.controller';
import { CertificationEngineService } from './certification-engine.service';
import { CertificationCron } from './certification-cron';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [CertificationsController],
  providers: [CertificationsService, CertificationEngineService, CertificationCron],
  exports: [CertificationsService, CertificationEngineService],
})
export class CertificationsModule {}
