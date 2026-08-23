import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { BattlePassService } from './battle-pass.service';

@Controller('v2/battle-pass')
export class BattlePassController {
  constructor(private readonly battlePassService: BattlePassService) {}

  @Get()
  getBattlePass() {
    return this.battlePassService.getBattlePass();
  }

  @Get('progress/:userId')
  getUserProgress(@Param('userId') userId: string) {
    return this.battlePassService.getUserProgress(userId);
  }

  @Get('leaderboard')
  getLeaderboard() {
    return this.battlePassService.getLeaderboard();
  }

  @Post()
  createBattlePass(@Body() body: { seasonId: string; title: string; tiers: Array<{ tierNumber: number; title: string; xpRequired: number; rewards: any; isPremium?: boolean }> }) {
    return this.battlePassService.createBattlePass(body.seasonId, body.title, body.tiers);
  }

  @Post('xp')
  addXp(@Body() body: { userId: string; amount: number; source: string }) {
    return this.battlePassService.addBattlePassXp(body.userId, body.amount, body.source);
  }
}
