import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PracticalAssessmentService } from './practical-assessment.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('v1/practical-assessments')
@UseGuards(AuthGuard('jwt'))
export class PracticalAssessmentController {
  constructor(private readonly service: PracticalAssessmentService) {}

  @Get()
  async getAssessments(@Query('domainId') domainId?: string) {
    return this.service.getAssessments(domainId);
  }

  @Get('user/history')
  async getUserAttempts(@Req() req: any) {
    return this.service.getUserAttempts(req.user.id);
  }

  @Get(':id')
  async getAssessment(@Param('id') id: string) {
    return this.service.getAssessment(id);
  }

  @Get(':id/stats')
  async getAssessmentStats(@Param('id') assessmentId: string) {
    return this.service.getAssessmentStats(assessmentId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PROFESSOR', 'TA')
  async createAssessment(
    @Body()
    body: {
      title: string;
      description: string;
      domainId?: string;
      timeLimit: number;
      maxScore?: number;
      passingScore?: number;
      maxAttempts?: number;
      isProctored?: boolean;
      scenarios: Array<{
        title: string;
        description: string;
        order?: number;
        maxScore?: number;
        expectedSteps?: unknown;
        expectedState?: unknown;
        hints?: unknown;
      }>;
      outcomeIds?: string[];
    },
  ) {
    return this.service.createAssessment(body);
  }

  @Post(':id/start')
  async startAttempt(@Req() req: any, @Param('id') assessmentId: string) {
    return this.service.startAttempt(req.user.id, assessmentId);
  }

  @Post(':id/submit')
  async submitAttempt(
    @Req() req: any,
    @Param('id') assessmentId: string,
    @Body()
    body: {
      scenarioResults: Array<{
        scenarioId: string;
        score: number;
        methodology?: number;
        timeSpent?: number;
        hintsUsed?: number;
        notes?: string;
      }>;
    },
  ) {
    return this.service.submitAttempt(req.user.id, assessmentId, body);
  }
}
