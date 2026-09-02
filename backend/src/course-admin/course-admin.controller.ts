import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { CourseAdminService } from './course-admin.service';

@Controller('v1/admin/courses')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CourseAdminController {
  constructor(private courseAdminService: CourseAdminService) {}

  @Get(':courseId/structure')
  getCourseStructure(@Param('courseId') courseId: string) {
    return this.courseAdminService.getCourseStructure(courseId);
  }

  @Post(':courseId/sections')
  createSection(
    @Param('courseId') courseId: string,
    @Body() body: { title: string; order?: number },
  ) {
    return this.courseAdminService.createSection(courseId, body);
  }

  @Patch('sections/:sectionId')
  updateSection(
    @Param('sectionId') sectionId: string,
    @Body() body: { title?: string },
  ) {
    return this.courseAdminService.updateSection(sectionId, body);
  }

  @Delete('sections/:sectionId')
  deleteSection(@Param('sectionId') sectionId: string) {
    return this.courseAdminService.deleteSection(sectionId);
  }

  @Post('sections/:sectionId/lessons')
  createLesson(@Param('sectionId') sectionId: string, @Body() body: any) {
    return this.courseAdminService.createLesson(sectionId, body);
  }

  @Post('sections/:sectionId/bulk-lessons')
  bulkCreateLessons(
    @Param('sectionId') sectionId: string,
    @Body() body: { lessons: any[] },
  ) {
    return this.courseAdminService.bulkCreateLessons(sectionId, body.lessons);
  }

  @Patch('lessons/:lessonId')
  updateLesson(@Param('lessonId') lessonId: string, @Body() body: any) {
    return this.courseAdminService.updateLesson(lessonId, body);
  }

  @Delete('lessons/:lessonId')
  deleteLesson(@Param('lessonId') lessonId: string) {
    return this.courseAdminService.deleteLesson(lessonId);
  }

  @Patch('lessons/:lessonId/move')
  moveLesson(
    @Param('lessonId') lessonId: string,
    @Body() body: { targetSectionId: string },
  ) {
    return this.courseAdminService.moveLessonToSection(
      lessonId,
      body.targetSectionId,
    );
  }

  @Post(':courseId/sections/:sectionId/lessons/:lessonId/reorder')
  reorderLesson(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Param('lessonId') lessonId: string,
    @Body() body: { newOrder: number },
    @Req() req: any,
  ) {
    return this.courseAdminService.reorderLesson(
      courseId,
      sectionId,
      lessonId,
      body.newOrder,
      req.user.id,
    );
  }

  @Post(':courseId/sections/:sectionId/reorder')
  reorderSection(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Body() body: { newOrder: number },
    @Req() req: any,
  ) {
    return this.courseAdminService.reorderSection(
      courseId,
      sectionId,
      body.newOrder,
      req.user.id,
    );
  }

  @Get(':courseId/reorder-history')
  getReorderHistory(@Param('courseId') courseId: string) {
    return this.courseAdminService.getReorderHistory(courseId);
  }
}
