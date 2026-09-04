import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { SecurityOpsService } from './security-ops.service';

@Controller('v1/admin/security')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SecurityOpsController {
  constructor(private securityOps: SecurityOpsService) {}

  @Get('overview')
  getOverview() {
    return this.securityOps.getOverview();
  }
}
