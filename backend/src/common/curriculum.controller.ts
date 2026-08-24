import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('v1/curricula')
@UseGuards(AuthGuard('jwt'))
export class CurriculumController {
  constructor(private readonly service: CurriculumService) {}

  @Get()
  async getCurricula(@Query('institution') institution?: string) {
    return this.service.getCurricula(institution);
  }

  @Get(':id')
  async getCurriculum(@Param('id') id: string) {
    return this.service.getCurriculum(id);
  }

  @Get(':id/stats')
  async getCurriculumStats(@Param('id') id: string) {
    return this.service.getCurriculumStats(id);
  }

  @Post()
  async createCurriculum(@Body() body: {
    name: string;
    description: string;
    institution: string;
    degree: string;
    year: number;
    modules?: Array<{
      name: string;
      code: string;
      credits: number;
      theoryHours?: number;
      practicalHours?: number;
      outcomeIds?: string[];
      labIds?: string[];
    }>;
  }) {
    return this.service.createCurriculum(body);
  }

  @Put(':id')
  async updateCurriculum(@Param('id') id: string, @Body() body: {
    name?: string;
    description?: string;
    institution?: string;
    degree?: string;
    year?: number;
    isActive?: boolean;
  }) {
    return this.service.updateCurriculum(id, body);
  }

  @Post(':curriculumId/modules')
  async addModule(@Param('curriculumId') curriculumId: string, @Body() body: {
    name: string;
    code: string;
    credits: number;
    theoryHours?: number;
    practicalHours?: number;
  }) {
    return this.service.addModule(curriculumId, body);
  }

  @Put('modules/:moduleId')
  async updateModule(@Param('moduleId') moduleId: string, @Body() body: {
    name?: string;
    code?: string;
    credits?: number;
    theoryHours?: number;
    practicalHours?: number;
  }) {
    return this.service.updateModule(moduleId, body);
  }

  @Delete('modules/:moduleId')
  async deleteModule(@Param('moduleId') moduleId: string) {
    return this.service.deleteModule(moduleId);
  }

  @Post('modules/:moduleId/outcomes')
  async mapOutcome(@Param('moduleId') moduleId: string, @Body() body: {
    learningOutcomeId: string;
    weight?: number;
  }) {
    return this.service.mapOutcome(moduleId, body.learningOutcomeId, body.weight);
  }

  @Delete('modules/:moduleId/outcomes/:outcomeId')
  async removeOutcomeMapping(
    @Param('moduleId') moduleId: string,
    @Param('outcomeId') outcomeId: string,
  ) {
    return this.service.removeOutcomeMapping(moduleId, outcomeId);
  }

  @Post('modules/:moduleId/labs')
  async mapLab(@Param('moduleId') moduleId: string, @Body() body: {
    labId: string;
  }) {
    return this.service.mapLab(moduleId, body.labId);
  }

  @Delete('modules/:moduleId/labs/:labId')
  async removeLabMapping(
    @Param('moduleId') moduleId: string,
    @Param('labId') labId: string,
  ) {
    return this.service.removeLabMapping(moduleId, labId);
  }
}
