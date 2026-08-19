import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Audit } from '../common/audit.decorator';
import { BatchIdsDto } from '../common/batch.dto';
import type { RequestWithUser } from '../common/request-with-user';

@ApiTags('courses')
@ApiBearerAuth('JWT-auth')
@Controller('courses')
@UseGuards(AuthGuard('jwt'))
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Get()
  async findAll() {
    return this.coursesService.findAll();
  }

  @Get('my-enrollments')
  async getMyEnrollments(@Request() req: RequestWithUser) {
    return this.coursesService.getEnrollmentsForUser(req.user.id);
  }

  @Get('recommendations')
  async getRecommendations(@Request() req: RequestWithUser) {
    return this.coursesService.getRecommendations(req.user.id);
  }

  @Post(':id/enroll')
  async enroll(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.coursesService.enroll(req.user.id, id);
  }

  @Get(':id/enrollment')
  async getEnrollment(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.coursesService.getEnrollment(req.user.id, id);
  }

  @Get('lessons/:id')
  async findLesson(@Param('id') id: string) {
    return this.coursesService.findLesson(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Audit('COURSE_CREATED')
  async create(@Body() body: { title: string; description: string }) {
    return this.coursesService.create(body);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Audit('COURSE_UPDATED')
  async update(
    @Param('id') id: string,
    @Body() body: { title?: string; description?: string },
  ) {
    return this.coursesService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Audit('COURSE_DELETED')
  async remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }

  @Post('batch/delete')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Audit('COURSES_DELETED_BATCH')
  async batchRemove(@Body() body: BatchIdsDto) {
    return this.coursesService.batchRemove(body.ids);
  }

  // === SECTIONS ===

  @Get(':courseId/sections')
  async findSections(@Param('courseId') courseId: string) {
    return this.coursesService.findSections(courseId);
  }

  @Post(':courseId/sections')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Audit('SECTION_CREATED')
  async createSection(
    @Param('courseId') courseId: string,
    @Body() body: { title: string; order?: number },
  ) {
    return this.coursesService.createSection(courseId, body);
  }

  @Patch(':courseId/sections/:sectionId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Audit('SECTION_UPDATED')
  async updateSection(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Body() body: { title?: string; order?: number },
  ) {
    return this.coursesService.updateSection(courseId, sectionId, body);
  }

  @Delete(':courseId/sections/:sectionId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Audit('SECTION_DELETED')
  async removeSection(
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
  ) {
    return this.coursesService.removeSection(courseId, sectionId);
  }

  // === LESSONS ===

  @Get(':courseId/sections/:sectionId/lessons')
  async findLessons(@Param('sectionId') sectionId: string) {
    return this.coursesService.findLessons(sectionId);
  }

  @Post(':courseId/sections/:sectionId/lessons')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Audit('LESSON_CREATED')
  async createLesson(
    @Param('sectionId') sectionId: string,
    @Body()
    body: {
      title: string;
      videoUrl?: string;
      content?: string;
      labId?: string;
      order?: number;
    },
  ) {
    return this.coursesService.createLesson(sectionId, body);
  }

  @Patch(':courseId/sections/:sectionId/lessons/:lessonId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Audit('LESSON_UPDATED')
  async updateLesson(
    @Param('sectionId') sectionId: string,
    @Param('lessonId') lessonId: string,
    @Body()
    body: {
      title?: string;
      videoUrl?: string;
      content?: string;
      labId?: string;
      order?: number;
    },
  ) {
    return this.coursesService.updateLesson(sectionId, lessonId, body);
  }

  @Delete(':courseId/sections/:sectionId/lessons/:lessonId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Audit('LESSON_DELETED')
  async removeLesson(@Param('lessonId') lessonId: string) {
    return this.coursesService.removeLesson(lessonId);
  }

  // === QUIZZES ===

  @Get(':courseId/sections/:sectionId/lessons/:lessonId/quiz')
  async findQuiz(@Param('lessonId') lessonId: string) {
    return this.coursesService.findQuiz(lessonId);
  }

  @Post(':courseId/sections/:sectionId/lessons/:lessonId/quiz')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Audit('QUIZ_CREATED')
  async createQuiz(
    @Param('lessonId') lessonId: string,
    @Body()
    body: {
      questions: {
        text: string;
        answers: { text: string; isCorrect: boolean }[];
      }[];
    },
  ) {
    return this.coursesService.createQuiz(lessonId, body);
  }

  @Patch(':courseId/sections/:sectionId/lessons/:lessonId/quiz/:quizId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Audit('QUIZ_UPDATED')
  async updateQuiz(
    @Param('quizId') quizId: string,
    @Body()
    body: {
      questions: {
        id?: string;
        text: string;
        answers: { id?: string; text: string; isCorrect: boolean }[];
      }[];
    },
  ) {
    return this.coursesService.updateQuiz(quizId, body);
  }

  @Delete(':courseId/sections/:sectionId/lessons/:lessonId/quiz/:quizId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Audit('QUIZ_DELETED')
  async removeQuiz(@Param('quizId') quizId: string) {
    return this.coursesService.removeQuiz(quizId);
  }

  @Get(':courseId/certificate')
  async getCertificate(
    @Request() req: RequestWithUser,
    @Param('courseId') courseId: string,
  ) {
    return this.coursesService.getCertificate(req.user.id, courseId);
  }

  // === REVIEWS ===

  @Get(':courseId/reviews')
  async getCourseReviews(@Param('courseId') courseId: string) {
    return this.coursesService.getCourseReviews(courseId);
  }

  @Post(':courseId/reviews')
  async createReview(
    @Request() req: RequestWithUser,
    @Param('courseId') courseId: string,
    @Body() body: { rating: number; comment?: string },
  ) {
    return this.coursesService.createReview(req.user.id, courseId, body.rating, body.comment);
  }

  @Get('my-reviews')
  async getMyReviews(@Request() req: RequestWithUser) {
    return this.coursesService.getMyReviews(req.user.id);
  }
}
