import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LearningOutcomeService } from './learning-outcome.service';
import { LearningOutcomeController } from './learning-outcome.controller';
import { AuthModule } from '../auth/auth.module';
import { DomainRankingModule } from '../domain-ranking/domain-ranking.module';

@Module({
  imports: [AuthModule, DomainRankingModule],
  controllers: [LearningOutcomeController],
  providers: [PrismaService, LearningOutcomeService],
  exports: [LearningOutcomeService],
})
export class LearningOutcomeModule {}
