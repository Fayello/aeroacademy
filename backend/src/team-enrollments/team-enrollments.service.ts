import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class TeamEnrollmentsService {
  constructor(private prisma: PrismaService) {}

  private generateInviteCode(): string {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  async createTeam(
    ownerId: string,
    name: string,
    description?: string,
    visibility: string = 'PUBLIC',
    customization?: {
      avatarUrl?: string;
      bannerUrl?: string;
      primaryColor?: string;
      accentColor?: string;
      motto?: string;
      tagline?: string;
    },
  ) {
    const existingUser = await this.prisma.user.findUnique({ where: { id: ownerId } });
    if (!existingUser) throw new NotFoundException('User not found');
    if (existingUser.teamId) throw new BadRequestException('You are already in a team. Leave your current team first.');

    const existingTeam = await this.prisma.team.findUnique({ where: { name } });
    if (existingTeam) throw new ConflictException('Team name already taken');

    const inviteCode = this.generateInviteCode();

    const team = await this.prisma.team.create({
      data: {
        name,
        description: description || null,
        inviteCode,
        visibility,
        ownerId,
        avatarUrl: customization?.avatarUrl || null,
        bannerUrl: customization?.bannerUrl || null,
        primaryColor: customization?.primaryColor || '#229C62',
        accentColor: customization?.accentColor || '#7AD62A',
        motto: customization?.motto || null,
        tagline: customization?.tagline || null,
      },
    });

    // Create TeamMember entry for owner
    await this.prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: ownerId,
        role: 'LEADER',
      },
    });

    // Also set teamId on User for backward compatibility
    await this.prisma.user.update({
      where: { id: ownerId },
      data: { teamId: team.id },
    });

    return team;
  }

  async updateTeam(
    teamId: string,
    userId: string,
    data: {
      name?: string;
      description?: string;
      avatarUrl?: string;
      bannerUrl?: string;
      primaryColor?: string;
      accentColor?: string;
      motto?: string;
      tagline?: string;
    },
  ) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');
    if (team.ownerId !== userId) throw new ForbiddenException('Only the team leader can update the team');

    if (data.name && data.name !== team.name) {
      const existing = await this.prisma.team.findUnique({ where: { name: data.name } });
      if (existing) throw new ConflictException('Team name already taken');
    }

    return this.prisma.team.update({
      where: { id: teamId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        ...(data.bannerUrl !== undefined && { bannerUrl: data.bannerUrl }),
        ...(data.primaryColor !== undefined && { primaryColor: data.primaryColor }),
        ...(data.accentColor !== undefined && { accentColor: data.accentColor }),
        ...(data.motto !== undefined && { motto: data.motto }),
        ...(data.tagline !== undefined && { tagline: data.tagline }),
      },
    });
  }

  async joinTeam(userId: string, inviteCode: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.teamId) throw new BadRequestException('You are already in a team. Leave your current team first.');

    const team = await this.prisma.team.findFirst({
      where: { inviteCode },
    });
    if (!team) throw new NotFoundException('Invalid invite code');

    const memberCount = await this.prisma.teamMember.count({ where: { teamId: team.id } });
    if (memberCount >= team.maxMembers) throw new BadRequestException(`Team is full (max ${team.maxMembers} members)`);

    const existingMember = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: team.id, userId } },
    });
    if (existingMember) throw new ConflictException('Already a member of this team');

    await this.prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId,
        role: 'MEMBER',
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { teamId: team.id },
    });

    return { message: `Joined team "${team.name}"`, teamId: team.id, teamName: team.name };
  }

  async joinTeamByName(userId: string, teamName: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.teamId) throw new BadRequestException('You are already in a team. Leave your current team first.');

    const team = await this.prisma.team.findFirst({
      where: { name: { equals: teamName, mode: 'insensitive' } },
    });
    if (!team) throw new NotFoundException('Team not found. Check the team name.');

    if (team.visibility === 'PRIVATE') {
      throw new ForbiddenException('This team is private. Use an invite code to join.');
    }

    const memberCount = await this.prisma.teamMember.count({ where: { teamId: team.id } });
    if (memberCount >= team.maxMembers) throw new BadRequestException(`Team is full (max ${team.maxMembers} members)`);

    await this.prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId,
        role: 'MEMBER',
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { teamId: team.id },
    });

    return { message: `Joined team "${team.name}"`, teamId: team.id };
  }

  async leaveTeam(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.teamId) throw new BadRequestException('You are not in a team');

    const team = await this.prisma.team.findUnique({ where: { id: user.teamId } });
    if (team?.ownerId === userId) throw new BadRequestException('Team owner cannot leave. Transfer ownership or disband the team.');

    await this.prisma.teamMember.deleteMany({
      where: { teamId: user.teamId, userId },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { teamId: null },
    });

    return { message: 'Left team' };
  }

  async removeMember(teamId: string, userId: string, requesterId: string) {
    const requesterMember = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: requesterId } },
    });
    if (!requesterMember || requesterMember.role !== 'LEADER') {
      throw new ForbiddenException('Only team leader can remove members');
    }

    if (userId === requesterId) {
      throw new BadRequestException('Leader cannot remove themselves. Use leave or disband.');
    }

    const member = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (!member) throw new NotFoundException('Member not found in this team');

    await this.prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId } },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { teamId: null },
    });

    return { message: 'Member removed' };
  }

  async disbandTeam(teamId: string, requesterId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');
    if (team.ownerId !== requesterId) throw new ForbiddenException('Only team owner can disband');

    // Remove all members
    await this.prisma.teamMember.deleteMany({ where: { teamId } });
    await this.prisma.user.updateMany({
      where: { teamId },
      data: { teamId: null },
    });

    // Remove team
    await this.prisma.team.delete({ where: { id: teamId } });

    return { message: 'Team disbanded' };
  }

  async getInviteCode(teamId: string, requesterId: string) {
    const member = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: requesterId } },
    });
    if (!member) throw new ForbiddenException('You are not a member of this team');

    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');

    return { inviteCode: team.inviteCode, teamName: team.name };
  }

  async refreshInviteCode(teamId: string, requesterId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');
    if (team.ownerId !== requesterId) throw new ForbiddenException('Only team owner can refresh invite code');

    const newCode = this.generateInviteCode();
    await this.prisma.team.update({
      where: { id: teamId },
      data: { inviteCode: newCode },
    });

    return { inviteCode: newCode };
  }

  async getTeams() {
    return this.prisma.team.findMany({
      where: { visibility: 'PUBLIC' },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        teamMembers: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        },
        courseEnrollments: {
          include: { course: { select: { id: true, title: true } } },
        },
        _count: { select: { teamMembers: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyTeam(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.teamId) return null;

    return this.prisma.team.findUnique({
      where: { id: user.teamId },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        teamMembers: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, xp: true, division: true } } },
          orderBy: { role: 'asc' },
        },
        courseEnrollments: {
          include: { course: { select: { id: true, title: true, imageUrl: true } } },
        },
      },
    });
  }

  async getTeam(teamId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true, xp: true } },
        teamMembers: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, xp: true, division: true } } },
          orderBy: { role: 'asc' },
        },
        courseEnrollments: {
          include: { course: { select: { id: true, title: true, imageUrl: true } } },
        },
      },
    });
    if (!team) throw new NotFoundException('Team not found');
    return team;
  }

  async enrollTeamInCourse(teamId: string, courseId: string, requesterId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { teamMembers: { include: { user: { select: { id: true } } } } },
    });
    if (!team) throw new NotFoundException('Team not found');
    if (team.ownerId !== requesterId) throw new ForbiddenException('Only team owner can enroll');

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
    for (const member of team.teamMembers) {
      await this.prisma.courseEnrollment.upsert({
        where: { userId_courseId: { userId: member.user.id, courseId } },
        create: { userId: member.user.id, courseId },
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
        teamMembers: {
          include: {
            user: { select: { id: true, name: true, xp: true, division: true, currentStreak: true } },
          },
          orderBy: { user: { xp: 'desc' } },
        },
      },
    });
    if (!team) throw new NotFoundException('Team not found');

    const members = team.teamMembers.map(tm => tm.user);
    const totalXP = members.reduce((sum, m) => sum + m.xp, 0);

    return {
      team: { id: team.id, name: team.name, totalXP, memberCount: members.length },
      members,
    };
  }

  async getCourseTeams(courseId: string) {
    const enrollments = await this.prisma.teamCourseEnrollment.findMany({
      where: { courseId },
      include: {
        team: {
          include: {
            teamMembers: {
              include: { user: { select: { id: true, name: true, xp: true } } },
            },
            _count: { select: { teamMembers: true } },
          },
        },
      },
    });

    return enrollments.map(e => ({
      ...e.team,
      enrolledAt: e.enrolledAt,
      totalXP: e.team.teamMembers.reduce((sum, tm) => sum + tm.user.xp, 0),
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
