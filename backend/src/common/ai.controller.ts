import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
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
