
import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LabsModule } from '../labs/labs.module';

@Module({
  imports: [PrismaModule, LabsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
