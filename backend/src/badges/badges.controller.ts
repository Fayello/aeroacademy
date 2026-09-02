import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BadgesService } from './badges.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { RequestWithUser } from '../common/request-with-user';

@ApiTags('badges')
@ApiBearerAuth('JWT-auth')
@Controller('v1/badges')
@UseGuards(AuthGuard('jwt'))
export class BadgesController {
  constructor(private badgesService: BadgesService) {}

  @Get()
  async getAllBadges() {
    return this.badgesService.getAllBadges();
  }

  @Get('my')
  async getMyBadges(@Request() req: RequestWithUser) {
    return this.badgesService.getUserBadges(req.user.id);
  }

  @Get('user/:userId')
  async getUserBadges(@Param('userId') userId: string) {
    return this.badgesService.getUserBadges(userId);
  }

  @Post('check')
  async checkBadges(@Request() req: RequestWithUser) {
    return this.badgesService.checkAndAwardBadges(req.user.id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async createBadge(
    @Body()
    body: {
      name: string;
      description: string;
      icon: string;
      category?: string;
      tier?: string;
      xpReward?: number;
      requirement: string;
    },
  ) {
    return this.badgesService.createBadge(body);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async deleteBadge(@Param('id') id: string) {
    return this.badgesService.deleteBadge(id);
  }
}
