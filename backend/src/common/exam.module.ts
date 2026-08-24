import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExamService } from './exam.service';
import { ExamController } from './exam.controller';

@Module({
  controllers: [ExamController],
  providers: [PrismaService, ExamService],
  exports: [ExamService],
})
export class ExamModule {}
