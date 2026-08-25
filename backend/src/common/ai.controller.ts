import { Controller, Get, Post, Body, Param, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AiService } from './ai.service';
import { AiGatewayFactory } from './ai.gateway';
import { LabAnalyticsService } from './lab-analytics.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('v1/ai')
@UseGuards(AuthGuard('jwt'))
export class AiController {
  constructor(
    private readonly service: AiService,
    private readonly gatewayFactory: AiGatewayFactory,
    private readonly analyticsService: LabAnalyticsService,
  ) {}

  @Post('coach')
  async learningCoach(
    @Req() req: any,
    @Body() body: { message: string; history?: Array<{ role: string; content: string }> },
  ) {
    return this.service.learningCoach(req.user.id, body.message, body.history);
  }

  @Post('coach/stream')
  async learningCoachStream(
    @Req() req: any,
    @Body() body: { message: string; history?: Array<{ role: string; content: string }> },
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const stream = await this.service.learningCoachStream(req.user.id, body.message, body.history);
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }
    } catch {}
    res.end();
  }

  @Get('recommendations')
  async getSmartRecommendations(@Req() req: any) {
    return this.service.getSmartRecommendations(req.user.id);
  }

  @Get('at-risk/:cohortId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PROFESSOR', 'TA')
  async getAtRiskStudents(@Param('cohortId') cohortId: string) {
    return this.service.getAtRiskStudents(cohortId);
  }

  @Get('lab-analytics')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PROFESSOR')
  async getLabAnalytics() {
    return this.service.getLabAnalytics();
  }

  @Get('gateway-status')
  async getGatewayStatus() {
    const gateways = this.gatewayFactory.listGateways();
    const available = await this.gatewayFactory.getAvailableGateway();
    return {
      active: available?.name || null,
      gateways,
    };
  }

  @Get('lab-analytics/:labId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PROFESSOR')
  async getLabInsights(@Param('labId') labId: string) {
    return this.analyticsService.getLabInsights(labId);
  }

  // ─── AI CONTENT GENERATORS ─────────────────────

  @Post('generate/briefing')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PROFESSOR', 'TA')
  async generateLabBriefing(@Body() body: { labId: string }) {
    return this.service.generateLabBriefing(body.labId);
  }

  @Post('generate/questions')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PROFESSOR', 'TA')
  async generateAssessmentQuestions(@Body() body: { assessmentId: string; count?: number }) {
    return this.service.generateAssessmentQuestions(body.assessmentId, body.count || 5);
  }

  @Post('generate/outline')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PROFESSOR', 'TA')
  async generateCourseOutline(@Body() body: { courseId: string }) {
    return this.service.generateCourseOutline(body.courseId);
  }

  @Post('calibrate/:labId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async calibrateLabDifficulty(@Param('labId') labId: string) {
    return this.service.calibrateLabDifficulty(labId);
  }

  @Post('calibrate-all')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async calibrateAllLabs() {
    return this.service.calibrateAllLabs();
  }
}
