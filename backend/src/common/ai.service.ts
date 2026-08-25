import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type Any = any;

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://5.189.182.196:11434';
const MODEL = 'llama3.2';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async ollamaGenerate(prompt: string, system?: string): Promise<string> {
    const body: Any = {
      model: MODEL,
      prompt,
      stream: false,
    };
    if (system) body.system = system;

    const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90000),
    });

    if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
    const data = await res.json() as Any;
    return data.response || '';
  }

  private async ollamaChat(messages: Array<{ role: string; content: string }>): Promise<string> {
    const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages,
        stream: false,
      }),
      signal: AbortSignal.timeout(90000),
    });

    if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
    const data = await res.json() as Any;
    return data.message?.content || '';
  }

  // ─── LEARNING COACH ────────────────────────────────────

  async learningCoach(userId: string, message: string, history: Array<{ role: string; content: string }> = []): Promise<{ response: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, xp: true },
    });

    const level = Math.floor((user?.xp || 0) / 1000) + 1;

    const systemPrompt = `You are a helpful learning coach for XpertClass, a technology competency platform.
The student is level ${level} with ${(user?.xp || 0).toLocaleString()} XP.
You help with: understanding concepts, recommending next steps, explaining errors, and study tips.
Be concise, encouraging, and practical. Max 2 sentences.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6),
      { role: 'user', content: message },
    ];

    const response = await this.ollamaChat(messages);
    return { response };
  }

  // ─── SMART RECOMMENDATIONS ─────────────────────────────

  async getSmartRecommendations(userId: string): Promise<Any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, xp: true, name: true },
    });
    if (!user) return { recommendations: [], summary: 'No user found' };

    const level = Math.floor(user.xp / 1000) + 1;

    // Gather context: competency, labs, recent activity
    const [competency, labs, enrollments, badges] = await Promise.all([
      this.prisma.$queryRawUnsafe(
        `SELECT sd."displayName" as "domainName", AVG(us.mastery) as score
         FROM "UserSkill" us
         JOIN "Skill" s ON s.id = us."skillId"
         JOIN "SkillDomain" sd ON sd.id = s."domainId"
         WHERE us."userId" = $1
         GROUP BY sd."displayName"
         ORDER BY score DESC`,
        userId,
      ) as Promise<Any[]>,
      this.prisma.$queryRawUnsafe(
        'SELECT l.title, l.difficulty, l."domainId" FROM "LabInstance" li JOIN "Lab" l ON l.id = li."labId" WHERE li."userId" = $1 ORDER BY li."createdAt" DESC LIMIT 5',
        userId,
      ) as Promise<Any[]>,
      this.prisma.cohortMember.findMany({
        where: { userId },
        include: { cohort: { include: { curriculum: true, members: true } } },
      }),
      this.prisma.$queryRawUnsafe(
        'SELECT b.name, ub."earnedAt" FROM "UserBadge" ub JOIN "Badge" b ON b.id = ub."badgeId" WHERE ub."userId" = $1 ORDER BY ub."earnedAt" DESC LIMIT 5',
        userId,
      ) as Promise<Any[]>,
    ]);

    const context = `Student: ${user.name || 'Unknown'}, Level ${level}, XP: ${user.xp}
Domains: ${competency.map((d: Any) => `${d.domainName}: ${Math.round(d.score)}%`).join(', ') || 'No data'}
Recent labs: ${labs.map((l: Any) => l.title).join(', ') || 'None'}
Cohorts: ${enrollments.map((e: Any) => e.cohort.name).join(', ') || 'None'}
Badges: ${badges.map((b: Any) => b.name).join(', ') || 'None'}`;

    const prompt = `Based on this student profile, recommend exactly 3 specific next actions.
Each recommendation should be actionable and specific to their level.

${context}

Respond in JSON format only:
[{"title":"...","description":"...","priority":"high|medium|low","type":"lab|course|assessment|practice"}]`;

    const response = await this.ollamaGenerate(prompt, 'You are an AI education advisor. Respond only in valid JSON.');

    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return { recommendations: JSON.parse(jsonMatch[0]), source: 'ai' };
      }
    } catch {
      this.logger.warn('Failed to parse AI recommendations, falling back to rules');
    }

    // Fallback to rule-based recommendations
    return this.getRuleBasedRecommendations(userId, level, competency, labs);
  }

  private getRuleBasedRecommendations(userId: string, level: number, domains: Any[], labs: Any[]): Any {
    const recs: Array<{ title: string; description: string; priority: string; type: string }> = [];

    if (domains.length === 0) {
      recs.push({
        title: 'Start a Linux Fundamentals Lab',
        description: 'Build your foundation with hands-on Linux practice',
        priority: 'high',
        type: 'lab',
      });
    } else {
      const weakest = domains.reduce((min: Any, d: Any) => d.score < min.score ? d : min, domains[0]);
      recs.push({
        title: `Improve ${weakest.domainName} skills`,
        description: `Your ${weakest.domainName} score is ${Math.round(weakest.score)}%. Focus on labs in this domain.`,
        priority: 'high',
        type: 'practice',
      });
    }

    if (labs.length === 0) {
      recs.push({
        title: 'Complete your first lab',
        description: 'Labs are the core of learning at XpertClass',
        priority: 'high',
        type: 'lab',
      });
    }

    if (level < 5) {
      recs.push({
        title: 'Take a skill assessment',
        description: 'Discover your strengths and weaknesses across domains',
        priority: 'medium',
        type: 'assessment',
      });
    }

    return { recommendations: recs.slice(0, 3), source: 'rules' };
  }

  // ─── AT-RISK ANALYSIS ──────────────────────────────────

  async getAtRiskStudents(cohortId: string): Promise<Any> {
    const cohort = await this.prisma.cohort.findUnique({
      where: { id: cohortId },
    });

    if (!cohort) return { students: [] };

    const members = await this.prisma.cohortMember.findMany({
      where: { cohortId, role: 'STUDENT' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            xp: true,
            lastActivityDate: true,
          },
        },
      },
    });

    const now = new Date();
    const students = members.map((m: Any) => {
      const user = m.user;
      const daysSinceActive = user.lastActivityDate
        ? Math.floor((now.getTime() - new Date(user.lastActivityDate).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      let riskScore = 0;
      const riskFactors: string[] = [];

      if (daysSinceActive > 7) {
        riskScore += 40;
        riskFactors.push(`Inactive for ${daysSinceActive} days`);
      } else if (daysSinceActive > 3) {
        riskScore += 20;
        riskFactors.push(`Low activity (${daysSinceActive} days since last visit)`);
      }

      const level = Math.floor(user.xp / 1000) + 1;
      if (level < 3) {
        riskScore += 30;
        riskFactors.push(`Low engagement (Level ${level}, ${user.xp} XP)`);
      }

      const riskLevel = riskScore >= 60 ? 'high' : riskScore >= 30 ? 'medium' : 'low';

      return {
        student: { id: user.id, name: user.name, email: user.email },
        riskScore,
        riskLevel,
        riskFactors,
        daysSinceActive,
        level,
        xp: user.xp,
      };
    });

    const sorted = students.sort((a: Any, b: Any) => b.riskScore - a.riskScore);

    // Generate AI summary for high-risk students
    const highRisk = sorted.filter((s: Any) => s.riskLevel === 'high');
    let aiSummary = '';

    if (highRisk.length > 0) {
      try {
        const prompt = `${highRisk.length} students in cohort "${cohort.name}" are at high risk.
${highRisk.map((s: Any) => `- ${s.student.name}: ${s.riskFactors.join(', ')}`).join('\n')}

Provide 2-3 brief, actionable intervention suggestions for the professor.`;
        aiSummary = await this.ollamaGenerate(prompt, 'You are an education analytics advisor. Be brief and actionable.');
      } catch {
        aiSummary = 'AI summary unavailable. Review high-risk students individually.';
      }
    }

    return {
      cohort: { id: cohort.id, name: cohort.name },
      students: sorted,
      summary: {
        total: students.length,
        highRisk: sorted.filter((s: Any) => s.riskLevel === 'high').length,
        mediumRisk: sorted.filter((s: Any) => s.riskLevel === 'medium').length,
        lowRisk: sorted.filter((s: Any) => s.riskLevel === 'low').length,
      },
      aiSummary,
    };
  }
}
