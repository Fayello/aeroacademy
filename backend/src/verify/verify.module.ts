import { Module } from '@nestjs/common';
import { VerifyController } from './verify.controller';
import { CoursesModule } from '../courses/courses.module';

@Module({
  imports: [CoursesModule],
  controllers: [VerifyController],
})
export class VerifyModule {}
