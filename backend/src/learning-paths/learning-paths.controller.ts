import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { LearningPathsService } from './learning-paths.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { RequestWithUser } from '../common/request-with-user';

@ApiTags('learning-paths')
@ApiBearerAuth('JWT-auth')
@Controller('v1/learning-paths')
@UseGuards(AuthGuard('jwt'))
export class LearningPathsController {
  constructor(private learningPathsService: LearningPathsService) {}

  @Get()
  async findAll() {
    return this.learningPathsService.findAll();
  }

  @Get('my')
  async getMyEnrollments(@Request() req: RequestWithUser) {
    return this.learningPathsService.getMyEnrollments(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.learningPathsService.findOne(id, req.user.id);
  }

  @Post(':id/enroll')
  async enroll(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.learningPathsService.enroll(req.user.id, id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async create(
    @Body()
    body: {
      title: string;
      description: string;
      imageUrl?: string;
      difficulty?: string;
      courses?: { courseId: string; order?: number }[];
    },
  ) {
    return this.learningPathsService.create(body);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      imageUrl?: string;
      difficulty?: string;
      courses?: { courseId: string; order?: number }[];
    },
  ) {
    return this.learningPathsService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    return this.learningPathsService.remove(id);
  }
}
