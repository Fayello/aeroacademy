import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AiGateway } from './ai.gateway';

type Any = any;

export interface AdaptiveQuestion {
  id: string;
  text: string;
  options: Array<{ key: string; text: string }>;
  correctAnswer: string;
  category: string;
  difficulty: number; // 1-5 scale
}

export interface AdaptiveSession {
  sessionId: string;
  assessmentId: string;
  assessmentTitle: string;
  totalQuestions: number;
  questions: AdaptiveQuestion[];
  currentDifficulty: number; // starts at student ability estimate
  abilityEstimate: number; // 1-5
  categoryAbility: Record<string, number>;
}

export interface SkillGapReport {
  userId: string;
  domains: Array<{
    domain: string;
    mastery: number;
    level: string;
    labsCompleted: number;
    assessmentsTaken: number;
    avgAssessmentScore: number;
    skillCount: number;
    skills: Array<{
      skill: string;
      mastery: number;
      lastPracticed: string | null;
      isDecaying: boolean;
    }>;
  }>;
  overallScore: number;
  weakestDomain: string;
  strongestDomain: string;
  recommendations: Array<{
    type: 'lab' | 'assessment' | 'course';
    title: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export interface PersonalizedPath {
  title: string;
  description: string;
  estimatedHours: number;
  steps: Array<{
    order: number;
    type: 'assessment' | 'lab' | 'course' | 'practice';
    title: string;
    description: string;
    estimatedMinutes: number;
    skillTargets: string[];
  }>;
}

@Injectable()
export class AssessmentIntelligenceService {
  private readonly logger = new Logger(AssessmentIntelligenceService.name);

  constructor(private readonly prisma: PrismaService) {}

  private get gateway(): AiGateway | undefined {
    // Lazy import to avoid circular dependency
    return undefined; // Will be injected properly
  }

  // ─── ADAPTIVE ASSESSMENT ENGINE ────────────────────────

  async createAdaptiveSession(
    userId: string,
    assessmentId: string,
  ): Promise<AdaptiveSession> {
    const assessment = await this.prisma.skillAssessment.findUnique({
      where: { id: assessmentId },
    });
    if (!assessment) throw new Error('Assessment not found');

    const allQuestions = assessment.questions as unknown as AdaptiveQuestion[];

    // Estimate student ability from past results and skill data
    const abilityEstimate = await this.estimateStudentAbility(
      userId,
      assessment.category,
    );

    // Get category-level ability
    const categoryAbility = await this.getCategoryAbility(userId);

    // Select questions adaptively: start near student ability, then adjust
    const selectedQuestions = this.selectAdaptiveQuestions(
      allQuestions,
      abilityEstimate,
      10,
    );

    return {
      sessionId: `adaptive-${userId}-${assessmentId}-${Date.now()}`,
      assessmentId,
      assessmentTitle: assessment.title,
      totalQuestions: selectedQuestions.length,
      questions: selectedQuestions,
      currentDifficulty: abilityEstimate,
      abilityEstimate,
      categoryAbility,
    };
  }

  async processAdaptiveAnswer(
    session: AdaptiveSession,
    questionIndex: number,
    answer: string,
  ): Promise<{
    correct: boolean;
    correctAnswer: string;
    newDifficulty: number;
    abilityDelta: number;
    nextQuestion: AdaptiveQuestion | null;
    questionNumber: number;
    totalQuestions: number;
  }> {
    const question = session.questions[questionIndex];
    if (!question) throw new Error('Invalid question index');

    const correct = answer === question.correctAnswer;
    const abilityDelta = correct ? 0.3 : -0.2;

    // Update ability estimate
    session.abilityEstimate = Math.max(
      1,
      Math.min(5, session.abilityEstimate + abilityDelta),
    );
    session.currentDifficulty = Math.round(session.abilityEstimate);

    // Update category ability
    if (!session.categoryAbility[question.category]) {
      session.categoryAbility[question.category] = 3;
    }
    session.categoryAbility[question.category] = Math.max(
      1,
      Math.min(
        5,
        session.categoryAbility[question.category] + (correct ? 0.4 : -0.3),
      ),
    );

    // Get next question (if not last)
    const nextIndex = questionIndex + 1;
    let nextQuestion: AdaptiveQuestion | null = null;

    if (nextIndex < session.questions.length) {
      // Re-select remaining questions based on updated ability
      const remaining = session.questions.slice(nextIndex);
      nextQuestion = this.pickBestNext(remaining, session.abilityEstimate);
    }

    return {
      correct,
      correctAnswer: question.correctAnswer,
      newDifficulty: session.currentDifficulty,
      abilityDelta,
      nextQuestion,
      questionNumber: nextIndex + 1,
      totalQuestions: session.totalQuestions,
    };
  }

  private async estimateStudentAbility(
    userId: string,
    category: string,
  ): Promise<number> {
    // Check past assessment results
    const results = await this.prisma.assessmentResult.findMany({
      where: { userId, assessment: { category } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (results.length > 0) {
      const avgPercentage =
        results.reduce((sum, r) => sum + r.score / r.maxScore, 0) /
        results.length;
      // Map 0-100% to 1-5 scale
      return Math.max(
        1,
        Math.min(5, (Math.round((avgPercentage / 20) * 5) / 5) * 5 || 3),
      );
    }

    // Fallback: check skill mastery in this domain
    const categoryDomainMap: Record<string, string> = {
      LINUX: 'Systems',
      NETWORKING: 'Networking',
      WEB_SECURITY: 'Security',
      CRYPTO: 'Security',
    };
    const domainName = categoryDomainMap[category];

    if (domainName) {
      const skills = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT AVG(us.mastery) as "avgMastery"
         FROM "UserSkill" us
         JOIN "Skill" s ON s.id = us."skillId"
         JOIN "SkillDomain" sd ON sd.id = s."domainId"
         WHERE us."userId" = $1 AND sd."name" = $2`,
        userId,
        domainName,
      );

      if (skills[0]?.avgMastery) {
        return Math.max(1, Math.min(5, Math.round(skills[0].avgMastery / 20)));
      }
    }

    return 3; // default mid-level
  }

  private async getCategoryAbility(
    userId: string,
  ): Promise<Record<string, number>> {
    const results = await this.prisma.assessmentResult.findMany({
      where: { userId },
      include: { assessment: { select: { category: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const ability: Record<string, { total: number; count: number }> = {};

    for (const r of results) {
      const cat = r.assessment.category;
      if (!ability[cat]) ability[cat] = { total: 0, count: 0 };
      ability[cat].total += (r.score / r.maxScore) * 5;
      ability[cat].count++;
    }

    const result: Record<string, number> = {};
    for (const [cat, data] of Object.entries(ability)) {
      result[cat] = Math.round((data.total / data.count) * 10) / 10 || 3;
    }
    return result;
  }

  private selectAdaptiveQuestions(
    questions: AdaptiveQuestion[],
    ability: number,
    count: number,
  ): AdaptiveQuestion[] {
    // Sort by proximity to student ability, then take top N
    const scored = questions.map((q) => ({
      question: q,
      distance: Math.abs((q.difficulty || 3) - ability),
    }));

    scored.sort((a, b) => a.distance - b.distance);

    // Also ensure category diversity
    const selected: AdaptiveQuestion[] = [];
    const categoryCount: Record<string, number> = {};

    for (const { question } of scored) {
      if (selected.length >= count) break;
      const cat = question.category || 'general';
      if ((categoryCount[cat] || 0) < Math.ceil(count / 3)) {
        selected.push(question);
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      }
    }

    // Fill remaining if needed
    for (const { question } of scored) {
      if (selected.length >= count) break;
      if (!selected.find((s) => s.id === question.id)) {
        selected.push(question);
      }
    }

    return selected;
  }

  private pickBestNext(
    remaining: AdaptiveQuestion[],
    ability: number,
  ): AdaptiveQuestion {
    // Pick the question closest to current ability
    let best = remaining[0];
    let bestDist = Math.abs((best.difficulty || 3) - ability);

    for (const q of remaining.slice(1)) {
      const dist = Math.abs((q.difficulty || 3) - ability);
      if (dist < bestDist) {
        best = q;
        bestDist = dist;
      }
    }

    return best;
  }

  // ─── SKILL GAP ANALYSIS ────────────────────────────────

  async getSkillGapReport(userId: string): Promise<SkillGapReport> {
    const [domains, assessments, labs] = await Promise.all([
      this.prisma.$queryRawUnsafe(
        `SELECT sd."id", sd."displayName" as "domain",
                COALESCE(AVG(us.mastery), 0) as "mastery",
                COUNT(DISTINCT s.id) as "skillCount"
         FROM "SkillDomain" sd
         LEFT JOIN "Skill" s ON s."domainId" = sd.id
         LEFT JOIN "UserSkill" us ON us."skillId" = s.id AND us."userId" = $1
         GROUP BY sd.id, sd."displayName"
         ORDER BY mastery DESC`,
        userId,
      ) as unknown as Any[],
      this.prisma.assessmentResult.findMany({
        where: { userId },
        include: { assessment: { select: { category: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.$queryRawUnsafe(
        `SELECT sd."displayName" as "domain", COUNT(DISTINCT li.id) as "labsCompleted"
         FROM "LabInstance" li
         JOIN "Lab" l ON l.id = li."labId"
         LEFT JOIN "LabSkill" lsk ON lsk."labId" = l.id
         LEFT JOIN "Skill" s ON s.id = lsk."skillId"
         LEFT JOIN "SkillDomain" sd ON sd.id = s."domainId"
         WHERE li."userId" = $1 AND (li.status::text) = 'COMPLETED'
         GROUP BY sd."displayName"`,
        userId,
      ) as unknown as Any[],
    ]);

    const domainSkills = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT sd."displayName" as "domain", s."displayName" as "skill",
              us.mastery, us."lastPracticedAt", us."isDecaying"
       FROM "SkillDomain" sd
       JOIN "Skill" s ON s."domainId" = sd.id
       LEFT JOIN "UserSkill" us ON us."skillId" = s.id AND us."userId" = $1
       ORDER BY sd."displayName", us.mastery DESC NULLS LAST`,
      userId,
    );

    // Group skills by domain
    const domainSkillMap: Record<string, Any[]> = {};
    for (const ds of domainSkills) {
      if (!domainSkillMap[ds.domain]) domainSkillMap[ds.domain] = [];
      domainSkillMap[ds.domain].push({
        skill: ds.skill,
        mastery: ds.mastery || 0,
        lastPracticed: ds.lastPracticedAt,
        isDecaying: ds.isDecaying,
      });
    }

    // Calculate assessment scores by domain
    const domainAssessmentScores: Record<string, number[]> = {};
    for (const r of assessments) {
      const cat = r.assessment.category;
      if (!domainAssessmentScores[cat]) domainAssessmentScores[cat] = [];
      domainAssessmentScores[cat].push((r.score / r.maxScore) * 100);
    }

    // Map assessment categories to domain names
    const catToDomain: Record<string, string> = {
      LINUX: 'Systems',
      NETWORKING: 'Networking',
      WEB_SECURITY: 'Security',
      CRYPTO: 'Security',
    };

    const domainData = domains.map((d) => {
      const assessmentCat = Object.entries(catToDomain).find(
        ([, v]) => v === d.domain,
      )?.[0];
      const scores = assessmentCat
        ? domainAssessmentScores[assessmentCat] || []
        : [];
      const avgScore =
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0;
      const labData = labs.find((l) => l.domain === d.domain);

      const mastery = Number(d.mastery) || 0;
      let level = 'Beginner';
      if (mastery >= 80) level = 'Expert';
      else if (mastery >= 60) level = 'Advanced';
      else if (mastery >= 40) level = 'Intermediate';

      return {
        domain: d.domain,
        mastery,
        level,
        labsCompleted: labData?.labsCompleted || 0,
        assessmentsTaken: scores.length,
        avgAssessmentScore: Math.round(avgScore),
        skillCount: Number(d.skillCount) || 0,
        skills: domainSkillMap[d.domain] || [],
      };
    });

    const sorted = [...domainData].sort((a, b) => a.mastery - b.mastery);
    const weakest = sorted[0]?.domain || 'None';
    const strongest = sorted[sorted.length - 1]?.domain || 'None';
    const overallScore =
      domainData.length > 0
        ? Math.round(
            domainData.reduce((s, d) => s + d.mastery, 0) / domainData.length,
          )
        : 0;

    // Generate recommendations
    const recommendations = await this.generateGapRecommendations(
      userId,
      sorted,
    );

    return {
      userId,
      domains: domainData,
      overallScore,
      weakestDomain: weakest,
      strongestDomain: strongest,
      recommendations,
    };
  }

  private async generateGapRecommendations(
    userId: string,
    sortedDomains: Any[],
  ): Promise<
    Array<{
      type: 'lab' | 'assessment' | 'course';
      title: string;
      reason: string;
      priority: 'high' | 'medium' | 'low';
    }>
  > {
    const recs: Array<{
      type: 'lab' | 'assessment' | 'course';
      title: string;
      reason: string;
      priority: 'high' | 'medium' | 'low';
    }> = [];

    // Get labs for weak domains
    const weakDomains = sortedDomains.filter((d) => d.mastery < 50).slice(0, 3);

    for (const domain of weakDomains) {
      const labs = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT l.id, l.title, l.difficulty
         FROM "Lab" l
         JOIN "LabSkill" lsk ON lsk."labId" = l.id
         JOIN "Skill" s ON s.id = lsk."skillId"
         JOIN "SkillDomain" sd ON sd.id = s."domainId"
         WHERE sd."displayName" = $1
         ORDER BY l.difficulty ASC
         LIMIT 3`,
        domain.domain,
      );

      for (const lab of labs) {
        recs.push({
          type: 'lab',
          title: lab.title,
          reason: `Build ${domain.domain} skills (current mastery: ${Math.round(domain.mastery)}%)`,
          priority: domain.mastery < 30 ? 'high' : 'medium',
        });
      }
    }

    // Suggest assessment for strongest domain to maintain
    const strongest = sortedDomains[sortedDomains.length - 1];
    if (strongest && strongest.mastery > 60) {
      recs.push({
        type: 'assessment',
        title: `${strongest.domain} Assessment`,
        reason: `Validate and maintain your ${strongest.domain} competency`,
        priority: 'low',
      });
    }

    return recs.slice(0, 6);
  }

  // ─── PERSONALIZED LEARNING PATH ────────────────────────

  async generatePersonalizedPath(userId: string): Promise<PersonalizedPath> {
    const report = await this.getSkillGapReport(userId);

    // Get available courses and labs
    const [courses, allLabs] = await Promise.all([
      this.prisma.course.findMany({
        select: {
          id: true,
          title: true,
          description: true,
          estimatedHours: true,
        },
        take: 20,
      }),
      this.prisma.$queryRawUnsafe(
        `SELECT l.id, l.title, l.description, l.difficulty, l."estimatedMinutes",
                sd."displayName" as "domain"
         FROM "Lab" l
         LEFT JOIN "LabSkill" lsk ON lsk."labId" = l.id
         LEFT JOIN "Skill" s ON s.id = lsk."skillId"
         LEFT JOIN "SkillDomain" sd ON sd.id = s."domainId"
         ORDER BY l.difficulty ASC`,
      ) as unknown as Any[],
    ]);

    const steps: PersonalizedPath['steps'] = [];
    let order = 1;
    let totalMinutes = 0;

    // Start with assessment of weakest domain
    const weakest = report.domains.find(
      (d) => d.domain === report.weakestDomain,
    );
    if (weakest) {
      steps.push({
        order: order++,
        type: 'assessment',
        title: `${weakest.domain} Diagnostic`,
        description: `Baseline assessment for your weakest domain (${Math.round(weakest.mastery)}% mastery)`,
        estimatedMinutes: 15,
        skillTargets: weakest.skills.slice(0, 3).map((s) => s.skill),
      });
      totalMinutes += 15;
    }

    // Add labs for weak domains (sorted by difficulty, easiest first)
    for (const domain of report.domains
      .filter((d) => d.mastery < 60)
      .slice(0, 3)) {
      const domainLabs = allLabs
        .filter((l) => l.domain === domain.domain && l.difficulty <= 1400)
        .slice(0, 2);

      for (const lab of domainLabs) {
        steps.push({
          order: order++,
          type: 'lab',
          title: lab.title,
          description: lab.description || `Practice ${domain.domain} skills`,
          estimatedMinutes: lab.estimatedMinutes || 60,
          skillTargets: [domain.domain],
        });
        totalMinutes += lab.estimatedMinutes || 60;
      }
    }

    // Add courses for medium-strength domains
    const mediumDomains = report.domains.filter(
      (d) => d.mastery >= 30 && d.mastery < 70,
    );
    for (const domain of mediumDomains.slice(0, 2)) {
      const matchingCourse = courses.find((c) =>
        c.title.toLowerCase().includes(domain.domain.toLowerCase()),
      );
      if (matchingCourse) {
        steps.push({
          order: order++,
          type: 'course',
          title: matchingCourse.title,
          description: matchingCourse.description,
          estimatedMinutes: (matchingCourse.estimatedHours || 10) * 60,
          skillTargets: [domain.domain],
        });
        totalMinutes += (matchingCourse.estimatedHours || 10) * 60;
      }
    }

    // Final validation assessment
    steps.push({
      order: order++,
      type: 'assessment',
      title: 'Competency Validation',
      description:
        'Final assessment to validate your progress across all domains',
      estimatedMinutes: 20,
      skillTargets: report.domains.map((d) => d.domain),
    });
    totalMinutes += 20;

    return {
      title: `Personalized Path for ${report.strongestDomain} → ${report.weakestDomain}`,
      description: `Custom learning path targeting your weakest areas while maintaining strengths. Overall score: ${report.overallScore}%`,
      estimatedHours: Math.round((totalMinutes / 60) * 10) / 10,
      steps,
    };
  }

  // ─── COHORT ASSESSMENT INTELLIGENCE ────────────────────

  async getCohortIntelligence(cohortId: string): Promise<Any> {
    const cohort = await this.prisma.cohort.findUnique({
      where: { id: cohortId },
    });
    if (!cohort) throw new Error('Cohort not found');

    const members = await this.prisma.cohortMember.findMany({
      where: { cohortId, role: 'STUDENT' },
      select: { userId: true },
    });
    const userIds = members.map((m) => m.userId);

    if (userIds.length === 0) {
      return {
        cohort: { id: cohortId, name: cohort.name },
        students: 0,
        data: [],
      };
    }

    // Get all assessment results for cohort
    const results = await this.prisma.assessmentResult.findMany({
      where: { userId: { in: userIds } },
      include: {
        assessment: { select: { title: true, category: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Per-student aggregation
    const studentMap: Record<string, Any> = {};
    for (const r of results) {
      const uid = r.userId;
      if (!studentMap[uid]) {
        studentMap[uid] = {
          id: uid,
          name: r.user.name,
          email: r.user.email,
          assessments: [],
          avgScore: 0,
          totalAssessments: 0,
        };
      }
      studentMap[uid].assessments.push({
        title: r.assessment.title,
        category: r.assessment.category,
        score: r.score,
        maxScore: r.maxScore,
        percentage: Math.round((r.score / r.maxScore) * 100),
        date: r.createdAt,
      });
    }

    // Calculate averages
    for (const student of Object.values(studentMap)) {
      const scores = student.assessments.map((a: Any) => a.percentage);
      student.avgScore =
        scores.length > 0
          ? Math.round(
              scores.reduce((a: number, b: number) => a + b, 0) / scores.length,
            )
          : 0;
      student.totalAssessments = scores.length;
    }

    const students = Object.values(studentMap).sort(
      (a: Any, b: Any) => b.avgScore - a.avgScore,
    );

    // Category-level analysis
    const categoryStats: Record<
      string,
      { total: number; sum: number; min: number; max: number; failures: number }
    > = {};
    for (const r of results) {
      const cat = r.assessment.category;
      if (!categoryStats[cat])
        categoryStats[cat] = {
          total: 0,
          sum: 0,
          min: 100,
          max: 0,
          failures: 0,
        };
      const pct = Math.round((r.score / r.maxScore) * 100);
      categoryStats[cat].total++;
      categoryStats[cat].sum += pct;
      categoryStats[cat].min = Math.min(categoryStats[cat].min, pct);
      categoryStats[cat].max = Math.max(categoryStats[cat].max, pct);
      if (pct < 60) categoryStats[cat].failures++;
    }

    const categorySummary = Object.entries(categoryStats).map(
      ([cat, stats]) => ({
        category: cat,
        avgScore: Math.round(stats.sum / stats.total),
        attempts: stats.total,
        minScore: stats.min,
        maxScore: stats.max,
        failureRate: Math.round((stats.failures / stats.total) * 100),
      }),
    );

    // Overall cohort stats
    const allScores = results.map((r) =>
      Math.round((r.score / r.maxScore) * 100),
    );
    const overallAvg =
      allScores.length > 0
        ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
        : 0;

    return {
      cohort: { id: cohortId, name: cohort.name },
      students: students.length,
      overallAverage: overallAvg,
      totalAssessments: results.length,
      categorySummary,
      studentsRanked: students,
    };
  }
}
