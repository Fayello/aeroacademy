import { Controller, Get, Post, Body, Param, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AiService } from './ai.service';
import { AiGatewayFactory } from './ai.gateway';
import { LabAnalyticsService } from './lab-analytics.service';
import { AssessmentIntelligenceService } from './assessment-intelligence.service';
import { PredictiveAnalyticsService } from './predictive-analytics.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

type Any = any;

@Controller('v1/ai')
@UseGuards(AuthGuard('jwt'))
export class AiController {
  constructor(
    private readonly service: AiService,
    private readonly gatewayFactory: AiGatewayFactory,
    private readonly analyticsService: LabAnalyticsService,
    private readonly intelligenceService: AssessmentIntelligenceService,
    private readonly predictiveService: PredictiveAnalyticsService,
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

  // ─── ASSESSMENT INTELLIGENCE ──────────────────

  @Post('adaptive/start')
  async startAdaptiveAssessment(@Req() req: any, @Body() body: { assessmentId: string }) {
    return this.intelligenceService.createAdaptiveSession(req.user.id, body.assessmentId);
  }

  @Post('adaptive/answer')
  async submitAdaptiveAnswer(
    @Req() req: any,
    @Body() body: { sessionId: string; questionIndex: number; answer: string; session: Any },
  ) {
    return this.intelligenceService.processAdaptiveAnswer(body.session, body.questionIndex, body.answer);
  }

  @Get('skill-gaps')
  async getSkillGapReport(@Req() req: any) {
    return this.intelligenceService.getSkillGapReport(req.user.id);
  }

  @Get('personalized-path')
  async getPersonalizedPath(@Req() req: any) {
    return this.intelligenceService.generatePersonalizedPath(req.user.id);
  }

  @Get('cohort-intelligence/:cohortId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PROFESSOR', 'TA')
  async getCohortIntelligence(@Param('cohortId') cohortId: string) {
    return this.intelligenceService.getCohortIntelligence(cohortId);
  }

  // ─── PREDICTIVE ANALYTICS ─────────────────────

  @Get('predictive/dashboard')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PROFESSOR', 'TA')
  async getPredictiveDashboard(@Req() req: any, @Param('cohortId') cohortId?: string) {
    return this.predictiveService.getPredictiveDashboard(cohortId);
  }

  @Get('predictive/at-risk')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PROFESSOR', 'TA')
  async getAtRiskPredictions(@Param('cohortId') cohortId?: string) {
    return this.predictiveService.predictAtRiskStudents(cohortId);
  }

  @Get('predictive/forecast/:userId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PROFESSOR', 'TA')
  async getPerformanceForecast(@Param('userId') userId: string) {
    return this.predictiveService.forecastPerformance(userId);
  }

  @Get('predictive/interventions/:cohortId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PROFESSOR', 'TA')
  async getInterventions(@Param('cohortId') cohortId: string) {
    return this.predictiveService.generateInterventions(cohortId);
  }
}
