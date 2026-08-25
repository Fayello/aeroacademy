import { Controller, Get, Post, Body, Param, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AiService } from './ai.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('v1/ai')
@UseGuards(AuthGuard('jwt'))
export class AiController {
  constructor(private readonly service: AiService) {}

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
}
