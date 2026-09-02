import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AcademicService } from './academic.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('v1/academic')
@UseGuards(AuthGuard('jwt'))
export class AcademicController {
  constructor(private readonly service: AcademicService) {}

  // ─── CURRICULUM ↔ COURSE LINKING ──────────────────────

  @Post('modules/:moduleId/courses')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PROFESSOR')
  async linkCourseToModule(
    @Param('moduleId') moduleId: string,
    @Body() body: { courseId: string },
  ) {
    return this.service.linkCourseToModule(moduleId, body.courseId);
  }

  @Delete('modules/:moduleId/courses/:courseId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PROFESSOR')
  async unlinkCourseFromModule(
    @Param('moduleId') moduleId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.service.unlinkCourseFromModule(moduleId, courseId);
  }

  @Get('modules/:moduleId/courses')
  async getModuleCourses(@Param('moduleId') moduleId: string) {
    return this.service.getModuleCourses(moduleId);
  }

  // ─── COHORT → COURSE ASSIGNMENTS ──────────────────────

  @Post('cohorts/:cohortId/courses')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PROFESSOR')
  async assignCourseToCohort(
    @Param('cohortId') cohortId: string,
    @Body() body: { courseId: string; weight?: number; isRequired?: boolean },
  ) {
    return this.service.assignCourseToCohort(
      cohortId,
      body.courseId,
      body.weight,
      body.isRequired,
    );
  }

  @Delete('cohorts/:cohortId/courses/:courseId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PROFESSOR')
  async unassignCourseFromCohort(
    @Param('cohortId') cohortId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.service.unassignCourseFromCohort(cohortId, courseId);
  }

  @Get('cohorts/:cohortId/courses')
  async getCohortCourses(@Param('cohortId') cohortId: string) {
    return this.service.getCohortCourses(cohortId);
  }

  @Get('my-courses')
  async getMyCourses(@Req() req: any) {
    return this.service.getStudentCohortCourses(req.user.id);
  }

  @Get('cohorts/:cohortId/dashboard')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PROFESSOR', 'TA')
  async getCohortAcademicDashboard(@Param('cohortId') cohortId: string) {
    return this.service.getCohortAcademicDashboard(cohortId);
  }
}
