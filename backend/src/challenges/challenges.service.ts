import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class ChallengesService {
  private readonly logger = new Logger(ChallengesService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async findAll() {
    return this.prisma.challenge.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { participants: true, teamParticipants: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, email: true, xp: true } } },
          orderBy: { progress: 'desc' },
        },
        teamParticipants: {
          include: { team: { select: { id: true, name: true } } },
          orderBy: { progress: 'desc' },
        },
      },
    });
    if (!challenge) throw new NotFoundException('Challenge not found');
    return challenge;
  }

  async joinChallenge(userId: string, challengeId: string) {
    const challenge = await this.prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) throw new NotFoundException('Challenge not found');
    if (!challenge.isActive) throw new BadRequestException('Challenge is no longer active');
    if (new Date(challenge.endDate) < new Date()) throw new BadRequestException('Challenge has ended');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (challenge.type === 'TEAM') {
      if (!user.teamId) throw new BadRequestException('You must be in a team to join team challenges');
      return this.joinTeamChallenge(user.teamId, challengeId);
    }

    const existing = await this.prisma.challengeParticipant.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
    });
    if (existing) throw new BadRequestException('Already joined this challenge');

    return this.prisma.challengeParticipant.create({
      data: { challengeId, userId },
    });
  }

  private async joinTeamChallenge(teamId: string, challengeId: string) {
    const existing = await this.prisma.teamChallengeParticipant.findUnique({
      where: { challengeId_teamId: { challengeId, teamId } },
    });
    if (existing) throw new BadRequestException('Team already joined this challenge');

    return this.prisma.teamChallengeParticipant.create({
      data: { challengeId, teamId },
    });
  }

  async updateProgress(userId: string) {
    const participations = await this.prisma.challengeParticipant.findMany({
      where: { userId, completed: false },
      include: { challenge: true },
    });

    for (const participation of participations) {
      const challenge = participation.challenge;
      if (new Date(challenge.endDate) < new Date()) continue;

      let progress = 0;

      switch (challenge.goalType) {
        case 'LESSONS_COMPLETED':
          progress = await this.prisma.progress.count({
            where: { userId, completed: true },
          });
          break;
        case 'FLAGS_CAPTURED':
          progress = await this.prisma.labSubmission.count({
            where: { userId, isCorrect: true },
          });
          break;
        case 'XP_EARNED':
          const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { xp: true } });
          progress = user?.xp || 0;
          break;
        case 'STREAK_DAYS':
          const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { currentStreak: true } });
          progress = u?.currentStreak || 0;
          break;
      }

      const completed = progress >= challenge.goalCount;

      if (progress !== participation.progress) {
        await this.prisma.challengeParticipant.update({
          where: { id: participation.id },
          data: { progress, completed },
        });

        if (completed && !participation.completed) {
          if (challenge.xpReward > 0) {
            await this.prisma.user.update({
              where: { id: userId },
              data: { xp: { increment: challenge.xpReward } },
            });
          }

          const user = await this.prisma.user.findUnique({ where: { id: userId } });
          if (user?.email) {
            this.emailService.send({
              to: user.email,
              from: 'labs',
              subject: `Challenge complete: ${challenge.title}`,
              html: `<p>Congratulations! You completed the challenge "${challenge.title}" and earned ${challenge.xpReward} XP.</p>`,
            }).catch(() => {});
          }

          this.logger.log(`User ${userId} completed challenge "${challenge.title}"`);
        }
      }
    }
  }

  async createChallenge(data: {
    title: string;
    description: string;
    type?: string;
    goalType: string;
    goalCount: number;
    xpReward?: number;
    startDate: string;
    endDate: string;
  }) {
    return this.prisma.challenge.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type || 'INDIVIDUAL',
        goalType: data.goalType,
        goalCount: data.goalCount,
        xpReward: data.xpReward || 0,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
    });
  }

  async getLeaderboard(challengeId: string) {
    const challenge = await this.prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) throw new NotFoundException('Challenge not found');

    if (challenge.type === 'TEAM') {
      return this.prisma.teamChallengeParticipant.findMany({
        where: { challengeId },
        include: { team: { select: { id: true, name: true } } },
        orderBy: { progress: 'desc' },
        take: 20,
      });
    }

    return this.prisma.challengeParticipant.findMany({
      where: { challengeId },
      include: { user: { select: { id: true, name: true, email: true, xp: true } } },
      orderBy: { progress: 'desc' },
      take: 20,
    });
  }
}
