import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { GlobalEventsService } from './global-events.service';

@Controller('global-events')
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

  @Post()
  createEvent(@Body() body: { seasonId?: string; title: string; description: string; type: string; targetXp?: number; targetCount?: number; xpReward?: number; metadata?: any; startsAt: string; expiresAt: string }) {
    return this.globalEventsService.createEvent(body);
  }

  @Post(':eventId/join')
  joinEvent(@Param('eventId') eventId: string, @Body() body: { userId: string }) {
    return this.globalEventsService.joinEvent(body.userId, eventId);
  }

  @Post(':eventId/progress')
  updateProgress(@Param('eventId') eventId: string, @Body() body: { userId: string; progress: number }) {
    return this.globalEventsService.updateProgress(body.userId, eventId, body.progress);
  }

  @Post(':eventId/claim')
  claimReward(@Param('eventId') eventId: string, @Body() body: { userId: string }) {
    return this.globalEventsService.claimReward(body.userId, eventId);
  }
}
