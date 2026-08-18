import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { CoursesCron } from './courses.cron';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, AuthModule, EmailModule],
  providers: [CoursesService, CoursesCron],
  controllers: [CoursesController],
  exports: [CoursesService],
})
export class CoursesModule {}
