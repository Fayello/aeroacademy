import { Controller, Get, Post, Body, Param, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { AuthGuard } from '@nestjs/passport';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { Throttle } from '@nestjs/throttler';

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
  async submitQuiz(
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Body() submitQuizDto: SubmitQuizDto,
    @Request() req,
  ) {
    return this.quizService.submitQuiz(req.user.id, quizId, submitQuizDto.answers);
  }
}
