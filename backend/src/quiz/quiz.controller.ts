import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { QuizService } from './quiz.service';
import { AuthGuard } from '@nestjs/passport';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Audit } from '../common/audit.decorator';
import type { RequestWithUser } from '../common/request-with-user';

@ApiTags('quiz')
@ApiBearerAuth('JWT-auth')
@Controller('quiz')
@UseGuards(AuthGuard('jwt'))
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get('lesson/:lessonId')
  async getQuiz(@Param('lessonId', ParseUUIDPipe) lessonId: string) {
    return this.quizService.getQuizByLesson(lessonId);
  }

  @Post('submit/:quizId')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Audit('QUIZ_SUBMITTED')
  async submitQuiz(
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Body() submitQuizDto: SubmitQuizDto,
    @Request() req: RequestWithUser,
  ) {
    return this.quizService.submitQuiz(
      req.user.id,
      quizId,
      submitQuizDto.answers,
    );
  }
}
