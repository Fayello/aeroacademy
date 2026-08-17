import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LabsService } from './labs.service';

@Injectable()
export class LabsCron {
  private readonly logger = new Logger(LabsCron.name);
  private healthCheckRunning = false;
  private cleanupRunning = false;

  constructor(private readonly labsService: LabsService) {}

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
}
