import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Audit } from '../common/audit.decorator';
import { BatchIdsDto, BatchRoleDto } from '../common/batch.dto';

@ApiTags('admin-users')
@ApiBearerAuth('JWT-auth')
@Controller('admin/users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async findAll(@Query('role') role?: string) {
    return this.usersService.findAll(role);
  }

  @Get('stats')
  async getStats() {
    return this.usersService.getStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Audit('USER_UPDATED')
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      email?: string;
      role?: string;
      bio?: string;
      city?: string;
      xp?: number;
      organizationId?: string;
    },
  ) {
    return this.usersService.update(id, body);
  }

  @Delete(':id')
  @Audit('USER_DELETED')
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post('batch/delete')
  @Audit('USERS_DELETED_BATCH')
  async batchRemove(@Request() req: any, @Body() body: BatchIdsDto) {
    return this.usersService.batchRemove(body.ids, req.user.id);
  }

  @Post('batch/role')
  @Audit('USER_ROLES_UPDATED_BATCH')
  async batchSetRole(@Request() req: any, @Body() body: BatchRoleDto) {
    return this.usersService.batchSetRole(body.ids, body.role, req.user.id);
  }
}
