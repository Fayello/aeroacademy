import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OllamaGateway, AiGatewayFactory, type AiGateway } from './ai.gateway';

type Any = any;

interface StudentContext {
  name: string;
  level: number;
  xp: number;
  domains: Array<{ domain: string; mastery: number }>;
  recentLabs: Array<{
    title: string;
    difficulty: number;
    status: string;
    completions: number;
    avgTime: number;
  }>;
  enrolledCohorts: string[];
  badges: string[];
  skillGaps: Array<{
    domain: string;
    mastery: number;
    labCount: number;
    failureRate: number;
  }>;
}

interface LabCatalogEntry {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  estimatedMinutes: number;
  domain: string;
  skills: string[];
  totalAttempts: number;
  completionRate: number;
  avgTime: number;
  hintUsageRate: number;
}

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);
  private gateway: AiGateway | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly gatewayFactory: AiGatewayFactory,
  ) {}

  async onModuleInit() {
    const ollama = new OllamaGateway();
    this.gatewayFactory.register(ollama);
    this.gateway = await this.gatewayFactory.getAvailableGateway();
    if (this.gateway) {
      this.logger.log(`AI gateway ready: ${this.gateway.name}`);
    } else {
      this.logger.warn('No AI gateway available — AI features disabled');
    }
  }

  // ─── DYNAMIC DATA BUILDERS ─────────────────────────────

  private async getLabCatalog(): Promise<LabCatalogEntry[]> {
    const labs = await this.prisma.lab.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        difficulty: true,
        estimatedMinutes: true,
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
        instances: { select: { id: true, status: true, createdAt: true } },
        flags: {
          select: {
            id: true,
            submissions: { select: { id: true, isCorrect: true } },
          },
        },
      },
    });

    return labs.map((lab): LabCatalogEntry => {
      const totalAttempts = lab.instances.length;
      const completedInstances = lab.instances.filter(
        (i) => (i.status as string) === 'COMPLETED',
      ).length;
      const completionRate =
        totalAttempts > 0
          ? Math.round((completedInstances / totalAttempts) * 100)
          : 0;

      const totalSubmissions = lab.flags.reduce(
        (sum, f) => sum + f.submissions.length,
        0,
      );
      const correctSubmissions = lab.flags.reduce(
        (sum, f) => sum + f.submissions.filter((s) => s.isCorrect).length,
        0,
      );
      const failureRate =
        totalSubmissions > 0
          ? Math.round(
              ((totalSubmissions - correctSubmissions) / totalSubmissions) *
                100,
            )
          : 0;

      const domains = [
        ...new Set(
          lab.labSkills
            .map((ls) => ls.skill.domain?.displayName)
            .filter(Boolean),
        ),
      ];
      const skills = lab.labSkills.map((ls) => ls.skill.displayName);

      return {
        id: lab.id,
        title: lab.title,
        description: lab.description,
        difficulty: lab.difficulty,
        estimatedMinutes: lab.estimatedMinutes || 60,
        domain: domains[0] || 'General',
        skills,
        totalAttempts,
        completionRate,
        avgTime: lab.estimatedMinutes || 60,
        hintUsageRate: failureRate,
      };
    });
  }

  private async getStudentContext(userId: string): Promise<StudentContext> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, xp: true },
    });

    const level = Math.floor((user?.xp || 0) / 1000) + 1;

    const [skillData, labInstances, enrollments, badges, analytics] =
      await Promise.all([
        this.prisma.$queryRawUnsafe(
          `SELECT sd."displayName" as "domain", AVG(us.mastery) as "mastery"
         FROM "UserSkill" us
         JOIN "Skill" s ON s.id = us."skillId"
         JOIN "SkillDomain" sd ON sd.id = s."domainId"
         WHERE us."userId" = $1
         GROUP BY sd."displayName"
         ORDER BY mastery DESC`,
          userId,
        ) as Promise<Any[]>,
        this.prisma.$queryRawUnsafe(
          `SELECT l.title, l.difficulty, li.status, li."createdAt"
         FROM "LabInstance" li
         JOIN "Lab" l ON l.id = li."labId"
         WHERE li."userId" = $1
         ORDER BY li."createdAt" DESC LIMIT 10`,
          userId,
        ) as Promise<Any[]>,
        this.prisma.cohortMember.findMany({
          where: { userId },
          include: { cohort: { select: { name: true } } },
        }),
        this.prisma.$queryRawUnsafe(
          'SELECT b.name FROM "UserBadge" ub JOIN "Badge" b ON b.id = ub."badgeId" WHERE ub."userId" = $1 ORDER BY ub."earnedAt" DESC LIMIT 5',
          userId,
        ) as Promise<Any[]>,
        this.prisma.$queryRawUnsafe(
          `SELECT l.title, la."completionRate", la."avgTimeMinutes", la."hintUsageRate"
         FROM "LabAnalytics" la
         JOIN "Lab" l ON l.id = la."labId"
         ORDER BY la."lastUpdated" DESC LIMIT 5`,
          userId,
        ) as Promise<Any[]>,
      ]);

    const domains = skillData.map((d) => ({
      domain: d.domain,
      mastery: Math.round(d.mastery),
    }));
    const recentLabs = labInstances.map((l) => ({
      title: l.title,
      difficulty: l.difficulty,
      status: l.status,
      completions: 0,
      avgTime: 0,
    }));

    const skillGaps = domains
      .filter((d) => d.mastery < 60)
      .map((d) => ({ ...d, labCount: 0, failureRate: 0 }));

    return {
      name: user?.name || 'Student',
      level,
      xp: user?.xp || 0,
      domains,
      recentLabs,
      enrolledCohorts: enrollments.map((e) => e.cohort.name),
      badges: badges.map((b) => b.name),
      skillGaps,
    };
  }

  private buildLabCatalogPrompt(labs: LabCatalogEntry[]): string {
    const byDomain: Record<string, LabCatalogEntry[]> = {};
    for (const lab of labs) {
      const domain = lab.domain || 'General';
      if (!byDomain[domain]) byDomain[domain] = [];
      byDomain[domain].push(lab);
    }

    const sections = Object.entries(byDomain).map(([domain, entries]) => {
      const lines = entries.map((l) => {
        const skills = l.skills.length > 0 ? ` [${l.skills.join(', ')}]` : '';
        const stats =
          l.totalAttempts > 0
            ? ` (${l.completionRate}% completion, ${l.totalAttempts} attempts)`
            : '';
        return `  - "${l.title}" — difficulty ${l.difficulty}, ~${l.estimatedMinutes}min${skills}${stats}`;
      });
      return `${domain.toUpperCase()} LABS:\n${lines.join('\n')}`;
    });

    return sections.join('\n\n');
  }

  private buildStudentProfile(ctx: StudentContext): string {
    const parts = [
      `Name: ${ctx.name}`,
      `Level: ${ctx.level} | XP: ${ctx.xp.toLocaleString()}`,
    ];

    if (ctx.domains.length > 0) {
      parts.push(
        `Domain mastery: ${ctx.domains.map((d) => `${d.domain} ${d.mastery}%`).join(', ')}`,
      );
    } else {
      parts.push('Domain mastery: No skill data yet');
    }

    if (ctx.recentLabs.length > 0) {
      parts.push(
        `Recent labs: ${ctx.recentLabs.map((l) => `${l.title} (${l.status})`).join(', ')}`,
      );
    } else {
      parts.push('Recent labs: None started');
    }

    if (ctx.enrolledCohorts.length > 0) {
      parts.push(`Cohorts: ${ctx.enrolledCohorts.join(', ')}`);
    }

    if (ctx.badges.length > 0) {
      parts.push(`Badges: ${ctx.badges.join(', ')}`);
    }

    if (ctx.skillGaps.length > 0) {
      parts.push(
        `Weak areas: ${ctx.skillGaps.map((g) => `${g.domain} (${g.mastery}%)`).join(', ')}`,
      );
    }

    return parts.join('\n');
  }

  private async buildSystemPrompt(userId: string): Promise<string> {
    const [labs, studentCtx] = await Promise.all([
      this.getLabCatalog(),
      this.getStudentContext(userId),
    ]);

    const labSection = this.buildLabCatalogPrompt(labs);
    const studentSection = this.buildStudentProfile(studentCtx);

    return `You are the XpertClass Learning Coach. You know the platform inside and out.

PLATFORM:
XpertClass is a hands-on technology competency platform. Students learn by doing real labs on real systems.

AVAILABLE LABS (all run in Docker containers on the platform):

${labSection}

PLATFORM FEATURES:
- Skill Assessments: quick tests to measure competency in specific areas
- Practical Exams: timed, proctored lab exams
- Compete Hub: Challenges, Ranked matches, Seasons, Boss Missions, Battle Pass, Leaderboards
- Teams: create or join teams with invite codes, compete together
- Courses: structured learning paths with modules

IMPORTANT RULES:
- XpertClass DOES have hacking/cybersecurity labs. Always mention specific lab names when students ask.
- When asked about hacking, penetration testing, or cybersecurity, list the specific labs above.
- Never say "we don't have that" or "XpertClass doesn't offer that."
- Be specific: name actual labs, give difficulty levels, suggest where to start.
- Be concise (2-3 sentences max), encouraging, and practical.
- No markdown formatting in your responses.
- If a student is new, suggest the easiest available lab first.
- Reference analytics: mention if a lab has high completion rate (popular) or low completion rate (challenging).

STUDENT PROFILE:
${studentSection}`;
  }

  // ─── LEARNING COACH ────────────────────────────────────

  async learningCoach(
    userId: string,
    message: string,
    history: Array<{ role: string; content: string }> = [],
  ): Promise<{ response: string }> {
    if (!this.gateway) throw new Error('AI service unavailable');

    const systemPrompt = await this.buildSystemPrompt(userId);

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.slice(-6).map((h) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user' as const, content: message },
    ];

    const response = await this.gateway.chat({ messages });
    return { response };
  }

  async learningCoachStream(
    userId: string,
    message: string,
    history: Array<{ role: string; content: string }> = [],
  ): Promise<ReadableStream<Uint8Array>> {
    if (!this.gateway) throw new Error('AI service unavailable');

    const systemPrompt = await this.buildSystemPrompt(userId);

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.slice(-6).map((h) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user' as const, content: message },
    ];

    return this.gateway.chatStream({ messages });
  }

  // ─── SMART RECOMMENDATIONS ─────────────────────────────

  async getSmartRecommendations(userId: string): Promise<Any> {
    if (!this.gateway) return this.getRuleBasedRecommendations(userId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, xp: true, name: true },
    });
    if (!user) return { recommendations: [], summary: 'No user found' };

    const studentCtx = await this.getStudentContext(userId);
    const labs = await this.getLabCatalog();

    const context = `Student: ${studentCtx.name}, Level ${studentCtx.level}, XP: ${studentCtx.xp}
Domains: ${studentCtx.domains.map((d) => `${d.domain}: ${d.mastery}%`).join(', ') || 'No data'}
Recent labs: ${studentCtx.recentLabs.map((l) => l.title).join(', ') || 'None'}
Weak areas: ${studentCtx.skillGaps.map((g) => `${g.domain} (${g.mastery}%)`).join(', ') || 'None'}

Available labs (with analytics):
${labs
  .slice(0, 15)
  .map(
    (l) =>
      `- ${l.title} (${l.difficulty}) [${l.completionRate}% completion, ${l.totalAttempts} attempts]`,
  )
  .join('\n')}`;

    const prompt = `Based on this student profile and available labs with real analytics data, recommend exactly 3 specific next actions.
Prioritize labs where the student has weak domains. Consider completion rates — suggest popular labs (high completion) for encouragement, or challenging labs (low completion) for growth.

${context}

Respond in JSON format only:
[{"title":"...","description":"...","priority":"high|medium|low","type":"lab|course|assessment|practice","labId":"..."}]`;

    try {
      const response = await this.gateway.generate({
        prompt,
        system:
          'You are an AI education advisor. Respond only in valid JSON. Use real lab titles from the available list.',
        format: 'json',
      });

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return { recommendations: JSON.parse(jsonMatch[0]), source: 'ai' };
      }
    } catch {
      this.logger.warn(
        'Failed to parse AI recommendations, falling back to rules',
      );
    }

    return this.getRuleBasedRecommendations(userId);
  }

  private async getRuleBasedRecommendations(userId: string): Promise<Any> {
    const recs: Array<{
      title: string;
      description: string;
      priority: string;
      type: string;
    }> = [];

    const domains = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT sd."displayName" as "domain", AVG(us.mastery) as "mastery"
       FROM "UserSkill" us
       JOIN "Skill" s ON s.id = us."skillId"
       JOIN "SkillDomain" sd ON sd.id = s."domainId"
       WHERE us."userId" = $1
       GROUP BY sd."displayName" ORDER BY mastery ASC`,
      userId,
    );

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true },
    });
    const level = Math.floor((user?.xp || 0) / 1000) + 1;

    if (domains.length === 0) {
      recs.push({
        title: 'Start a Linux Fundamentals Lab',
        description: 'Build your foundation with hands-on Linux practice',
        priority: 'high',
        type: 'lab',
      });
    } else {
      const weakest = domains[0];
      recs.push({
        title: `Improve ${weakest.domain} skills`,
        description: `Your ${weakest.domain} score is ${Math.round(weakest.mastery)}%. Focus on labs in this domain.`,
        priority: 'high',
        type: 'practice',
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
    const students = members.map((m) => {
      const user = m.user;
      const daysSinceActive = user.lastActivityDate
        ? Math.floor(
            (now.getTime() - new Date(user.lastActivityDate).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 999;

      let riskScore = 0;
      const riskFactors: string[] = [];

      if (daysSinceActive > 7) {
        riskScore += 40;
        riskFactors.push(`Inactive for ${daysSinceActive} days`);
      } else if (daysSinceActive > 3) {
        riskScore += 20;
        riskFactors.push(`Low activity (${daysSinceActive} days)`);
      }

      const level = Math.floor(user.xp / 1000) + 1;
      if (level < 3) {
        riskScore += 30;
        riskFactors.push(`Low engagement (Level ${level})`);
      }

      return {
        student: { id: user.id, name: user.name, email: user.email },
        riskScore,
        riskLevel:
          riskScore >= 60 ? 'high' : riskScore >= 30 ? 'medium' : 'low',
        riskFactors,
        daysSinceActive,
        level,
        xp: user.xp,
      };
    });

    const sorted = students.sort((a, b) => b.riskScore - a.riskScore);
    const highRisk = sorted.filter((s) => s.riskLevel === 'high');

    let aiSummary = '';
    if (highRisk.length > 0 && this.gateway) {
      try {
        const prompt = `${highRisk.length} students in cohort "${cohort.name}" are at high risk.
${highRisk.map((s) => `- ${s.student.name}: ${s.riskFactors.join(', ')}`).join('\n')}

Provide 2-3 brief, actionable intervention suggestions for the professor.`;
        aiSummary = await this.gateway.generate({
          prompt,
          system:
            'You are an education analytics advisor. Be brief and actionable.',
        });
      } catch {
        aiSummary =
          'AI summary unavailable. Review high-risk students individually.';
      }
    }

    return {
      cohort: { id: cohort.id, name: cohort.name },
      students: sorted,
      summary: {
        total: students.length,
        highRisk: sorted.filter((s) => s.riskLevel === 'high').length,
        mediumRisk: sorted.filter((s) => s.riskLevel === 'medium').length,
        lowRisk: sorted.filter((s) => s.riskLevel === 'low').length,
      },
      aiSummary,
    };
  }

  // ─── AI CONTENT GENERATORS ───────────────────────────────

  async generateLabBriefing(labId: string): Promise<{
    briefing: string;
    objectives: string[];
    prerequisites: string[];
  }> {
    if (!this.gateway) throw new Error('AI service unavailable');

    const lab = await this.prisma.lab.findUnique({
      where: { id: labId },
      select: {
        title: true,
        description: true,
        dockerImage: true,
        difficulty: true,
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
    });
    if (!lab) throw new Error('Lab not found');

    const domains = [
      ...new Set(
        lab.labSkills.map((ls) => ls.skill.domain?.displayName).filter(Boolean),
      ),
    ];
    const skills = lab.labSkills.map((ls) => ls.skill.displayName);
    const diffLabel =
      lab.difficulty < 1000
        ? 'beginner'
        : lab.difficulty < 1300
          ? 'intermediate'
          : lab.difficulty < 1600
            ? 'advanced'
            : 'expert';

    const prompt = `Generate a professional lab briefing for this hands-on lab:

Title: ${lab.title}
Description: ${lab.description}
Docker Image: ${lab.dockerImage}
Difficulty: ${diffLabel} (ELO ${lab.difficulty})
Domain: ${domains.join(', ') || 'General'}
Skills: ${skills.join(', ') || 'N/A'}

Create a briefing with:
1. A compelling scenario paragraph (3-5 sentences) setting up the real-world context
2. Exactly 3-5 learning objectives (what the student will master)
3. 2-3 prerequisites (what they should know before starting)

Respond in JSON format only:
{"briefing":"...","objectives":["..."],"prerequisites":["..."]}`;

    const response = await this.gateway.generate({
      prompt,
      system:
        'You are a cybersecurity/technology education content writer. Create professional, concise lab briefings. Respond only in valid JSON.',
      format: 'json',
      temperature: 0.7,
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          briefing: parsed.briefing || lab.description,
          objectives: Array.isArray(parsed.objectives) ? parsed.objectives : [],
          prerequisites: Array.isArray(parsed.prerequisites)
            ? parsed.prerequisites
            : [],
        };
      } catch {}
    }

    return { briefing: lab.description, objectives: [], prerequisites: [] };
  }

  async generateAssessmentQuestions(
    assessmentId: string,
    count: number = 5,
  ): Promise<{
    questions: Array<{
      text: string;
      options: Array<{ key: string; text: string }>;
      correctAnswer: string;
      category: string;
    }>;
  }> {
    if (!this.gateway) throw new Error('AI service unavailable');

    const assessment = await this.prisma.skillAssessment.findUnique({
      where: { id: assessmentId },
      select: {
        title: true,
        description: true,
        category: true,
        questions: true,
      },
    });
    if (!assessment) throw new Error('Assessment not found');

    const existingQuestions = ((assessment.questions as Any[]) || [])
      .map((q) => q.text)
      .slice(0, 5);

    const prompt = `Generate ${count} multiple-choice questions for this assessment:

Title: ${assessment.title}
Description: ${assessment.description}
Category: ${assessment.category}
${existingQuestions.length > 0 ? `\nExisting questions (avoid duplicates):\n${existingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}` : ''}

Requirements:
- Each question has exactly 4 options (A, B, C, D)
- Only ONE correct answer per question
- Questions should test understanding, not just recall
- Mix difficulty: some easy, some hard
- Category should be specific (e.g., "SQL Injection", "Buffer Overflow", not just "${assessment.category}")

Respond in JSON format only:
{"questions":[{"text":"...","options":[{"key":"A","text":"..."},{"key":"B","text":"..."},{"key":"C","text":"..."},{"key":"D","text":"..."}],"correctAnswer":"A","category":"..."}]}`;

    const response = await this.gateway.generate({
      prompt,
      system:
        'You are a technology education assessment expert. Create accurate, well-crafted MCQ questions. Respond only in valid JSON.',
      format: 'json',
      temperature: 0.8,
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed.questions)) {
          return { questions: parsed.questions.slice(0, count) };
        }
      } catch {}
    }

    return { questions: [] };
  }

  async generateCourseOutline(courseId: string): Promise<{
    modules: Array<{
      title: string;
      description: string;
      lessons: Array<{ title: string; type: string }>;
    }>;
  }> {
    if (!this.gateway) throw new Error('AI service unavailable');

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        title: true,
        description: true,
        sections: {
          select: { title: true, lessons: { select: { title: true } } },
        },
      },
    });
    if (!course) throw new Error('Course not found');

    const existingModules = (course as Any).sections.map((s: Any) => ({
      title: s.title,
      lessonCount: s.lessons.length,
    }));

    const prompt = `Generate a structured course outline for this course:

Title: ${course.title}
Description: ${course.description}
${existingModules.length > 0 ? `\nExisting modules:\n${existingModules.map((m) => `- ${m.title} (${m.lessonCount} lessons)`).join('\n')}` : '\nThis is a new course — create the full outline from scratch.'}

Create a course outline with 4-6 modules. Each module has 3-5 lessons.
Lessons can be of types: video, reading, lab, quiz, practice.

Requirements:
- Progress from fundamentals to advanced topics
- Include hands-on labs for practical skills
- Each module should build on the previous one
- Module titles should be clear and descriptive

Respond in JSON format only:
{"modules":[{"title":"...","description":"...","lessons":[{"title":"...","type":"lab|video|reading|quiz|practice"}]}]}`;

    const response = await this.gateway.generate({
      prompt,
      system:
        'You are a curriculum design expert for technology education. Create well-structured course outlines. Respond only in valid JSON.',
      format: 'json',
      temperature: 0.7,
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed.modules)) {
          return { modules: parsed.modules };
        }
      } catch {}
    }

    return { modules: [] };
  }

  async calibrateLabDifficulty(labId: string): Promise<Any> {
    const analytics = await this.prisma.labAnalytics.findUnique({
      where: { labId },
    });
    const lab = await this.prisma.lab.findUnique({
      where: { id: labId },
      select: { difficulty: true, title: true },
    });
    if (!lab) throw new Error('Lab not found');

    if (!analytics || analytics.totalAttempts < 5) {
      return {
        labId,
        title: lab.title,
        currentDifficulty: lab.difficulty,
        suggestion: 'insufficient_data',
        message: 'Need at least 5 attempts to calibrate difficulty.',
        newDifficulty: lab.difficulty,
      };
    }

    const completionRate = analytics.completionRate;
    const failureRate = analytics.failureRate;
    const avgTime = analytics.avgTimeMinutes;
    const estimatedMinutes = 60;

    let adjustment = 0;
    const reasons: string[] = [];

    if (completionRate > 85) {
      adjustment -= 50;
      reasons.push(
        `Very high completion rate (${completionRate}%) — lab is too easy`,
      );
    } else if (completionRate > 70) {
      adjustment -= 20;
      reasons.push(
        `High completion rate (${completionRate}%) — slightly too easy`,
      );
    } else if (completionRate < 15) {
      adjustment += 80;
      reasons.push(
        `Very low completion rate (${completionRate}%) — lab is too hard`,
      );
    } else if (completionRate < 30) {
      adjustment += 40;
      reasons.push(
        `Low completion rate (${completionRate}%) — slightly too hard`,
      );
    }

    if (failureRate > 80) {
      adjustment += 30;
      reasons.push(
        `Very high failure rate (${failureRate}%) — questions may be unclear`,
      );
    }
    if (avgTime > estimatedMinutes * 1.5) {
      adjustment += 20;
      reasons.push(
        `Avg time (${avgTime.toFixed(0)}m) exceeds estimate (${estimatedMinutes}m)`,
      );
    } else if (avgTime < estimatedMinutes * 0.4) {
      adjustment -= 20;
      reasons.push(
        `Avg time (${avgTime.toFixed(0)}m) much faster than estimate (${estimatedMinutes}m)`,
      );
    }

    const newDifficulty = Math.max(
      800,
      Math.min(2000, lab.difficulty + adjustment),
    );

    if (newDifficulty !== lab.difficulty) {
      await this.prisma.lab.update({
        where: { id: labId },
        data: { difficulty: newDifficulty },
      });
    }

    return {
      labId,
      title: lab.title,
      currentDifficulty: lab.difficulty,
      newDifficulty,
      adjustment,
      reasons,
      metrics: {
        completionRate,
        failureRate,
        avgTimeMinutes: avgTime,
        totalAttempts: analytics.totalAttempts,
      },
      changed: newDifficulty !== lab.difficulty,
    };
  }

  async calibrateAllLabs(): Promise<Any[]> {
    const labs = await this.prisma.lab.findMany({ select: { id: true } });
    const results: Any[] = [];
    for (const lab of labs) {
      try {
        const result = await this.calibrateLabDifficulty(lab.id);
        results.push(result);
      } catch (err) {
        results.push({ labId: lab.id, error: String(err) });
      }
    }
    return results;
  }

  // ─── LAB ANALYTICS ─────────────────────────────────────

  async getLabAnalytics(): Promise<Any[]> {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(`
      SELECT
        l.id as "labId",
        l.title,
        l.difficulty,
        sd."displayName" as "domainName",
        COUNT(DISTINCT li.id) as "totalAttempts",
        COUNT(DISTINCT CASE WHEN (li.status::text) = 'RUNNING' THEN li.id END) as "completions",
        ROUND(COUNT(DISTINCT CASE WHEN (li.status::text) = 'RUNNING' THEN li.id END)::numeric / NULLIF(COUNT(DISTINCT li.id), 0) * 100, 1) as "completionRate",
        COUNT(DISTINCT ls.id) as "totalSubmissions",
        COUNT(DISTINCT CASE WHEN ls."isCorrect" = true THEN ls.id END) as "correctSubmissions",
        ROUND(COUNT(DISTINCT CASE WHEN ls."isCorrect" = false THEN ls.id END)::numeric / NULLIF(COUNT(DISTINCT ls.id), 0) * 100, 1) as "failureRate",
        COALESCE(la."avgTimeMinutes", 0) as "avgTimeMinutes",
        COALESCE(la."hintUsageRate", 0) as "hintUsageRate",
        la."difficultyELO",
        COALESCE(la."tooEasy", false) as "tooEasy",
        COALESCE(la."tooHard", false) as "tooHard"
      FROM "Lab" l
      LEFT JOIN "LabInstance" li ON li."labId" = l.id
      LEFT JOIN "LabFlag" lf ON lf."labId" = l.id
      LEFT JOIN "LabSubmission" ls ON ls."flagId" = lf.id
      LEFT JOIN "LabSkill" lsk ON lsk."labId" = l.id
      LEFT JOIN "Skill" s ON s.id = lsk."skillId"
      LEFT JOIN "SkillDomain" sd ON sd.id = s."domainId"
      LEFT JOIN "LabAnalytics" la ON la."labId" = l.id
      GROUP BY l.id, l.title, l.difficulty, sd."displayName", la."avgTimeMinutes", la."hintUsageRate", la."difficultyELO", la."tooEasy", la."tooHard"
      ORDER BY "totalAttempts" DESC
    `);
    return rows.map((r: any) => ({
      ...r,
      totalAttempts: Number(r.totalAttempts) || 0,
      completions: Number(r.completions) || 0,
      completionRate: Number(r.completionRate) || 0,
      totalSubmissions: Number(r.totalSubmissions) || 0,
      correctSubmissions: Number(r.correctSubmissions) || 0,
      failureRate: Number(r.failureRate) || 0,
      avgTimeMinutes: Number(r.avgTimeMinutes) || 0,
      hintUsageRate: Number(r.hintUsageRate) || 0,
      stepAnalytics: null,
      weeklyCompletions: null,
      weeklyAttempts: null,
    }));
  }
}
