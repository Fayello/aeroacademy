import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
  ValidationPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LabsService } from './labs.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SubmitFlagDto } from './dto/submit-flag.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Audit } from '../common/audit.decorator';
import { BatchIdsDto, BatchLabStopDto } from '../common/batch.dto';
import type { RequestWithUser } from '../common/request-with-user';

@ApiTags('labs')
@Controller('v1/labs')
export class LabsController {
  constructor(private readonly labsService: LabsService) {}

  @Get('health')
  health() {
    return { status: 'OK', timestamp: new Date() };
  }

  @ApiBearerAuth('JWT-auth')
  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  async getStats() {
    return this.labsService.getGlobalStats();
  }

  @ApiBearerAuth('JWT-auth')
  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(@Request() req: RequestWithUser) {
    return this.labsService.findAll({ userId: req.user.id, userRole: req.user.role });
  }

  @ApiBearerAuth('JWT-auth')
  @Get('definition/:id')
  @UseGuards(AuthGuard('jwt'))
  async getDefinition(
    @Request() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.labsService.getLabDefinition(id, req.user.id, req.user.role);
  }

  @ApiBearerAuth('JWT-auth')
  @Get('status/:id')
  @UseGuards(AuthGuard('jwt'))
  async getStatus(
    @Request() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) labId: string,
  ) {
    return this.labsService.getLabStatus(req.user.id, labId);
  }

  @ApiBearerAuth('JWT-auth')
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Audit('LAB_CREATED')
  async create(
    @Body()
    body: {
      title: string;
      description: string;
      dockerImage: string;
      difficulty?: number;
      briefing?: string;
    },
  ) {
    return this.labsService.create(body);
  }

  @ApiBearerAuth('JWT-auth')
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Audit('LAB_UPDATED')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { title?: string; description?: string; dockerImage?: string; difficulty?: number; briefing?: string; imageUrl?: string },
  ) {
    return this.labsService.update(id, body);
  }

  @ApiBearerAuth('JWT-auth')
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Audit('LAB_DELETED')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.labsService.remove(id);
  }

  @ApiBearerAuth('JWT-auth')
  @Post('batch/delete')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Audit('LABS_DELETED_BATCH')
  async batchRemove(@Body() body: BatchIdsDto) {
    return this.labsService.batchRemove(body.ids);
  }

  @ApiBearerAuth('JWT-auth')
  @Post('batch/stop')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Audit('LABS_STOPPED_BATCH')
  async batchStop(@Body() body: BatchLabStopDto) {
    return this.labsService.batchStop(body.items);
  }

  @ApiBearerAuth('JWT-auth')
  @Post('start/:id')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @UseGuards(AuthGuard('jwt'))
  @Audit('LAB_STARTED')
  async startLab(
    @Request() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) labId: string,
  ) {
    return this.labsService.startLab(req.user.id, labId);
  }

  @ApiBearerAuth('JWT-auth')
  @Post('stop/:id')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(AuthGuard('jwt'))
  @Audit('LAB_STOPPED')
  async stopLab(
    @Request() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) labId: string,
  ) {
    return this.labsService.stopLab(req.user.id, labId);
  }

  @ApiBearerAuth('JWT-auth')
  @Post('reset/:id')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(AuthGuard('jwt'))
  @Audit('LAB_RESET')
  async resetLab(
    @Request() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) labId: string,
  ) {
    return this.labsService.resetLab(req.user.id, labId);
  }

  @ApiBearerAuth('JWT-auth')
  @Post('submit-flag/:flagId')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(AuthGuard('jwt'))
  @Audit('FLAG_SUBMITTED')
  async submitFlag(
    @Request() req: RequestWithUser,
    @Param('flagId', ParseUUIDPipe) flagId: string,
    @Body(ValidationPipe) submitFlagDto: SubmitFlagDto,
  ) {
    return this.labsService.submitFlag(
      req.user.id,
      flagId,
      submitFlagDto.answer,
    );
  }

  // === FLAG MANAGEMENT ===

  @ApiBearerAuth('JWT-auth')
  @Post(':labId/flags')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Audit('FLAG_CREATED')
  async createFlag(
    @Param('labId', ParseUUIDPipe) labId: string,
    @Body()
    body: {
      title: string;
      description?: string;
      points?: number;
      correctAnswer: string;
    },
  ) {
    return this.labsService.createFlag(labId, body);
  }

  @ApiBearerAuth('JWT-auth')
  @Patch('flags/:flagId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Audit('FLAG_UPDATED')
  async updateFlag(
    @Param('flagId', ParseUUIDPipe) flagId: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      points?: number;
      correctAnswer?: string;
    },
  ) {
    return this.labsService.updateFlag(flagId, body);
  }

  @ApiBearerAuth('JWT-auth')
  @Delete('flags/:flagId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Audit('FLAG_DELETED')
  async removeFlag(@Param('flagId', ParseUUIDPipe) flagId: string) {
    return this.labsService.removeFlag(flagId);
  }
}
