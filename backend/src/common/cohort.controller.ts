import { Controller, Get, Post, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { CohortService } from './cohort.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('v1/cohorts')
@UseGuards(AuthGuard('jwt'))
export class CohortController {
  constructor(private readonly service: CohortService) {}

  @Get()
  async getCohorts(@Query('curriculumId') curriculumId?: string) {
    return this.service.getCohorts(curriculumId);
  }

  @Get(':id')
  async getCohort(@Param('id') id: string) {
    return this.service.getCohort(id);
  }

  @Get(':id/dashboard')
  async getCohortDashboard(@Param('id') id: string) {
    return this.service.getCohortDashboard(id);
  }

  @Get(':id/students/:userId')
  async getStudentProgress(@Param('id') id: string, @Param('userId') userId: string) {
    return this.service.getStudentProgress(id, userId);
  }

  @Post()
  async createCohort(@Body() body: {
    curriculumId: string;
    name: string;
    semester?: string;
    year: number;
    maxStudents?: number;
  }) {
    return this.service.createCohort(body);
  }

  @Post(':id/members')
  async addMember(@Param('id') id: string, @Body() body: {
    userId: string;
    role?: string;
  }) {
    return this.service.addMember(id, body.userId, body.role);
  }

  @Delete(':id/members/:userId')
  async removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.service.removeMember(id, userId);
  }
}
