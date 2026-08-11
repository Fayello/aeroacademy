import { Injectable, NotFoundException, BadRequestException, ForbiddenException, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../common/events.service';
import { AchievementService } from '../dashboard/achievement.service';
import { LeaguesService } from '../leagues/leagues.service';
import { verifyAnswer, decryptCredentials } from '../common/crypto.util';
import { getLevel, getRequiredLabLevel } from '../common/level.util';
import Docker from 'dockerode';
import * as net from 'net';
import createLogger from '../common/logger';

const logger = createLogger('Labs');

const LAB_EXPIRY_HOURS = parseInt(process.env.LAB_EXPIRY_HOURS || '2', 10);
const LAB_MEMORY_MB = parseInt(process.env.LAB_MEMORY_MB || '512', 10);
const LAB_CPU_QUOTA = parseInt(process.env.LAB_CPU_QUOTA || '100000', 10);
const PORT_RANGE_START = parseInt(process.env.LAB_PORT_START || '8000', 10);
const PORT_RANGE_END = parseInt(process.env.LAB_PORT_END || '9000', 10);
const MAX_CONCURRENT_LABS = parseInt(process.env.LAB_MAX_CONCURRENT || '20', 10);
const TERMINAL_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

@Injectable()
export class LabsService implements OnModuleInit {
  private docker: Docker;
  private portLock: Promise<void> = Promise.resolve();

  constructor(
    private prisma: PrismaService,
    private eventsService: EventsService,
    @Inject(forwardRef(() => AchievementService))
    private achievementService: AchievementService,
    private leaguesService: LeaguesService,
  ) {
    this.docker = new Docker();
  }

  async onModuleInit() {
    try {
      await this.docker.ping();
      logger.info('Connected to Docker daemon');
      await this.pruneOrphanedContainers();
    } catch {
      logger.error('Docker daemon unavailable. Labs will not work.');
    }
  }

  private async pruneOrphanedContainers() {
    try {
      const containers = await this.docker.listContainers({ all: true });
      const labContainers = containers.filter(c => c.Names.some(name => name.includes('/lab-')));

      for (const c of labContainers) {
        const container = this.docker.getContainer(c.Id);
        await container.stop().catch(() => {});
        await container.remove().catch(() => {});
      }

      await this.prisma.labInstance.updateMany({
        where: { status: 'RUNNING' },
        data: { status: 'STOPPED' }
      });

      try {
        await this.docker.createNetwork({ Name: 'tactical-net' });
      } catch {}

      try {
        const mongo = this.docker.getContainer('tactical-mongo');
        const info = await mongo.inspect();
        if (!info.State.Running) await mongo.start();
      } catch {
        try {
          await this.docker.createContainer({
            Image: 'mongo:4.4',
            name: 'tactical-mongo',
            HostConfig: {
              NetworkMode: 'tactical-net',
              Memory: 2 * 1024 * 1024 * 1024,
              CpuQuota: 200000,
            }
          }).then(c => c.start());
        } catch (e) {
          logger.error(`Failed to provision tactical-mongo: ${e.message}`);
        }
      }
    } catch (err) {
      logger.error(`Prune error: ${err.message}`);
    }
  }

  private async resolveLocalImage(requestedImage: string): Promise<string> {
    try {
      const localImages = await this.docker.listImages();
      const searchTerms = requestedImage.split('/').pop()?.split(':')[0] || requestedImage;

      const exactMatch = localImages.find(img =>
        img.RepoTags?.some(tag => tag === requestedImage || tag === `${requestedImage}:latest`)
      );
      if (exactMatch && exactMatch.RepoTags?.[0]) return exactMatch.RepoTags[0];

      const fuzzyMatch = localImages.find(img =>
        img.RepoTags?.some(tag => tag.toLowerCase().includes(searchTerms.toLowerCase()))
      );
      if (fuzzyMatch && fuzzyMatch.RepoTags?.[0]) return fuzzyMatch.RepoTags[0];

      return requestedImage.includes(':') ? requestedImage : `${requestedImage}:latest`;
    } catch {
      return requestedImage;
    }
  }

  async startLab(userId: string, labId: string) {
    const lab = await this.prisma.lab.findUnique({ where: { id: labId } });
    if (!lab) throw new NotFoundException('Lab not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const userLevel = getLevel(user.xp);
    const requiredLevel = getRequiredLabLevel(lab.difficulty || 1200);
    if (userLevel < requiredLevel) {
      throw new ForbiddenException(`Level ${requiredLevel} required to access this lab. Your level: ${userLevel}`);
    }

    const runningCount = await this.prisma.labInstance.count({ where: { status: 'RUNNING' } });
    if (runningCount >= MAX_CONCURRENT_LABS) {
      throw new BadRequestException('Lab capacity reached. Try again later.');
    }

    const existing = await this.prisma.labInstance.findFirst({
      where: { userId, labId, status: 'RUNNING' }
    });
    if (existing) return existing;

    const port = await this.getAvailablePort();
    if (!port) throw new BadRequestException('No available ports');

    const instance = await this.prisma.labInstance.create({
      data: {
        userId,
        labId,
        port,
        status: 'PROVISIONING',
        expiresAt: new Date(Date.now() + LAB_EXPIRY_HOURS * 60 * 60 * 1000),
      }
    });

    try {
      const imageName = await this.resolveLocalImage(lab.dockerImage);

      try {
        await this.docker.getImage(imageName).inspect();
      } catch {
        await new Promise((resolve, reject) => {
          this.docker.pull(imageName, (err: any, stream: any) => {
            if (err) return reject(err);
            this.docker.modem.followProgress(stream, (err: any) => {
              if (err) reject(err); else resolve(true);
            });
          });
        });
      }

      let internalPort = '80/tcp';
      if (imageName.toLowerCase().includes('juice-shop')) internalPort = '3000/tcp';
      else if (imageName.toLowerCase().includes('webgoat')) internalPort = '8080/tcp';
      else if (imageName.toLowerCase().includes('nodegoat')) internalPort = '4000/tcp';

      const env: string[] = [];
      if (imageName.toLowerCase().includes('nodegoat')) {
        const dbName = `nodegoat_${userId.replace(/-/g, '_')}`;
        env.push(`MONGODB_URI=mongodb://tactical-mongo:27017/${dbName}`);
      }

      const container = await this.docker.createContainer({
        Image: imageName,
        name: `lab-${labId.slice(0, 8)}-${userId.slice(0, 8)}-${Date.now()}`,
        ExposedPorts: { [internalPort]: {} },
        Env: env,
        HostConfig: {
          PortBindings: { [internalPort]: [{ HostPort: port.toString() }] },
          Memory: LAB_MEMORY_MB * 1024 * 1024,
          CpuQuota: LAB_CPU_QUOTA,
          NetworkMode: 'tactical-net',
        },
        NetworkingConfig: {
          EndpointsConfig: { 'tactical-net': {} }
        }
      });

      await container.start();

      return await this.prisma.labInstance.update({
        where: { id: instance.id },
        data: { containerId: container.id, status: 'RUNNING' }
      });

    } catch (err) {
      await this.prisma.labInstance.delete({ where: { id: instance.id } }).catch(() => {});
      logger.error(`Lab start failed for user ${userId}, lab ${labId}: ${err.message}`);
      throw new BadRequestException('Lab setup failed. Please try again later.');
    }
  }

  async stopLab(userId: string, labId: string) {
    const instance = await this.prisma.labInstance.findFirst({
      where: { userId, labId, status: 'RUNNING' }
    });

    if (!instance) return { success: true };
    if (!instance.containerId) {
      await this.prisma.labInstance.update({ where: { id: instance.id }, data: { status: 'STOPPED' } });
      return { success: true };
    }

    try {
      const container = this.docker.getContainer(instance.containerId);
      await container.stop().catch(() => {});
      await container.remove().catch(() => {});
    } catch {}

    await this.prisma.labInstance.update({
      where: { id: instance.id },
      data: { status: 'STOPPED' }
    }).catch(() => {});

    return { success: true };
  }

  async resetLab(userId: string, labId: string) {
    await this.stopLab(userId, labId);
    return this.startLab(userId, labId);
  }

  async healthCheckAll() {
    const activeInstances = await this.prisma.labInstance.findMany({
      where: { status: 'RUNNING' }
    });

    for (const instance of activeInstances) {
      if (!instance.containerId) continue;

      try {
        const container = this.docker.getContainer(instance.containerId);
        const info = await container.inspect();
        if (!info.State.Running) {
          await this.prisma.labInstance.update({
            where: { id: instance.id },
            data: { status: 'STOPPED' }
          });
        }
      } catch {
        await this.prisma.labInstance.update({
          where: { id: instance.id },
          data: { status: 'STOPPED' }
        });
      }
    }
  }

  async cleanupExpiredLabs() {
    const expiredInstances = await this.prisma.labInstance.findMany({
      where: {
        status: 'RUNNING',
        expiresAt: { lt: new Date() }
      }
    });

    for (const instance of expiredInstances) {
      try {
        if (!instance.containerId) continue;
        const container = this.docker.getContainer(instance.containerId);
        await container.stop().catch(() => {});
        await container.remove().catch(() => {});

        await this.prisma.labInstance.update({
          where: { id: instance.id },
          data: { status: 'EXPIRED' }
        });
      } catch {}
    }
  }

  async getLabStatus(userId: string, labId: string) {
    return this.prisma.labInstance.findFirst({
      where: { userId, labId, status: 'RUNNING' },
      include: { lab: { select: { id: true, title: true, description: true, difficulty: true } } }
    });
  }

  async findAll() {
    return this.prisma.lab.findMany({
      include: { flags: { include: { submissions: { where: { isCorrect: true }, select: { userId: true } } } } }
    });
  }

  async submitFlag(userId: string, flagId: string, answer: string) {
    const flag = await this.prisma.labFlag.findUnique({ where: { id: flagId } });
    if (!flag) throw new NotFoundException('Flag not found');

    const existingCorrect = await this.prisma.labSubmission.findFirst({
      where: { userId, flagId, isCorrect: true }
    });

    if (existingCorrect) {
      return { isCorrect: true, alreadySolved: true, message: 'Already solved.' };
    }

    const isCorrect = await verifyAnswer(answer, flag.correctAnswer);

    await this.prisma.labSubmission.create({
      data: { userId, flagId, answer: '[REDACTED]', isCorrect }
    });

    if (isCorrect) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { xp: { increment: flag.points } }
      });

      const lab = await this.prisma.lab.findUnique({ where: { id: flag.labId } });
      if (lab) await this.leaguesService.calculateUserElo(userId, lab.difficulty, true);

      await this.achievementService.checkAndUnlockAchievements(userId);

      this.eventsService.emit('FLAG_CAPTURED', {
        userId, flagTitle: flag.title, points: flag.points, timestamp: new Date()
      });
    }

    return {
      isCorrect,
      xpAwarded: isCorrect ? flag.points : 0,
      message: isCorrect ? `Correct! +${flag.points} XP` : 'Incorrect. Try again.'
    };
  }

  async getLabDefinition(id: string) {
    const lab = await this.prisma.lab.findUnique({
      where: { id },
      include: { flags: { include: { submissions: { where: { isCorrect: true } } } } }
    });
    if (!lab) throw new NotFoundException('Lab not found');

    let credentials = lab.credentials;
    if (typeof credentials === 'string') {
      try {
        credentials = decryptCredentials(credentials as string);
      } catch {
        try { credentials = JSON.parse(credentials as string); } catch { credentials = []; }
      }
    }

    return { ...lab, credentials };
  }

  async getGlobalStats() {
    const runningCount = await this.prisma.labInstance.count({ where: { status: 'RUNNING' } });
    const activeUsers = await this.prisma.labInstance.groupBy({
      by: ['userId'],
      where: { status: 'RUNNING' }
    });

    return {
      activeContainers: runningCount,
      activeUsers: activeUsers.length,
      capacityPercentage: Math.round((runningCount / MAX_CONCURRENT_LABS) * 100),
      maxCapacity: MAX_CONCURRENT_LABS,
      systemStatus: runningCount < MAX_CONCURRENT_LABS * 0.9 ? 'HEALTHY' : 'NEAR_CAPACITY'
    };
  }

  async create(data: { title: string; description: string; dockerImage: string; difficulty?: number; briefing?: string }) {
    return this.prisma.lab.create({ data });
  }

  async update(id: string, data: Record<string, any>) {
    const lab = await this.prisma.lab.findUnique({ where: { id } });
    if (!lab) throw new NotFoundException('Lab not found');
    return this.prisma.lab.update({ where: { id }, data });
  }

  async remove(id: string) {
    const lab = await this.prisma.lab.findUnique({ where: { id } });
    if (!lab) throw new NotFoundException('Lab not found');
    return this.prisma.lab.delete({ where: { id } });
  }

  private async getAvailablePort(): Promise<number | null> {
    const release = await this.acquireLock();

    try {
      const activeInstances = await this.prisma.labInstance.findMany({
        where: { status: { in: ['RUNNING', 'PROVISIONING'] } },
        select: { port: true }
      });

      const usedPorts = new Set(activeInstances.map(i => i.port));

      for (let port = PORT_RANGE_START; port <= PORT_RANGE_END; port++) {
        if (usedPorts.has(port)) continue;

        const isFree = await new Promise<boolean>((resolve) => {
          const server = net.createServer();
          server.once('error', () => resolve(false));
          server.once('listening', () => { server.close(); resolve(true); });
          server.listen(port);
        });

        if (isFree) return port;
      }

      return null;
    } finally {
      release();
    }
  }

  private async acquireLock(): Promise<() => void> {
    let release!: () => void;
    const nextLock = new Promise<void>(resolve => { release = resolve; });
    const currentLock = this.portLock;
    this.portLock = currentLock.then(() => nextLock);
    await currentLock;
    return release;
  }

  // === FLAG MANAGEMENT ===

  async createFlag(labId: string, data: { title: string; description?: string; points?: number; correctAnswer: string }) {
    const lab = await this.prisma.lab.findUnique({ where: { id: labId } });
    if (!lab) throw new NotFoundException('Lab not found');
    const bcrypt = require('bcrypt');
    const hashedAnswer = await bcrypt.hash(data.correctAnswer.trim().toLowerCase(), 10);
    return this.prisma.labFlag.create({
      data: {
        labId,
        title: data.title,
        description: data.description,
        points: data.points || 100,
        correctAnswer: hashedAnswer,
      },
    });
  }

  async updateFlag(flagId: string, data: { title?: string; description?: string; points?: number; correctAnswer?: string }) {
    const flag = await this.prisma.labFlag.findUnique({ where: { id: flagId } });
    if (!flag) throw new NotFoundException('Flag not found');
    const updateData: any = { ...data };
    if (data.correctAnswer) {
      const bcrypt = require('bcrypt');
      updateData.correctAnswer = await bcrypt.hash(data.correctAnswer.trim().toLowerCase(), 10);
    }
    return this.prisma.labFlag.update({ where: { id: flagId }, data: updateData });
  }

  async removeFlag(flagId: string) {
    const flag = await this.prisma.labFlag.findUnique({ where: { id: flagId } });
    if (!flag) throw new NotFoundException('Flag not found');
    return this.prisma.labFlag.delete({ where: { id: flagId } });
  }
}
