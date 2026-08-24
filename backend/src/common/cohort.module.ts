import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CohortService } from './cohort.service';
import { CohortController } from './cohort.controller';

@Module({
  controllers: [CohortController],
  providers: [PrismaService, CohortService],
  exports: [CohortService],
})
export class CohortModule {}
