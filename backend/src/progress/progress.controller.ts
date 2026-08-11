import { Controller, Post, Body, Get, UseGuards, Request, Param } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { AuthGuard } from '@nestjs/passport';
import { CompleteLessonDto } from './dto/complete-lesson.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('progress')
@UseGuards(AuthGuard('jwt'))
export class ProgressController {
  constructor(private progressService: ProgressService) {}

  @Post('complete')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async completeLesson(@Request() req, @Body() completeLessonDto: CompleteLessonDto) {
    return this.progressService.markAsComplete(req.user.id, completeLessonDto.lessonId);
  }

  @Get('latest')
  async getLatest(@Request() req) {
    return this.progressService.getLatestProgress(req.user.id);
  }

  @Get('course/:id')
  async getCourseProgress(@Request() req, @Param('id') courseId: string) {
    return this.progressService.getCourseProgress(req.user.id, courseId);
  }
}
