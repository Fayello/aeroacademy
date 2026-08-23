import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SeasonsService } from './seasons.service';

@Controller('seasons')
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

  @Post()
  createSeason(@Body() body: { name: string; theme?: string; xpMultiplier?: number; startDate: string; endDate: string }) {
    return this.seasonsService.createSeason(body);
  }

  @Post(':id/end')
  endSeason(@Param('id') id: string) {
    return this.seasonsService.endSeason(id);
  }

  @Post('rotate')
  rotateSeason() {
    return this.seasonsService.rotateSeason();
  }
}
