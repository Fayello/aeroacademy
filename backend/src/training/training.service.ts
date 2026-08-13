import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { EventsService } from '../common/events.service';

@Injectable()
export class TrainingService {
  constructor(
    private prisma: PrismaService,
    private eventsService: EventsService,
  ) {}

  async findAllTrainers() {
    return this.prisma.trainer.findMany({
      where: { isActive: true },
      include: {
        user: { select: { id: true, name: true, email: true } },
        slots: { where: { isActive: true } },
        _count: { select: { bookings: true } },
      },
    });
  }

  async findTrainer(id: string) {
    const trainer = await this.prisma.trainer.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, bio: true } },
        slots: { where: { isActive: true }, orderBy: { dayOfWeek: 'asc' } },
        _count: { select: { bookings: true } },
      },
    });
    if (!trainer) throw new NotFoundException('Trainer not found');
    return trainer;
  }

  async getAvailableSlots(trainerId: string, date: string) {
    const d = new Date(date);
    const dayOfWeek = d.getDay();

    const slots = await this.prisma.trainingSlot.findMany({
      where: { trainerId, dayOfWeek, isActive: true },
    });

    const bookings = await this.prisma.booking.findMany({
      where: {
        trainerId,
        date: d,
        status: { not: 'CANCELLED' },
      },
    });

    return slots.map((slot) => {
      const isBooked = bookings.some(
        (b) => b.startTime === slot.startTime && b.endTime === slot.endTime,
      );
      return { ...slot, available: !isBooked };
    });
  }

  async book(data: {
    trainerId: string;
    studentId: string;
    slotId?: string;
    date: string;
    startTime: string;
    endTime: string;
    topic: string;
    notes?: string;
  }) {
    const trainer = await this.prisma.trainer.findUnique({
      where: { id: data.trainerId },
    });
    if (!trainer) throw new NotFoundException('Trainer not found');

    const d = new Date(data.date);
    const existing = await this.prisma.booking.findFirst({
      where: {
        trainerId: data.trainerId,
        date: d,
        startTime: data.startTime,
        status: { not: 'CANCELLED' },
      },
    });
    if (existing) throw new BadRequestException('This slot is already booked');

    const booking = await this.prisma.booking.create({
      data: {
        trainerId: data.trainerId,
        studentId: data.studentId,
        slotId: data.slotId,
        date: d,
        startTime: data.startTime,
        endTime: data.endTime,
        topic: data.topic,
        notes: data.notes,
        status: 'CONFIRMED',
      },
      include: {
        trainer: { include: { user: { select: { name: true } } } },
      },
    });

    this.eventsService.emit('BOOKING_CONFIRMED', {
      userId: data.studentId,
      message: `Your training session on ${data.date} at ${data.startTime} has been confirmed.`,
      trainerName: booking.trainer?.user?.name,
    });

    return booking;
  }

  async cancelBooking(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.studentId !== userId)
      throw new BadRequestException('Not your booking');

    const cancelled = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
    });

    this.eventsService.emit('BOOKING_CANCELLED', {
      userId,
      message: `Your training session on ${cancelled.date.toISOString().slice(0, 10)} has been cancelled.`,
    });

    return cancelled;
  }

  async getMyBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: { studentId: userId },
      include: {
        trainer: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async addTrainer(data: {
    userId: string;
    bio?: string;
    specialties?: string[];
    hourlyRate?: number;
  }) {
    const existing = await this.prisma.trainer.findUnique({
      where: { userId: data.userId },
    });
    if (existing) throw new BadRequestException('User is already a trainer');

    return this.prisma.trainer.create({
      data,
      include: { user: { select: { name: true, email: true } } },
    });
  }

  async addSlots(
    trainerId: string,
    slots: { dayOfWeek: number; startTime: string; endTime: string }[],
  ) {
    const trainer = await this.prisma.trainer.findUnique({
      where: { id: trainerId },
    });
    if (!trainer) throw new NotFoundException('Trainer not found');

    return this.prisma.trainingSlot.createMany({
      data: slots.map((s) => ({ ...s, trainerId })),
    });
  }

  async removeSlot(slotId: string) {
    return this.prisma.trainingSlot.delete({ where: { id: slotId } });
  }

  async updateTrainer(id: string, data: Prisma.TrainerUpdateInput) {
    const trainer = await this.prisma.trainer.findUnique({ where: { id } });
    if (!trainer) throw new NotFoundException('Trainer not found');

    return this.prisma.trainer.update({
      where: { id },
      data,
      include: { user: { select: { name: true, email: true } } },
    });
  }

  async deleteTrainer(id: string) {
    const trainer = await this.prisma.trainer.findUnique({ where: { id } });
    if (!trainer) throw new NotFoundException('Trainer not found');

    await this.prisma.trainingSlot.deleteMany({ where: { trainerId: id } });
    return this.prisma.trainer.delete({ where: { id } });
  }
}
