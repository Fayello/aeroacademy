import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('courses')
@UseGuards(AuthGuard('jwt'))
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Get()
  async findAll() {
    return this.coursesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async create(@Body() body: { title: string; description: string }) {
    return this.coursesService.create(body);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() body: { title?: string; description?: string }) {
    return this.coursesService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }

  // === SECTIONS ===

  @Get(':courseId/sections')
  async findSections(@Param('courseId') courseId: string) {
    return this.coursesService.findSections(courseId);
  }

  @Post(':courseId/sections')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async createSection(@Param('courseId') courseId: string, @Body() body: { title: string; order?: number }) {
    return this.coursesService.createSection(courseId, body);
  }

  @Patch(':courseId/sections/:sectionId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
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
  async removeSection(@Param('courseId') courseId: string, @Param('sectionId') sectionId: string) {
    return this.coursesService.removeSection(courseId, sectionId);
  }

  // === LESSONS ===

  @Get(':courseId/sections/:sectionId/lessons')
  async findLessons(@Param('sectionId') sectionId: string) {
    return this.coursesService.findLessons(sectionId);
  }

  @Get('lessons/:id')
  async findLesson(@Param('id') id: string) {
    return this.coursesService.findLesson(id);
  }

  @Post(':courseId/sections/:sectionId/lessons')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async createLesson(
    @Param('sectionId') sectionId: string,
    @Body() body: { title: string; videoUrl?: string; content?: string; labId?: string; order?: number },
  ) {
    return this.coursesService.createLesson(sectionId, body);
  }

  @Patch(':courseId/sections/:sectionId/lessons/:lessonId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async updateLesson(
    @Param('sectionId') sectionId: string,
    @Param('lessonId') lessonId: string,
    @Body() body: { title?: string; videoUrl?: string; content?: string; labId?: string; order?: number },
  ) {
    return this.coursesService.updateLesson(sectionId, lessonId, body);
  }

  @Delete(':courseId/sections/:sectionId/lessons/:lessonId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
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
  async createQuiz(
    @Param('lessonId') lessonId: string,
    @Body() body: { questions: { text: string; answers: { text: string; isCorrect: boolean }[] }[] },
  ) {
    return this.coursesService.createQuiz(lessonId, body);
  }

  @Patch(':courseId/sections/:sectionId/lessons/:lessonId/quiz/:quizId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async updateQuiz(
    @Param('quizId') quizId: string,
    @Body() body: { questions: { id?: string; text: string; answers: { id?: string; text: string; isCorrect: boolean }[] }[] },
  ) {
    return this.coursesService.updateQuiz(quizId, body);
  }

  @Delete(':courseId/sections/:sectionId/lessons/:lessonId/quiz/:quizId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async removeQuiz(@Param('quizId') quizId: string) {
    return this.coursesService.removeQuiz(quizId);
  }
}
