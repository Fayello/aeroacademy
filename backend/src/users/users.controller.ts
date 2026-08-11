import { Controller, Get, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

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
  async update(@Param('id') id: string, @Body() body: { name?: string; email?: string; role?: string; bio?: string; city?: string; xp?: number; organizationId?: string }) {
    return this.usersService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
