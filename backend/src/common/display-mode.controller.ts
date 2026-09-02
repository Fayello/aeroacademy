import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DisplayModeService } from './display-mode.service';
import { MetricsService } from './metrics.service';
import type { RequestWithUser } from '../common/request-with-user';

type DisplayMode = 'PROFESSIONAL' | 'PROGRESSION' | 'COMPETITIVE';

@ApiTags('display-mode')
@Controller('v1/display-mode')
export class DisplayModeController {
  constructor(
    private displayModeService: DisplayModeService,
    private metricsService: MetricsService,
  ) {}

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getDisplayMode(@Request() req: RequestWithUser) {
    const mode = await this.displayModeService.getDisplayMode(req.user.id);
    const config = await this.displayModeService.getModeConfig(mode);
    return { mode, config };
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Patch()
  async setDisplayMode(
    @Request() req: RequestWithUser,
    @Body('mode') mode: string,
  ) {
    const newMode = await this.displayModeService.setDisplayMode(
      req.user.id,
      mode as DisplayMode,
    );
    const config = await this.displayModeService.getModeConfig(newMode);

    await this.metricsService.record({
      userId: req.user.id,
      displayMode: newMode,
      type: 'MODE_CHANGED',
      metadata: { newMode },
    });

    return { mode: newMode, config };
  }
}

@ApiTags('metrics')
@Controller('v1/metrics')
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Get('mode-comparison')
  async getModeComparison() {
    return this.metricsService.getModeComparison();
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Get('retention')
  async getModeRetention() {
    return this.metricsService.getModeRetention();
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Get('feature-adoption')
  async getFeatureAdoption() {
    return this.metricsService.getModeFeatureAdoption();
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Patch('record')
  async recordEvent(
    @Request() req: RequestWithUser,
    @Body() body: { type: string; metadata?: Record<string, unknown> },
  ) {
    await this.metricsService.record({
      userId: req.user.id,
      type: body.type,
      metadata: body.metadata,
    });
    return { ok: true };
  }
}
