import { Module } from '@nestjs/common';
import { RecruitmentService } from './recruitment.service';
import { RecruitmentController } from './recruitment.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DomainRankingModule } from '../domain-ranking/domain-ranking.module';

@Module({
  imports: [PrismaModule, DomainRankingModule],
  controllers: [RecruitmentController],
  providers: [RecruitmentService],
})
export class RecruitmentModule {}
