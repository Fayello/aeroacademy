import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LearningOutcomeService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── OUTCOME CRUD ──────────────────────────────────────────────

  async getOutcomesByDomain(domainId: string) {
    return this.prisma.learningOutcome.findMany({
      where: { domainId },
      include: {
        skillOutcomes: { include: { skill: true } },
        labOutcomes: true,
        _count: { select: { evidence: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  async getOutcome(id: string) {
    return this.prisma.learningOutcome.findUnique({
      where: { id },
      include: {
        skillOutcomes: { include: { skill: true } },
        labOutcomes: { include: { lab: true } },
        assessments: true,
        evidence: { orderBy: { demonstratedAt: 'desc' }, take: 20 },
      },
    });
  }

  async createOutcome(data: {
    code: string;
    title: string;
    description: string;
    domainId: string;
    weight?: number;
  }) {
    return this.prisma.learningOutcome.create({
      data: {
        code: data.code,
        title: data.title,
        description: data.description,
        domainId: data.domainId,
        weight: data.weight ?? 1.0,
      },
    });
  }

  // ─── OUTCOME ↔ SKILL MAPPING ──────────────────────────────────

  async linkSkill(outcomeId: string, skillId: string, weight = 1.0) {
    return this.prisma.skillOutcome.upsert({
      where: { skillId_learningOutcomeId: { skillId, learningOutcomeId: outcomeId } },
      update: { weight },
      create: { skillId, learningOutcomeId: outcomeId, weight },
    });
  }

  async unlinkSkill(outcomeId: string, skillId: string) {
    return this.prisma.skillOutcome.deleteMany({
      where: { skillId, learningOutcomeId: outcomeId },
    });
  }

  // ─── OUTCOME ↔ LAB MAPPING ────────────────────────────────────

  async linkLab(outcomeId: string, labId: string, weight = 1.0) {
    return this.prisma.labOutcome.upsert({
      where: { labId_learningOutcomeId: { labId, learningOutcomeId: outcomeId } },
      update: { weight },
      create: { labId, learningOutcomeId: outcomeId, weight },
    });
  }

  async unlinkLab(outcomeId: string, labId: string) {
    return this.prisma.labOutcome.deleteMany({
      where: { labId, learningOutcomeId: outcomeId },
    });
  }

  // ─── EVIDENCE RECORDING ───────────────────────────────────────

  async recordEvidence(params: {
    userId: string;
    learningOutcomeId: string;
    activityType: string;
    activityId: string;
    score: number;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.outcomeEvidence.create({
      data: {
        userId: params.userId,
        learningOutcomeId: params.learningOutcomeId,
        activityType: params.activityType,
        activityId: params.activityId,
        score: params.score,
        metadata: params.metadata as any ?? {},
      },
    });
  }

  async getUserEvidence(userId: string, outcomeId?: string) {
    return this.prisma.outcomeEvidence.findMany({
      where: {
        userId,
        ...(outcomeId ? { learningOutcomeId: outcomeId } : {}),
      },
      include: { outcome: true },
      orderBy: { demonstratedAt: 'desc' },
    });
  }

  // ─── COMPETENCY PROFILE ───────────────────────────────────────

  async getCompetencyProfile(userId: string) {
    const domains = await this.prisma.skillDomain.findMany({
      include: {
        learningOutcomes: {
          include: {
            evidence: { where: { userId } },
            skillOutcomes: { include: { skill: true } },
          },
        },
      },
    });

    const outcomeSummaries = domains.flatMap((d) =>
      d.learningOutcomes.map((lo) => {
        const scores = lo.evidence.map((e) => e.score);
        const avgScore = scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0;
        const attemptCount = scores.length;
        const lastDemonstrated = scores.length > 0
          ? lo.evidence.sort((a, b) => b.demonstratedAt.getTime() - a.demonstratedAt.getTime())[0].demonstratedAt
          : null;
        const coveredSkills = lo.skillOutcomes.map((so) => so.skillId);
        return {
          id: lo.id,
          code: lo.code,
          title: lo.title,
          description: lo.description,
          weight: lo.weight,
          domainId: lo.domainId,
          avgScore: Math.round(avgScore * 10) / 10,
          attemptCount,
          lastDemonstrated,
          coveredSkills,
        };
      }),
    );

    const domainSummaries = domains.map((d) => {
      const outcomes = outcomeSummaries.filter((o) => o.domainId === d.id);
      const totalWeight = outcomes.reduce((s, o) => s + o.weight, 0);
      const weightedScore = outcomes.reduce((s, o) => s + o.avgScore * o.weight, 0);
      const avgMastery = totalWeight > 0 ? weightedScore / totalWeight : 0;
      const completedOutcomes = outcomes.filter((o) => o.avgScore >= 70).length;
      return {
        domainId: d.id,
        domainName: d.displayName,
        totalOutcomes: outcomes.length,
        completedOutcomes,
        completionPct: outcomes.length > 0 ? Math.round((completedOutcomes / outcomes.length) * 100) : 0,
        avgMastery: Math.round(avgMastery * 10) / 10,
        outcomes,
      };
    });

    const totalOutcomes = outcomeSummaries.length;
    const completedOutcomes = outcomeSummaries.filter((o) => o.avgScore >= 70).length;
    return {
      userId,
      totalOutcomes,
      completedOutcomes,
      overallPct: totalOutcomes > 0 ? Math.round((completedOutcomes / totalOutcomes) * 100) : 0,
      domains: domainSummaries,
    };
  }

  // ─── BULK SEED ────────────────────────────────────────────────

  async seedOutcomes(outcomes: Array<{
    code: string;
    title: string;
    description: string;
    domainId: string;
    weight?: number;
  }>) {
    const results: { code: string; id: string }[] = [];
    for (const o of outcomes) {
      const existing = await this.prisma.learningOutcome.findFirst({
        where: { domainId: o.domainId, code: o.code },
      });
      if (!existing) {
        const created = await this.prisma.learningOutcome.create({
          data: {
            code: o.code,
            title: o.title,
            description: o.description,
            domainId: o.domainId,
            weight: o.weight ?? 1.0,
          },
        });
        results.push({ code: created.code, id: created.id });
      } else {
        results.push({ code: existing.code, id: existing.id });
      }
    }
    return results;
  }
}
