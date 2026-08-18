import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LabsService } from './labs.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class LabsCron {
  private readonly logger = new Logger(LabsCron.name);
  private healthCheckRunning = false;
  private cleanupRunning = false;
  private expiringNotified = new Set<string>();

  constructor(
    private readonly labsService: LabsService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleHealthCheck() {
    if (this.healthCheckRunning) return;
    this.healthCheckRunning = true;
    try {
      await this.labsService.healthCheckAll();
    } catch (err) {
      this.logger.error(`Health check failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      this.healthCheckRunning = false;
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCleanup() {
    if (this.cleanupRunning) return;
    this.cleanupRunning = true;
    try {
      this.logger.log('Starting automated lab cleanup cycle...');
      await this.labsService.cleanupExpiredLabs();
      this.logger.log('Lab cleanup cycle complete.');
    } catch (err) {
      this.logger.error(`Cleanup failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      this.cleanupRunning = false;
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleExpiringLabs() {
    try {
      const threshold = new Date(Date.now() + 15 * 60 * 1000);
      const now = new Date();

      const expiring = await this.prisma.labInstance.findMany({
        where: {
          status: 'RUNNING',
          expiresAt: { gt: now, lte: threshold },
        },
        include: {
          lab: { select: { title: true } },
          user: { select: { email: true, name: true } },
        },
      });

      for (const instance of expiring) {
        if (this.expiringNotified.has(instance.id)) continue;
        this.expiringNotified.add(instance.id);

        const minutesLeft = Math.max(1, Math.round((instance.expiresAt.getTime() - now.getTime()) / 60000));
        this.emailService
          .sendLabExpiring(instance.user.email, instance.user.name, instance.lab.title, minutesLeft)
          .catch(() => {});
      }

      const runningIds = expiring.map((i) => i.id);
      for (const id of this.expiringNotified) {
        if (!runningIds.includes(id)) this.expiringNotified.delete(id);
      }
    } catch (err) {
      this.logger.error(`Expiring check failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
