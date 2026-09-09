import { Module } from '@nestjs/common';
import { CapstoneService } from './capstone.service';
import { CapstoneController } from './capstone.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CapstoneController],
  providers: [CapstoneService],
  exports: [CapstoneService],
})
export class CapstonesModule {}
