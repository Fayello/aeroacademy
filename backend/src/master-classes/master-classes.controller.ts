import { Controller, Get, Post, Delete, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { MasterClassesService } from './master-classes.service';

@Controller('master-classes')
export class MasterClassesController {
  constructor(private masterClassesService: MasterClassesService) {}

  @Get()
  async findAll(@Query() query: { category?: string; status?: string; limit?: string }) {
    return this.masterClassesService.findAll({
      category: query.category,
      status: query.status,
      limit: query.limit ? parseInt(query.limit) : undefined,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.masterClassesService.findOne(id);
  }

  @Post(':id/register')
  @UseGuards(AuthGuard('jwt'))
  async register(@Param('id') id: string, @Request() req: any) {
    return this.masterClassesService.register(id, req.user.id);
  }

  @Delete(':id/register')
  @UseGuards(AuthGuard('jwt'))
  async unregister(@Param('id') id: string, @Request() req: any) {
    return this.masterClassesService.unregister(id, req.user.id);
  }

  @Get('my/registrations')
  @UseGuards(AuthGuard('jwt'))
  async getMyRegistrations(@Request() req: any) {
    return this.masterClassesService.getMyRegistrations(req.user.id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async create(@Body() body: any) {
    return this.masterClassesService.create(body);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.masterClassesService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    return this.masterClassesService.remove(id);
  }
}
