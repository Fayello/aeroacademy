import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CohortService } from './cohort.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

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
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PROFESSOR', 'TA')
  async getCohortDashboard(@Param('id') id: string) {
    return this.service.getCohortDashboard(id);
  }

  @Get(':id/students/:userId')
  async getStudentProgress(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.service.getStudentProgress(id, userId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PROFESSOR')
  async createCohort(
    @Body()
    body: {
      curriculumId: string;
      name: string;
      semester?: string;
      year: number;
      maxStudents?: number;
    },
  ) {
    return this.service.createCohort(body);
  }

  @Post(':id/members')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PROFESSOR', 'TA')
  async addMember(
    @Param('id') id: string,
    @Body()
    body: {
      userId: string;
      role?: string;
    },
  ) {
    return this.service.addMember(id, body.userId, body.role);
  }

  @Delete(':id/members/:userId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PROFESSOR')
  async removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.service.removeMember(id, userId);
  }
}
