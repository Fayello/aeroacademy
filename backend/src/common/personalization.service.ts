import { Injectable, Logger } from '@nestjs/common';
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
  ],
  cybersecurity: [
    'cybersecurity',
    'security',
    'defensive security',
    'offensive security',
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
  ],
  devops: ['devops', 'platform', 'automation', 'infrastructure', 'sre'],
  devsecops: ['devsecops', 'secure pipeline', 'sast', 'dast', 'supply chain'],
  cloud: ['cloud', 'aws', 'azure', 'gcp', 'terraform', 'iam', 'serverless'],
  containers: [
    'containers',
    'container',
    'docker',
    'kubernetes',
    'k8s',
    'helm',
  ],
  cicd: ['cicd', 'ci/cd', 'pipeline', 'github actions', 'gitlab', 'jenkins'],
  networking: ['networking', 'network', 'routing', 'firewall', 'dns', 'vpn'],
  systems: ['systems', 'linux', 'sysadmin', 'infrastructure'],
  software: ['software', 'engineering', 'backend', 'frontend', 'api'],
  web: ['web', 'frontend', 'backend', 'browser', 'react', 'node'],
  mobile: ['mobile', 'android', 'ios', 'apk'],
  data: ['data', 'analytics', 'sql', 'warehouse', 'etl'],
  'data-eng': [
    'data engineering',
    'etl',
    'warehouse',
    'pipeline',
    'postgres',
    'mongo',
    'redis',
  ],
  ai: ['ai', 'machine learning', 'ml', 'llm', 'nlp', 'vision'],
  'ml-ops': [
    'mlops',
    'ml ops',
    'model serving',
    'vector',
    'qdrant',
    'kubeflow',
    'feast',
  ],
  design: ['design', 'ux', 'ui', 'figma', 'research'],
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

    const courseCandidates = await this.prisma.course.findMany({
      where: { id: { notIn: [...enrolledCourseIds] } },
      take: Math.max(limit * 8, 24),
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
    const pathCandidates = await this.prisma.learningPath.findMany({
      where: { difficulty },
      take: 12,
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        careerRole: true,
      },
    });
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

    const labCandidates = await this.prisma.lab.findMany({
      take: Math.max(limit * 8, 24),
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
    },
  ) {
    return this.prisma.userPreference.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        interests: data.interests || [],
        weakSkills: data.weakSkills || [],
        preferredDifficulty: data.preferredDifficulty || 'MEDIUM',
        notificationsEnabled: data.notificationsEnabled ?? true,
        weeklyDigestEnabled: data.weeklyDigestEnabled ?? true,
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
      'Personalize a learning journey for one XpertClass user.',
      '',
      `Level: ${args.profile.level}`,
      `Streak: ${args.profile.streak}`,
      `Focus areas: ${args.profile.focusAreas.join(', ') || 'none'}`,
      `Weak domains: ${args.profile.weakDomains.join(', ') || 'none'}`,
      `Purpose: ${args.profile.onboarding.purpose.join(', ') || 'none'}`,
      `Field: ${args.profile.onboarding.field.join(', ') || 'none'}`,
      `Skills: ${args.profile.onboarding.skills.join(', ') || 'none'}`,
      `Experience: ${args.profile.onboarding.experience || 'unknown'}`,
      `Role: ${args.profile.onboarding.role || 'unknown'}`,
      `Recent lessons: ${args.profile.recentLessonTitles.join(', ') || 'none'}`,
      '',
      'Candidate courses:',
      ...args.candidates.courses.map(
        (course) => `- ${course.id} | ${course.title} | ${course.description}`,
      ),
      '',
      'Candidate learning paths:',
      ...args.candidates.learningPaths.map(
        (path) =>
          `- ${path.id} | ${path.title} | ${path.description} | ${path.careerRole || 'general'}`,
      ),
      '',
      'Candidate labs:',
      ...args.candidates.labs.map(
        (lab) =>
          `- ${lab.id} | ${lab.title} | difficulty ${lab.difficulty} | ${lab.description}`,
      ),
      '',
      'Return JSON only with this shape:',
      '{"journeySummary":"...", "focusAreas":["..."], "courseIds":["..."], "pathIds":["..."], "labIds":["..."]}',
      'Rules:',
      '- Choose only ids from the candidate lists.',
      '- Prefer different sequences for users with different level, streak, weak areas, and recent work even if they share the same broad interest.',
      '- Keep journeySummary to 1-2 sentences.',
      '- Do not invent ids.',
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
