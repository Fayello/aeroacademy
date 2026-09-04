import { Module } from '@nestjs/common';
import { SecurityOpsService } from './security-ops.service';
import { SecurityOpsController } from './security-ops.controller';
import { ThreatIntelModule } from './threat-intel.module';

@Module({
  imports: [ThreatIntelModule],
  providers: [SecurityOpsService],
  controllers: [SecurityOpsController],
  exports: [SecurityOpsService],
})
export class SecurityOpsModule {}
