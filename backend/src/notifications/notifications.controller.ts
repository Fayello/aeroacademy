import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { NotificationsService } from './notifications.service';

interface RequestWithUser extends ExpressRequest {
  user: { id: string; role: string };
}

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async findAll(
    @Request() req: RequestWithUser,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    const parsedOffset = offset ? parseInt(offset, 10) : undefined;
    return this.notificationsService.findAll(req.user.id, {
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
      offset: Number.isFinite(parsedOffset) ? parsedOffset : undefined,
      unreadOnly: unreadOnly === 'true',
    });
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: RequestWithUser) {
    const count = await this.notificationsService.unreadCount(req.user.id);
    return { count };
  }

  @Patch('read-all')
  async markAllRead(@Request() req: RequestWithUser) {
    return this.notificationsService.markAllRead(req.user.id);
  }

  @Patch(':id/read')
  async markRead(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.notificationsService.markRead(req.user.id, id);
  }

  @Delete(':id')
  async delete(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.notificationsService.delete(req.user.id, id);
  }
}
