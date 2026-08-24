import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LearningOutcomeService } from './learning-outcome.service';

export interface ScoreBreakdown {
  correctness: number;    // 0-100: did they solve it?
  methodology: number;    // 0-100: did they follow proper approach?
  timeEfficiency: number; // 0-100: how fast relative to time limit?
  independence: number;   // 0-100: did they need hints?
  finalState: number;     // 0-100: is the system in a good state?
}

@Injectable()
export class PracticalAssessmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outcomeService: LearningOutcomeService,
  ) {}

  // ─── ASSESSMENT CRUD ──────────────────────────────────────────

  async getAssessments(domainId?: string) {
    return this.prisma.practicalAssessment.findMany({
      where: {
        isActive: true,
        ...(domainId ? { domainId } : {}),
      },
      include: {
        domain: true,
        outcomes: { include: { outcome: true } },
        scenarios: { orderBy: { order: 'asc' } },
        _count: { select: { attempts: true } },
      },
    });
  }

  async getAssessment(id: string) {
    return this.prisma.practicalAssessment.findUnique({
      where: { id },
      include: {
        domain: true,
        outcomes: { include: { outcome: true } },
        scenarios: { orderBy: { order: 'asc' } },
      },
    });
  }

  async createAssessment(data: {
    title: string;
    description: string;
    domainId?: string;
    timeLimit: number;
    maxScore?: number;
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
  }) {
    return this.prisma.$transaction(async (tx) => {
      const assessment = await tx.practicalAssessment.create({
        data: {
          title: data.title,
          description: data.description,
          domainId: data.domainId,
          timeLimit: data.timeLimit,
          maxScore: data.maxScore ?? 100,
        },
      });

      for (const s of data.scenarios) {
        await tx.assessmentScenario.create({
          data: {
            assessmentId: assessment.id,
            title: s.title,
            description: s.description,
            order: s.order ?? 0,
            maxScore: s.maxScore ?? 100,
            expectedSteps: s.expectedSteps as any,
            expectedState: s.expectedState as any,
            hints: s.hints as any,
          },
        });
      }

      if (data.outcomeIds?.length) {
        for (const outcomeId of data.outcomeIds) {
          await tx.assessmentOutcome.create({
            data: {
              assessmentId: assessment.id,
              learningOutcomeId: outcomeId,
              weight: 1.0,
            },
          });
        }
      }

      return assessment;
    });
  }

  // ─── ATTEMPT LIFECYCLE ────────────────────────────────────────

  async startAttempt(userId: string, assessmentId: string) {
    const assessment = await this.prisma.practicalAssessment.findUnique({
      where: { id: assessmentId },
      include: { scenarios: true },
    });
    if (!assessment) throw new NotFoundException('Assessment not found');
    if (!assessment.isActive) throw new BadRequestException('Assessment is not active');

    const existing = await this.prisma.studentAssessment.findUnique({
      where: { userId_assessmentId: { userId, assessmentId } },
    });
    if (existing && existing.status === 'IN_PROGRESS') {
      return existing;
    }

    if (existing && existing.status === 'COMPLETED') {
      throw new BadRequestException('Assessment already completed');
    }

    return this.prisma.studentAssessment.create({
      data: {
        userId,
        assessmentId,
        maxScore: assessment.maxScore,
        status: 'IN_PROGRESS',
      },
    });
  }

  async submitAttempt(
    userId: string,
    assessmentId: string,
    submission: {
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
    const attempt = await this.prisma.studentAssessment.findUnique({
      where: { userId_assessmentId: { userId, assessmentId } },
      include: {
        assessment: {
          include: {
            scenarios: true,
            outcomes: { include: { outcome: true } },
            domain: true,
          },
        },
      },
    });

    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.status !== 'IN_PROGRESS') throw new BadRequestException('Attempt not in progress');

    const assessment = attempt.assessment;
    const timeLimitMs = assessment.timeLimit * 60 * 1000;
    const elapsed = Date.now() - attempt.startedAt.getTime();
    const timeEfficiency = Math.max(0, Math.min(100, 100 - (elapsed / timeLimitMs) * 100));

    // Compute multi-dimensional scores
    let totalCorrectness = 0;
    let totalMethodology = 0;
    let totalIndependence = 0;
    let totalMaxScore = 0;

    for (const result of submission.scenarioResults) {
      const scenario = assessment.scenarios.find((s) => s.id === result.scenarioId);
      if (!scenario) continue;

      const correctness = Math.min(100, (result.score / scenario.maxScore) * 100);
      const methodology = result.methodology ?? correctness;
      const hintsUsed = result.hintsUsed ?? 0;
      const independence = Math.max(0, 100 - hintsUsed * 20);

      totalCorrectness += correctness * scenario.maxScore;
      totalMethodology += methodology * scenario.maxScore;
      totalIndependence += independence * scenario.maxScore;
      totalMaxScore += scenario.maxScore;
    }

    const avgCorrectness = totalMaxScore > 0 ? totalCorrectness / totalMaxScore : 0;
    const avgMethodology = totalMaxScore > 0 ? totalMethodology / totalMaxScore : 0;
    const avgIndependence = totalMaxScore > 0 ? totalIndependence / totalMaxScore : 0;

    // Final state: average of all scenario scores (proxy for system state)
    const avgFinalState = avgCorrectness;

    // Overall score using weighted formula
    const overallScore = Math.round(
      avgCorrectness * 0.35 +
      avgMethodology * 0.25 +
      timeEfficiency * 0.20 +
      avgIndependence * 0.10 +
      avgFinalState * 0.10
    );

    const breakdown: ScoreBreakdown = {
      correctness: Math.round(avgCorrectness * 10) / 10,
      methodology: Math.round(avgMethodology * 10) / 10,
      timeEfficiency: Math.round(timeEfficiency * 10) / 10,
      independence: Math.round(avgIndependence * 10) / 10,
      finalState: Math.round(avgFinalState * 10) / 10,
    };

    // Update attempt
    const updated = await this.prisma.studentAssessment.update({
      where: { id: attempt.id },
      data: {
        score: overallScore,
        breakdown: breakdown as any,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Record evidence for each linked outcome
    for (const ao of assessment.outcomes) {
      const outcomeScore = overallScore * ao.weight;
      await this.outcomeService.recordEvidence({
        userId,
        learningOutcomeId: ao.learningOutcomeId,
        activityType: 'ASSESSMENT_PASSED',
        activityId: assessmentId,
        score: outcomeScore,
        metadata: {
          assessmentTitle: assessment.title,
          breakdown,
          domainId: assessment.domainId,
        },
      });
    }

    return { ...updated, breakdown, overallScore };
  }

  // ─── HISTORY & ANALYTICS ──────────────────────────────────────

  async getUserAttempts(userId: string) {
    return this.prisma.studentAssessment.findMany({
      where: { userId },
      include: {
        assessment: {
          include: { domain: true, outcomes: { include: { outcome: true } } },
        },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  async getAssessmentStats(assessmentId: string) {
    const attempts = await this.prisma.studentAssessment.findMany({
      where: { assessmentId, status: 'COMPLETED' },
    });

    if (attempts.length === 0) {
      return { totalAttempts: 0, avgScore: 0, passRate: 0, scores: [] };
    }

    const scores = attempts.map((a) => a.score ?? 0);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const passRate = attempts.filter((a) => (a.score ?? 0) >= 70).length / attempts.length * 100;

    return {
      totalAttempts: attempts.length,
      avgScore: Math.round(avgScore * 10) / 10,
      passRate: Math.round(passRate),
      scores,
    };
  }
}
