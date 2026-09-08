import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SecurityOpsService } from './security-ops.service';

@Controller('v1/admin/security')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
export class SecurityOpsController {
  constructor(private securityOps: SecurityOpsService) {}

  @Get('overview')
  getOverview() {
    return this.securityOps.getOverview();
  }
}
