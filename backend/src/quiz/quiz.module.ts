import { Module } from '@nestjs/common';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../common/events.module';
import { ChallengesModule } from '../challenges/challenges.module';

@Module({
  imports: [PrismaModule, EventsModule, ChallengesModule],
  controllers: [QuizController],
  providers: [QuizService],
  exports: [QuizService],
})
export class QuizModule {}
