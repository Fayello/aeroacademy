import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Audit } from '../common/audit.decorator';
import type { RequestWithUser } from '../common/request-with-user';

@ApiTags('assessments')
@ApiBearerAuth('JWT-auth')
@Controller('v1/assessments')
@UseGuards(AuthGuard('jwt'))
export class AssessmentsController {
  constructor(private assessmentsService: AssessmentsService) {}

  @Get()
  async getAllAssessments() {
    return this.assessmentsService.getAllAssessments();
  }

  @Get('my-results')
  async getMyResults(@Request() req: RequestWithUser) {
    return this.assessmentsService.getUserResults(req.user.id);
  }

  @Get(':id')
  async getAssessment(@Param('id') id: string) {
    return this.assessmentsService.getAssessment(id);
  }

  @Post(':id/submit')
  @Audit('ASSESSMENT_SUBMITTED')
  async submitAssessment(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: { answers: Record<string, string> },
  ) {
    return this.assessmentsService.submitAssessment(req.user.id, id, body.answers);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PROFESSOR', 'TA')
  @Audit('ASSESSMENT_CREATED')
  async createAssessment(
    @Body() body: {
      title: string;
      description: string;
      category: string;
      questions: Array<{
        text: string;
        options: { key: string; text: string }[];
        correctAnswer: string;
        category: string;
      }>;
    },
  ) {
    return this.assessmentsService.createAssessment(body);
  }
}
