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

  // ─── ENHANCED COMPETENCY PROFILE ─────────────────────────────

  async getEnhancedCompetencyProfile(userId: string) {
    const [domains, assessments, userLabs, userSkills] = await Promise.all([
      this.prisma.skillDomain.findMany({
        include: {
          learningOutcomes: {
            include: {
              evidence: { where: { userId } },
              skillOutcomes: { include: { skill: true } },
              labOutcomes: { include: { lab: true } },
            },
          },
        },
      }),
      this.prisma.studentAssessment.findMany({
        where: { userId, status: 'COMPLETED' },
        include: {
          assessment: {
            include: { domain: true, outcomes: { include: { outcome: true } } },
          },
        },
        orderBy: { completedAt: 'desc' },
      }),
      this.prisma.labInstance.findMany({
        where: { userId },
        include: {
          lab: {
            include: {
              labSkills: { include: { skill: true } },
              labOutcomes: { include: { outcome: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.userSkill.findMany({
        where: { userId },
        include: { skill: { include: { domain: true } } },
      }),
    ]);

    // Compute per-outcome data with decay awareness
    const outcomeSummaries = domains.flatMap((d) =>
      d.learningOutcomes.map((lo) => {
        const scores = lo.evidence.map((e) => e.score);
        const avgScore = scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0;
        const lastEvidence = lo.evidence.length > 0
          ? lo.evidence.sort((a, b) => b.demonstratedAt.getTime() - a.demonstratedAt.getTime())[0]
          : null;
        const daysSinceLastPractice = lastEvidence
          ? Math.floor((Date.now() - lastEvidence.demonstratedAt.getTime()) / 86400000)
          : null;
        const isFading = daysSinceLastPractice !== null && daysSinceLastPractice > 7;
        const linkedLabs = lo.labOutcomes.map((lo) => ({
          id: lo.lab.id,
          title: lo.lab.title,
          difficulty: lo.lab.difficulty,
        }));
        const completedLabs = lo.labOutcomes
          .filter((lo) => userLabs.some((ul) => ul.labId === lo.lab.id))
          .map((lo) => lo.lab.id);
        return {
          id: lo.id,
          code: lo.code,
          title: lo.title,
          description: lo.description,
          weight: lo.weight,
          domainId: lo.domainId,
          avgScore: Math.round(avgScore * 10) / 10,
          attemptCount: scores.length,
          lastDemonstrated: lastEvidence?.demonstratedAt ?? null,
          daysSinceLastPractice,
          isFading,
          coveredSkills: lo.skillOutcomes.map((so) => so.skill.name),
          linkedLabs,
          completedLabIds: completedLabs,
          labCompletionPct: linkedLabs.length > 0
            ? Math.round((completedLabs.length / linkedLabs.length) * 100)
            : 0,
        };
      }),
    );

    // Compute per-domain summaries
    const domainSummaries = domains.map((d) => {
      const outcomes = outcomeSummaries.filter((o) => o.domainId === d.id);
      const totalWeight = outcomes.reduce((s, o) => s + o.weight, 0);
      const weightedScore = outcomes.reduce((s, o) => s + o.avgScore * o.weight, 0);
      const avgMastery = totalWeight > 0 ? weightedScore / totalWeight : 0;
      const completedOutcomes = outcomes.filter((o) => o.avgScore >= 70).length;
      const fadingOutcomes = outcomes.filter((o) => o.isFading).length;
      const domainSkills = userSkills.filter((us) => us.skill.domainId === d.id);
      const totalSkillXp = domainSkills.reduce((s, us) => s + us.xp, 0);
      const domainAssessments = assessments.filter((a) => a.assessment.domainId === d.id);
      const avgAssessmentScore = domainAssessments.length > 0
        ? domainAssessments.reduce((s, a) => s + (a.score ?? 0), 0) / domainAssessments.length
        : 0;

      return {
        domainId: d.id,
        domainName: d.displayName,
        icon: d.icon,
        totalOutcomes: outcomes.length,
        completedOutcomes,
        completionPct: outcomes.length > 0 ? Math.round((completedOutcomes / outcomes.length) * 100) : 0,
        avgMastery: Math.round(avgMastery * 10) / 10,
        fadingOutcomes,
        totalSkillXp,
        assessmentCount: domainAssessments.length,
        avgAssessmentScore: Math.round(avgAssessmentScore * 10) / 10,
        outcomes,
      };
    });

    // Compute overall stats
    const totalOutcomes = outcomeSummaries.length;
    const completedOutcomes = outcomeSummaries.filter((o) => o.avgScore >= 70).length;
    const fadingCount = outcomeSummaries.filter((o) => o.isFading).length;
    const totalLabsCompleted = new Set(userLabs.map((ul) => ul.labId)).size;
    const totalAssessmentsCompleted = assessments.length;
    const overallAssessmentScore = assessments.length > 0
      ? Math.round(assessments.reduce((s, a) => s + (a.score ?? 0), 0) / assessments.length)
      : 0;

    // Recommendations: what to do next
    const recommendations: Array<{
      type: 'OUTCOME' | 'ASSESSMENT' | 'LAB' | 'MAINTAIN';
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
      title: string;
      description: string;
      domainId: string;
      link?: string;
    }> = [];

    // 1. Fading skills need maintenance
    const fadingOutcomes = outcomeSummaries
      .filter((o) => o.isFading && o.avgScore >= 50)
      .sort((a, b) => (b.daysSinceLastPractice ?? 0) - (a.daysSinceLastPractice ?? 0))
      .slice(0, 3);
    for (const fo of fadingOutcomes) {
      recommendations.push({
        type: 'MAINTAIN',
        priority: 'HIGH',
        title: `Maintain: ${fo.title}`,
        description: `Last practiced ${fo.daysSinceLastPractice} days ago. Mastery may be decaying.`,
        domainId: fo.domainId,
      });
    }

    // 2. Weak outcomes (avgScore < 70) that have linked labs
    const weakOutcomes = outcomeSummaries
      .filter((o) => o.avgScore < 70 && o.avgScore > 0 && o.linkedLabs.length > 0)
      .sort((a, b) => a.avgScore - b.avgScore)
      .slice(0, 3);
    for (const wo of weakOutcomes) {
      const incompleteLab = wo.linkedLabs.find((l) => !wo.completedLabIds.includes(l.id));
      if (incompleteLab) {
        recommendations.push({
          type: 'LAB',
          priority: 'MEDIUM',
          title: `Practice: ${wo.title}`,
          description: `Try lab "${incompleteLab.title}" to improve this outcome.`,
          domainId: wo.domainId,
          link: `/dashboard/labs/${incompleteLab.id}`,
        });
      }
    }

    // 3. Untested outcomes
    const untestedOutcomes = outcomeSummaries
      .filter((o) => o.attemptCount === 0)
      .slice(0, 3);
    for (const uo of untestedOutcomes) {
      recommendations.push({
        type: 'OUTCOME',
        priority: 'LOW',
        title: `Explore: ${uo.title}`,
        description: `No evidence yet for this outcome. Complete a related lab to start building competency.`,
        domainId: uo.domainId,
      });
    }

    return {
      userId,
      summary: {
        totalOutcomes,
        completedOutcomes,
        overallPct: totalOutcomes > 0 ? Math.round((completedOutcomes / totalOutcomes) * 100) : 0,
        fadingCount,
        totalLabsCompleted,
        totalAssessmentsCompleted,
        overallAssessmentScore,
      },
      domains: domainSummaries,
      recentAssessments: assessments.slice(0, 5).map((a) => ({
        id: a.id,
        title: a.assessment.title,
        domain: a.assessment.domain?.displayName,
        score: a.score,
        maxScore: a.maxScore,
        breakdown: a.breakdown,
        completedAt: a.completedAt,
      })),
      recommendations,
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
