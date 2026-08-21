import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  OnModuleInit,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../common/events.service';
import { ActivityService } from '../common/activity.service';
import { AchievementService } from '../dashboard/achievement.service';
import { LeaguesService } from '../leagues/leagues.service';
import { verifyAnswer, decryptCredentials } from '../common/crypto.util';
import { getLevel, getRequiredLabLevel } from '../common/level.util';
import { DockerManager } from './docker-manager.service';
import { EmailService } from '../email/email.service';
import Docker from 'dockerode';
import * as net from 'net';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import createLogger from '../common/logger';

const logger = createLogger('Labs');

const LAB_EXPIRY_HOURS = parseInt(process.env.LAB_EXPIRY_HOURS || '2', 10);
const LAB_MEMORY_MB = parseInt(process.env.LAB_MEMORY_MB || '512', 10);
const LAB_CPU_QUOTA = parseInt(process.env.LAB_CPU_QUOTA || '100000', 10);
const PORT_RANGE_START = parseInt(process.env.LAB_PORT_START || '8000', 10);
const PORT_RANGE_END = parseInt(process.env.LAB_PORT_END || '9000', 10);
const MAX_CONCURRENT_LABS = parseInt(
  process.env.LAB_MAX_CONCURRENT || '40',
  10,
);
const MAX_LABS_PER_USER = parseInt(process.env.MAX_LABS_PER_USER || '3', 10);
const STALE_PROVISIONING_MS = parseInt(
  process.env.LAB_PROVISION_TIMEOUT_MS || (10 * 60 * 1000).toString(),
  10,
);

@Injectable()
export class LabsService implements OnModuleInit {
  private docker: Docker;
  private portLock: Promise<void> = Promise.resolve();

  constructor(
    private prisma: PrismaService,
    private eventsService: EventsService,
    private activityService: ActivityService,
    @Inject(forwardRef(() => AchievementService))
    private achievementService: AchievementService,
    private leaguesService: LeaguesService,
    private dockerManager: DockerManager,
    private emailService: EmailService,
  ) {
    this.docker = dockerManager.getLocalDocker();
  }

  async onModuleInit() {
    try {
      await this.docker.ping();
      logger.info('Connected to local Docker daemon');
      await this.pruneOrphanedContainers();
    } catch {
      logger.error('Docker daemon unavailable. Labs will not work.');
    }
  }

  private async updateStreak(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    const lastActivity = user.lastActivityDate;
    if (!lastActivity) {
      await this.prisma.user.update({ where: { id: userId }, data: { currentStreak: 1, longestStreak: Math.max(1, user.longestStreak), lastActivityDate: today } });
      return;
    }
    const lastDay = new Date(lastActivity);
    lastDay.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - lastDay.getTime()) / 86400000);
    if (diffDays === 0) return;
    if (diffDays === 1) {
      const newStreak = user.currentStreak + 1;
      await this.prisma.user.update({ where: { id: userId }, data: { currentStreak: newStreak, longestStreak: Math.max(newStreak, user.longestStreak), lastActivityDate: today } });
    } else {
      await this.prisma.user.update({ where: { id: userId }, data: { currentStreak: 1, lastActivityDate: today } });
    }
  }

  private async pruneOrphanedContainers() {
    try {
      const runningInstances = await this.prisma.labInstance.findMany({
        where: { status: 'RUNNING' },
        select: { containerId: true },
      });
      const activeContainerIds = new Set(runningInstances.map((i) => i.containerId).filter(Boolean));

      const containers = await this.docker.listContainers({ all: true });
      const labContainers = containers.filter((c) =>
        c.Names.some((name) => name.includes('/lab-')),
      );

      for (const c of labContainers) {
        if (activeContainerIds.has(c.Id)) continue;
        const container = this.docker.getContainer(c.Id);
        await container.stop().catch(() => {});
        await container.remove().catch(() => {});
      }

      const nonRunningStatuses: any[] = ['STOPPED', 'EXPIRED'];
      await this.prisma.labInstance.updateMany({
        where: { status: { in: nonRunningStatuses } },
        data: { status: 'STOPPED' },
      });

      try {
        await this.docker.createNetwork({ Name: 'tactical-net' });
      } catch {
        /* network already exists */
      }

      try {
        const mongo = this.docker.getContainer('tactical-mongo');
        const info = await mongo.inspect();
        if (!info.State.Running) await mongo.start();
      } catch {
        try {
          await this.docker
            .createContainer({
              Image: 'mongo:4.4',
              name: 'tactical-mongo',
              HostConfig: {
                NetworkMode: 'tactical-net',
                Memory: 2 * 1024 * 1024 * 1024,
                CpuQuota: 200000,
                RestartPolicy: { Name: 'unless-stopped' },
              },
            })
            .then((c) => c.start());
        } catch (e) {
          logger.error(
            `Failed to provision tactical-mongo: ${
              e instanceof Error ? e.message : String(e)
            }`,
          );
        }
      }
    } catch (err) {
      logger.error(
        `Prune error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private async resolveLocalImage(requestedImage: string, docker?: Docker): Promise<string> {
    const targetDocker = docker || this.docker;
    try {
      const localImages = await targetDocker.listImages();
      const searchTerms =
        requestedImage.split('/').pop()?.split(':')[0] || requestedImage;

      const exactMatch = localImages.find((img) =>
        img.RepoTags?.some(
          (tag) => tag === requestedImage || tag === `${requestedImage}:latest`,
        ),
      );
      if (exactMatch && exactMatch.RepoTags?.[0]) return exactMatch.RepoTags[0];

      const fuzzyMatch = localImages.find((img) =>
        img.RepoTags?.some((tag) =>
          tag.toLowerCase().includes(searchTerms.toLowerCase()),
        ),
      );
      if (fuzzyMatch && fuzzyMatch.RepoTags?.[0]) return fuzzyMatch.RepoTags[0];

      return requestedImage.includes(':')
        ? requestedImage
        : `${requestedImage}:latest`;
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
      throw new ForbiddenException(
        `Level ${requiredLevel} required to access this lab. Your level: ${userLevel}`,
      );
    }

    const existing = await this.prisma.labInstance.findFirst({
      where: { userId, labId, status: 'RUNNING' },
    });
    if (existing) return existing;

    const port = await this.getAvailablePort();
    if (!port) throw new BadRequestException('No available ports');

    // Pick the best server for this lab
    const serverId = this.dockerManager.pickServer();
    const targetDocker = this.dockerManager.getDockerForServer(serverId);
    if (!targetDocker) throw new BadRequestException('No Docker servers available');

    const result = await this.prisma.$transaction(async (tx) => {
      const runningCount = await tx.labInstance.count({
        where: { status: 'RUNNING' },
      });
      if (runningCount >= MAX_CONCURRENT_LABS) {
        throw new BadRequestException('Lab capacity reached. Try again later.');
      }

      const userRunningCount = await tx.labInstance.count({
        where: { userId, status: 'RUNNING' },
      });
      if (userRunningCount >= MAX_LABS_PER_USER) {
        throw new BadRequestException(
          `You can only run ${MAX_LABS_PER_USER} labs at a time. Stop a running lab first.`,
        );
      }

      return tx.labInstance.create({
        data: {
          userId,
          labId,
          port,
          serverId,
          status: 'PROVISIONING',
          expiresAt: new Date(Date.now() + LAB_EXPIRY_HOURS * 60 * 60 * 1000),
        },
      });
    });

    const instance = result;

    try {
      const imageName = await this.resolveLocalImage(lab.dockerImage, targetDocker);

      try {
        await targetDocker.getImage(imageName).inspect();
      } catch {
        await new Promise<void>((resolve, reject) => {
          void targetDocker.pull(
            imageName,
            (err: Error | null, stream: NodeJS.ReadableStream | undefined) => {
              if (err) {
                reject(err instanceof Error ? err : new Error(String(err)));
                return;
              }
              if (stream) {
                targetDocker.modem.followProgress(stream, (error) => {
                  if (error) reject(error);
                  else resolve();
                });
              } else {
                resolve();
              }
            },
          );
        });
      }

      let internalPort = '80/tcp';
      if (imageName.toLowerCase().includes('juice-shop'))
        internalPort = '3000/tcp';
      else if (imageName.toLowerCase().includes('webgoat'))
        internalPort = '8080/tcp';
      else if (imageName.toLowerCase().includes('nodegoat'))
        internalPort = '4000/tcp';

      const env: string[] = [];
      if (imageName.toLowerCase().includes('nodegoat')) {
        const dbName = `nodegoat_${userId.replace(/-/g, '_')}`;
        env.push(`MONGODB_URI=mongodb://tactical-mongo:27017/${dbName}`);
      }

      const serviceImages = ['juice-shop', 'webgoat', 'nodegoat', 'webgoat', 'dvwa', 'vapi'];
      const isServiceImage = serviceImages.some(name => imageName.toLowerCase().includes(name));

      const containerOpts: any = {
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
          EndpointsConfig: { 'tactical-net': {} },
        },
      };

      if (!isServiceImage) {
        containerOpts.Cmd = ['tail', '-f', '/dev/null'];
      }

      const container = await targetDocker.createContainer(containerOpts);

      await container.start();
      this.dockerManager.incrementLabs(serverId);

      try {
        const setupExec = await container.exec({
          AttachStdin: false,
          AttachStdout: false,
          AttachStderr: false,
          Cmd: ['bash', '-c', 'id student >/dev/null 2>&1 || (useradd -m -s /bin/bash student && echo "student:lab123" | chpasswd && echo "student ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/student && chmod 0440 /etc/sudoers.d/student); exit 0'],
        });
        await setupExec.start({ hijack: false });
        logger.info('Student user setup complete');
      } catch (err) {
        logger.warn(`Student user setup failed: ${err instanceof Error ? err.message : String(err)}`);
      }

      // Install lab-specific packages based on Docker image
      try {
        const image = (lab.dockerImage || '').toLowerCase();
        let pkgCmd = '';
        if (image.includes('ubuntu') || image.includes('debian')) {
          pkgCmd = 'apt-get update -qq && apt-get install -y -qq acl rsyslog openssh-server cron aide iptables fail2ban-client net-tools iputils-ping curl wget > /dev/null 2>&1; service rsyslog start 2>/dev/null; service cron start 2>/dev/null; service ssh start 2>/dev/null; exit 0';
        } else if (image.includes('centos') || image.includes('rhel')) {
          pkgCmd = 'dnf install -y -q acl rsyslog openssh-server cronie aide iptables-regs net-tools iputils curl wget > /dev/null 2>&1; systemctl start rsyslog 2>/dev/null; systemctl start crond 2>/dev/null; systemctl start sshd 2>/dev/null; exit 0';
        }
        if (pkgCmd) {
          const pkgExec = await container.exec({
            AttachStdin: false, AttachStdout: false, AttachStderr: false,
            Cmd: ['bash', '-c', pkgCmd],
          });
          await pkgExec.start({ hijack: false });
          logger.info(`Package setup complete for image: ${image}`);
        }
      } catch (err) {
        logger.warn(`Package setup failed: ${err instanceof Error ? err.message : String(err)}`);
      }

      const updated = await this.prisma.labInstance.update({
        where: { id: instance.id },
        data: { containerId: container.id, status: 'RUNNING' },
      });

      // Check if first lab
      const priorLabCount = await this.prisma.labInstance.count({
        where: { userId, id: { not: instance.id } },
      });
      if (priorLabCount === 0) {
        this.emailService.sendFirstLabLaunched(user.email, user.name).catch(() => {});
      }

      logger.info(`Lab started on ${serverId}: ${lab.title} for user ${userId}`);

      await this.activityService
        .log(userId, 'LAB_STARTED', {
          labId: lab.id,
          labTitle: lab.title,
          instanceId: instance.id,
          serverId,
        })
        .catch(() => {});

      this.emailService.sendLabStarted(user.email, user.name, lab.title, updated.expiresAt).catch(() => {});

      return updated;
    } catch (err) {
      await this.prisma.labInstance
        .delete({ where: { id: instance.id } })
        .catch(() => {});
      logger.error(
        `Lab start failed for user ${userId}, lab ${labId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      throw new BadRequestException(
        'Lab setup failed. Please try again later.',
      );
    }
  }

  async stopLab(userId: string, labId: string) {
    const instance = await this.prisma.labInstance.findFirst({
      where: { userId, labId, status: 'RUNNING' },
    });

    if (!instance) return { success: true };
    if (!instance.containerId) {
      await this.prisma.labInstance.update({
        where: { id: instance.id },
        data: { status: 'STOPPED' },
      });
      return { success: true };
    }

    try {
      const targetDocker = this.dockerManager.getDockerForServer(instance.serverId || 'local') || this.docker;
      const container = targetDocker.getContainer(instance.containerId);
      await container.stop().catch(() => {});
      await container.remove().catch(() => {});
      this.dockerManager.decrementLabs(instance.serverId || 'local');
    } catch {
      /* containers may already be stopped/removed */
    }

    await this.prisma.labInstance
      .update({
        where: { id: instance.id },
        data: { status: 'STOPPED' },
      });

    const lab = await this.prisma.lab.findUnique({ where: { id: labId } });
    await this.activityService
      .log(userId, 'LAB_STOPPED', {
        labId,
        labTitle: lab?.title || 'Unknown Lab',
        instanceId: instance.id,
      })
      .catch(() => {});

    return { success: true };
  }

  async resetLab(userId: string, labId: string) {
    await this.stopLab(userId, labId);
    return this.startLab(userId, labId);
  }

  async healthCheckAll() {
    const activeInstances = await this.prisma.labInstance.findMany({
      where: { status: 'RUNNING' },
    });

    for (const instance of activeInstances) {
      if (!instance.containerId) continue;

      try {
        const targetDocker = this.dockerManager.getDockerForServer(instance.serverId || 'local') || this.docker;
        const container = targetDocker.getContainer(instance.containerId);
        const info = await container.inspect();
        if (!info.State.Running) {
          this.dockerManager.decrementLabs(instance.serverId || 'local');
          await this.prisma.labInstance.update({
            where: { id: instance.id },
            data: { status: 'STOPPED' },
          });
        }
      } catch {
        this.dockerManager.decrementLabs(instance.serverId || 'local');
        await this.prisma.labInstance.update({
          where: { id: instance.id },
          data: { status: 'STOPPED' },
        });
      }
    }
  }

  async cleanupExpiredLabs() {
    const expiredInstances = await this.prisma.labInstance.findMany({
      where: {
        status: 'RUNNING',
        expiresAt: { lt: new Date() },
      },
    });

    for (const instance of expiredInstances) {
      try {
        if (!instance.containerId) continue;
        const targetDocker = this.dockerManager.getDockerForServer(instance.serverId || 'local') || this.docker;
        const container = targetDocker.getContainer(instance.containerId);
        await container.stop().catch(() => {});
        await container.remove().catch(() => {});
        this.dockerManager.decrementLabs(instance.serverId || 'local');

        await this.prisma.labInstance.update({
          where: { id: instance.id },
          data: { status: 'EXPIRED' },
        });

        const labWithUser = await this.prisma.labInstance.findUnique({
          where: { id: instance.id },
          include: { lab: { select: { title: true } }, user: { select: { email: true, name: true } } },
        });
        if (labWithUser) {
          this.emailService.sendLabExpired(labWithUser.user.email, labWithUser.user.name, labWithUser.lab.title).catch(() => {});
        }
      } catch {
        /* container may already be gone */
      }
    }

    const staleProvisioning = await this.prisma.labInstance.findMany({
      where: {
        status: 'PROVISIONING',
        createdAt: { lt: new Date(Date.now() - STALE_PROVISIONING_MS) },
      },
    });

    for (const instance of staleProvisioning) {
      try {
        if (instance.containerId) {
          const targetDocker = this.dockerManager.getDockerForServer(instance.serverId || 'local') || this.docker;
          const container = targetDocker.getContainer(instance.containerId);
          await container.stop().catch(() => {});
          await container.remove().catch(() => {});
        }
        await this.prisma.labInstance.update({
          where: { id: instance.id },
          data: { status: 'STOPPED' },
        });
      } catch {
        /* container may already be gone */
      }
    }
  }

  async getLabStatus(userId: string, labId: string) {
    return this.prisma.labInstance.findFirst({
      where: { userId, labId, status: 'RUNNING' },
      include: {
        lab: {
          select: {
            id: true,
            title: true,
            description: true,
            difficulty: true,
          },
        },
      },
    });
  }

  async findAll(opts?: { skip?: number; take?: number; userId?: string; userRole?: string }) {
    const labs = await this.prisma.lab.findMany({
      skip: opts?.skip ?? 0,
      take: opts?.take ?? 50,
      include: {
        flags: {
          include: {
            submissions: {
              where: opts?.userId ? { isCorrect: true, userId: opts.userId } : { isCorrect: true },
              select: { userId: true },
            },
          },
        },
      },
    });

    if (opts?.userId) {
      const user = await this.prisma.user.findUnique({ where: { id: opts.userId } });
      const userLevel = user ? getLevel(user.xp) : 1;
      return labs.map((lab) => {
        const requiredLevel = getRequiredLabLevel(lab.difficulty || 1200);
        return {
          ...lab,
          isLocked: userLevel < requiredLevel,
          requiredLevel,
        };
      });
    }

    return labs.map((lab) => ({
      ...lab,
      isLocked: false,
      requiredLevel: getRequiredLabLevel(lab.difficulty || 1200),
    }));
  }

  async submitFlag(userId: string, flagId: string, answer: string) {
    const flag = await this.prisma.labFlag.findUnique({
      where: { id: flagId },
    });
    if (!flag) throw new NotFoundException('Flag not found');

    const activeInstance = await this.prisma.labInstance.findFirst({
      where: { userId, labId: flag.labId, status: 'RUNNING' },
    });
    if (!activeInstance) {
      throw new BadRequestException('You must have an active lab instance to submit flags.');
    }

    const existingCorrect = await this.prisma.labSubmission.findFirst({
      where: { userId, flagId, isCorrect: true },
    });

    if (existingCorrect) {
      return {
        isCorrect: true,
        alreadySolved: true,
        message: 'Already solved.',
      };
    }

    const isCorrect = await verifyAnswer(answer, flag.correctAnswer);

    await this.prisma.$transaction(async (tx) => {
      await tx.labSubmission.create({
        data: { userId, flagId, answer: '[REDACTED]', isCorrect },
      });

      if (isCorrect) {
        await tx.user.update({
          where: { id: userId },
          data: { xp: { increment: flag.points } },
        });
      }
    });

    if (isCorrect) {
      const lab = await this.prisma.lab.findUnique({
        where: { id: flag.labId },
      });
      if (lab)
        await this.leaguesService.calculateUserElo(
          userId,
          lab.difficulty,
          true,
        );

      // Check if first flag (submission already created in transaction above)
      const priorCorrectCount = await this.prisma.labSubmission.count({
        where: { userId, isCorrect: true },
      });
      if (priorCorrectCount === 1) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user) {
          this.emailService.sendFirstFlagCaptured(user.email, user.name, lab?.title || 'Unknown Lab', flag.points).catch(() => {});
        }
      }

      await this.achievementService.checkAndUnlockAchievements(userId);

      // Check if lab is now fully complete (all flags captured)
      const totalFlagsInLab = await this.prisma.labFlag.count({ where: { labId: flag.labId } });
      const capturedFlagIds = await this.prisma.labSubmission.findMany({
        where: { userId, isCorrect: true, flag: { labId: flag.labId } },
        select: { flagId: true },
        distinct: ['flagId'],
      });
      if (capturedFlagIds.length >= totalFlagsInLab && totalFlagsInLab > 0) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user) {
          const flagPoints = await this.prisma.labFlag.findMany({
            where: { labId: flag.labId },
            select: { points: true },
          });
          const totalXp = flagPoints.reduce((sum, f) => sum + f.points, 0);
          this.emailService.sendLabCompleted(user.email, user.name, lab?.title || 'Unknown Lab', totalXp, totalFlagsInLab).catch(() => {});
        }
        this.eventsService.emit('LAB_COMPLETED', { userId, labId: flag.labId, labTitle: lab?.title, timestamp: new Date() });
      }

      await this.activityService
        .log(userId, 'FLAG_SOLVED', {
          labId: flag.labId,
          labTitle: lab?.title || 'Unknown',
          flagId: flag.id,
          flagTitle: flag.title,
          points: flag.points,
        })
        .catch(() => {});

      await this.updateStreak(userId).catch(() => {});

      this.eventsService.emit('FLAG_CAPTURED', {
        userId,
        flagTitle: flag.title,
        points: flag.points,
        timestamp: new Date(),
      });
    }

    return {
      isCorrect,
      xpAwarded: isCorrect ? flag.points : 0,
      message: isCorrect
        ? `Correct! +${flag.points} XP`
        : 'Incorrect. Try again.',
    };
  }

  async getLabDefinition(id: string, userId?: string, userRole?: string) {
    const lab = await this.prisma.lab.findUnique({
      where: { id },
      include: {
        flags: { include: { submissions: { where: userId ? { isCorrect: true, userId } : { isCorrect: true } } } },
      },
    });
    if (!lab) throw new NotFoundException('Lab not found');

    if (userRole !== 'ADMIN' && userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        const userLevel = getLevel(user.xp);
        const requiredLevel = getRequiredLabLevel(lab.difficulty || 1200);
        if (userLevel < requiredLevel) {
          throw new ForbiddenException(
            `Level ${requiredLevel} required to access this lab. Your level: ${userLevel}`,
          );
        }
      }
    }

    let credentials = lab.credentials;
    if (typeof credentials === 'string') {
      try {
        credentials = decryptCredentials(credentials);
      } catch {
        try {
          credentials = JSON.parse(credentials as string) as Prisma.JsonValue;
        } catch {
          credentials = [];
        }
      }
    }

    if (userRole !== 'ADMIN') {
      return { ...lab, credentials: null };
    }

    return { ...lab, credentials };
  }

  async getGlobalStats() {
    const runningCount = await this.prisma.labInstance.count({
      where: { status: 'RUNNING' },
    });
    const activeUsers = await this.prisma.labInstance.groupBy({
      by: ['userId'],
      where: { status: 'RUNNING' },
    });

    return {
      activeContainers: runningCount,
      activeUsers: activeUsers.length,
      capacityPercentage: Math.round(
        (runningCount / MAX_CONCURRENT_LABS) * 100,
      ),
      maxCapacity: MAX_CONCURRENT_LABS,
      systemStatus:
        runningCount < MAX_CONCURRENT_LABS * 0.9 ? 'HEALTHY' : 'NEAR_CAPACITY',
    };
  }

  async create(data: {
    title: string;
    description: string;
    dockerImage: string;
    difficulty?: number;
    briefing?: string;
  }) {
    return this.prisma.lab.create({ data });
  }

  async update(id: string, data: { title?: string; description?: string; dockerImage?: string; difficulty?: number; briefing?: string; imageUrl?: string }) {
    const lab = await this.prisma.lab.findUnique({ where: { id } });
    if (!lab) throw new NotFoundException('Lab not found');
    return this.prisma.lab.update({ where: { id }, data });
  }

  async remove(id: string) {
    const lab = await this.prisma.lab.findUnique({ where: { id } });
    if (!lab) throw new NotFoundException('Lab not found');

    const instances = await this.prisma.labInstance.findMany({ where: { labId: id, containerId: { not: null } } });
    for (const instance of instances) {
      try {
        const targetDocker = this.dockerManager.getDockerForServer(instance.serverId || 'local') || this.docker;
        const container = targetDocker.getContainer(instance.containerId!);
        await container.stop().catch(() => {});
        await container.remove().catch(() => {});
        this.dockerManager.decrementLabs(instance.serverId || 'local');
      } catch {}
    }

    await this.prisma.$transaction([
      this.prisma.labSubmission.deleteMany({ where: { flag: { labId: id } } }),
      this.prisma.labFlag.deleteMany({ where: { labId: id } }),
      this.prisma.labInstance.deleteMany({ where: { labId: id } }),
    ]);

    return this.prisma.lab.delete({ where: { id } });
  }

  async batchRemove(ids: string[]) {
    const instances = await this.prisma.labInstance.findMany({ where: { labId: { in: ids }, containerId: { not: null } } });
    for (const instance of instances) {
      try {
        const targetDocker = this.dockerManager.getDockerForServer(instance.serverId || 'local') || this.docker;
        const container = targetDocker.getContainer(instance.containerId!);
        await container.stop().catch(() => {});
        await container.remove().catch(() => {});
        this.dockerManager.decrementLabs(instance.serverId || 'local');
      } catch {}
    }
    await this.prisma.$transaction([
      this.prisma.labSubmission.deleteMany({ where: { flag: { labId: { in: ids } } } }),
      this.prisma.labFlag.deleteMany({ where: { labId: { in: ids } } }),
      this.prisma.labInstance.deleteMany({ where: { labId: { in: ids } } }),
    ]);
    return this.prisma.lab.deleteMany({ where: { id: { in: ids } } });
  }

  async batchStop(items: { labId: string; userId: string }[]) {
    const results: { labId: string; success: boolean }[] = [];
    for (const item of items) {
      try {
        await this.stopLab(item.userId, item.labId);
        results.push({ labId: item.labId, success: true });
      } catch {
        results.push({ labId: item.labId, success: false });
      }
    }
    return { stopped: results.filter((r) => r.success).length, results };
  }

  private async getAvailablePort(): Promise<number | null> {
    const release = await this.acquireLock();

    try {
      const activeInstances = await this.prisma.labInstance.findMany({
        where: { status: { in: ['RUNNING', 'PROVISIONING'] } },
        select: { port: true },
      });

      const usedPorts = new Set(activeInstances.map((i) => i.port));

      for (let port = PORT_RANGE_START; port <= PORT_RANGE_END; port++) {
        if (usedPorts.has(port)) continue;

        const isFree = await new Promise<boolean>((resolve) => {
          const server = net.createServer();
          server.once('error', () => resolve(false));
          server.once('listening', () => {
            server.close();
            resolve(true);
          });
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
    const nextLock = new Promise<void>((resolve) => {
      release = resolve;
    });
    const currentLock = this.portLock;
    this.portLock = currentLock.then(() => nextLock);
    await currentLock;
    return release;
  }

  // === FLAG MANAGEMENT ===

  async createFlag(
    labId: string,
    data: {
      title: string;
      description?: string;
      points?: number;
      correctAnswer: string;
    },
  ) {
    const lab = await this.prisma.lab.findUnique({ where: { id: labId } });
    if (!lab) throw new NotFoundException('Lab not found');
    const points = Math.max(1, Math.round(data.points ?? 100));
    const hashedAnswer = await bcrypt.hash(
      data.correctAnswer.trim().toLowerCase(),
      10,
    );
    return this.prisma.labFlag.create({
      data: {
        labId,
        title: data.title,
        description: data.description,
        points,
        correctAnswer: hashedAnswer,
      },
    });
  }

  async updateFlag(
    flagId: string,
    data: {
      title?: string;
      description?: string;
      points?: number;
      correctAnswer?: string;
    },
  ) {
    const flag = await this.prisma.labFlag.findUnique({
      where: { id: flagId },
    });
    if (!flag) throw new NotFoundException('Flag not found');
    const updateData: {
      title?: string;
      description?: string;
      points?: number;
      correctAnswer?: string;
    } = { ...data };
    if (data.points !== undefined) {
      updateData.points = Math.max(1, Math.round(data.points));
    }
    if (data.correctAnswer) {
      updateData.correctAnswer = await bcrypt.hash(
        data.correctAnswer.trim().toLowerCase(),
        10,
      );
    }
    return this.prisma.labFlag.update({
      where: { id: flagId },
      data: updateData,
    });
  }

  async removeFlag(flagId: string) {
    const flag = await this.prisma.labFlag.findUnique({
      where: { id: flagId },
    });
    if (!flag) throw new NotFoundException('Flag not found');
    return this.prisma.labFlag.delete({ where: { id: flagId } });
  }
}
