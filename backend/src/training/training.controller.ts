import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TrainingService } from './training.service';

@Controller('training')
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
  async getAvailableSlots(@Param('id') id: string, @Query('date') date: string) {
    return this.trainingService.getAvailableSlots(id, date);
  }

  @Post('book')
  @UseGuards(AuthGuard('jwt'))
  async book(@Body() body: any, @Request() req: any) {
    return this.trainingService.book({ ...body, studentId: req.user.id });
  }

  @Delete('bookings/:id')
  @UseGuards(AuthGuard('jwt'))
  async cancelBooking(@Param('id') id: string, @Request() req: any) {
    return this.trainingService.cancelBooking(id, req.user.id);
  }

  @Get('bookings')
  @UseGuards(AuthGuard('jwt'))
  async getMyBookings(@Request() req: any) {
    return this.trainingService.getMyBookings(req.user.id);
  }

  @Post('trainers')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async addTrainer(@Body() body: any) {
    return this.trainingService.addTrainer(body);
  }

  @Patch('trainers/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async updateTrainer(@Param('id') id: string, @Body() body: any) {
    return this.trainingService.updateTrainer(id, body);
  }

  @Delete('trainers/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async deleteTrainer(@Param('id') id: string) {
    return this.trainingService.deleteTrainer(id);
  }

  @Post('trainers/:id/slots')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async addSlots(@Param('id') id: string, @Body() body: { slots: { dayOfWeek: number; startTime: string; endTime: string }[] }) {
    return this.trainingService.addSlots(id, body.slots);
  }

  @Delete('slots/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async removeSlot(@Param('id') id: string) {
    return this.trainingService.removeSlot(id);
  }
}
