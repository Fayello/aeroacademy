import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { BattlePassService } from './battle-pass.service';

@Controller('v2/battle-pass')
@UseGuards(AuthGuard('jwt'))
export class BattlePassController {
  constructor(private readonly battlePassService: BattlePassService) {}

  @Get()
  getAllBattlePasses() {
    return this.battlePassService.getAllBattlePasses();
  }

  @Get('active')
  getActiveBattlePass() {
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
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  createBattlePass(
    @Body()
    body: {
      seasonId: string;
      title: string;
      tiers: Array<{
        tierNumber: number;
        title: string;
        xpRequired: number;
        rewards: any;
        isPremium?: boolean;
      }>;
    },
  ) {
    return this.battlePassService.createBattlePass(
      body.seasonId,
      body.title,
      body.tiers,
    );
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  updateBattlePass(
    @Param('id') id: string,
    @Body()
    body: {
      seasonId?: string;
      title?: string;
      tiers?: Array<{
        tierNumber: number;
        title: string;
        xpRequired: number;
        rewards: any;
        isPremium?: boolean;
      }>;
    },
  ) {
    return this.battlePassService.updateBattlePass(id, body);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  deactivateBattlePass(@Param('id') id: string) {
    return this.battlePassService.deactivateBattlePass(id);
  }

  @Post('xp')
  addXp(@Body() body: { userId: string; amount: number; source: string }) {
    return this.battlePassService.addBattlePassXp(
      body.userId,
      body.amount,
      body.source,
    );
  }
}
