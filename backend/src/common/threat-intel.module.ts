import { Module } from '@nestjs/common';
import { ThreatIntelService } from './threat-intel.service';
import { ThreatIntelController } from './threat-intel.controller';

@Module({
  providers: [ThreatIntelService],
  controllers: [ThreatIntelController],
  exports: [ThreatIntelService],
})
export class ThreatIntelModule {}
