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
  level: number;
  learnItems: NavItem[];
  competeItems: NavItem[];
  communityItems: NavItem[];
  profileItems: NavItem[];
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

    // Admin/Recruiter → ADMIN experience
    if (user.role === 'ADMIN' || user.role === 'RECRUITER') return 'ADMIN';

    // Check if user is an instructor/professor in any cohort
    const instructorCohort = await this.prisma.cohortMember.findFirst({
      where: { userId, role: { in: ['PROFESSOR', 'TA'] } },
    });
    if (instructorCohort) return 'INSTRUCTOR';

    // Check organization type
    if (user.organization) {
      if (user.organization.type === 'UNIVERSITY') return 'UNIVERSITY';
      if (user.organization.type === 'ENTERPRISE' || user.organization.type === 'GOVERNMENT') return 'CORPORATE';
    }

    // Check if enrolled in any cohort (even as student)
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
      return this.getDefaultContext('INDIVIDUAL', 1);
    }

    const level = Math.floor(user.xp / 1000) + 1;
    const experience = user.userExperience as UserExperience;

    // Get user's enrollments
    const [cohortMemberships, examEnrollments, activeExams] = await Promise.all([
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
      this.prisma.studentAssessment.findMany({
        where: { userId },
        include: {
          assessment: {
            select: { id: true, title: true, domainId: true, isProctored: true },
          },
        },
      }),
      this.prisma.practicalAssessment.findMany({
        select: { id: true, title: true, domainId: true, isProctored: true },
        take: 3,
      }),
    ]);

    // Build navigation based on experience
    const ctx = this.getDefaultContext(experience, level);

    // ─── LEARN items ───
    // Always show courses, learning paths, assessments
    ctx.learnItems = [
      { href: '/dashboard/courses', tKey: 'bucket.courses', icon: 'GraduationCap', label: 'Courses' },
      { href: '/dashboard/learning-paths', tKey: 'bucket.paths', icon: 'Route', label: 'Learning Paths' },
      { href: '/dashboard/training', tKey: 'bucket.masterclasses', icon: 'Award', label: 'Masterclasses' },
      { href: '/dashboard/analytics/competency', tKey: 'bucket.assessments', icon: 'ClipboardCheck', label: 'Assessments' },
    ];

    // UNIVERSITY: show curriculum, cohort, exams
    if (experience === 'UNIVERSITY' || experience === 'INSTRUCTOR') {
      const hasCurriculum = cohortMemberships.some(cm => cm.cohort.curriculum);
      if (hasCurriculum) {
        ctx.learnItems.splice(0, 0, {
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
      }

      if (activeExams.length > 0 || examEnrollments.length > 0) {
        ctx.learnItems.push({
          href: '/dashboard/exams',
          tKey: 'bucket.exams',
          icon: 'ClipboardCheck',
          label: 'Exams',
        });
      }
    }

    // CORPORATE: show assigned training
    if (experience === 'CORPORATE') {
      ctx.learnItems = [
        { href: '/dashboard/courses', tKey: 'bucket.courses', icon: 'GraduationCap', label: 'Assigned Training' },
        { href: '/dashboard/learning-paths', tKey: 'bucket.paths', icon: 'Route', label: 'Learning Paths' },
        { href: '/dashboard/analytics/competency', tKey: 'bucket.assessments', icon: 'ClipboardCheck', label: 'Assessments' },
      ];

      if (cohortMemberships.length > 0) {
        ctx.learnItems.push({
          href: '/dashboard/cohorts',
          tKey: 'bucket.myCohort',
          icon: 'Users',
          label: 'My Cohort',
        });
      }
    }

    // INSTRUCTOR: add management items
    if (experience === 'INSTRUCTOR') {
      ctx.learnItems.push(
        { href: '/dashboard/curricula', tKey: 'bucket.curricula', icon: 'ScrollText', label: 'Curriculum Management' },
        { href: '/dashboard/cohorts', tKey: 'bucket.cohorts', icon: 'Users', label: 'Cohort Management' },
        { href: '/dashboard/exams', tKey: 'bucket.exams', icon: 'ClipboardCheck', label: 'Exam Management' },
      );
    }

    // ─── COMPETE items ───
    // Level-gated progression
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
      ctx.competeItems.push(
        { href: '/dashboard/ranking', tKey: 'bucket.ranked', icon: 'Shield', label: 'Ranked' },
        { href: '/dashboard/capability-ranking', tKey: 'bucket.capability', icon: 'Target', label: 'Capability' },
      );
    }

    if (level >= 7) {
      ctx.competeItems.push(
        { href: '/dashboard/teams', tKey: 'bucket.teams', icon: 'Users', label: 'Teams' },
        { href: '/dashboard/seasons', tKey: 'bucket.seasons', icon: 'ScrollText', label: 'Seasons' },
      );
    }

    if (level >= 10) {
      ctx.competeItems.push(
        { href: '/dashboard/boss-missions', tKey: 'bucket.boss-missions', icon: 'Swords', label: 'Boss Missions' },
        { href: '/dashboard/battle-pass', tKey: 'bucket.rewards', icon: 'Award', label: 'Battle Pass' },
      );
    }

    // Always show missions and leaderboards for competitive
    ctx.competeItems.push(
      { href: '/dashboard/my-missions', tKey: 'bucket.missions', icon: 'Target', label: 'My Missions' },
      { href: '/dashboard/leaderboard', tKey: 'bucket.leaderboards', icon: 'Award', label: 'Leaderboards' },
    );

    // ─── COMMUNITY items ───
    ctx.communityItems = [
      { href: '/dashboard/teams', tKey: 'bucket.teams', icon: 'Users', label: 'Teams' },
      { href: '/dashboard/events', tKey: 'bucket.events', icon: 'ScrollText', label: 'Events' },
    ];

    // ─── ALERTS ───
    // Exam alerts
    for (const exam of activeExams) {
      ctx.alerts.push({
        type: 'EXAM_AVAILABLE',
        title: `${exam.title} is available`,
        description: exam.isProctored ? 'Proctored exam — timed environment' : 'Self-paced assessment',
        href: `/dashboard/exams/${exam.id}`,
      });
    }

    // Cohort alerts
    for (const cm of cohortMemberships) {
      if (cm.cohort.curriculum) {
        ctx.alerts.push({
          type: 'COHORT_ACTIVE',
          title: `${cm.cohort.name}`,
          description: `Curriculum: ${cm.cohort.curriculum.degree} ${cm.cohort.curriculum.name}`,
          href: `/dashboard/cohorts/${cm.cohort.id}`,
        });
      }
    }

    ctx.showCompete = ctx.competeItems.length > 0;
    ctx.showCommunity = true;

    return ctx;
  }

  private getDefaultContext(experience: UserExperience, level: number): NavigationContext {
    return {
      experience,
      level,
      learnItems: [],
      competeItems: [],
      communityItems: [],
      profileItems: [
        { href: '/dashboard/profile', tKey: 'bucket.overview', icon: 'User', label: 'Overview' },
        { href: '/dashboard/genome', tKey: 'bucket.skills', icon: 'Target', label: 'Skills' },
        { href: '/dashboard/competency', tKey: 'bucket.competency', icon: 'BarChart3', label: 'Competency' },
        { href: '/dashboard/certifications', tKey: 'bucket.certifications', icon: 'Award', label: 'Certifications' },
        { href: '/dashboard/analytics', tKey: 'bucket.achievements', icon: 'Award', label: 'Achievements' },
      ],
      alerts: [],
      showCompete: true,
      showCommunity: true,
    };
  }
}
