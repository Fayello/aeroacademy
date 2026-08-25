import { Module } from '@nestjs/common';
import { GradeBookService } from './grade-book.service';
import { GradeBookController } from './grade-book.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GradeBookController],
  providers: [GradeBookService],
  exports: [GradeBookService],
})
export class GradeBookModule {}
