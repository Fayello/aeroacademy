import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DomainRankingService } from './domain-ranking.service';
import { DomainRankingController } from './domain-ranking.controller';

@Module({
  imports: [PrismaModule],
  providers: [DomainRankingService],
  controllers: [DomainRankingController],
  exports: [DomainRankingService],
})
export class DomainRankingModule {}
