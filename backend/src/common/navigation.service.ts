import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type UserExperience = 'INDIVIDUAL' | 'UNIVERSITY' | 'CORPORATE' | 'INSTRUCTOR' | 'ADMIN';

export interface NavItem {
  href: string;
  tKey: string;
  icon: string;
  label: string;
  badge?: string;
  disabled?: boolean;
}

export interface NavAlert {
  type: 'EXAM_AVAILABLE' | 'COHORT_ACTIVE' | 'CURRICULUM_ASSIGNED' | 'LEVEL_UP';
  title: string;
  description: string;
  href?: string;
}

export interface NavigationContext {
  experience: UserExperience;
  role: string;
  level: number;
  learnItems: NavItem[];
  practiceItems: NavItem[];
  competeItems: NavItem[];
  communityItems: NavItem[];
  alerts: NavAlert[];
  showCompete: boolean;
  showCommunity: boolean;
}

@Injectable()
export class NavigationService {
  private readonly logger = new Logger(NavigationService.name);

  constructor(private prisma: PrismaService) {}

  async detectExperience(userId: string): Promise<UserExperience> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        organizationId: true,
        organization: { select: { type: true } },
      },
    });

    if (!user) return 'INDIVIDUAL';

    if (user.role === 'ADMIN' || user.role === 'RECRUITER') return 'ADMIN';

    const instructorCohort = await this.prisma.cohortMember.findFirst({
      where: { userId, role: { in: ['PROFESSOR', 'TA'] } },
    });
    if (instructorCohort) return 'INSTRUCTOR';

    if (user.organization) {
      if (user.organization.type === 'UNIVERSITY') return 'UNIVERSITY';
      if (user.organization.type === 'ENTERPRISE' || user.organization.type === 'GOVERNMENT') return 'CORPORATE';
    }

    const cohortMembership = await this.prisma.cohortMember.findFirst({
      where: { userId },
    });
    if (cohortMembership) return 'UNIVERSITY';

    return 'INDIVIDUAL';
  }

  async syncExperience(userId: string): Promise<UserExperience> {
    const experience = await this.detectExperience(userId);
    await this.prisma.user.update({
      where: { id: userId },
      data: { userExperience: experience },
    });
    return experience;
  }

  async getNavigationContext(userId: string): Promise<NavigationContext> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        xp: true,
        userExperience: true,
        organizationId: true,
        organization: { select: { type: true, name: true } },
      },
    });

    if (!user) {
      return this.getDefaultContext('INDIVIDUAL', 'STUDENT', 1);
    }

    const level = Math.floor(user.xp / 1000) + 1;
    const experience = (user.userExperience as UserExperience) || 'INDIVIDUAL';
    const role = user.role;

    const ctx = this.getDefaultContext(experience, role, level);

    if (role === 'ADMIN' || role === 'RECRUITER') {
      return this.getAdminContext(ctx);
    }

    if (experience === 'INSTRUCTOR') {
      return this.getInstructorContext(ctx, userId, level);
    }

    if (experience === 'UNIVERSITY' || experience === 'CORPORATE') {
      await this.getInstitutionalContext(ctx, userId, experience, level);
    }

    return this.getStudentContext(ctx, userId, level);
  }

  private getAdminContext(ctx: NavigationContext): NavigationContext {
    ctx.learnItems = [];
    ctx.practiceItems = [
      { href: '/dashboard/admin/labs', tKey: 'bucket.labs', icon: 'FlaskConical', label: 'Labs' },
    ];
    ctx.competeItems = [];
    ctx.communityItems = [];
    return ctx;
  }

  private getInstructorContext(ctx: NavigationContext, userId: string, level: number): NavigationContext {
    ctx.learnItems = [
      { href: '/dashboard/curricula', tKey: 'bucket.curricula', icon: 'ScrollText', label: 'Curriculum' },
      { href: '/dashboard/cohorts', tKey: 'bucket.cohorts', icon: 'Users', label: 'Cohorts' },
      { href: '/dashboard/exams', tKey: 'bucket.exams', icon: 'ClipboardCheck', label: 'Assessments' },
      { href: '/dashboard/training', tKey: 'bucket.training', icon: 'Award', label: 'Masterclasses' },
    ];
    ctx.practiceItems = [
      { href: '/dashboard/labs', tKey: 'bucket.labs', icon: 'FlaskConical', label: 'Labs' },
      { href: '/dashboard/courses', tKey: 'bucket.courses', icon: 'GraduationCap', label: 'Courses' },
    ];
    ctx.competeItems = [];
    ctx.communityItems = [];
    return ctx;
  }

  private async getInstitutionalContext(
    ctx: NavigationContext,
    userId: string,
    experience: UserExperience,
    level: number,
  ): Promise<void> {
    const cohortMemberships = await this.prisma.cohortMember.findMany({
      where: { userId },
      include: {
        cohort: {
          select: {
            id: true,
            name: true,
            curriculum: { select: { id: true, name: true, degree: true } },
          },
        },
      },
    });

    const hasCurriculum = cohortMemberships.some(cm => cm.cohort.curriculum);
    if (hasCurriculum) {
      ctx.learnItems.unshift({
        href: '/dashboard/curricula',
        tKey: 'bucket.myCurriculum',
        icon: 'ScrollText',
        label: 'My Curriculum',
      });
    }

    if (cohortMemberships.length > 0) {
      ctx.learnItems.push({
        href: '/dashboard/cohorts',
        tKey: 'bucket.myCohort',
        icon: 'Users',
        label: 'My Cohort',
      });

      ctx.alerts.push(
        ...cohortMemberships.map(cm => ({
          type: 'COHORT_ACTIVE' as const,
          title: cm.cohort.name,
          description: cm.cohort.curriculum
            ? `${cm.cohort.curriculum.degree} ${cm.cohort.curriculum.name}`
            : 'Active cohort',
          href: `/dashboard/cohorts/${cm.cohort.id}`,
        })),
      );
    }

    const examEnrollments = await this.prisma.studentAssessment.findMany({
      where: { userId },
      include: {
        assessment: { select: { id: true, title: true, isProctored: true } },
      },
    });
    const activeExams = await this.prisma.practicalAssessment.findMany({
      select: { id: true, title: true, isProctored: true },
      take: 3,
    });

    if (activeExams.length > 0 || examEnrollments.length > 0) {
      ctx.learnItems.push({
        href: '/dashboard/exams',
        tKey: 'bucket.exams',
        icon: 'ClipboardCheck',
        label: 'Exams',
      });

      for (const exam of activeExams) {
        ctx.alerts.push({
          type: 'EXAM_AVAILABLE',
          title: `${exam.title} is available`,
          description: exam.isProctored ? 'Proctored — timed environment' : 'Self-paced assessment',
          href: `/dashboard/exams/${exam.id}`,
        });
      }
    }
  }

  private async getStudentContext(
    ctx: NavigationContext,
    userId: string,
    level: number,
  ): Promise<NavigationContext> {
    ctx.learnItems = [
      { href: '/dashboard/courses', tKey: 'bucket.courses', icon: 'GraduationCap', label: 'Courses' },
      { href: '/dashboard/learning-paths', tKey: 'bucket.paths', icon: 'Route', label: 'Learning Paths' },
      { href: '/dashboard/master-classes', tKey: 'bucket.masterclasses', icon: 'Award', label: 'Classes' },
    ];

    ctx.practiceItems = [
      { href: '/dashboard/labs', tKey: 'bucket.labs', icon: 'FlaskConical', label: 'Labs' },
      { href: '/dashboard/exams', tKey: 'bucket.practical-exams', icon: 'ClipboardCheck', label: 'Practical Exams' },
    ];

    ctx.competeItems = [];
    if (level >= 3) {
      ctx.competeItems.push({
        href: '/dashboard/challenges',
        tKey: 'bucket.challenges',
        icon: 'Target',
        label: 'Challenges',
      });
    }
    if (level >= 5) {
      ctx.competeItems.push({
        href: '/dashboard/ranking',
        tKey: 'bucket.ranked',
        icon: 'Shield',
        label: 'Ranked',
      });
    }
    ctx.competeItems.push(
      { href: '/dashboard/my-missions', tKey: 'bucket.missions', icon: 'Target', label: 'Missions' },
      { href: '/dashboard/leaderboard', tKey: 'bucket.leaderboard', icon: 'Award', label: 'Leaderboard' },
    );

    ctx.communityItems = [
      { href: '/dashboard/teams', tKey: 'bucket.teams', icon: 'Users', label: 'Teams' },
      { href: '/dashboard/events', tKey: 'bucket.events', icon: 'ScrollText', label: 'Events' },
    ];

    ctx.showCompete = true;
    ctx.showCommunity = true;

    return ctx;
  }

  private getDefaultContext(experience: UserExperience, role: string, level: number): NavigationContext {
    return {
      experience,
      role,
      level,
      learnItems: [],
      practiceItems: [],
      competeItems: [],
      communityItems: [],
      alerts: [],
      showCompete: true,
      showCommunity: true,
    };
  }
}
