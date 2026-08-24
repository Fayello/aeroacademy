import {
  Controller,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NavigationService } from './navigation.service';
import type { RequestWithUser } from '../common/request-with-user';

@ApiTags('navigation')
@Controller('v1/navigation')
export class NavigationController {
  constructor(private navigationService: NavigationService) {}

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Get('context')
  async getNavigationContext(@Request() req: RequestWithUser) {
    return this.navigationService.getNavigationContext(req.user.id);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Get('experience')
  async getExperience(@Request() req: RequestWithUser) {
    const experience = await this.navigationService.detectExperience(req.user.id);
    return { experience };
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Get('sync-experience')
  async syncExperience(@Request() req: RequestWithUser) {
    const experience = await this.navigationService.syncExperience(req.user.id);
    return { experience };
  }
}
