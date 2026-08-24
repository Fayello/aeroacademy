import { Module } from '@nestjs/common';
import { SeasonsService } from './seasons.service';
import { SeasonsController } from './seasons.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DomainRankingModule } from '../domain-ranking/domain-ranking.module';
import { BattlePassModule } from '../battle-pass/battle-pass.module';

@Module({
  imports: [PrismaModule, DomainRankingModule, BattlePassModule],
  controllers: [SeasonsController],
  providers: [SeasonsService],
  exports: [SeasonsService],
})
export class SeasonsModule {}
