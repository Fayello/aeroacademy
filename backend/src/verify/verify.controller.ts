import { Controller, Get, Param } from '@nestjs/common';
import { CoursesService } from '../courses/courses.service';

@Controller('v1/verify')
export class VerifyController {
  constructor(private coursesService: CoursesService) {}

  @Get(':courseId/:userId')
  async verifyCertificate(
    @Param('courseId') courseId: string,
    @Param('userId') userId: string,
  ) {
    return this.coursesService.verifyCertificate(courseId, userId);
  }
}
