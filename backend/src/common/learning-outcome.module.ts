import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LearningOutcomeService } from './learning-outcome.service';
import { LearningOutcomeController } from './learning-outcome.controller';

@Module({
  controllers: [LearningOutcomeController],
  providers: [PrismaService, LearningOutcomeService],
  exports: [LearningOutcomeService],
})
export class LearningOutcomeModule {}
