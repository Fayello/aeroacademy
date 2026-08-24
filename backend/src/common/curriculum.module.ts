import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurriculumService } from './curriculum.service';
import { CurriculumController } from './curriculum.controller';

@Module({
  controllers: [CurriculumController],
  providers: [PrismaService, CurriculumService],
  exports: [CurriculumService],
})
export class CurriculumModule {}
