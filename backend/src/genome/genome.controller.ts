import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MasteryService, TechnologyGenome } from '../common/mastery.service';

@Controller('v1/genome')
export class GenomeController {
  constructor(private readonly masteryService: MasteryService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getMyGenome(@Request() req: any): Promise<TechnologyGenome> {
    return this.masteryService.getTechnologyGenome(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile/:userId')
  async getGenome(@Param('userId') userId: string): Promise<TechnologyGenome> {
    return this.masteryService.getTechnologyGenome(userId);
  }
}
