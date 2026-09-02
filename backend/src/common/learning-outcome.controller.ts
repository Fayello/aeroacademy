import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { LearningOutcomeService } from './learning-outcome.service';

@Controller('v1/learning-outcomes')
export class LearningOutcomeController {
  constructor(private readonly service: LearningOutcomeService) {}

  // ─── OUTCOME CRUD ──────────────────────────────────────────────

  @Get()
  async getOutcomes(@Query('domainId') domainId: string) {
    if (domainId) {
      return this.service.getOutcomesByDomain(domainId);
    }
    return this.service.getOutcomesByDomain('');
  }

  @Get(':id')
  async getOutcome(@Param('id') id: string) {
    return this.service.getOutcome(id);
  }

  @Post()
  async createOutcome(
    @Body()
    body: {
      code: string;
      title: string;
      description: string;
      domainId: string;
      weight?: number;
    },
  ) {
    return this.service.createOutcome(body);
  }

  // ─── SKILL MAPPING ────────────────────────────────────────────

  @Post(':id/skills/:skillId')
  async linkSkill(
    @Param('id') outcomeId: string,
    @Param('skillId') skillId: string,
    @Body('weight') weight?: number,
  ) {
    return this.service.linkSkill(outcomeId, skillId, weight);
  }

  @Delete(':id/skills/:skillId')
  async unlinkSkill(
    @Param('id') outcomeId: string,
    @Param('skillId') skillId: string,
  ) {
    return this.service.unlinkSkill(outcomeId, skillId);
  }

  // ─── LAB MAPPING ──────────────────────────────────────────────

  @Post(':id/labs/:labId')
  async linkLab(
    @Param('id') outcomeId: string,
    @Param('labId') labId: string,
    @Body('weight') weight?: number,
  ) {
    return this.service.linkLab(outcomeId, labId, weight);
  }

  @Delete(':id/labs/:labId')
  async unlinkLab(
    @Param('id') outcomeId: string,
    @Param('labId') labId: string,
  ) {
    return this.service.unlinkLab(outcomeId, labId);
  }

  // ─── COMPETENCY PROFILE ───────────────────────────────────────

  @Get('competency-profile/:userId')
  async getCompetencyProfile(@Param('userId') userId: string) {
    return this.service.getCompetencyProfile(userId);
  }

  @Get('competency-profile/:userId/enhanced')
  async getEnhancedCompetencyProfile(@Param('userId') userId: string) {
    return this.service.getEnhancedCompetencyProfile(userId);
  }

  // ─── EVIDENCE ─────────────────────────────────────────────────

  @Get('evidence/:userId')
  async getUserEvidence(
    @Param('userId') userId: string,
    @Query('outcomeId') outcomeId?: string,
  ) {
    return this.service.getUserEvidence(userId, outcomeId);
  }

  @Post('evidence')
  async recordEvidence(
    @Body()
    body: {
      userId: string;
      learningOutcomeId: string;
      activityType: string;
      activityId: string;
      score: number;
      metadata?: Record<string, unknown>;
    },
  ) {
    return this.service.recordEvidence(body);
  }

  // ─── BULK SEED ────────────────────────────────────────────────

  @Post('seed')
  async seedOutcomes(
    @Body()
    body: {
      outcomes: Array<{
        code: string;
        title: string;
        description: string;
        domainId: string;
        weight?: number;
      }>;
    },
  ) {
    return this.service.seedOutcomes(body.outcomes);
  }
}
