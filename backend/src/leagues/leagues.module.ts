
import { Module } from '@nestjs/common';
import { LeaguesService } from './leagues.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [LeaguesService],
  exports: [LeaguesService],
})
export class LeaguesModule {}
