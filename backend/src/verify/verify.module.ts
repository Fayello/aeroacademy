import { Module } from '@nestjs/common';
import { VerifyController } from './verify.controller';
import { CoursesModule } from '../courses/courses.module';
import { CertificationsModule } from '../certifications/certifications.module';

@Module({
  imports: [CoursesModule, CertificationsModule],
  controllers: [VerifyController],
})
export class VerifyModule {}
