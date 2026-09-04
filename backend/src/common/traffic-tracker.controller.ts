import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { TrafficTrackerService } from './traffic-tracker.service';

@Controller('v1/admin/traffic')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TrafficTrackerController {
  constructor(private tracker: TrafficTrackerService) {}

  @Get('snapshot')
  getSnapshot() {
    return this.tracker.getSnapshot();
  }

  @Get('ip/:ip')
  getIpDetail(@Param('ip') ip: string) {
    return this.tracker.getIpDetail(ip);
  }
}
