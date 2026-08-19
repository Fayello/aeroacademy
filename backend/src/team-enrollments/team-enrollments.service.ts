import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeamEnrollmentsService {
  constructor(private prisma: PrismaService) {}

  async getTeams() {
    return this.prisma.team.findMany({
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { select: { id: true, name: true, email: true } },
        courseEnrollments: {
          include: { course: { select: { id: true, title: true } } },
        },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTeam(teamId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        owner: { select: { id: true, name: true, email: true, xp: true } },
        members: { select: { id: true, name: true, email: true, xp: true, division: true } },
        courseEnrollments: {
          include: { course: { select: { id: true, title: true, imageUrl: true } } },
        },
      },
    });
    if (!team) throw new NotFoundException('Team not found');
    return team;
  }

  async enrollTeamInCourse(teamId: string, courseId: string, adminId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { members: { select: { id: true } } },
    });
    if (!team) throw new NotFoundException('Team not found');
    if (team.ownerId !== adminId) throw new ForbiddenException('Only team owner can enroll');

    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    const existing = await this.prisma.teamCourseEnrollment.findUnique({
      where: { teamId_courseId: { teamId, courseId } },
    });
    if (existing) throw new ConflictException('Team already enrolled');

    const enrollment = await this.prisma.teamCourseEnrollment.create({
      data: { teamId, courseId },
      include: { course: { select: { id: true, title: true } } },
    });

    // Auto-enroll all team members
    for (const member of team.members) {
      await this.prisma.courseEnrollment.upsert({
        where: { userId_courseId: { userId: member.id, courseId } },
        create: { userId: member.id, courseId },
        update: { lastActivityAt: new Date() },
      });
    }

    return enrollment;
  }

  async unenrollTeamFromCourse(teamId: string, courseId: string) {
    await this.prisma.teamCourseEnrollment.delete({
      where: { teamId_courseId: { teamId, courseId } },
    });
    return { success: true };
  }

  async getTeamLeaderboard(teamId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          select: { id: true, name: true, xp: true, division: true, currentStreak: true },
          orderBy: { xp: 'desc' },
        },
      },
    });
    if (!team) throw new NotFoundException('Team not found');

    const totalXP = team.members.reduce((sum, m) => sum + m.xp, 0);
    return {
      team: { id: team.id, name: team.name, totalXP, memberCount: team.members.length },
      members: team.members,
    };
  }

  async getCourseTeams(courseId: string) {
    const enrollments = await this.prisma.teamCourseEnrollment.findMany({
      where: { courseId },
      include: {
        team: {
          include: {
            members: { select: { id: true, name: true, xp: true } },
            _count: { select: { members: true } },
          },
        },
      },
    });

    return enrollments.map(e => ({
      ...e.team,
      enrolledAt: e.enrolledAt,
      totalXP: e.team.members.reduce((sum, m) => sum + m.xp, 0),
    }));
  }

  async bulkEnrollTeams(courseId: string, teamIds: string[], adminId: string) {
    const results: any[] = [];
    for (const teamId of teamIds) {
      try {
        const enrollment = await this.enrollTeamInCourse(teamId, courseId, adminId);
        results.push({ teamId, success: true, enrollment });
      } catch (err: any) {
        results.push({ teamId, success: false, error: err.message });
      }
    }
    return results;
  }
}
