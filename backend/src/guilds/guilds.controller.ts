import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { GuildsService } from './guilds.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Audit } from '../common/audit.decorator';
import type { RequestWithUser } from '../common/request-with-user';

@ApiTags('guilds')
@ApiBearerAuth('JWT-auth')
@Controller('v1/guilds')
@UseGuards(AuthGuard('jwt'))
export class GuildsController {
  constructor(private guildsService: GuildsService) {}

  // ── Non-parameterized routes FIRST ──

  @Post()
  @Audit('GUILD_CREATED')
  async createGuild(@Request() req: RequestWithUser, @Body() body: { name: string; description?: string; focusDomain?: string; visibility?: string; motto?: string; primaryColor?: string; accentColor?: string }) {
    return this.guildsService.createGuild(req.user.id, body);
  }

  @Get()
  async browseGuilds(@Request() req: RequestWithUser, @Query('search') search?: string) {
    return this.guildsService.browseGuilds(req.user.id, search);
  }

  @Get('mine')
  async getMyGuild(@Request() req: RequestWithUser) {
    return this.guildsService.getMyGuild(req.user.id);
  }

  @Get('leaderboard')
  async getGuildLeaderboard() {
    return this.guildsService.getGuildLeaderboard();
  }

  @Get('seekers')
  async getGuildSeekers() {
    return this.guildsService.getGuildSeekers();
  }

  @Post('seeking-guild')
  async toggleSeekingGuild(@Request() req: RequestWithUser) {
    return this.guildsService.toggleSeekingGuild(req.user.id);
  }

  @Post('leave')
  @Audit('GUILD_LEFT')
  async leaveGuild(@Request() req: RequestWithUser) {
    return this.guildsService.leaveGuild(req.user.id);
  }

  @Post('join/:code')
  @Audit('GUILD_JOINED_BY_CODE')
  async joinByCode(@Request() req: RequestWithUser, @Param('code') code: string) {
    return this.guildsService.joinByCode(req.user.id, code);
  }

  // ── Parameterized :id routes AFTER ──

  @Get(':id')
  async getGuildDetail(@Param('id') id: string) {
    return this.guildsService.getGuildDetail(id);
  }

  @Patch(':id')
  @Audit('GUILD_UPDATED')
  async updateGuild(@Request() req: RequestWithUser, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.guildsService.updateGuild(req.user.id, id, body);
  }

  @Delete(':id')
  @Audit('GUILD_DISBANDED')
  async disbandGuild(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.guildsService.disbandGuild(req.user.id, id);
  }

  @Post(':id/join')
  @Audit('GUILD_JOINED')
  async joinGuild(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.guildsService.joinGuild(req.user.id, id);
  }

  @Post(':id/apply')
  @Audit('GUILD_APPLICATION_SENT')
  async applyToGuild(@Request() req: RequestWithUser, @Param('id') id: string, @Body() body: { message?: string }) {
    return this.guildsService.applyToGuild(req.user.id, id, body.message);
  }

  @Post(':id/applications/:appId')
  @Audit('GUILD_APPLICATION_REVIEWED')
  async reviewApplication(@Request() req: RequestWithUser, @Param('id') id: string, @Param('appId') appId: string, @Body() body: { action: 'APPROVED' | 'REJECTED' }) {
    return this.guildsService.reviewApplication(req.user.id, id, appId, body.action);
  }

  @Get(':id/applications')
  async getApplications(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.guildsService.getApplications(req.user.id, id);
  }

  @Delete(':id/members/:userId')
  @Audit('GUILD_MEMBER_KICKED')
  async kickMember(@Request() req: RequestWithUser, @Param('id') id: string, @Param('userId') userId: string) {
    return this.guildsService.kickMember(req.user.id, id, userId);
  }

  @Post(':id/promote/:userId')
  @Audit('GUILD_MEMBER_PROMOTED')
  async promoteMember(@Request() req: RequestWithUser, @Param('id') id: string, @Param('userId') userId: string) {
    return this.guildsService.promoteMember(req.user.id, id, userId);
  }

  @Post(':id/demote/:userId')
  @Audit('GUILD_MEMBER_DEMOTED')
  async demoteMember(@Request() req: RequestWithUser, @Param('id') id: string, @Param('userId') userId: string) {
    return this.guildsService.demoteMember(req.user.id, id, userId);
  }

  @Post(':id/refresh-code')
  async refreshInviteCode(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.guildsService.refreshInviteCode(req.user.id, id);
  }

  @Get(':id/chat')
  async getChatHistory(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.guildsService.getChatHistory(id, limit ? parseInt(limit) : 100);
  }

  @Post(':id/chat')
  @Audit('GUILD_CHAT_SENT')
  async sendChatMessage(@Request() req: RequestWithUser, @Param('id') id: string, @Body() body: { content: string }) {
    return this.guildsService.sendChatMessage(id, req.user.id, body.content);
  }

  @Post(':id/chat/pin/:messageId')
  @Audit('GUILD_MESSAGE_PINNED')
  async pinMessage(@Request() req: RequestWithUser, @Param('id') id: string, @Param('messageId') messageId: string) {
    return this.guildsService.pinMessage(req.user.id, id, messageId);
  }

  @Get(':id/feed')
  async getGuildFeed(@Param('id') id: string) {
    return this.guildsService.getGuildFeed(id);
  }
}
