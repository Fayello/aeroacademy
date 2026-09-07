import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MissionService } from './mission.service';
import { FeatureUnlockService } from './feature-unlock.service';
import { ProgressionService } from '../common/progression.service';
import { EventsService } from '../common/events.service';
import { EmailService } from '../email/email.service';
import { getRequiredLabLevel, getLevel } from '../common/level.util';

@Injectable()
export class ChallengesService {
  private readonly logger = new Logger(ChallengesService.name);

  constructor(
    private prisma: PrismaService,
    private missionService: MissionService,
    private featureUnlockService: FeatureUnlockService,
    private progressionService: ProgressionService,
    private eventsService: EventsService,
    private emailService: EmailService,
  ) {}

  async findAll() {
    return this.prisma.challenge.findMany({
      where: { isActive: true },
      include: {
        domain: { select: { name: true, displayName: true } },
        skill: { select: { name: true, displayName: true } },
        _count: { select: { userChallenges: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id },
      include: {
        domain: { select: { name: true, displayName: true } },
        skill: { select: { name: true, displayName: true } },
        userChallenges: {
          include: { user: { select: { id: true, name: true, xp: true } } },
          orderBy: { progress: 'desc' },
        },
      },
    });
    if (!challenge) throw new NotFoundException('Challenge not found');
    return challenge;
  }

  async getDailyMissions(userId: string) {
    const unlocked = await this.featureUnlockService.isFeatureUnlocked(
      userId,
      'DAILY_MISSIONS',
    );
    if (!unlocked) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { xp: true },
      });
      const level = Math.floor((user?.xp || 0) / 1000) + 1;
      throw new BadRequestException(
        `Daily missions unlock at Level 2. You are Level ${level}.`,
      );
    }
    return this.missionService.getDailyMissions(userId);
  }

  async claimReward(userId: string, challengeId: string) {
    return this.missionService.claimReward(userId, challengeId);
  }

  async getSkillProfile(userId: string) {
    const unlocked = await this.featureUnlockService.isFeatureUnlocked(
      userId,
      'SKILL_PROFILE',
    );
    const skills = unlocked
      ? await this.progressionService.getSkillProfile(userId)
      : [];
    return { unlocked, skills };
  }

  async getLeaderboard(challengeId: string) {
    return this.prisma.userChallenge.findMany({
      where: { challengeId },
      include: {
        user: { select: { id: true, name: true, username: true, xp: true } },
      },
      orderBy: { progress: 'desc' },
      take: 20,
    });
  }

  async joinChallenge(userId: string, challengeId: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
    });
    if (!challenge) throw new NotFoundException('Challenge not found');
    if (!challenge.isActive) throw new BadRequestException('Challenge is no longer active');

    const now = new Date();
    if (now < challenge.startAt) throw new BadRequestException('Challenge has not started yet');
    if (now > challenge.endAt) throw new BadRequestException('Challenge has ended');

    const existing = await this.prisma.userChallenge.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
    });
    if (existing) return existing;

    return this.prisma.userChallenge.create({
      data: {
        userId,
        challengeId,
        target: challenge.objectiveTarget,
      },
      include: {
        challenge: { select: { id: true, title: true, objectiveTarget: true } },
      },
    });
  }

  async recordLabChallengeTime(userId: string, labId: string) {
    const challenge = await this.prisma.labChallenge.findFirst({
      where: {
        labId,
        status: 'ACCEPTED',
        OR: [{ challengerId: userId }, { opponentId: userId }],
      },
    });
    if (!challenge) return null;

    const isChallenger = challenge.challengerId === userId;
    const timeField = isChallenger ? 'challengerTime' : 'opponentTime';
    const alreadySubmitted = isChallenger ? challenge.challengerTime : challenge.opponentTime;
    if (alreadySubmitted !== null) return null;

    const elapsed = Math.floor((Date.now() - challenge.createdAt.getTime()) / 1000);

    const updateData: Record<string, unknown> = {
      [timeField]: elapsed,
    };

    const otherTime = isChallenger ? challenge.opponentTime : challenge.challengerTime;
    if (otherTime !== null) {
      updateData.winnerId = elapsed < otherTime ? userId : elapsed > otherTime ? (isChallenger ? challenge.opponentId : challenge.challengerId) : null;
      updateData.status = 'COMPLETED';
    }

    return this.prisma.labChallenge.update({
      where: { id: challenge.id },
      data: updateData,
      include: {
        challenger: { select: { id: true, name: true, username: true } },
        opponent: { select: { id: true, name: true, username: true } },
        lab: { select: { id: true, title: true } },
      },
    });
  }

  async cancelLabChallenge(userId: string, challengeId: string) {
    const challenge = await this.prisma.labChallenge.findUnique({ where: { id: challengeId } });
    if (!challenge) throw new NotFoundException('Challenge not found');
    if (challenge.challengerId !== userId) throw new BadRequestException('Only the challenger can cancel');
    if (challenge.status !== 'PENDING') throw new BadRequestException('Can only cancel pending challenges');

    return this.prisma.labChallenge.update({
      where: { id: challengeId },
      data: { status: 'DECLINED' },
    });
  }

  async sendLabChallenge(challengerId: string, opponentId: string, labId: string) {
    if (challengerId === opponentId) {
      throw new BadRequestException('Cannot challenge yourself');
    }

    const lab = await this.prisma.lab.findUnique({ where: { id: labId } });
    if (!lab) throw new NotFoundException('Lab not found');

    const requiredLevel = getRequiredLabLevel(lab.difficulty || 1200);

    const [challenger, opponent] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: challengerId }, select: { xp: true, name: true } }),
      this.prisma.user.findUnique({ where: { id: opponentId }, select: { xp: true, name: true } }),
    ]);

    const challengerLevel = getLevel(challenger?.xp || 0);
    const opponentLevel = getLevel(opponent?.xp || 0);

    if (challengerLevel < requiredLevel) {
      throw new BadRequestException(`You need Level ${requiredLevel} to challenge on this lab. You are Level ${challengerLevel}.`);
    }
    if (opponentLevel < requiredLevel) {
      throw new BadRequestException(`${opponent?.name || 'Opponent'} needs Level ${requiredLevel} for this lab. They are Level ${opponentLevel}.`);
    }

    const existing = await this.prisma.labChallenge.findFirst({
      where: {
        challengerId,
        opponentId,
        labId,
        status: { in: ['PENDING', 'ACCEPTED'] },
      },
    });
    if (existing) {
      throw new BadRequestException('Challenge already pending or active');
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    const result = await this.prisma.labChallenge.create({
      data: {
        challengerId,
        opponentId,
        labId,
        expiresAt,
      },
      include: {
        challenger: { select: { id: true, name: true, username: true } },
        opponent: { select: { id: true, name: true, username: true, email: true } },
        lab: { select: { id: true, title: true, difficulty: true } },
      },
    });

    const challengerName = result.challenger.name || result.challenger.username;
    const labTitle = result.lab.title;
    const msg = `${challengerName} challenged you to "${labTitle}"`;

    this.eventsService.emit('LAB_CHALLENGE_SENT', {
      userId: opponentId,
      message: msg,
    });
    this.eventsService.emit('LAB_CHALLENGE_SENT', {
      userId: challengerId,
      message: `You challenged ${result.opponent.name || result.opponent.username} to "${labTitle}"`,
    });

    if (result.opponent.email) {
      this.emailService.sendChallengeReceived(
        result.opponent.email,
        challengerName,
        labTitle,
      ).catch((err) => this.logger.error(`Failed to send challenge email: ${err.message}`));
    }

    return result;
  }

  async getMyLabChallenges(userId: string) {
    return this.prisma.labChallenge.findMany({
      where: {
        OR: [{ challengerId: userId }, { opponentId: userId }],
      },
      include: {
        challenger: { select: { id: true, name: true, username: true, xp: true } },
        opponent: { select: { id: true, name: true, username: true, xp: true } },
        lab: { select: { id: true, title: true, difficulty: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async acceptLabChallenge(userId: string, challengeId: string) {
    const challenge = await this.prisma.labChallenge.findUnique({ where: { id: challengeId } });
    if (!challenge) throw new NotFoundException('Challenge not found');
    if (challenge.opponentId !== userId) throw new BadRequestException('Not your challenge');
    if (challenge.status !== 'PENDING') throw new BadRequestException('Challenge is not pending');
    if (new Date() > challenge.expiresAt) throw new BadRequestException('Challenge expired');

    const result = await this.prisma.labChallenge.update({
      where: { id: challengeId },
      data: { status: 'ACCEPTED' },
      include: {
        challenger: { select: { id: true, name: true, username: true, email: true } },
        opponent: { select: { id: true, name: true, username: true } },
        lab: { select: { id: true, title: true } },
      },
    });

    const opponentName = result.opponent.name || result.opponent.username;
    const labTitle = result.lab.title;

    this.eventsService.emit('LAB_CHALLENGE_ACCEPTED', {
      userId: challenge.challengerId,
      message: `${opponentName} accepted your challenge on "${labTitle}"`,
    });

    if (result.challenger.email) {
      this.emailService.sendChallengeAccepted(
        result.challenger.email,
        opponentName,
        labTitle,
      ).catch((err) => this.logger.error(`Failed to send challenge accepted email: ${err.message}`));
    }

    return result;
  }

  async declineLabChallenge(userId: string, challengeId: string) {
    const challenge = await this.prisma.labChallenge.findUnique({ where: { id: challengeId } });
    if (!challenge) throw new NotFoundException('Challenge not found');
    if (challenge.opponentId !== userId) throw new BadRequestException('Not your challenge');

    return this.prisma.labChallenge.update({
      where: { id: challengeId },
      data: { status: 'DECLINED' },
    });
  }

  async completeLabChallenge(userId: string, challengeId: string) {
    const challenge = await this.prisma.labChallenge.findUnique({ where: { id: challengeId } });
    if (!challenge) throw new NotFoundException('Challenge not found');
    if (challenge.challengerId !== userId && challenge.opponentId !== userId) {
      throw new BadRequestException('Not part of this challenge');
    }
    if (challenge.status !== 'ACCEPTED') throw new BadRequestException('Challenge not active');

    const isChallenger = challenge.challengerId === userId;
    const timeField = isChallenger ? 'challengerTime' : 'opponentTime';

    const startTime = challenge.createdAt;
    const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);

    const updateData: Record<string, unknown> = {
      [timeField]: elapsed,
    };

    const otherTime = isChallenger ? challenge.opponentTime : challenge.challengerTime;
    const bothDone = otherTime !== null;
    if (bothDone) {
      const myTime = elapsed;
      updateData.winnerId = myTime < otherTime ? userId : myTime > otherTime ? (isChallenger ? challenge.opponentId : challenge.challengerId) : null;
      updateData.status = 'COMPLETED';
    }

    const result = await this.prisma.labChallenge.update({
      where: { id: challengeId },
      data: updateData,
      include: {
        challenger: { select: { id: true, name: true, username: true, email: true } },
        opponent: { select: { id: true, name: true, username: true, email: true } },
        lab: { select: { id: true, title: true } },
      },
    });

    if (bothDone) {
      const winnerId = result.winnerId;
      const loserId = winnerId
        ? winnerId === result.challengerId ? result.opponentId : result.challengerId
        : null;
      const labTitle = result.lab.title;

      if (winnerId) {
        const winnerName = winnerId === result.challengerId
          ? (result.challenger.name || result.challenger.username)
          : (result.opponent.name || result.opponent.username);

        this.eventsService.emit('LAB_CHALLENGE_COMPLETED', {
          userId: winnerId,
          title: 'Challenge Won',
          message: `You beat ${winnerId === result.challengerId ? (result.opponent.name || result.opponent.username) : (result.challenger.name || result.challenger.username)} on "${labTitle}"`,
        });
        if (loserId) {
          this.eventsService.emit('LAB_CHALLENGE_COMPLETED', {
            userId: loserId,
            title: 'Challenge Lost',
            message: `${winnerName} beat you on "${labTitle}"`,
          });
        }

        const winnerEmail = winnerId === result.challengerId ? result.challenger.email : result.opponent.email;
        const loserEmail = loserId === (result.challengerId) ? result.challenger.email : result.opponent.email;
        const loserName = loserId === result.challengerId
          ? (result.challenger.name || result.challenger.username)
          : (result.opponent.name || result.opponent.username);

        if (winnerEmail) {
          this.emailService.sendChallengeCompleted(
            winnerEmail, winnerName, labTitle, true,
          ).catch((err) => this.logger.error(`Challenge email failed: ${err.message}`));
        }
        if (loserEmail) {
          this.emailService.sendChallengeCompleted(
            loserEmail, loserName, labTitle, false,
          ).catch((err) => this.logger.error(`Challenge email failed: ${err.message}`));
        }
      } else {
        this.eventsService.emit('LAB_CHALLENGE_COMPLETED', {
          userId: result.challengerId,
          title: 'Challenge Tied',
          message: `Your challenge on "${labTitle}" ended in a tie`,
        });
        this.eventsService.emit('LAB_CHALLENGE_COMPLETED', {
          userId: result.opponentId,
          title: 'Challenge Tied',
          message: `Your challenge on "${labTitle}" ended in a tie`,
        });
      }
    }

    return result;
  }
}
