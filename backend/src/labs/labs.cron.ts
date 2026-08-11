import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LabsService } from './labs.service';

@Injectable()
export class LabsCron {
  private readonly logger = new Logger(LabsCron.name);

  constructor(private readonly labsService: LabsService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleHealthCheck() {
    await this.labsService.healthCheckAll();
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCleanup() {
    this.logger.log('Starting automated lab cleanup cycle...');
    await this.labsService.cleanupExpiredLabs();
    this.logger.log('Lab cleanup cycle complete.');
  }
}
