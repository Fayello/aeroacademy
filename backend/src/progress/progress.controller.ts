import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { ProgressService } from './progress.service';
import { AuthGuard } from '@nestjs/passport';
import { CompleteLessonDto } from './dto/complete-lesson.dto';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Audit } from '../common/audit.decorator';
import type { RequestWithUser } from '../common/request-with-user';

@ApiTags('progress')
@ApiBearerAuth('JWT-auth')
@Controller('progress')
@UseGuards(AuthGuard('jwt'))
export class ProgressController {
  constructor(private progressService: ProgressService) {}

  @Post('start')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async startLesson(
    @Request() req: RequestWithUser,
    @Body() completeLessonDto: CompleteLessonDto,
  ) {
    return this.progressService.startLesson(
      req.user.id,
      completeLessonDto.lessonId,
    );
  }

  @Post('complete')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Audit('LESSON_COMPLETED')
  async completeLesson(
    @Request() req: RequestWithUser,
    @Body() completeLessonDto: CompleteLessonDto,
  ) {
    return this.progressService.markAsComplete(
      req.user.id,
      completeLessonDto.lessonId,
    );
  }

  @Get('latest')
  async getLatest(@Request() req: RequestWithUser) {
    return this.progressService.getLatestProgress(req.user.id);
  }

  @Get('course/:id')
  @Throttle({ default: { limit: 200, ttl: 60000 } })
  async getCourseProgress(
    @Request() req: RequestWithUser,
    @Param('id') courseId: string,
  ) {
    return this.progressService.getCourseProgress(req.user.id, courseId);
  }
}
