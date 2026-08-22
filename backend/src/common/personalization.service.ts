import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const logger = new Logger('Personalization');

@Injectable()
export class PersonalizationService {
  constructor(private prisma: PrismaService) {}

  async getRecommendations(userId: string, limit = 5) {
    const [user, userSkills, enrollments, recentProgress] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { xp: true, currentStreak: true },
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
        include: { lesson: { include: { section: { include: { course: true } } } } },
      }),
    ]);

    const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));
    const weakSkillDomains = userSkills
      .filter((us) => us.xp < 200)
      .map((us) => us.skill.domain.name);

    const level = user ? Math.floor(user.xp / 1000) + 1 : 1;

    // 1. Course recommendations based on weak skills
    const skillBasedCourses = await this.prisma.course.findMany({
      where: {
        id: { notIn: [...enrolledCourseIds] },
        sections: {
          some: {
            lessons: {
              some: {
                lab: {
                  labSkills: {
                    some: {
                      skill: { domain: { name: { in: weakSkillDomains.length > 0 ? weakSkillDomains : ['SECURITY', 'SYSTEMS'] } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      take: limit,
      select: { id: true, title: true, description: true, imageUrl: true },
    });

    // 2. Recommended learning paths based on level
    const difficulty = level < 5 ? 'BEGINNER' : level < 15 ? 'INTERMEDIATE' : 'ADVANCED';
    const recommendedPaths = await this.prisma.learningPath.findMany({
      where: { difficulty },
      take: 3,
      select: { id: true, title: true, description: true, imageUrl: true, careerRole: true },
    });

    // 3. Suggested labs based on weak skills
    const suggestedLabs = await this.prisma.lab.findMany({
      where: {
        labSkills: {
          some: {
            skill: { domain: { name: { in: weakSkillDomains.length > 0 ? weakSkillDomains : ['SECURITY'] } } },
          },
        },
      },
      take: 3,
      select: { id: true, title: true, description: true, difficulty: true },
    });

    // 4. "Users like you" — similar XP range
    const xpRange = user ? { gte: Math.max(0, user.xp - 500), lte: user.xp + 500 } : { gte: 0, lte: 1000 };
    const similarUsers = await this.prisma.user.findMany({
      where: { xp: xpRange, id: { not: userId }, role: 'STUDENT' },
      take: 5,
      select: { id: true, name: true, username: true, xp: true },
    });

    return {
      courses: skillBasedCourses,
      learningPaths: recommendedPaths,
      labs: suggestedLabs,
      similarUsers,
      insights: {
        weakDomains: weakSkillDomains.slice(0, 3),
        level,
        streak: user?.currentStreak || 0,
      },
    };
  }

  async updatePreferences(userId: string, data: {
    interests?: string[];
    weakSkills?: string[];
    preferredDifficulty?: string;
    notificationsEnabled?: boolean;
    weeklyDigestEnabled?: boolean;
  }) {
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
}
