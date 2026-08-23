import { Module } from '@nestjs/common';
import { CrossDomainService } from './cross-domain.service';
import { CrossDomainController } from './cross-domain.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CrossDomainController],
  providers: [CrossDomainService],
  exports: [CrossDomainService],
})
export class CrossDomainModule {}
