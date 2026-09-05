import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CertificationEngineService } from './certification-engine.service';

@Injectable()
export class CertificationCron {
  private readonly logger = new Logger(CertificationCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: CertificationEngineService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleDailyEvaluation() {
    this.logger.log('Running daily certification auto-award check...');

    const users = await this.prisma.user.findMany({
      where: { xp: { gte: 5000 } },
      select: { id: true, email: true },
    });

    let awarded = 0;
    for (const user of users) {
      try {
        const codes = await this.engine.autoAwardForUser(user.id);
        if (codes.length > 0) {
          this.logger.log(`Auto-awarded ${codes.join(', ')} to ${user.email}`);
          awarded += codes.length;
        }
      } catch (error) {
        this.logger.warn(`Failed to evaluate ${user.email}: ${error}`);
      }
    }

    this.logger.log(`Daily certification check complete. ${awarded} certifications auto-awarded.`);
  }
}
