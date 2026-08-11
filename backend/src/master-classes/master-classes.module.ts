import { Module } from '@nestjs/common';
import { MasterClassesService } from './master-classes.service';
import { MasterClassesController } from './master-classes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [MasterClassesController],
  providers: [MasterClassesService],
  exports: [MasterClassesService],
})
export class MasterClassesModule {}
