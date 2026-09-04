import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AiGatewayFactory, type AiGateway } from './ai.gateway';

const logger = new Logger('Personalization');

type OnboardingSelections = {
  purpose?: string[];
  field?: string[];
  role?: string;
  experience?: string;
  skills?: string[];
  jobInterests?: string[];
};

const TERM_ALIASES: Record<string, string[]> = {
  security: [
    'security',
    'cybersecurity',
    'soc',
    'threat',
    'blue team',
    'defense',
    'defensive',
    'siem',
    'incident',
    'forensic',
    'malware',
    'vulnerability',
    'penetration',
    'pentest',
    'red team',
    'attack',
  ],
  cybersecurity: [
    'cybersecurity',
    'security',
    'defensive security',
    'offensive security',
    'infosec',
    'information security',
  ],
  appsec: [
    'appsec',
    'application security',
    'web security',
    'api security',
    'owasp',
    'xss',
    'ssrf',
    'sql injection',
    'code review',
    'secure coding',
  ],
  devops: ['devops', 'platform', 'automation', 'infrastructure', 'sre', 'reliability', 'monitoring', 'observability'],
  devsecops: ['devsecops', 'secure pipeline', 'sast', 'dast', 'supply chain', 'security scanning', 'shift left'],
  cloud: ['cloud', 'aws', 'azure', 'gcp', 'terraform', 'iam', 'serverless', 'lambda', 'ec2', 's3', 'kubernetes', 'infrastructure as code'],
  containers: [
    'containers',
    'container',
    'docker',
    'kubernetes',
    'k8s',
    'helm',
    'podman',
    'containerization',
  ],
  cicd: ['cicd', 'ci/cd', 'pipeline', 'github actions', 'gitlab', 'jenkins', 'automation', 'deployment'],
  networking: ['networking', 'network', 'routing', 'firewall', 'dns', 'vpn', 'tcp', 'http', 'load balancer', 'proxy', 'switch', 'router'],
  systems: ['systems', 'linux', 'sysadmin', 'infrastructure', 'kernel', 'systemd', 'bash', 'shell'],
  software: ['software', 'engineering', 'backend', 'frontend', 'api', 'architecture', 'microservices', 'database'],
  web: ['web', 'frontend', 'backend', 'browser', 'react', 'node', 'javascript', 'typescript', 'html', 'css', 'http', 'rest', 'graphql'],
  mobile: ['mobile', 'android', 'ios', 'apk', 'react native', 'flutter', 'swift', 'kotlin'],
  data: ['data', 'analytics', 'sql', 'warehouse', 'etl', 'business intelligence', 'reporting', 'visualization'],
  'data-eng': [
    'data engineering',
    'etl',
    'warehouse',
    'pipeline',
    'postgres',
    'mongo',
    'redis',
    'elasticsearch',
    'kafka',
    'spark',
  ],
  ai: [
    'ai',
    'artificial intelligence',
    'machine learning',
    'ml',
    'deep learning',
    'neural network',
    'llm',
    'large language model',
    'nlp',
    'natural language processing',
    'computer vision',
    'vision',
    'generative ai',
    'gen ai',
    'transformer',
    'gpt',
    'bert',
    'training',
    'inference',
    'model',
    'prediction',
    'classification',
    'regression',
    'reinforcement learning',
    'data science',
  ],
  'ml-ops': [
    'mlops',
    'ml ops',
    'model serving',
    'vector',
    'qdrant',
    'kubeflow',
    'feast',
    'feature store',
    'model deployment',
    'model monitoring',
    'ml pipeline',
  ],
  design: [
    'design',
    'ux',
    'ui',
    'figma',
    'research',
    'user experience',
    'user interface',
    'wireframe',
    'prototype',
    'usability',
    'accessibility',
    'interaction design',
    'visual design',
    'design system',
  ],
  databases: ['database', 'sql', 'postgres', 'postgresql', 'mysql', 'mariadb', 'mongo', 'mongodb', 'redis', 'elasticsearch', 'cassandra', 'oracle', 'database design', 'query optimization'],
  penetration: ['penetration testing', 'pentest', 'ethical hacking', 'exploit', 'vulnerability scanning', 'reconnaissance', 'privilege escalation', 'lateral movement'],
  forensics: ['forensic', 'digital forensic', 'incident response', 'malware analysis', 'reverse engineering', 'memory forensic', 'disk forensic', 'log analysis'],
  cloudsecurity: ['cloud security', 'cloud posture', 'cspm', 'cwpp', 'cloud compliance', 'identity management', 'access control'],
  cryptography: ['cryptography', 'encryption', 'certificate', 'pki', 'hashing', 'tls', 'ssl', 'key management'],
};

type RecommendationCourse = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
};

type RecommendationPath = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  careerRole: string | null;
};

type RecommendationLab = {
  id: string;
  title: string;
  description: string;
  difficulty: number;
};

type RecommendationInsights = {
  weakDomains: string[];
  level: number;
  streak: number;
  focusAreas: string[];
  journeySummary?: string;
  personalizationMode?: 'ai' | 'rules';
};

@Injectable()
export class PersonalizationService {
  constructor(
    private prisma: PrismaService,
    private readonly gatewayFactory: AiGatewayFactory,
  ) {}

  private buildLabInterestWhere(
    tokens: string[],
  ): Prisma.LabWhereInput | undefined {
    if (!tokens.length) return undefined;
    const meaningful = tokens.filter((t) => t.length > 2);
    if (!meaningful.length) return undefined;
    const conditions = meaningful.flatMap((token) => [
      { title: { contains: token, mode: 'insensitive' as const } },
      { description: { contains: token, mode: 'insensitive' as const } },
    ]);
    return { OR: conditions };
  }

  private buildCourseInterestWhere(
    tokens: string[],
  ): Prisma.CourseWhereInput | undefined {
    if (!tokens.length) return undefined;
    const meaningful = tokens.filter((t) => t.length > 2);
    if (!meaningful.length) return undefined;
    const conditions = meaningful.flatMap((token) => [
      { title: { contains: token, mode: 'insensitive' as const } },
      { description: { contains: token, mode: 'insensitive' as const } },
    ]);
    return { OR: conditions };
  }

  private buildPathInterestWhere(
    tokens: string[],
  ): Prisma.LearningPathWhereInput | undefined {
    if (!tokens.length) return undefined;
    const meaningful = tokens.filter((t) => t.length > 2);
    if (!meaningful.length) return undefined;
    const conditions = meaningful.flatMap((token) => [
      { title: { contains: token, mode: 'insensitive' as const } },
      { description: { contains: token, mode: 'insensitive' as const } },
      { careerRole: { contains: token, mode: 'insensitive' as const } },
    ]);
    return { OR: conditions };
  }

  private async fetchLabCandidates(
    interestTokens: string[],
    preferredDifficulty: string | null,
    limit: number,
  ) {
    const targetCount = Math.max(limit * 8, 24);
    const interestWhere = this.buildLabInterestWhere(interestTokens);

    let candidates: Awaited<ReturnType<typeof this.fetchLabPool>> = [];

    if (interestWhere) {
      candidates = await this.fetchLabPool(interestWhere, targetCount);
    }

    if (candidates.length < targetCount) {
      const remaining = targetCount - candidates.length;
      const existingIds = new Set(candidates.map((c) => c.id));
      const filler = await this.fetchLabPool({}, remaining);
      for (const lab of filler) {
        if (!existingIds.has(lab.id)) {
          candidates.push(lab);
          existingIds.add(lab.id);
        }
      }
    }

    return candidates;
  }

  private async fetchLabPool(
    where: Prisma.LabWhereInput,
    take: number,
  ) {
    return this.prisma.lab.findMany({
      where,
      take,
      select: {
        id: true,
        title: true,
        description: true,
        difficulty: true,
        labSkills: {
          select: {
            skill: {
              select: {
                name: true,
                domain: { select: { name: true, displayName: true } },
              },
            },
          },
        },
      },
    });
  }

  private async fetchCourseCandidates(
    interestTokens: string[],
    enrolledCourseIds: Set<string>,
    preferredDifficulty: string | null,
    limit: number,
  ) {
    const targetCount = Math.max(limit * 8, 24);
    const interestWhere = this.buildCourseInterestWhere(interestTokens);

    let candidates: Awaited<ReturnType<typeof this.fetchCoursePool>> = [];

    if (interestWhere) {
      candidates = await this.fetchCoursePool(
        { ...interestWhere, id: { notIn: [...enrolledCourseIds] } },
        targetCount,
      );
    }

    if (candidates.length < targetCount) {
      const remaining = targetCount - candidates.length;
      const existingIds = new Set(candidates.map((c) => c.id));
      const filler = await this.fetchCoursePool(
        { id: { notIn: [...enrolledCourseIds] } },
        remaining,
      );
      for (const course of filler) {
        if (!existingIds.has(course.id)) {
          candidates.push(course);
          existingIds.add(course.id);
        }
      }
    }

    return candidates;
  }

  private async fetchCoursePool(
    where: Prisma.CourseWhereInput,
    take: number,
  ) {
    return this.prisma.course.findMany({
      where,
      take,
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        sections: {
          select: {
            title: true,
            lessons: {
              select: {
                title: true,
                lab: {
                  select: {
                    title: true,
                    description: true,
                    difficulty: true,
                    labSkills: {
                      select: {
                        skill: {
                          select: {
                            name: true,
                            domain: {
                              select: { name: true, displayName: true },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  private async fetchPathCandidates(
    interestTokens: string[],
    difficulty: string,
    limit: number,
  ) {
    const targetCount = Math.max(limit * 4, 12);
    const interestWhere = this.buildPathInterestWhere(interestTokens);

    let candidates: Awaited<ReturnType<typeof this.fetchPathPool>> = [];

    if (interestWhere) {
      candidates = await this.fetchPathPool(
        { ...interestWhere, difficulty },
        targetCount,
      );
    }

    if (candidates.length < targetCount) {
      const remaining = targetCount - candidates.length;
      const existingIds = new Set(candidates.map((c) => c.id));
      const filler = await this.fetchPathPool({ difficulty }, remaining);
      for (const path of filler) {
        if (!existingIds.has(path.id)) {
          candidates.push(path);
          existingIds.add(path.id);
        }
      }
    }

    return candidates;
  }

  private async fetchPathPool(
    where: Prisma.LearningPathWhereInput,
    take: number,
  ) {
    return this.prisma.learningPath.findMany({
      where,
      take,
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        careerRole: true,
      },
    });
  }

  async getRecommendations(userId: string, limit = 5) {
    const [user, userSkills, enrollments, recentProgress] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          xp: true,
          currentStreak: true,
          preference: {
            select: {
              interests: true,
              weakSkills: true,
              preferredDifficulty: true,
              onboardingSelections: true,
            },
          },
        },
      }),
      this.prisma.userSkill.findMany({
        where: { userId },
        include: { skill: { include: { domain: true } } },
        orderBy: { xp: 'asc' },
      }),
      this.prisma.courseEnrollment.findMany({
        where: { userId },
        select: { courseId: true },
      }),
      this.prisma.progress.findMany({
        where: { userId, completed: true },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        include: {
          lesson: { include: { section: { include: { course: true } } } },
        },
      }),
    ]);

    const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));
    const weakSkillDomains = userSkills
      .filter((us) => us.xp < 200)
      .map((us) => us.skill.domain.displayName || us.skill.domain.name);
    const onboarding = normalizeOnboardingSelections(
      user?.preference?.onboardingSelections,
    );
    const interestTokens = buildInterestTokens({
      interests: user?.preference?.interests || [],
      weakSkills: user?.preference?.weakSkills || [],
      onboarding,
      weakSkillDomains,
    });
    const rankedWeakDomains = uniqueStrings([
      ...weakSkillDomains,
      ...(user?.preference?.weakSkills || []),
      ...onboarding.field,
      ...onboarding.skills,
    ]);

    const level = user ? Math.floor(user.xp / 1000) + 1 : 1;

    const courseCandidates = await this.fetchCourseCandidates(
      interestTokens,
      enrolledCourseIds,
      user?.preference?.preferredDifficulty || null,
      limit,
    );

    const skillBasedCourses = courseCandidates
      .map((course) => {
        const lessonText = course.sections
          .flatMap((section) => [
            section.title,
            ...section.lessons.flatMap((lesson) => [
              lesson.title,
              lesson.lab?.title || '',
              lesson.lab?.description || '',
              ...(lesson.lab?.labSkills || []).flatMap((labSkill) => [
                labSkill.skill.name,
                labSkill.skill.domain.displayName || labSkill.skill.domain.name,
              ]),
            ]),
          ])
          .join(' ');
        const haystack = `${course.title} ${course.description} ${lessonText}`;
        const difficultyHint = averageCourseDifficulty(course.sections);
        return {
          id: course.id,
          title: course.title,
          description: course.description,
          imageUrl: course.imageUrl,
          score:
            scoreAgainstTokens(haystack, interestTokens) +
            scoreDifficultyPreference(
              difficultyHint,
              user?.preference?.preferredDifficulty || null,
            ) +
            scoreRecencyBoost(
              course.id,
              recentProgress.map((item) => item.lesson.section.courseId),
            ),
        };
      })
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, limit)
      .map(({ id, title, description, imageUrl }) => ({
        id,
        title,
        description,
        imageUrl,
      }));

    // 2. Recommended learning paths based on level
    const difficulty =
      level < 5 ? 'BEGINNER' : level < 15 ? 'INTERMEDIATE' : 'ADVANCED';
    const pathCandidates = await this.fetchPathCandidates(
      interestTokens,
      difficulty,
      limit,
    );
    const recommendedPaths = pathCandidates
      .map((path) => ({
        ...path,
        score: scoreAgainstTokens(
          `${path.title} ${path.description} ${path.careerRole || ''}`,
          interestTokens,
        ),
      }))
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, 3)
      .map(({ score, ...path }) => path);

    const labCandidates = await this.fetchLabCandidates(
      interestTokens,
      user?.preference?.preferredDifficulty || null,
      limit,
    );
    const suggestedLabs = labCandidates
      .map((lab) => {
        const relatedSkills = lab.labSkills.flatMap((labSkill) => [
          labSkill.skill.name,
          labSkill.skill.domain.displayName || labSkill.skill.domain.name,
        ]);
        const haystack = `${lab.title} ${lab.description} ${relatedSkills.join(' ')}`;
        return {
          id: lab.id,
          title: lab.title,
          description: lab.description,
          difficulty: lab.difficulty,
          score:
            scoreAgainstTokens(haystack, interestTokens) +
            scoreDifficultyPreference(
              lab.difficulty,
              user?.preference?.preferredDifficulty || null,
            ),
        };
      })
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.difficulty - b.difficulty ||
          a.title.localeCompare(b.title),
      )
      .slice(0, 3)
      .map(({ score, ...lab }) => lab);

    // 4. "Users like you" — similar XP range
    const xpRange = user
      ? { gte: Math.max(0, user.xp - 500), lte: user.xp + 500 }
      : { gte: 0, lte: 1000 };
    const similarUsers = await this.prisma.user.findMany({
      where: { xp: xpRange, id: { not: userId }, role: 'STUDENT' },
      take: 5,
      select: { id: true, name: true, username: true, xp: true },
    });

    const baseResponse: {
      courses: RecommendationCourse[];
      learningPaths: RecommendationPath[];
      labs: RecommendationLab[];
      similarUsers: Array<{
        id: string;
        name: string | null;
        username: string | null;
        xp: number;
      }>;
      insights: RecommendationInsights;
      source: 'ai' | 'rules';
    } = {
      courses: skillBasedCourses,
      learningPaths: recommendedPaths,
      labs: suggestedLabs,
      similarUsers,
      insights: {
        weakDomains: rankedWeakDomains.slice(0, 3),
        level,
        streak: user?.currentStreak || 0,
        focusAreas: interestTokens.slice(0, 6),
        journeySummary: buildRuleJourneySummary({
          level,
          streak: user?.currentStreak || 0,
          focusAreas: interestTokens.slice(0, 6),
          weakDomains: rankedWeakDomains.slice(0, 3),
          courseCount: skillBasedCourses.length,
          labCount: suggestedLabs.length,
        }),
        personalizationMode: 'rules',
      },
      source: 'rules',
    };

    const gateway = await this.getAvailableGateway();
    if (!gateway) {
      return baseResponse;
    }

    try {
      const aiResponse = await this.getAiRefinedRecommendations({
        gateway,
        profile: {
          level,
          streak: user?.currentStreak || 0,
          focusAreas: interestTokens.slice(0, 8),
          weakDomains: rankedWeakDomains.slice(0, 5),
          onboarding,
          recentCourseIds: recentProgress.map(
            (item) => item.lesson.section.courseId,
          ),
          recentLessonTitles: uniqueStrings(
            recentProgress.map((item) => item.lesson.title).filter(isString),
          ),
          enrolledCourseIds: [...enrolledCourseIds],
        },
        candidates: {
          courses: skillBasedCourses,
          learningPaths: recommendedPaths,
          labs: suggestedLabs,
        },
      });

      if (!aiResponse) {
        return baseResponse;
      }

      return {
        ...baseResponse,
        courses: reorderByIds(skillBasedCourses, aiResponse.courseIds),
        learningPaths: reorderByIds(recommendedPaths, aiResponse.pathIds),
        labs: reorderByIds(suggestedLabs, aiResponse.labIds),
        insights: {
          ...baseResponse.insights,
          journeySummary:
            aiResponse.journeySummary || baseResponse.insights.journeySummary,
          focusAreas:
            aiResponse.focusAreas.length > 0
              ? aiResponse.focusAreas
              : baseResponse.insights.focusAreas,
          personalizationMode: 'ai',
        },
        source: 'ai',
      };
    } catch (error) {
      logger.warn(
        `AI personalization fallback for user ${userId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return baseResponse;
    }
  }

  async updatePreferences(
    userId: string,
    data: {
      interests?: string[];
      weakSkills?: string[];
      preferredDifficulty?: string;
      notificationsEnabled?: boolean;
      weeklyDigestEnabled?: boolean;
      displayMode?: string;
      onboardingCompleted?: boolean;
      onboardingSelections?: Prisma.InputJsonValue;
    },
  ) {
    const updateData: Prisma.UserPreferenceUncheckedUpdateInput = {
      ...(Array.isArray(data.interests) ? { interests: data.interests } : {}),
      ...(Array.isArray(data.weakSkills) ? { weakSkills: data.weakSkills } : {}),
      ...(typeof data.preferredDifficulty === 'string'
        ? { preferredDifficulty: data.preferredDifficulty }
        : {}),
      ...(typeof data.notificationsEnabled === 'boolean'
        ? { notificationsEnabled: data.notificationsEnabled }
        : {}),
      ...(typeof data.weeklyDigestEnabled === 'boolean'
        ? { weeklyDigestEnabled: data.weeklyDigestEnabled }
        : {}),
      ...(typeof data.displayMode === 'string'
        ? { displayMode: data.displayMode }
        : {}),
      ...(typeof data.onboardingCompleted === 'boolean'
        ? { onboardingCompleted: data.onboardingCompleted }
        : {}),
      ...(data.onboardingSelections !== undefined
        ? { onboardingSelections: data.onboardingSelections }
        : {}),
    };

    return this.prisma.userPreference.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        interests: Array.isArray(data.interests) ? data.interests : [],
        weakSkills: Array.isArray(data.weakSkills) ? data.weakSkills : [],
        preferredDifficulty:
          typeof data.preferredDifficulty === 'string'
            ? data.preferredDifficulty
            : 'MEDIUM',
        notificationsEnabled: data.notificationsEnabled ?? true,
        weeklyDigestEnabled: data.weeklyDigestEnabled ?? true,
        displayMode:
          typeof data.displayMode === 'string'
            ? data.displayMode
            : 'PROGRESSION',
        onboardingCompleted: data.onboardingCompleted ?? false,
        onboardingSelections:
          data.onboardingSelections !== undefined
            ? data.onboardingSelections
            : {},
      },
    });
  }

  async getPreferences(userId: string) {
    return this.prisma.userPreference.findUnique({ where: { userId } });
  }

  private async getAvailableGateway(): Promise<AiGateway | undefined> {
    return this.gatewayFactory.getAvailableGateway();
  }

  private async getAiRefinedRecommendations(args: {
    gateway: AiGateway;
    profile: {
      level: number;
      streak: number;
      focusAreas: string[];
      weakDomains: string[];
      onboarding: Required<OnboardingSelections>;
      recentCourseIds: string[];
      recentLessonTitles: string[];
      enrolledCourseIds: string[];
    };
    candidates: {
      courses: RecommendationCourse[];
      learningPaths: RecommendationPath[];
      labs: RecommendationLab[];
    };
  }): Promise<{
    courseIds: string[];
    pathIds: string[];
    labIds: string[];
    journeySummary: string;
    focusAreas: string[];
  } | null> {
    const prompt = [
      'You are a learning recommendation engine for XpertClass, a hands-on certification platform.',
      'Given the user profile and candidate items, produce a personalized ranked journey.',
      '',
      'USER PROFILE:',
      `Level: ${args.profile.level} | Streak: ${args.profile.streak} days`,
      `Focus areas: ${args.profile.focusAreas.join(', ') || 'none declared'}`,
      `Weak domains: ${args.profile.weakDomains.join(', ') || 'none identified'}`,
      `Purpose: ${args.profile.onboarding.purpose.join(', ') || 'general learning'}`,
      `Field: ${args.profile.onboarding.field.join(', ') || 'general'}`,
      `Skills: ${args.profile.onboarding.skills.join(', ') || 'none specified'}`,
      `Experience: ${args.profile.onboarding.experience || 'unknown'}`,
      `Role: ${args.profile.onboarding.role || 'learner'}`,
      `Recent lessons studied: ${args.profile.recentLessonTitles.join(', ') || 'none'}`,
      `Already enrolled in: ${args.profile.enrolledCourseIds.length} courses`,
      '',
      'CANDIDATE COURSES (rank by relevance to focus areas and weak domains):',
      ...args.candidates.courses.map(
        (course, i) => `${i + 1}. [${course.id}] "${course.title}" — ${course.description.substring(0, 120)}`,
      ),
      '',
      'CANDIDATE LEARNING PATHS (rank by career alignment):',
      ...args.candidates.learningPaths.map(
        (path, i) => `${i + 1}. [${path.id}] "${path.title}" → ${path.careerRole || 'general'} — ${path.description.substring(0, 100)}`,
      ),
      '',
      'CANDIDATE LABS (rank by skill-building value and interest match):',
      ...args.candidates.labs.map(
        (lab, i) => `${i + 1}. [${lab.id}] "${lab.title}" (difficulty ${lab.difficulty}) — ${lab.description.substring(0, 100)}`,
      ),
      '',
      'INSTRUCTIONS:',
      '- Prioritize items that directly match the user\'s declared focus areas and field.',
      '- If focus is "ai" or "machine learning", strongly prefer AI/ML-related items even if they\'re labeled as security (e.g., AI-powered security tools, ML for threat detection).',
      '- If focus is "design", prefer items related to UI/UX, accessibility, visual design, or design systems.',
      '- Weave in foundational items that support the declared interests.',
      '- Avoid repeating the same topic area. Diversify across the user\'s interests.',
      '- The journeySummary should be 1-2 sentences that feel personal, not generic.',
      '',
      'Return ONLY valid JSON: {"journeySummary":"...", "focusAreas":["..."], "courseIds":["..."], "pathIds":["..."], "labIds":["..."]}',
    ].join('\n');

    const response = await args.gateway.generate({
      prompt,
      system:
        'You are a personalization engine for a hands-on certification platform. Respond only with valid JSON.',
      format: 'json',
      temperature: 0.4,
    });

    const match = response.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]) as Partial<{
      journeySummary: string;
      focusAreas: string[];
      courseIds: string[];
      pathIds: string[];
      labIds: string[];
    }>;

    return {
      journeySummary:
        typeof parsed.journeySummary === 'string' ? parsed.journeySummary : '',
      focusAreas: Array.isArray(parsed.focusAreas)
        ? parsed.focusAreas.filter(isString)
        : [],
      courseIds: Array.isArray(parsed.courseIds)
        ? parsed.courseIds.filter(isString)
        : [],
      pathIds: Array.isArray(parsed.pathIds)
        ? parsed.pathIds.filter(isString)
        : [],
      labIds: Array.isArray(parsed.labIds)
        ? parsed.labIds.filter(isString)
        : [],
    };
  }
}

function reorderByIds<T extends { id: string }>(
  items: T[],
  orderedIds: string[],
): T[] {
  if (!orderedIds.length) return items;
  const byId = new Map(items.map((item) => [item.id, item]));
  const ordered = orderedIds
    .map((id) => byId.get(id))
    .filter((item): item is T => Boolean(item));
  const seen = new Set(ordered.map((item) => item.id));
  const rest = items.filter((item) => !seen.has(item.id));
  return [...ordered, ...rest];
}

function buildRuleJourneySummary(args: {
  level: number;
  streak: number;
  focusAreas: string[];
  weakDomains: string[];
  courseCount: number;
  labCount: number;
}): string {
  const focus = args.focusAreas.slice(0, 2).join(' + ') || 'your current goals';
  if (args.level <= 3) {
    return `Your journey is weighted toward foundation-building in ${focus}, with approachable labs and structured courses first.`;
  }
  if (args.weakDomains.length > 0) {
    return `Your journey is balancing ${focus} with reinforcement in ${args.weakDomains[0]}, so the next steps strengthen weak spots instead of only following declared interests.`;
  }
  return `Your journey is being shaped around ${focus}, with ${args.courseCount} course and ${args.labCount} lab options ranked from your current momentum.`;
}

function normalizeOnboardingSelections(
  value: unknown,
): Required<OnboardingSelections> {
  const source =
    value && typeof value === 'object' ? (value as OnboardingSelections) : {};
  return {
    purpose: Array.isArray(source.purpose)
      ? source.purpose.filter(isString)
      : [],
    field: Array.isArray(source.field) ? source.field.filter(isString) : [],
    role: isString(source.role) ? source.role : '',
    experience: isString(source.experience) ? source.experience : '',
    skills: Array.isArray(source.skills) ? source.skills.filter(isString) : [],
    jobInterests: Array.isArray(source.jobInterests)
      ? source.jobInterests.filter(isString)
      : [],
  };
}

function buildInterestTokens(args: {
  interests: string[];
  weakSkills: string[];
  onboarding: Required<OnboardingSelections>;
  weakSkillDomains: string[];
}): string[] {
  const rawValues = [
    ...args.interests,
    ...args.weakSkills,
    ...args.weakSkillDomains,
    ...args.onboarding.field,
    ...args.onboarding.skills,
    ...args.onboarding.purpose,
    ...args.onboarding.jobInterests,
    args.onboarding.role,
  ].filter(Boolean);

  return uniqueStrings(
    rawValues.flatMap((value) => {
      const normalized = value.toLowerCase().trim();
      const aliases = TERM_ALIASES[normalized] || [];
      return [normalized, ...normalized.split(/[\s/_-]+/), ...aliases];
    }),
  );
}

function scoreAgainstTokens(text: string, tokens: string[]): number {
  const haystack = text.toLowerCase();
  return tokens.reduce((total, token) => {
    if (!token || !haystack.includes(token)) return total;
    return total + (token.includes(' ') ? 3 : token.length > 4 ? 2 : 1);
  }, 0);
}

function averageCourseDifficulty(
  sections: Array<{
    lessons: Array<{ lab: { difficulty: number } | null }>;
  }>,
): number | null {
  const difficulties = sections.flatMap((section) =>
    section.lessons
      .map((lesson) => lesson.lab?.difficulty)
      .filter((value): value is number => typeof value === 'number'),
  );
  if (difficulties.length === 0) return null;
  return Math.round(
    difficulties.reduce((sum, value) => sum + value, 0) / difficulties.length,
  );
}

function scoreDifficultyPreference(
  difficulty: number | null,
  preferredDifficulty: string | null,
): number {
  if (!difficulty || !preferredDifficulty) return 0;
  const normalized = preferredDifficulty.toUpperCase();
  if (normalized === 'BEGINNER' || normalized === 'LOW')
    return difficulty <= 800 ? 2 : 0;
  if (normalized === 'INTERMEDIATE' || normalized === 'MEDIUM')
    return difficulty > 800 && difficulty <= 1600 ? 2 : 0;
  if (normalized === 'ADVANCED' || normalized === 'HIGH')
    return difficulty > 1600 ? 2 : 0;
  return 0;
}

function scoreRecencyBoost(
  courseId: string,
  recentCourseIds: string[],
): number {
  return recentCourseIds.includes(courseId) ? 2 : 0;
}

function uniqueStrings(values: string[]): string[] {
  return values
    .map((value) => value.trim())
    .filter(
      (value, index, array) =>
        value.length > 1 && array.indexOf(value) === index,
    );
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}
