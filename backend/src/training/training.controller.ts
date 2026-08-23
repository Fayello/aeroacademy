import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TrainingService } from './training.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Audit } from '../common/audit.decorator';
import { BatchIdsDto } from '../common/batch.dto';
import type { RequestWithUser } from '../common/request-with-user';
import type { Prisma } from '@prisma/client';

@ApiTags('training')
@Controller('v1/training')
export class TrainingController {
  constructor(private trainingService: TrainingService) {}

  @Get('trainers')
  async findAllTrainers() {
    return this.trainingService.findAllTrainers();
  }

  @Get('trainers/:id')
  async findTrainer(@Param('id') id: string) {
    return this.trainingService.findTrainer(id);
  }

  @Get('trainers/:id/slots')
  async getAvailableSlots(
    @Param('id') id: string,
    @Query('date') date: string,
  ) {
    return this.trainingService.getAvailableSlots(id, date);
  }

  @ApiBearerAuth('JWT-auth')
  @Post('book')
  @UseGuards(AuthGuard('jwt'))
  @Audit('BOOKING_CREATED')
  async book(
    @Body()
    body: {
      trainerId: string;
      slotId?: string;
      date: string;
      startTime: string;
      endTime: string;
      topic: string;
      notes?: string;
    },
    @Request() req: RequestWithUser,
  ) {
    return this.trainingService.book({ ...body, studentId: req.user.id });
  }

  @ApiBearerAuth('JWT-auth')
  @Delete('bookings/:id')
  @UseGuards(AuthGuard('jwt'))
  @Audit('BOOKING_CANCELLED')
  async cancelBooking(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    return this.trainingService.cancelBooking(id, req.user.id);
  }

  @ApiBearerAuth('JWT-auth')
  @Get('bookings')
  @UseGuards(AuthGuard('jwt'))
  async getMyBookings(@Request() req: RequestWithUser) {
    return this.trainingService.getMyBookings(req.user.id);
  }

  @ApiBearerAuth('JWT-auth')
  @Post('trainers')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Audit('TRAINER_CREATED')
  async addTrainer(
    @Body()
    body: {
      userId: string;
      bio?: string;
      specialties?: string[];
      hourlyRate?: number;
    },
  ) {
    return this.trainingService.addTrainer(body);
  }

  @ApiBearerAuth('JWT-auth')
  @Patch('trainers/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Audit('TRAINER_UPDATED')
  async updateTrainer(
    @Param('id') id: string,
    @Body() body: { name?: string; email?: string; specialties?: string[]; bio?: string; hourlyRate?: number; isActive?: boolean },
  ) {
    return this.trainingService.updateTrainer(id, body);
  }

  @ApiBearerAuth('JWT-auth')
  @Delete('trainers/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Audit('TRAINER_DELETED')
  async deleteTrainer(@Param('id') id: string) {
    return this.trainingService.deleteTrainer(id);
  }

  @ApiBearerAuth('JWT-auth')
  @Post('batch/delete-trainers')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Audit('TRAINERS_DELETED_BATCH')
  async batchDeleteTrainers(@Body() body: BatchIdsDto) {
    return this.trainingService.batchDeleteTrainers(body.ids);
  }

  @ApiBearerAuth('JWT-auth')
  @Post('trainers/:id/slots')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Audit('TRAINER_SLOTS_ADDED')
  async addSlots(
    @Param('id') id: string,
    @Body()
    body: {
      slots: { dayOfWeek: number; startTime: string; endTime: string }[];
    },
  ) {
    return this.trainingService.addSlots(id, body.slots);
  }

  @ApiBearerAuth('JWT-auth')
  @Delete('slots/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Audit('TRAINER_SLOT_REMOVED')
  async removeSlot(@Param('id') id: string) {
    return this.trainingService.removeSlot(id);
  }
}
