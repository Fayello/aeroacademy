import { Module } from '@nestjs/common';
import { CourseAdminController } from './course-admin.controller';
import { CourseAdminService } from './course-admin.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CourseAdminController],
  providers: [CourseAdminService],
  exports: [CourseAdminService],
})
export class CourseAdminModule {}
