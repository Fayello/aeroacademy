import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { ThreatIntelService } from './threat-intel.service';

@Controller('v1/admin/threats')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ThreatIntelController {
  constructor(private threatIntel: ThreatIntelService) {}

  @Get('summary')
  getSummary() {
    return this.threatIntel.getSummary();
  }

  @Get('ip/:ip')
  getIpDetail(@Param('ip') ip: string) {
    return this.threatIntel.getIpDetail(ip);
  }
}
