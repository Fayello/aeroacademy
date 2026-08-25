import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AiGateway } from './ai.gateway';

type Any = any;

export interface ContentRelevanceScore {
  id: string;
  type: 'lab' | 'course';
  title: string;
  relevanceScore: number; // 0-100
  freshnessScore: number; // 0-100
  overallScore: number;   // weighted average
  issues: string[];
  suggestions: string[];
  lastUpdated: Date;
  daysSinceUpdate: number;
}

export interface ContentUpdateSuggestion {
  id: string;
  type: 'lab' | 'course';
  title: string;
  field: string;
  currentValue: string;
  suggestedValue: string;
  reason: string;
  confidence: number;
}

export interface ContentFreshnessReport {
  totalLabs: number;
  totalCourses: number;
  staleLabs: number;        // >90 days since update
  staleCourses: number;     // >90 days since update
  outdatedLabs: number;     // relevance <50
  outdatedCourses: number;  // relevance <50
  avgLabRelevance: number;
  avgCourseRelevance: number;
  avgLabFreshness: number;
  avgCourseFreshness: number;
  labsNeedingRefresh: Array<{ id: string; title: string; score: number; daysSinceUpdate: number }>;
  coursesNeedingRefresh: Array<{ id: string; title: string; score: number; daysSinceUpdate: number }>;
  domainBreakdown: Array<{ domain: string; avgRelevance: number; count: number }>;
}

export interface RefreshHistoryEntry {
  id: string;
  contentType: string;
  contentId: string;
  contentTitle: string;
  action: string;
  details: string;
  createdAt: Date;
}

@Injectable()
export class ContentRefreshService {
  private readonly logger = new Logger(ContentRefreshService.name);

  constructor(private readonly prisma: PrismaService) {}

  private get gateway(): AiGateway | undefined {
    return undefined;
  }

  // ─── CONTENT RELEVANCE SCORING ─────────────────────────

  async scoreLabRelevance(labId: string): Promise<ContentRelevanceScore> {
    const lab = await this.prisma.lab.findUnique({
      where: { id: labId },
      select: {
        id: true, title: true, description: true, briefing: true,
        difficulty: true, estimatedMinutes: true,
        flags: { select: { title: true, description: true } },
        labSkills: { select: { skill: { select: { displayName: true, domain: { select: { displayName: true } } } } } },
        analytics: true,
      },
    }) as unknown as Any;

    if (!lab) throw new Error('Lab not found');

    const domains = [...new Set(lab.labSkills.map((ls: Any) => ls.skill.domain?.displayName).filter(Boolean))];
    const lastUpdated = lab.analytics?.updatedAt || new Date(0);
    const daysSinceUpdate = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 86400000);

    // Rule-based initial score
    let relevanceScore = 70; // baseline
    let freshnessScore = 100;
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Freshness scoring
    if (daysSinceUpdate > 180) {
      freshnessScore = 20;
      issues.push('Content is over 6 months old');
      suggestions.push('Consider updating briefing and flags to reflect current threats');
    } else if (daysSinceUpdate > 90) {
      freshnessScore = 50;
      issues.push('Content is over 3 months old');
    } else if (daysSinceUpdate > 30) {
      freshnessScore = 75;
    }

    // Analytics-based scoring
    if (lab.analytics) {
      if (lab.analytics.completionRate < 20) {
        relevanceScore -= 15;
        issues.push(`Very low completion rate: ${lab.analytics.completionRate}%`);
        suggestions.push('Briefing may be unclear or difficulty too high');
      } else if (lab.analytics.completionRate > 80) {
        relevanceScore -= 5;
        issues.push(`Very high completion rate: ${lab.analytics.completionRate}% — may be too easy`);
        suggestions.push('Consider adding more challenging flags');
      }

      if (lab.analytics.failureRate > 60) {
        relevanceScore -= 10;
        issues.push(`High failure rate: ${lab.analytics.failureRate}%`);
        suggestions.push('Review flag difficulty and hint availability');
      }
    }

    // Content quality checks
    if (!lab.briefing || lab.briefing.length < 50) {
      relevanceScore -= 10;
      issues.push('Briefing is missing or too short');
      suggestions.push('Add a detailed scenario briefing for better learning outcomes');
    }

    if (lab.flags.length < 2) {
      relevanceScore -= 5;
      issues.push('Lab has fewer than 2 flags');
      suggestions.push('Add more flags to increase engagement');
    }

    if (!lab.description || lab.description.length < 20) {
      relevanceScore -= 5;
      issues.push('Description is missing or too short');
    }

    // AI-enhanced scoring
    let aiScore: number | null = null;
    if (this.gateway) {
      try {
        const prompt = `Rate the relevance and quality of this lab on a scale of 0-100:
Title: ${lab.title}
Description: ${lab.description}
Briefing: ${lab.briefing || 'None'}
Domains: ${domains.join(', ')}
Flags: ${lab.flags.map((f) => f.title).join(', ')}
Difficulty: ${lab.difficulty}
Completion rate: ${lab.analytics?.completionRate || 'N/A'}%

Consider: current industry trends, learning objectives clarity, practical applicability.
Respond with just the number.`;

        const response = await this.gateway.generate({
          prompt,
          system: 'You are a cybersecurity education content evaluator. Rate content relevance 0-100.',
          temperature: 0.3,
        });

        const parsed = parseInt(response.trim(), 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
          aiScore = parsed;
        }
      } catch {}
    }

    const finalRelevance = aiScore !== null
      ? Math.round((relevanceScore * 0.5 + aiScore * 0.5))
      : Math.max(0, Math.min(100, relevanceScore));

    const overallScore = Math.round(finalRelevance * 0.6 + freshnessScore * 0.4);

    return {
      id: lab.id,
      type: 'lab',
      title: lab.title,
      relevanceScore: finalRelevance,
      freshnessScore,
      overallScore,
      issues,
      suggestions,
      lastUpdated,
      daysSinceUpdate,
    };
  }

  async scoreCourseRelevance(courseId: string): Promise<ContentRelevanceScore> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true, title: true, description: true, estimatedHours: true, createdAt: true,
        sections: {
          select: {
            title: true,
            lessons: { select: { title: true, content: true, labId: true } },
          },
        },
        enrollments: true,
        reviews: true,
      },
    }) as unknown as Any;

    if (!course) throw new Error('Course not found');

    const daysSinceUpdate = Math.floor((Date.now() - new Date(course.createdAt).getTime()) / 86400000);
    const totalLessons = course.sections.reduce((sum, s) => sum + s.lessons.length, 0);
    const lessonsWithLabs = course.sections.reduce(
      (sum, s) => sum + s.lessons.filter((l) => l.labId).length, 0
    );
    const avgRating = course.reviews.length > 0
      ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
      : null;

    let relevanceScore = 70;
    let freshnessScore = 100;
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Freshness
    if (daysSinceUpdate > 180) {
      freshnessScore = 20;
      issues.push('Course is over 6 months old');
      suggestions.push('Review and update lesson content');
    } else if (daysSinceUpdate > 90) {
      freshnessScore = 50;
      issues.push('Course is over 3 months old');
    }

    // Quality metrics
    if (totalLessons < 3) {
      relevanceScore -= 15;
      issues.push('Course has fewer than 3 lessons');
      suggestions.push('Add more lessons for comprehensive coverage');
    }

    if (course.sections.length === 0) {
      relevanceScore -= 10;
      issues.push('Course has no sections');
      suggestions.push('Organize content into sections');
    }

    if (lessonsWithLabs === 0 && totalLessons > 0) {
      relevanceScore -= 10;
      issues.push('No lessons have associated labs');
      suggestions.push('Add hands-on labs for practical learning');
    }

    if (avgRating !== null && avgRating < 3) {
      relevanceScore -= 10;
      issues.push(`Low average rating: ${avgRating.toFixed(1)}/5`);
      suggestions.push('Review student feedback and improve content');
    }

    if (course.enrollments.length === 0) {
      issues.push('No enrollments yet');
    }

    // Content quality
    const emptyLessons = course.sections.flatMap((s) => s.lessons).filter(
      (l) => !l.content || l.content.length < 50
    );
    if (emptyLessons.length > 0) {
      relevanceScore -= 5;
      issues.push(`${emptyLessons.length} lesson(s) have minimal content`);
      suggestions.push('Flesh out lesson content with explanations and examples');
    }

    // AI scoring
    let aiScore: number | null = null;
    if (this.gateway) {
      try {
        const prompt = `Rate this course's relevance and quality 0-100:
Title: ${course.title}
Description: ${course.description}
Sections: ${course.sections.map((s) => `${s.title} (${s.lessons.length} lessons)`).join(', ')}
Total lessons: ${totalLessons}
Lessons with labs: ${lessonsWithLabs}
Rating: ${avgRating?.toFixed(1) || 'N/A'}/5
Enrollments: ${course.enrollments.length}

Rate based on: content completeness, practical applicability, structure, industry relevance.
Respond with just the number.`;

        const response = await this.gateway.generate({
          prompt,
          system: 'You are a technology education content evaluator. Rate course relevance 0-100.',
          temperature: 0.3,
        });

        const parsed = parseInt(response.trim(), 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
          aiScore = parsed;
        }
      } catch {}
    }

    const finalRelevance = aiScore !== null
      ? Math.round((relevanceScore * 0.5 + aiScore * 0.5))
      : Math.max(0, Math.min(100, relevanceScore));

    const overallScore = Math.round(finalRelevance * 0.6 + freshnessScore * 0.4);

    return {
      id: course.id,
      type: 'course',
      title: course.title,
      relevanceScore: finalRelevance,
      freshnessScore,
      overallScore,
      issues,
      suggestions,
      lastUpdated: course.createdAt,
      daysSinceUpdate,
    };
  }

  // ─── CONTENT UPDATE SUGGESTIONS ────────────────────────

  async suggestLabUpdates(labId: string): Promise<ContentUpdateSuggestion[]> {
    const lab = await this.prisma.lab.findUnique({
      where: { id: labId },
      select: {
        id: true, title: true, description: true, briefing: true,
        difficulty: true, estimatedMinutes: true,
        flags: { select: { title: true, description: true } },
        labSkills: { select: { skill: { select: { displayName: true, domain: { select: { displayName: true } } } } } },
        analytics: { select: { completionRate: true, failureRate: true, avgTimeMinutes: true } },
      },
    }) as unknown as Any;

    if (!lab) throw new Error('Lab not found');

    const domains = [...new Set(lab.labSkills.map((ls: Any) => ls.skill.domain?.displayName).filter(Boolean))];

    if (!this.gateway) {
      return this.getRuleBasedLabSuggestions(lab);
    }

    const prompt = `Analyze this lab and suggest specific improvements:

Title: ${lab.title}
Description: ${lab.description}
Briefing: ${lab.briefing || 'None'}
Difficulty: ${lab.difficulty}
Estimated time: ${lab.estimatedMinutes} min
Domains: ${domains.join(', ')}
Flags: ${lab.flags.map((f) => `${f.title}: ${f.description || 'no description'}`).join('; ')}
Analytics: completion=${lab.analytics?.completionRate || 'N/A'}%, failure=${lab.analytics?.failureRate || 'N/A'}%, avgTime=${lab.analytics?.avgTimeMinutes || 'N/A'} min

Suggest improvements for: description, briefing, difficulty, estimated time, flag descriptions.
Respond in JSON format:
[{"field":"description|briefing|difficulty|estimatedMinutes","currentValue":"...","suggestedValue":"...","reason":"...","confidence":0.8}]`;

    try {
      const response = await this.gateway.generate({
        prompt,
        system: 'You are a cybersecurity lab content specialist. Suggest specific, actionable improvements.',
        format: 'json',
        temperature: 0.5,
      });

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map((s: Any) => ({
          id: labId,
          type: 'lab' as const,
          title: lab.title,
          field: s.field,
          currentValue: s.currentValue,
          suggestedValue: s.suggestedValue,
          reason: s.reason,
          confidence: s.confidence || 0.7,
        }));
      }
    } catch {}

    return this.getRuleBasedLabSuggestions(lab);
  }

  private getRuleBasedLabSuggestions(lab: Any): ContentUpdateSuggestion[] {
    const suggestions: ContentUpdateSuggestion[] = [];

    if (!lab.briefing || lab.briefing.length < 50) {
      suggestions.push({
        id: lab.id, type: 'lab', title: lab.title,
        field: 'briefing', currentValue: lab.briefing || '',
        suggestedValue: `Scenario: You are a security analyst investigating a potential breach. Your objective is to identify and exploit vulnerabilities in the target system to capture all flags. Use standard penetration testing methodologies.`,
        reason: 'Briefing is missing or too short — a good briefing sets context and learning objectives',
        confidence: 0.9,
      });
    }

    if (lab.analytics?.completionRate && lab.analytics.completionRate < 20) {
      suggestions.push({
        id: lab.id, type: 'lab', title: lab.title,
        field: 'difficulty', currentValue: String(lab.difficulty),
        suggestedValue: String(Math.max(800, lab.difficulty - 200)),
        reason: `Very low completion rate (${lab.analytics.completionRate}%) suggests difficulty may be too high`,
        confidence: 0.8,
      });
    }

    if (lab.analytics?.avgTimeMinutes && lab.analytics.avgTimeMinutes > (lab.estimatedMinutes || 60) * 1.5) {
      suggestions.push({
        id: lab.id, type: 'lab', title: lab.title,
        field: 'estimatedMinutes', currentValue: String(lab.estimatedMinutes),
        suggestedValue: String(Math.ceil(lab.analytics.avgTimeMinutes * 1.1)),
        reason: `Average time (${lab.analytics.avgTimeMinutes} min) exceeds estimate (${lab.estimatedMinutes} min)`,
        confidence: 0.85,
      });
    }

    return suggestions;
  }

  // ─── CONTENT FRESHNESS REPORT ──────────────────────────

  async getFreshnessReport(): Promise<ContentFreshnessReport> {
    const [labs, courses] = await Promise.all([
      this.prisma.lab.findMany({
        select: {
          id: true, title: true,
          analytics: { select: { completionRate: true } },
          labSkills: { select: { skill: { select: { domain: { select: { displayName: true } } } } } },
        },
      }) as unknown as Any[],
      this.prisma.course.findMany({
        select: {
          id: true, title: true, createdAt: true,
          sections: { select: { lessons: { select: { id: true } } } },
          reviews: { select: { rating: true } },
        },
      }) as unknown as Any[],
    ]);

    const now = Date.now();
    const staleThreshold = 90; // days

    const labScores = labs.map((lab: Any) => {
      const isOutdated = (lab.analytics?.completionRate || 50) < 30;
      return {
        id: lab.id, title: lab.title,
        daysSinceUpdate: 0, isStale: false, isOutdated,
        score: isOutdated ? 30 : 80,
      };
    });

    const courseScores = courses.map((course: Any) => {
      const daysSinceUpdate = Math.floor((now - new Date(course.createdAt).getTime()) / 86400000);
      const isStale = daysSinceUpdate > staleThreshold;
      const totalLessons = (course.sections || []).reduce((sum: number, s: Any) => sum + s.lessons.length, 0);
      const isOutdated = totalLessons < 3;
      return {
        id: course.id, title: course.title,
        daysSinceUpdate, isStale, isOutdated,
        score: isOutdated ? 30 : isStale ? 50 : 80,
      };
    });

    const staleLabs = labScores.filter((l) => l.isStale).length;
    const staleCourses = courseScores.filter((c) => c.isStale).length;
    const outdatedLabs = labScores.filter((l) => l.isOutdated).length;
    const outdatedCourses = courseScores.filter((c) => c.isOutdated).length;

    const avgLabRelevance = labScores.length > 0
      ? Math.round(labScores.reduce((s, l) => s + l.score, 0) / labScores.length)
      : 0;
    const avgCourseRelevance = courseScores.length > 0
      ? Math.round(courseScores.reduce((s, c) => s + c.score, 0) / courseScores.length)
      : 0;

    const avgLabFreshness = labScores.length > 0
      ? Math.round(labScores.reduce((s, l) => s + Math.max(0, 100 - l.daysSinceUpdate), 0) / labScores.length)
      : 0;
    const avgCourseFreshness = courseScores.length > 0
      ? Math.round(courseScores.reduce((s, c) => s + Math.max(0, 100 - c.daysSinceUpdate), 0) / courseScores.length)
      : 0;

    // Domain breakdown
    const domainMap: Record<string, { totalRelevance: number; count: number }> = {};
    for (const lab of labs) {
      for (const ls of (lab.labSkills || [])) {
        const domain = ls.skill?.domain?.displayName || 'Unknown';
        if (!domainMap[domain]) domainMap[domain] = { totalRelevance: 0, count: 0 };
        const score = labScores.find((l: Any) => l.id === lab.id)?.score || 50;
        domainMap[domain].totalRelevance += score;
        domainMap[domain].count += 1;
      }
    }

    const domainBreakdown = Object.entries(domainMap)
      .map(([domain, data]) => ({
        domain,
        avgRelevance: Math.round(data.totalRelevance / data.count),
        count: data.count,
      }))
      .sort((a, b) => a.avgRelevance - b.avgRelevance);

    return {
      totalLabs: labs.length,
      totalCourses: courses.length,
      staleLabs,
      staleCourses,
      outdatedLabs,
      outdatedCourses,
      avgLabRelevance,
      avgCourseRelevance,
      avgLabFreshness,
      avgCourseFreshness,
      labsNeedingRefresh: labScores
        .filter((l) => l.score < 60)
        .sort((a, b) => a.score - b.score)
        .slice(0, 10)
        .map((l) => ({ id: l.id, title: l.title, score: l.score, daysSinceUpdate: l.daysSinceUpdate })),
      coursesNeedingRefresh: courseScores
        .filter((c) => c.score < 60)
        .sort((a, b) => a.score - b.score)
        .slice(0, 10)
        .map((c) => ({ id: c.id, title: c.title, score: c.score, daysSinceUpdate: c.daysSinceUpdate })),
      domainBreakdown,
    };
  }

  // ─── REFRESH HISTORY ───────────────────────────────────

  async logRefresh(contentType: string, contentId: string, contentTitle: string, action: string, details: string): Promise<void> {
    try {
      await this.prisma.$queryRawUnsafe(
        `INSERT INTO "ContentRefreshHistory" ("id", "contentType", "contentId", "contentTitle", "action", "details", "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW())`,
        contentType, contentId, contentTitle, action, details,
      );
    } catch (err) {
      this.logger.warn(`Failed to log refresh: ${err}`);
    }
  }

  async getRefreshHistory(limit = 50): Promise<RefreshHistoryEntry[]> {
    try {
      const rows = await this.prisma.$queryRawUnsafe(
        `SELECT * FROM "ContentRefreshHistory" ORDER BY "createdAt" DESC LIMIT $1`,
        limit,
      ) as Any[];
      return rows.map((r: Any) => ({
        id: r.id,
        contentType: r.contentType,
        contentId: r.contentId,
        contentTitle: r.contentTitle,
        action: r.action,
        details: r.details,
        createdAt: r.createdAt,
      }));
    } catch {
      return [];
    }
  }

  // ─── BULK SCORE ALL ────────────────────────────────────

  async scoreAllContent(): Promise<{ labs: ContentRelevanceScore[]; courses: ContentRelevanceScore[] }> {
    const [labIds, courseIds] = await Promise.all([
      this.prisma.lab.findMany({ select: { id: true } }),
      this.prisma.course.findMany({ select: { id: true } }),
    ]);

    const labScores = await Promise.all(labIds.map((l) => this.scoreLabRelevance(l.id)));
    const courseScores = await Promise.all(courseIds.map((c) => this.scoreCourseRelevance(c.id)));

    return { labs: labScores, courses: courseScores };
  }
}
