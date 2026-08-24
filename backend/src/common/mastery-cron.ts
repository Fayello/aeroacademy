import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MasteryService } from './mastery.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MasteryCron {
  private readonly logger = new Logger(MasteryCron.name);
  private decayRunning = false;

  constructor(
    private readonly masteryService: MasteryService,
    private readonly prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleMasteryDecay() {
    if (this.decayRunning) return;
    this.decayRunning = true;

    try {
      this.logger.log('Starting mastery decay cycle...');
      const decayedCount = await this.masteryService.applyMasteryDecay();
      this.logger.log(`Mastery decay complete: ${decayedCount} skills affected`);

      // Send notifications for skills that dropped below thresholds
      await this.sendDecayNotifications();
    } catch (err) {
      this.logger.error(
        `Mastery decay failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      this.decayRunning = false;
    }
  }

  private async sendDecayNotifications() {
    try {
      // Find skills that just crossed below 50% mastery
      const recentDecayEvents = await this.prisma.skillMasteryEvent.findMany({
        where: {
          eventType: 'MASTERY_DECAY',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          masteryAfter: { lt: 50 },
          masteryBefore: { gte: 50 },
        },
        include: {
          skill: { select: { displayName: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      });

      for (const event of recentDecayEvents) {
        await this.prisma.notification.create({
          data: {
            userId: event.userId,
            title: 'Skill Mastery Fading',
            message: `Your ${event.skill.displayName} mastery has dropped to ${Math.round(event.masteryAfter)}%. Practice to restore it.`,
            type: 'WARNING',
            link: '/dashboard/genome',
          },
        });
      }

      if (recentDecayEvents.length > 0) {
        this.logger.log(`Sent ${recentDecayEvents.length} decay notifications`);
      }
    } catch (err) {
      this.logger.warn(`Failed to send decay notifications: ${err}`);
    }
  }
}
