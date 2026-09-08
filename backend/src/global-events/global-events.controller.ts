import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GlobalEventsService } from './global-events.service';
import type { RequestWithUser } from '../common/request-with-user';

@Controller('v1/global-events')
@UseGuards(AuthGuard('jwt'))
export class GlobalEventsController {
  constructor(private readonly globalEventsService: GlobalEventsService) {}

  @Get('active')
  getActiveEvents() {
    return this.globalEventsService.getActiveEvents();
  }

  @Get()
  getAllEvents() {
    return this.globalEventsService.getAllEvents();
  }

  @Get(':eventId/leaderboard')
  getEventLeaderboard(@Param('eventId') eventId: string) {
    return this.globalEventsService.getEventLeaderboard(eventId);
  }

  @Get(':eventId/progress')
  getCommunityProgress(@Param('eventId') eventId: string) {
    return this.globalEventsService.getCommunityProgress(eventId);
  }

  @Get(':eventId/user-progress')
  getUserProgress(
    @Request() req: RequestWithUser,
    @Param('eventId') eventId: string,
  ) {
    return this.globalEventsService.getUserProgress(req.user.id, eventId);
  }

  @Post()
  createEvent(
    @Body()
    body: {
      seasonId?: string;
      title: string;
      description: string;
      type: string;
      targetXp?: number;
      targetCount?: number;
      xpReward?: number;
      metadata?: any;
      startsAt: string;
      expiresAt: string;
    },
  ) {
    return this.globalEventsService.createEvent(body);
  }

  @Post(':eventId/join')
  joinEvent(
    @Request() req: RequestWithUser,
    @Param('eventId') eventId: string,
  ) {
    return this.globalEventsService.joinEvent(req.user.id, eventId);
  }

  @Post(':eventId/progress')
  updateProgress(
    @Request() req: RequestWithUser,
    @Param('eventId') eventId: string,
    @Body() body: { progress: number },
  ) {
    return this.globalEventsService.updateProgress(
      req.user.id,
      eventId,
      body.progress,
    );
  }

  @Post(':eventId/claim')
  claimReward(
    @Request() req: RequestWithUser,
    @Param('eventId') eventId: string,
  ) {
    return this.globalEventsService.claimReward(req.user.id, eventId);
  }
}
