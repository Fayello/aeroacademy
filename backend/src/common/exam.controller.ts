import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ExamService } from './exam.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('v1/exams')
@UseGuards(AuthGuard('jwt'))
export class ExamController {
  constructor(private readonly service: ExamService) {}

  @Get(':assessmentId/attempts')
  async getExamAttempts(@Param('assessmentId') assessmentId: string) {
    return this.service.getExamAttempts(assessmentId);
  }

  @Get(':assessmentId/stats')
  async getExamStats(@Param('assessmentId') assessmentId: string) {
    return this.service.getExamStats(assessmentId);
  }

  @Get('attempts/:attemptId/report')
  async getGradeReport(@Param('attemptId') attemptId: string) {
    return this.service.getGradeReport(attemptId);
  }
}
