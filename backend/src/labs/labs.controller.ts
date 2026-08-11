import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Request, ParseUUIDPipe, ValidationPipe } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LabsService } from './labs.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SubmitFlagDto } from './dto/submit-flag.dto';

@Controller('labs')
export class LabsController {
  constructor(private readonly labsService: LabsService) {}

  @Get('health')
  async health() {
    return { status: 'OK', timestamp: new Date() };
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  async getStats() {
    return this.labsService.getGlobalStats();
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll() {
    return this.labsService.findAll();
  }

  @Get('definition/:id')
  @UseGuards(AuthGuard('jwt'))
  async getDefinition(@Param('id', ParseUUIDPipe) id: string) {
    return this.labsService.getLabDefinition(id);
  }

  @Get('status/:id')
  @UseGuards(AuthGuard('jwt'))
  async getStatus(@Request() req, @Param('id', ParseUUIDPipe) labId: string) {
    return this.labsService.getLabStatus(req.user.id, labId);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async create(@Body() body: { title: string; description: string; dockerImage: string; difficulty?: number; briefing?: string }) {
    return this.labsService.create(body);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() body: Record<string, any>) {
    return this.labsService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.labsService.remove(id);
  }

  @Post('start/:id')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @UseGuards(AuthGuard('jwt'))
  async startLab(@Request() req, @Param('id', ParseUUIDPipe) labId: string) {
    return this.labsService.startLab(req.user.id, labId);
  }

  @Post('stop/:id')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(AuthGuard('jwt'))
  async stopLab(@Request() req, @Param('id', ParseUUIDPipe) labId: string) {
    return this.labsService.stopLab(req.user.id, labId);
  }

  @Post('reset/:id')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(AuthGuard('jwt'))
  async resetLab(@Request() req, @Param('id', ParseUUIDPipe) labId: string) {
    return this.labsService.resetLab(req.user.id, labId);
  }

  @Post('submit-flag/:flagId')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(AuthGuard('jwt'))
  async submitFlag(
    @Request() req,
    @Param('flagId', ParseUUIDPipe) flagId: string,
    @Body(ValidationPipe) submitFlagDto: SubmitFlagDto,
  ) {
    return this.labsService.submitFlag(req.user.id, flagId, submitFlagDto.answer);
  }

  // === FLAG MANAGEMENT ===

  @Post(':labId/flags')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async createFlag(@Param('labId', ParseUUIDPipe) labId: string, @Body() body: { title: string; description?: string; points?: number; correctAnswer: string }) {
    return this.labsService.createFlag(labId, body);
  }

  @Patch('flags/:flagId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async updateFlag(@Param('flagId', ParseUUIDPipe) flagId: string, @Body() body: { title?: string; description?: string; points?: number; correctAnswer?: string }) {
    return this.labsService.updateFlag(flagId, body);
  }

  @Delete('flags/:flagId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async removeFlag(@Param('flagId', ParseUUIDPipe) flagId: string) {
    return this.labsService.removeFlag(flagId);
  }
}
