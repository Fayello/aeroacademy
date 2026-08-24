import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface GradeReport {
  attemptId: string;
  student: { id: string; name: string; email: string };
  exam: { id: string; title: string; domain: string | null };
  date: Date;
  duration: number; // minutes
  timeLimit: number;
  scores: {
    correctness: number;
    methodology: number;
    timeEfficiency: number;
    independence: number;
    finalState: number;
  };
  overallGrade: number;
  letterGrade: string;
  outcomeBreakdown: Array<{
    outcomeId: string;
    code: string;
    title: string;
    domain: string;
    score: number;
  }>;
  evidence: {
    stepsTaken: number;
    commandsExecuted: number;
    avgTimePerStep: number;
    hintsUsed: number;
    errorsRecovered: number;
  };
}

@Injectable()
export class ExamService {
  constructor(private readonly prisma: PrismaService) {}

  private getLetterGrade(score: number): string {
    if (score >= 93) return 'A';
    if (score >= 90) return 'A-';
    if (score >= 87) return 'B+';
    if (score >= 83) return 'B';
    if (score >= 80) return 'B-';
    if (score >= 77) return 'C+';
    if (score >= 73) return 'C';
    if (score >= 70) return 'C-';
    if (score >= 67) return 'D+';
    if (score >= 60) return 'D';
    return 'F';
  }

  async getGradeReport(attemptId: string): Promise<GradeReport> {
    const attempt = await this.prisma.studentAssessment.findUnique({
      where: { id: attemptId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        assessment: {
          include: {
            domain: true,
            outcomes: { include: { outcome: { include: { domain: true } } } },
            scenarios: true,
          },
        },
      },
    });

    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.status !== 'COMPLETED') throw new BadRequestException('Attempt not completed');

    const breakdown = attempt.breakdown as Record<string, number> | null;
    const duration = attempt.completedAt
      ? Math.round((attempt.completedAt.getTime() - attempt.startedAt.getTime()) / 60000)
      : 0;

    // Compute outcome-level breakdown
    const outcomeBreakdown = attempt.assessment.outcomes.map((ao) => {
      const score = attempt.score ?? 0;
      return {
        outcomeId: ao.learningOutcomeId,
        code: ao.outcome.code,
        title: ao.outcome.title,
        domain: ao.outcome.domain.name,
        score: Math.round(score * ao.weight * 10) / 10,
      };
    });

    return {
      attemptId: attempt.id,
      student: attempt.user,
      exam: {
        id: attempt.assessment.id,
        title: attempt.assessment.title,
        domain: attempt.assessment.domain?.name ?? null,
      },
      date: attempt.completedAt ?? attempt.startedAt,
      duration,
      timeLimit: attempt.assessment.timeLimit,
      scores: {
        correctness: breakdown?.['correctness'] ?? 0,
        methodology: breakdown?.['methodology'] ?? 0,
        timeEfficiency: breakdown?.['timeEfficiency'] ?? 0,
        independence: breakdown?.['independence'] ?? 0,
        finalState: breakdown?.['finalState'] ?? 0,
      },
      overallGrade: attempt.score ?? 0,
      letterGrade: this.getLetterGrade(attempt.score ?? 0),
      outcomeBreakdown,
      evidence: {
        stepsTaken: 0,
        commandsExecuted: 0,
        avgTimePerStep: 0,
        hintsUsed: 0,
        errorsRecovered: 0,
      },
    };
  }

  async getExamAttempts(assessmentId: string) {
    const attempts = await this.prisma.studentAssessment.findMany({
      where: { assessmentId, status: 'COMPLETED' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { completedAt: 'desc' },
    });

    return attempts.map((a) => ({
      attemptId: a.id,
      student: a.user,
      score: a.score,
      letterGrade: this.getLetterGrade(a.score ?? 0),
      completedAt: a.completedAt,
      duration: a.completedAt
        ? Math.round((a.completedAt.getTime() - a.startedAt.getTime()) / 60000)
        : 0,
    }));
  }

  async getExamStats(assessmentId: string) {
    const attempts = await this.prisma.studentAssessment.findMany({
      where: { assessmentId, status: 'COMPLETED' },
    });

    if (attempts.length === 0) {
      return {
        totalAttempts: 0,
        avgScore: 0,
        medianScore: 0,
        passRate: 0,
        gradeDistribution: {},
        avgDuration: 0,
      };
    }

    const scores = attempts.map((a) => a.score ?? 0).sort((a, b) => a - b);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const medianScore = scores[Math.floor(scores.length / 2)];
    const passRate = (scores.filter((s) => s >= 70).length / scores.length) * 100;

    const gradeDistribution: Record<string, number> = {};
    for (const score of scores) {
      const grade = this.getLetterGrade(score);
      gradeDistribution[grade] = (gradeDistribution[grade] ?? 0) + 1;
    }

    const durations = attempts.map((a) =>
      a.completedAt ? (a.completedAt.getTime() - a.startedAt.getTime()) / 60000 : 0,
    );
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

    return {
      totalAttempts: attempts.length,
      avgScore: Math.round(avgScore * 10) / 10,
      medianScore,
      passRate: Math.round(passRate),
      gradeDistribution,
      avgDuration: Math.round(avgDuration),
    };
  }
}
