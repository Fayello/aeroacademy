import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PracticalAssessmentService } from './practical-assessment.service';
import { PracticalAssessmentController } from './practical-assessment.controller';
import { LearningOutcomeModule } from './learning-outcome.module';

@Module({
  imports: [LearningOutcomeModule],
  controllers: [PracticalAssessmentController],
  providers: [PrismaService, PracticalAssessmentService],
  exports: [PracticalAssessmentService],
})
export class PracticalAssessmentModule {}
