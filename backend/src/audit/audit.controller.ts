import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  ParseUUIDPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuditService } from './audit.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('admin-audit')
@ApiBearerAuth('JWT-auth')
@Controller('admin/audit-logs')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async findAll(
    @Query('action') action?: string,
    @Query('actorId', new DefaultValuePipe(undefined), ParseUUIDPipe)
    actorId?: string,
    @Query('status') status?: 'success' | 'error',
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    return this.auditService.findAll({
      action,
      actorId,
      status,
      from,
      to,
      limit,
      offset,
    });
  }

  @Get('summary')
  async summary() {
    return this.auditService.getSummary();
  }
}
