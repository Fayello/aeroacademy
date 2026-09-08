import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SeasonsService } from './seasons.service';

@Controller('v1/seasons')
@UseGuards(AuthGuard('jwt'))
export class SeasonsController {
  constructor(private readonly seasonsService: SeasonsService) {}

  @Get('active')
  getActiveSeason() {
    return this.seasonsService.getActiveSeason();
  }

  @Get()
  getAllSeasons() {
    return this.seasonsService.getAllSeasons();
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post()
  createSeason(
    @Body()
    body: {
      name: string;
      theme?: string;
      xpMultiplier?: number;
      startDate: string;
      endDate: string;
    },
  ) {
    return this.seasonsService.createSeason(body);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post(':id/end')
  endSeason(@Param('id') id: string) {
    return this.seasonsService.endSeason(id);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post('rotate')
  rotateSeason() {
    return this.seasonsService.rotateSeason();
  }
}
