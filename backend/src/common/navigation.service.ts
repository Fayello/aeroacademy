import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type UserExperience =
  | 'INDIVIDUAL'
  | 'UNIVERSITY'
  | 'CORPORATE'
  | 'INSTRUCTOR'
  | 'ADMIN';

export interface NavItem {
  href: string;
  tKey: string;
  icon: string;
  label: string;
  badge?: string;
  disabled?: boolean;
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

export interface NavAlert {
  type: 'EXAM_AVAILABLE' | 'COHORT_ACTIVE' | 'CURRICULUM_ASSIGNED' | 'LEVEL_UP';
  title: string;
  description: string;
  href?: string;
}

export interface NavigationContext {
  experience: UserExperience;
  level: number;
  role: string;
  sections: NavSection[];
  alerts: NavAlert[];
  showTeach: boolean;
  showAcademic: boolean;
  showAdmin: boolean;
  canAccessAdminView: boolean;
  adminHomePath: string | null;
  adminViewLabel: string | null;
  adminRoutePrefixes: string[];
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
    if (user.role === 'PROFESSOR' || user.role === 'TA') return 'INSTRUCTOR';

    if (user.organization) {
      if (user.organization.type === 'UNIVERSITY') return 'UNIVERSITY';
      if (
        user.organization.type === 'ENTERPRISE' ||
        user.organization.type === 'GOVERNMENT'
      )
        return 'CORPORATE';
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
        teamId: true,
        userExperience: true,
      },
    });

    if (!user) {
      return this.getDefaultContext('INDIVIDUAL', 1, 'STUDENT');
    }

    const level = Math.floor(user.xp / 1000) + 1;
    const experience = user.userExperience as UserExperience;
    const role = user.role;

    // Check context
    const [cohortMemberships, teachingCohorts] = await Promise.all([
      this.prisma.cohortMember.findMany({
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
      }),
      // Check if user teaches any cohorts (PROFESSOR/TA)
      role === 'PROFESSOR' || role === 'TA'
        ? this.prisma.cohortMember.findMany({
            where: { userId, role: { in: ['PROFESSOR', 'TA'] } },
            include: {
              cohort: { select: { id: true, name: true } },
            },
          })
        : Promise.resolve([]),
    ]);

    const isEnrolledInCohort = cohortMemberships.length > 0;
    const isTeaching = teachingCohorts.length > 0;
    const canAccessAdminView = role === 'ADMIN' || role === 'RECRUITER';
    const isAdmin = role === 'ADMIN';
    const adminHomePath =
      role === 'RECRUITER' ? '/dashboard/enterprise' : '/dashboard/admin';
    const adminViewLabel =
      role === 'RECRUITER' ? 'Recruitment Workspace' : 'Admin Workspace';
    const adminRoutePrefixes =
      role === 'RECRUITER'
        ? [
            '/dashboard/enterprise',
            '/dashboard/admin/inquiries',
            '/dashboard/admin/community-programs',
          ]
        : canAccessAdminView
          ? ['/dashboard/admin', '/dashboard/enterprise']
          : [];

    // ─── BUILD CORE SECTIONS ───
    const sections: NavSection[] = [];

    // Dashboard (always first)
    sections.push({
      id: 'dashboard',
      label: 'Command Center',
      items: [
        {
          href: '/dashboard',
          tKey: 'nav.dashboard',
          icon: 'Home',
          label: 'Dashboard',
        },
      ],
    });

    // Learn
    sections.push({
      id: 'learn',
      label: 'Learn',
      items: [
        {
          href: '/dashboard/courses',
          tKey: 'nav.courses',
          icon: 'GraduationCap',
          label: 'Courses',
        },
        {
          href: '/dashboard/learning-paths',
          tKey: 'nav.paths',
          icon: 'Route',
          label: 'Learning Paths',
        },
        {
          href: '/dashboard/training',
          tKey: 'nav.masterclasses',
          icon: 'Award',
          label: 'Master Classes',
        },
        {
          href: '/dashboard/certifications',
          tKey: 'nav.certifications',
          icon: 'Award',
          label: 'Certifications',
        },
      ],
    });

    // Labs
    sections.push({
      id: 'labs',
      label: 'Practice',
      items: [
        {
          href: '/dashboard/labs',
          tKey: 'nav.labs',
          icon: 'FlaskConical',
          label: 'Labs',
        },
        {
          href: '/dashboard/exams',
          tKey: 'nav.exams',
          icon: 'ClipboardCheck',
          label: 'Practical Exams',
        },
        {
          href: '/dashboard/assessments',
          tKey: 'nav.assessments',
          icon: 'Target',
          label: 'Skill Assessments',
        },
      ],
    });

    // Compete
    sections.push({
      id: 'compete',
      label: 'Compete',
      items: [
        {
          href: '/dashboard/ranking',
          tKey: 'nav.ranking',
          icon: 'Trophy',
          label: 'Leaderboard',
        },
        {
          href: '/dashboard/head-to-head',
          tKey: 'nav.headToHead',
          icon: 'Swords',
          label: 'Head-to-Head',
        },
        {
          href: '/dashboard/challenges/lab-challenges',
          tKey: 'nav.labChallenges',
          icon: 'Swords',
          label: 'Lab Challenges',
        },
      ],
    });

    // Community
    sections.push({
      id: 'community',
      label: 'Community',
      items: [
        {
          href: '/dashboard/community',
          tKey: 'nav.community',
          icon: 'Megaphone',
          label: 'Community',
        },
        {
          href: '/dashboard/guilds',
          tKey: 'nav.guilds',
          icon: 'Shield',
          label: 'Guilds',
        },
        {
          href: '/dashboard/teams',
          tKey: 'nav.teams',
          icon: 'Users',
          label: 'Teams',
        },
        {
          href: '/dashboard/leaderboard',
          tKey: 'nav.leaderboard',
          icon: 'Trophy',
          label: 'Leaderboard',
        },
      ],
    });

    // ─── ACADEMIC SECTION (for enrolled students) ───
    if (isEnrolledInCohort) {
      const academicItems: NavItem[] = [
        {
          href: '/dashboard/academics',
          tKey: 'nav.academic.overview',
          icon: 'BookOpen',
          label: 'My Academics',
        },
      ];

      sections.push({
        id: 'academic',
        label: 'My Academics',
        items: academicItems,
      });
    }

    // ─── TEACH SECTION (for professors/TAs) ───
    if (isTeaching) {
      const teachItems: NavItem[] = [
        {
          href: '/dashboard/curricula',
          tKey: 'nav.teach.curricula',
          icon: 'ScrollText',
          label: 'Curriculum',
        },
        {
          href: '/dashboard/cohorts',
          tKey: 'nav.teach.cohorts',
          icon: 'Users',
          label: 'Classes',
        },
        {
          href: '/dashboard/exams',
          tKey: 'nav.teach.exams',
          icon: 'ClipboardCheck',
          label: 'Assessments',
        },
        {
          href: '/dashboard/gradebook',
          tKey: 'nav.teach.gradebook',
          icon: 'ClipboardCheck',
          label: 'Gradebook',
        },
      ];

      sections.push({
        id: 'teach',
        label: 'Teaching',
        items: teachItems,
      });
    }

    // ─── ALERTS ───
    const alerts: NavAlert[] = [];

    for (const cm of cohortMemberships) {
      if (cm.cohort.curriculum) {
        alerts.push({
          type: 'COHORT_ACTIVE',
          title: cm.cohort.name,
          description: `Curriculum: ${cm.cohort.curriculum.degree} ${cm.cohort.curriculum.name}`,
          href: `/dashboard/cohorts/${cm.cohort.id}`,
        });
      }
    }

    return {
      experience,
      level,
      role,
      sections,
      alerts,
      showTeach: isTeaching,
      showAcademic: isEnrolledInCohort,
      showAdmin: canAccessAdminView,
      canAccessAdminView,
      adminHomePath: canAccessAdminView ? adminHomePath : null,
      adminViewLabel: canAccessAdminView ? adminViewLabel : null,
      adminRoutePrefixes,
    };
  }

  private getDefaultContext(
    experience: UserExperience,
    level: number,
    role: string,
  ): NavigationContext {
    return {
      experience,
      level,
      role,
      sections: [
        {
          id: 'dashboard',
          label: 'Command Center',
          items: [
            {
              href: '/dashboard',
              tKey: 'nav.dashboard',
              icon: 'Home',
              label: 'Dashboard',
            },
          ],
        },
        {
          id: 'learn',
          label: 'Learn',
          items: [
            {
              href: '/dashboard/courses',
              tKey: 'nav.courses',
              icon: 'GraduationCap',
              label: 'Courses',
            },
            {
              href: '/dashboard/learning-paths',
              tKey: 'nav.paths',
              icon: 'Route',
              label: 'Learning Paths',
            },
            {
              href: '/dashboard/training',
              tKey: 'nav.masterclasses',
              icon: 'Award',
              label: 'Master Classes',
            },
          ],
        },
        {
          id: 'labs',
          label: 'Practice',
          items: [
            {
              href: '/dashboard/labs',
              tKey: 'nav.labs',
              icon: 'FlaskConical',
              label: 'Labs',
            },
            {
              href: '/dashboard/exams',
              tKey: 'nav.exams',
              icon: 'ClipboardCheck',
              label: 'Practical Exams',
            },
            {
              href: '/dashboard/assessments',
              tKey: 'nav.assessments',
              icon: 'Target',
              label: 'Skill Assessments',
            },
          ],
        },
        {
          id: 'compete',
          label: 'Compete',
          items: [
            {
              href: '/dashboard/compete',
              tKey: 'nav.compete',
              icon: 'Swords',
              label: 'Compete',
            },
          ],
        },
      ],
      alerts: [],
      showTeach: false,
      showAcademic: false,
      showAdmin: false,
      canAccessAdminView: false,
      adminHomePath: null,
      adminViewLabel: null,
      adminRoutePrefixes: [],
    };
  }
}
