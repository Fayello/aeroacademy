import { Module } from '@nestjs/common';
import { CertificationsService } from './certifications.service';
import { CertificationsController } from './certifications.controller';
import { CertificationEngineService } from './certification-engine.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CertificationsController],
  providers: [CertificationsService, CertificationEngineService],
  exports: [CertificationsService, CertificationEngineService],
})
export class CertificationsModule {}
