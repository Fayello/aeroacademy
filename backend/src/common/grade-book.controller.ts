import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { GradeBookService } from './grade-book.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('v1/gradebook')
@UseGuards(AuthGuard('jwt'))
export class GradeBookController {
  constructor(private readonly service: GradeBookService) {}

  // ─── CATEGORIES ───────────────────────────────────────

  @Post('cohorts/:cohortId/categories')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PROFESSOR')
  async createCategory(
    @Param('cohortId') cohortId: string,
    @Body() body: { name: string; weight: number; order?: number },
  ) {
    return this.service.createCategory(
      cohortId,
      body.name,
      body.weight,
      body.order,
    );
  }

  @Put('categories/:categoryId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PROFESSOR')
  async updateCategory(
    @Param('categoryId') categoryId: string,
    @Body() body: { name?: string; weight?: number; order?: number },
  ) {
    return this.service.updateCategory(categoryId, body);
  }

  @Delete('categories/:categoryId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PROFESSOR')
  async deleteCategory(@Param('categoryId') categoryId: string) {
    return this.service.deleteCategory(categoryId);
  }

  @Get('cohorts/:cohortId/categories')
  async getCategories(@Param('cohortId') cohortId: string) {
    return this.service.getCategories(cohortId);
  }

  // ─── ENTRIES ──────────────────────────────────────────

  @Post('categories/:categoryId/entries')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PROFESSOR', 'TA')
  async addEntry(
    @Param('categoryId') categoryId: string,
    @Req() req: any,
    @Body()
    body: {
      userId: string;
      title: string;
      score: number;
      maxScore?: number;
      weight?: number;
      comment?: string;
    },
  ) {
    return this.service.addEntry(categoryId, {
      ...body,
      gradedById: req.user.id,
    });
  }

  @Post('categories/:categoryId/entries/bulk')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PROFESSOR', 'TA')
  async bulkAddEntries(
    @Param('categoryId') categoryId: string,
    @Req() req: any,
    @Body()
    body: {
      entries: Array<{
        userId: string;
        title: string;
        score: number;
        maxScore?: number;
        weight?: number;
        comment?: string;
      }>;
    },
  ) {
    return this.service.bulkAddEntries(categoryId, body.entries, req.user.id);
  }

  @Put('entries/:entryId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PROFESSOR', 'TA')
  async updateEntry(
    @Param('entryId') entryId: string,
    @Body() body: { score?: number; comment?: string },
  ) {
    return this.service.updateEntry(entryId, body);
  }

  @Delete('entries/:entryId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PROFESSOR')
  async deleteEntry(@Param('entryId') entryId: string) {
    return this.service.deleteEntry(entryId);
  }

  // ─── GRADE VIEWS ─────────────────────────────────────

  @Get('cohorts/:cohortId/grades')
  async getCohortGradeBook(@Param('cohortId') cohortId: string) {
    return this.service.getCohortGradeBook(cohortId);
  }

  @Get('cohorts/:cohortId/my-grades')
  async getMyGrades(@Param('cohortId') cohortId: string, @Req() req: any) {
    return this.service.getStudentGrades(req.user.id, cohortId);
  }

  // ─── GPA ──────────────────────────────────────────────

  @Get('my-gpa')
  async getMyGPA(@Req() req: any) {
    return this.service.calculateGPA(req.user.id);
  }

  @Get('students/:userId/gpa')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PROFESSOR')
  async getStudentGPA(@Param('userId') userId: string) {
    return this.service.calculateGPA(userId);
  }
}
