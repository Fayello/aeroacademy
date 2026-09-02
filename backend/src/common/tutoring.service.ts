import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AiGateway } from './ai.gateway';

type Any = any;

export interface TutorMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface TutorResponse {
  response: string;
  method: 'socratic' | 'direct' | 'hint' | 'encouragement';
  followUpQuestions: string[];
  conceptTags: string[];
}

export interface LabAssistRequest {
  labId: string;
  currentStep?: string;
  errorOutput?: string;
  flagTitle?: string;
  hintLevel: number; // 1=subtle, 2=moderate, 3=explicit
}

export interface LabAssistResponse {
  hint: string;
  approach: string;
  nextSteps: string[];
  relatedConcepts: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface TutoringInteraction {
  id: string;
  userId: string;
  type: 'chat' | 'lab_assist' | 'hint' | 'socratic';
  message: string;
  response: string;
  method: string;
  labId?: string;
  conceptTags: string[];
  createdAt: Date;
}

export interface TutoringAnalytics {
  totalInteractions: number;
  byType: Record<string, number>;
  byMethod: Record<string, number>;
  topConcepts: Array<{ concept: string; count: number }>;
  avgInteractionsPerUser: number;
  uniqueUsers: number;
  labAssistCount: number;
  socraticCount: number;
  hourlyDistribution: Array<{ hour: number; count: number }>;
}

@Injectable()
export class TutoringService {
  private readonly logger = new Logger(TutoringService.name);

  constructor(private readonly prisma: PrismaService) {}

  private get gateway(): AiGateway | undefined {
    return undefined;
  }

  // ─── SOCRATIC TUTORING ─────────────────────────────────

  async socraticTutor(
    userId: string,
    message: string,
    history: Array<{ role: string; content: string }> = [],
    context?: { labId?: string; currentStep?: string; skillDomain?: string },
  ): Promise<TutorResponse> {
    const studentCtx = await this.getStudentContext(userId);

    // Determine if this is a conceptual question or a help request
    const isHelpRequest =
      /\b(help|hint|stuck|don't understand|confused|how do|what is|explain|why|error|fail)\b/i.test(
        message,
      );
    const isConceptual =
      /\b(what|why|how|explain|difference|compare|meaning)\b/i.test(message);

    let method: TutorResponse['method'] = 'direct';
    let systemPrompt = '';

    if (isHelpRequest && context?.labId) {
      // Lab help — use Socratic approach
      method = 'socratic';
      systemPrompt = `You are an expert tutor for the XpertClass platform using the SOCRATIC METHOD.
Instead of giving answers directly, ask guiding questions that lead the student to discover the answer themselves.

Rules:
- Never give the answer directly on the first response
- Ask 1-2 thought-provoking questions that guide thinking
- Reference specific concepts the student should consider
- If they're stuck on a lab, ask about what they've tried and what they observed
- After 2-3 exchanges, if still stuck, provide a moderate hint
- Be encouraging and supportive
- Keep responses under 100 words

Student profile:
Level ${studentCtx.level} | Domains: ${studentCtx.domains.map((d) => `${d.domain}: ${d.mastery}%`).join(', ') || 'No data'}
${context?.labId ? `Current lab context available.` : ''}
${context?.currentStep ? `Working on step: ${context.currentStep}` : ''}`;
    } else if (isConceptual) {
      // Conceptual question — explain clearly but concisely
      method = 'direct';
      systemPrompt = `You are an expert tutor for the XpertClass platform.
Explain concepts clearly and concisely. Use real-world analogies when helpful.
Relate explanations to the student's current skill level and labs.

Student profile:
Level ${studentCtx.level} | Domains: ${studentCtx.domains.map((d) => `${d.domain}: ${d.mastery}%`).join(', ') || 'No data'}
Recent labs: ${studentCtx.recentLabs.map((l) => l.title).join(', ') || 'None'}

Rules:
- Be concise (2-3 sentences max)
- Use plain language, no jargon without explanation
- Relate to their labs when possible
- End with a follow-up question to check understanding`;
    } else {
      // General tutoring
      method = 'encouragement';
      systemPrompt = `You are an expert tutor for the XpertClass platform.
Be encouraging, provide clear guidance, and help students navigate their learning journey.

Student profile:
Level ${studentCtx.level} | XP: ${studentCtx.xp}
Domains: ${studentCtx.domains.map((d) => `${d.domain}: ${d.mastery}%`).join(', ') || 'No data'}
Weak areas: ${studentCtx.skillGaps.map((g) => `${g.domain} (${g.mastery}%)`).join(', ') || 'None'}
Recent labs: ${studentCtx.recentLabs.map((l) => `${l.title} (${l.status})`).join(', ') || 'None'}
Badges: ${studentCtx.badges.join(', ') || 'None'}

Rules:
- Be warm and encouraging
- Reference their actual progress and achievements
- Suggest specific next steps when appropriate
- Keep responses concise (3-4 sentences)`;
    }

    const messages: TutorMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-8).map((h) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user', content: message },
    ];

    // For Socratic mode, also ask follow-up questions
    const followUpPrompt =
      method === 'socratic'
        ? `\n\nAfter your response, add a JSON block with follow-up questions:
{"followUp":["question1","question2"],"concepts":["concept1","concept2"]}`
        : '';

    const response =
      (await this.gateway?.chat({
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content + (m.role === 'system' ? followUpPrompt : ''),
        })),
      })) || 'AI tutor is currently unavailable.';

    let followUpQuestions: string[] = [];
    let conceptTags: string[] = [];

    // Parse follow-up questions from response
    const jsonMatch = response.match(/\{[\s\S]*"followUp"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        followUpQuestions = parsed.followUp || [];
        conceptTags = parsed.concepts || [];
      } catch {}
    }

    // Clean response (remove JSON block if present)
    const cleanResponse = response
      .replace(/\n*\{[\s\S]*"followUp"[\s\S]*\}\s*$/, '')
      .trim();

    // Log interaction
    await this.logInteraction(
      userId,
      'chat',
      message,
      cleanResponse,
      method,
      context?.labId,
      conceptTags,
    );

    return {
      response: cleanResponse,
      method,
      followUpQuestions,
      conceptTags,
    };
  }

  // ─── LAB ASSIST ────────────────────────────────────────

  async labAssist(
    userId: string,
    request: LabAssistRequest,
  ): Promise<LabAssistResponse> {
    const [lab, studentCtx] = await Promise.all([
      this.prisma.lab.findUnique({
        where: { id: request.labId },
        select: {
          title: true,
          description: true,
          briefing: true,
          difficulty: true,
          flags: { select: { title: true, description: true, points: true } },
          labSkills: {
            select: {
              skill: {
                select: {
                  displayName: true,
                  domain: { select: { displayName: true } },
                },
              },
            },
          },
        },
      }),
      this.getStudentContext(userId),
    ]);

    if (!lab) throw new Error('Lab not found');

    const domains = [
      ...new Set(
        lab.labSkills.map((ls) => ls.skill.domain?.displayName).filter(Boolean),
      ),
    ];
    const diffLabel =
      lab.difficulty < 1000
        ? 'beginner'
        : lab.difficulty < 1300
          ? 'intermediate'
          : lab.difficulty < 1600
            ? 'advanced'
            : 'expert';

    const hintLevels = ['vague', 'moderate', 'explicit'];
    const hintLevel = hintLevels[Math.min(request.hintLevel - 1, 2)];

    const prompt = `A student needs help with a lab. Provide a ${hintLevel} hint.

Lab: "${lab.title}" (${diffLabel})
Description: ${lab.description}
Briefing: ${lab.briefing || 'No briefing available'}
Domain: ${domains.join(', ')}
Flags: ${lab.flags.map((f) => f.title).join(', ')}

Student level: ${studentCtx.level}
${request.currentStep ? `Current step: ${request.currentStep}` : ''}
${request.flagTitle ? `Working on flag: ${request.flagTitle}` : ''}
${request.errorOutput ? `Error output:\n${request.errorOutput}` : ''}

Hint level: ${hintLevel} (${request.hintLevel}/3)

Respond in JSON format:
{"hint":"...","approach":"...","nextSteps":["step1","step2"],"relatedConcepts":["concept1"],"difficulty":"easy|medium|hard"}`;

    const response =
      (await this.gateway?.generate({
        prompt,
        system: `You are a lab assistant for XpertClass. Provide helpful hints without giving away the answer.

Hint levels:
- vague (1): Point them in the right direction without specifics
- moderate (2): Give a clearer approach but still let them figure it out
- explicit (3): Tell them exactly what to do

Be encouraging. Reference the student's skill level.`,
        format: 'json',
        temperature: 0.6,
      })) || '{}';

    let result: LabAssistResponse;
    try {
      const parsed = JSON.parse(response);
      result = {
        hint:
          parsed.hint ||
          'Try exploring the lab environment and looking for clues.',
        approach:
          parsed.approach ||
          'Start with reconnaissance and work systematically.',
        nextSteps: parsed.nextSteps || [],
        relatedConcepts: parsed.relatedConcepts || [],
        difficulty: parsed.difficulty || 'medium',
      };
    } catch {
      result = {
        hint: 'Try exploring the lab environment. What services are running? What versions are they?',
        approach:
          'Start with reconnaissance — identify services, versions, and potential attack vectors.',
        nextSteps: [
          'Run nmap or similar scanning tools',
          'Check for known vulnerabilities',
        ],
        relatedConcepts: ['Reconnaissance', 'Service Enumeration'],
        difficulty: 'medium',
      };
    }

    // Log interaction
    await this.logInteraction(
      userId,
      'lab_assist',
      request.currentStep || 'general',
      result.hint,
      `hint_level_${request.hintLevel}`,
      request.labId,
      result.relatedConcepts,
    );

    return result;
  }

  // ─── ADAPTIVE HINTS ────────────────────────────────────

  async getAdaptiveHint(
    userId: string,
    labId: string,
    context: string,
  ): Promise<{ hint: string; level: number; totalLevels: number }> {
    // Check how many hints the student has already requested for this lab
    const previousHints = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*) as count FROM "TutoringInteraction"
       WHERE "userId" = $1 AND "labId" = $2 AND "type" = 'hint'`,
      userId,
      labId,
    );

    const hintCount = Number(previousHints[0]?.count || 0);
    const level = Math.min(hintCount + 1, 3);

    const levels = [
      'vague — just a nudge in the right direction',
      'moderate — a clearer approach',
      'explicit — step-by-step instructions',
    ];

    const prompt = `Student needs a hint (level ${level}/3: ${levels[level - 1]}) for a lab.

Context: ${context}
Previous hints given: ${hintCount}

Provide a ${levels[level - 1].split('—')[0].trim()} hint.`;

    const response =
      (await this.gateway?.generate({
        prompt,
        system:
          'You are a helpful lab tutor. Give concise, encouraging hints. Never give the full answer on level 1.',
        temperature: 0.5,
      })) || 'Try exploring the environment more carefully.';

    await this.logInteraction(
      userId,
      'hint',
      context,
      response,
      `level_${level}`,
      labId,
      [],
    );

    return { hint: response, level, totalLevels: 3 };
  }

  // ─── CONCEPT EXPLAINER ─────────────────────────────────

  async explainConcept(
    userId: string,
    concept: string,
    relatedLab?: string,
  ): Promise<{
    explanation: string;
    examples: string[];
    practiceSuggestions: string[];
  }> {
    const studentCtx = await this.getStudentContext(userId);

    const prompt = `Explain the concept "${concept}" to a Level ${studentCtx.level} student.
${relatedLab ? `This is related to the lab "${relatedLab}".` : ''}
Their weak areas: ${studentCtx.skillGaps.map((g) => g.domain).join(', ') || 'None'}

Provide:
1. A clear, concise explanation (3-4 sentences)
2. 2 real-world examples
3. 1-2 practice suggestions (specific labs or exercises)`;

    const response =
      (await this.gateway?.generate({
        prompt,
        system:
          'You are a technology education expert. Explain concepts clearly with practical examples. Be concise.',
        temperature: 0.6,
      })) || 'Concept explanation unavailable.';

    // Parse response
    const lines = response.split('\n').filter(Boolean);
    const explanation = lines.slice(0, 4).join(' ');
    const examples = lines
      .filter((l) => l.startsWith('-') || l.startsWith('*'))
      .slice(0, 2)
      .map((l) => l.replace(/^[-*]\s*/, ''));
    const practiceSuggestions = lines
      .filter((l) => /practice|try|exercise|lab/i.test(l))
      .slice(0, 2);

    await this.logInteraction(
      userId,
      'chat',
      `Explain: ${concept}`,
      explanation,
      'direct',
      relatedLab,
      [concept],
    );

    return {
      explanation,
      examples:
        examples.length > 0
          ? examples
          : [
              `Using ${concept} in a real scenario`,
              `Practical application of ${concept}`,
            ],
      practiceSuggestions:
        practiceSuggestions.length > 0
          ? practiceSuggestions
          : ['Try a lab that uses this concept'],
    };
  }

  // ─── TUTORING ANALYTICS ────────────────────────────────

  async getTutoringAnalytics(cohortId?: string): Promise<TutoringAnalytics> {
    let interactions: Any[];

    if (cohortId) {
      // Get users in cohort first, then filter
      const cohortUserIds = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT "userId" FROM "CohortMember" WHERE "cohortId" = $1`,
        cohortId,
      );
      const userIds = cohortUserIds.map((u: Any) => u.userId);
      interactions =
        userIds.length > 0
          ? ((await this.prisma.tutoringInteraction.findMany({
              where: { userId: { in: userIds } },
              select: {
                id: true,
                userId: true,
                type: true,
                method: true,
                message: true,
                response: true,
                labId: true,
                conceptTags: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'desc' },
            })) as Any[])
          : [];
    } else {
      interactions = (await this.prisma.tutoringInteraction.findMany({
        select: {
          id: true,
          userId: true,
          type: true,
          method: true,
          message: true,
          response: true,
          labId: true,
          conceptTags: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      })) as Any[];
    }

    const byType: Record<string, number> = {};
    const byMethod: Record<string, number> = {};
    const conceptCounts: Record<string, number> = {};
    const hourlyCounts: Record<number, number> = {};
    const uniqueUsers = new Set<string>();

    for (const i of interactions) {
      byType[i.type] = (byType[i.type] || 0) + 1;
      byMethod[i.method] = (byMethod[i.method] || 0) + 1;
      uniqueUsers.add(i.userId);

      const tags = i.conceptTags as string[];
      if (Array.isArray(tags)) {
        for (const tag of tags) {
          conceptCounts[tag] = (conceptCounts[tag] || 0) + 1;
        }
      }

      const hour = new Date(i.createdAt).getHours();
      hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
    }

    const topConcepts = Object.entries(conceptCounts)
      .map(([concept, count]) => ({ concept, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: hourlyCounts[hour] || 0,
    }));

    return {
      totalInteractions: interactions.length,
      byType,
      byMethod,
      topConcepts,
      avgInteractionsPerUser:
        uniqueUsers.size > 0
          ? Math.round((interactions.length / uniqueUsers.size) * 10) / 10
          : 0,
      uniqueUsers: uniqueUsers.size,
      labAssistCount: byType['lab_assist'] || 0,
      socraticCount: byMethod['socratic'] || 0,
      hourlyDistribution,
    };
  }

  // ─── HELPERS ───────────────────────────────────────────

  private async getStudentContext(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, xp: true },
    });

    const level = Math.floor((user?.xp || 0) / 1000) + 1;

    const [skillData, labInstances, badges] = await Promise.all([
      this.prisma.$queryRawUnsafe(
        `SELECT sd."displayName" as "domain", AVG(us.mastery) as "mastery"
         FROM "UserSkill" us
         JOIN "Skill" s ON s.id = us."skillId"
         JOIN "SkillDomain" sd ON sd.id = s."domainId"
         WHERE us."userId" = $1
         GROUP BY sd."displayName" ORDER BY mastery DESC`,
        userId,
      ) as unknown as Any[],
      this.prisma.$queryRawUnsafe(
        `SELECT l.title, l.difficulty, li.status
         FROM "LabInstance" li
         JOIN "Lab" l ON l.id = li."labId"
         WHERE li."userId" = $1
         ORDER BY li."createdAt" DESC LIMIT 5`,
        userId,
      ) as unknown as Any[],
      this.prisma.$queryRawUnsafe(
        'SELECT b.name FROM "UserBadge" ub JOIN "Badge" b ON b.id = ub."badgeId" WHERE ub."userId" = $1 ORDER BY ub."earnedAt" DESC LIMIT 5',
        userId,
      ) as unknown as Any[],
    ]);

    const domains = skillData.map((d) => ({
      domain: d.domain,
      mastery: Math.round(d.mastery),
    }));
    const skillGaps = domains.filter((d) => d.mastery < 60);

    return {
      name: user?.name || 'Student',
      level,
      xp: user?.xp || 0,
      domains,
      recentLabs: labInstances.map((l) => ({
        title: l.title,
        difficulty: l.difficulty,
        status: l.status,
      })),
      badges: badges.map((b) => b.name),
      skillGaps,
    };
  }

  private async logInteraction(
    userId: string,
    type: string,
    message: string,
    response: string,
    method: string,
    labId?: string,
    conceptTags?: string[],
  ): Promise<void> {
    try {
      await this.prisma.tutoringInteraction.create({
        data: {
          userId,
          type,
          message,
          response,
          method,
          labId: labId || null,
          conceptTags: conceptTags || [],
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to log tutoring interaction: ${err}`);
    }
  }
}
