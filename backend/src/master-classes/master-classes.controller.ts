import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { MasterClassesService } from './master-classes.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Audit } from '../common/audit.decorator';
import { BatchIdsDto, BatchStatusDto } from '../common/batch.dto';
import type { RequestWithUser } from '../common/request-with-user';

interface CreateMasterClassDto {
  title: string;
  description: string;
  instructorName?: string;
  instructorBio?: string;
  category?: string;
  scheduledAt?: string;
  duration?: number;
  maxParticipants?: number;
  isLive?: boolean;
}

@ApiTags('master-classes')
@Controller('master-classes')
export class MasterClassesController {
  constructor(private masterClassesService: MasterClassesService) {}

  @Get()
  async findAll(
    @Query() query: { category?: string; status?: string; limit?: string },
  ) {
    return this.masterClassesService.findAll({
      category: query.category,
      status: query.status,
      limit: query.limit ? Math.max(1, parseInt(query.limit) || 20) : undefined,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.masterClassesService.findOne(id);
  }

  @ApiBearerAuth('JWT-auth')
  @Post(':id/register')
  @UseGuards(AuthGuard('jwt'))
  @Audit('MASTERCLASS_REGISTERED')
  async register(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.masterClassesService.register(id, req.user.id);
  }

  @ApiBearerAuth('JWT-auth')
  @Delete(':id/register')
  @UseGuards(AuthGuard('jwt'))
  @Audit('MASTERCLASS_UNREGISTERED')
  async unregister(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.masterClassesService.unregister(id, req.user.id);
  }

  @ApiBearerAuth('JWT-auth')
  @Get('my/registrations')
  @UseGuards(AuthGuard('jwt'))
  async getMyRegistrations(@Request() req: RequestWithUser) {
    return this.masterClassesService.getMyRegistrations(req.user.id);
  }

  @ApiBearerAuth('JWT-auth')
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Audit('MASTERCLASS_CREATED')
  async create(@Body() body: CreateMasterClassDto) {
    return this.masterClassesService.create(body);
  }

  @ApiBearerAuth('JWT-auth')
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Audit('MASTERCLASS_UPDATED')
  async update(@Param('id') id: string, @Body() body: { title?: string; description?: string; instructorName?: string; instructorBio?: string; category?: string; scheduledAt?: string; duration?: number; maxParticipants?: number; isLive?: boolean; status?: string }) {
    return this.masterClassesService.update(id, body);
  }

  @ApiBearerAuth('JWT-auth')
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Audit('MASTERCLASS_DELETED')
  async remove(@Param('id') id: string) {
    return this.masterClassesService.remove(id);
  }

  @ApiBearerAuth('JWT-auth')
  @Post('batch/delete')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Audit('MASTERCLASSES_DELETED_BATCH')
  async batchRemove(@Body() body: BatchIdsDto) {
    return this.masterClassesService.batchRemove(body.ids);
  }

  @ApiBearerAuth('JWT-auth')
  @Post('batch/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Audit('MASTERCLASS_STATUS_UPDATED_BATCH')
  async batchSetStatus(@Body() body: BatchStatusDto) {
    return this.masterClassesService.batchSetStatus(body.ids, body.status);
  }
}
