import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { EventsService } from '../common/events.service';
import { EmailService } from '../email/email.service';
import createLogger from '../common/logger';

const logger = createLogger('Training');

@Injectable()
export class TrainingService {
  constructor(
    private prisma: PrismaService,
    private eventsService: EventsService,
    private emailService: EmailService,
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
    if (!trainer.isActive)
      throw new BadRequestException('Trainer is not currently available');
    const d = new Date(data.date);
    if (isNaN(d.getTime()))
      throw new BadRequestException('Invalid date format');
    if (d.getTime() < Date.now() - 86400000)
      throw new BadRequestException('Cannot book sessions in the past');

    return this.prisma.$transaction(async (tx) => {
      if (data.slotId) {
        const slot = await tx.trainingSlot.findUnique({
          where: { id: data.slotId },
        });
        if (!slot || slot.trainerId !== data.trainerId)
          throw new BadRequestException('Invalid training slot');
      }

      const existingBookings = await tx.booking.findMany({
        where: {
          trainerId: data.trainerId,
          date: d,
          status: { not: 'CANCELLED' },
        },
        select: { startTime: true, endTime: true },
      });

      const hasOverlap = existingBookings.some((b) => {
        const aStart = data.startTime;
        const aEnd = data.endTime;
        return aStart < b.endTime && aEnd > b.startTime;
      });
      if (hasOverlap)
        throw new BadRequestException(
          'This time slot overlaps with an existing booking',
        );

      const booking = await tx.booking.create({
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
          trainer: { include: { user: { select: { id: true, name: true, email: true } } } },
          student: { select: { id: true, name: true, email: true } },
        },
      });

      const studentName = booking.student?.name || 'A student';
      const trainerName = booking.trainer?.user?.name || 'Your trainer';
      const dateStr = data.date;
      const timeStr = `${data.startTime} - ${data.endTime}`;

      this.eventsService.emit('BOOKING_CONFIRMED', {
        userId: data.studentId,
        message: `Your training session with ${trainerName} on ${dateStr} at ${timeStr} has been confirmed.`,
        trainerName,
      });

      this.eventsService.emit('TRAINER_BOOKING_RECEIVED', {
        userId: booking.trainer?.user?.id || '',
        message: `${studentName} booked a session with you on ${dateStr} at ${timeStr} — Topic: ${data.topic}`,
        studentName,
        link: '/dashboard/training/bookings',
      });

      const trainerEmail = booking.trainer?.user?.email;
      if (trainerEmail) {
        this.emailService.send({
          to: trainerEmail,
          from: 'info',
          subject: `New Booking: ${studentName} — ${dateStr} ${timeStr}`,
          html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:#0F203A;padding:24px 32px;">
      <h1 style="margin:0;color:#7AD62A;font-size:20px;">New Training Booking</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#334155;font-size:15px;line-height:1.6;">Hi ${trainerName},</p>
      <p style="color:#334155;font-size:15px;line-height:1.6;">${studentName} has booked a training session with you.</p>
      <div style="background:#f8fafc;border-radius:10px;padding:20px;margin:20px 0;border:1px solid #e2e8f0;">
        <table style="width:100%;font-size:14px;color:#475569;">
          <tr><td style="padding:6px 0;font-weight:600;color:#1e293b;">Date</td><td style="padding:6px 0;">${dateStr}</td></tr>
          <tr><td style="padding:6px 0;font-weight:600;color:#1e293b;">Time</td><td style="padding:6px 0;">${timeStr}</td></tr>
          <tr><td style="padding:6px 0;font-weight:600;color:#1e293b;">Topic</td><td style="padding:6px 0;">${data.topic}</td></tr>
          ${data.notes ? `<tr><td style="padding:6px 0;font-weight:600;color:#1e293b;">Notes</td><td style="padding:6px 0;">${data.notes}</td></tr>` : ''}
        </table>
      </div>
      <p style="color:#64748b;font-size:13px;margin-top:24px;">Log in to your dashboard to view booking details.</p>
    </div>
    <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">XpertClass Training Platform</p>
    </div>
  </div>
</body>
</html>`,
        }).catch((err) => logger.error(`Trainer booking email failed: ${err.message}`));
      }

      const studentEmail = booking.student?.email;
      if (studentEmail) {
        this.emailService.send({
          to: studentEmail,
          from: 'info',
          subject: `Booking Confirmed: Session with ${trainerName} — ${dateStr} ${timeStr}`,
          html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:#0F203A;padding:24px 32px;">
      <h1 style="margin:0;color:#7AD62A;font-size:20px;">Booking Confirmed</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#334155;font-size:15px;line-height:1.6;">Hi ${studentName},</p>
      <p style="color:#334155;font-size:15px;line-height:1.6;">Your training session with <strong>${trainerName}</strong> has been confirmed.</p>
      <div style="background:#f8fafc;border-radius:10px;padding:20px;margin:20px 0;border:1px solid #e2e8f0;">
        <table style="width:100%;font-size:14px;color:#475569;">
          <tr><td style="padding:6px 0;font-weight:600;color:#1e293b;">Date</td><td style="padding:6px 0;">${dateStr}</td></tr>
          <tr><td style="padding:6px 0;font-weight:600;color:#1e293b;">Time</td><td style="padding:6px 0;">${timeStr}</td></tr>
          <tr><td style="padding:6px 0;font-weight:600;color:#1e293b;">Topic</td><td style="padding:6px 0;">${data.topic}</td></tr>
        </table>
      </div>
      <p style="color:#64748b;font-size:13px;margin-top:24px;">Log in to your dashboard to view booking details.</p>
    </div>
    <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">XpertClass Training Platform</p>
    </div>
  </div>
</body>
</html>`,
        }).catch((err) => logger.error(`Student booking email failed: ${err.message}`));
      }

      return booking;
    });
  }

  async cancelBooking(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        trainer: { include: { user: { select: { id: true, name: true, email: true } } } },
        student: { select: { id: true, name: true, email: true } },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.studentId !== userId)
      throw new BadRequestException('Not your booking');

    const cancelled = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
    });

    const dateStr = cancelled.date.toISOString().slice(0, 10);
    const timeStr = `${cancelled.startTime} - ${cancelled.endTime}`;
    const studentName = booking.student?.name || 'The student';
    const trainerName = booking.trainer?.user?.name || 'The trainer';

    this.eventsService.emit('BOOKING_CANCELLED', {
      userId,
      message: `Your training session with ${trainerName} on ${dateStr} at ${timeStr} has been cancelled.`,
    });

    this.eventsService.emit('BOOKING_CANCELLED', {
      userId: booking.trainer?.user?.id || '',
      message: `${studentName} cancelled their session on ${dateStr} at ${timeStr}.`,
      link: '/dashboard/training/bookings',
    });

    const trainerEmail = booking.trainer?.user?.email;
    if (trainerEmail) {
      this.emailService.send({
        to: trainerEmail,
        from: 'info',
        subject: `Booking Cancelled: ${studentName} — ${dateStr} ${timeStr}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:#0F203A;padding:24px 32px;">
      <h1 style="margin:0;color:#ef4444;font-size:20px;">Booking Cancelled</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#334155;font-size:15px;line-height:1.6;">Hi ${trainerName},</p>
      <p style="color:#334155;font-size:15px;line-height:1.6;">${studentName} has cancelled their training session.</p>
      <div style="background:#fef2f2;border-radius:10px;padding:20px;margin:20px 0;border:1px solid #fecaca;">
        <table style="width:100%;font-size:14px;color:#475569;">
          <tr><td style="padding:6px 0;font-weight:600;color:#1e293b;">Date</td><td style="padding:6px 0;">${dateStr}</td></tr>
          <tr><td style="padding:6px 0;font-weight:600;color:#1e293b;">Time</td><td style="padding:6px 0;">${timeStr}</td></tr>
        </table>
      </div>
    </div>
    <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">XpertClass Training Platform</p>
    </div>
  </div>
</body>
</html>`,
      }).catch((err) => logger.error(`Trainer cancel email failed: ${err.message}`));
    }

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
    const slot = await this.prisma.trainingSlot.findUnique({
      where: { id: slotId },
    });
    if (!slot) throw new NotFoundException('Slot not found');
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

    await this.prisma.$transaction([
      this.prisma.booking.updateMany({
        where: {
          trainerId: id,
          status: { not: 'CANCELLED' },
          date: { gte: new Date() },
        },
        data: { status: 'CANCELLED' },
      }),
      this.prisma.trainingSlot.deleteMany({ where: { trainerId: id } }),
    ]);

    return this.prisma.trainer.delete({ where: { id } });
  }

  async batchDeleteTrainers(ids: string[]) {
    const existing = await this.prisma.trainer.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    const found = existing.map((t) => t.id);

    await this.prisma.$transaction([
      this.prisma.booking.updateMany({
        where: {
          trainerId: { in: found },
          status: { not: 'CANCELLED' },
          date: { gte: new Date() },
        },
        data: { status: 'CANCELLED' },
      }),
      this.prisma.trainingSlot.deleteMany({
        where: { trainerId: { in: found } },
      }),
      this.prisma.trainer.deleteMany({ where: { id: { in: found } } }),
    ]);

    return { deleted: found.length };
  }

  async getTrainerByUserId(userId: string) {
    return this.prisma.trainer.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        slots: { where: { isActive: true }, orderBy: { dayOfWeek: 'asc' } },
        _count: { select: { bookings: true } },
      },
    });
  }

  async getTrainerBookings(userId: string) {
    const trainer = await this.prisma.trainer.findUnique({ where: { userId } });
    if (!trainer) return [];
    return this.prisma.booking.findMany({
      where: { trainerId: trainer.id },
      include: {
        student: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { date: 'asc' },
    });
  }

  async updateTrainerProfile(userId: string, data: { bio?: string; specialties?: string[]; hourlyRate?: number }) {
    const trainer = await this.prisma.trainer.findUnique({ where: { userId } });
    if (!trainer) throw new NotFoundException('Trainer profile not found');
    return this.prisma.trainer.update({
      where: { id: trainer.id },
      data,
      include: {
        user: { select: { id: true, name: true, email: true } },
        slots: { where: { isActive: true } },
      },
    });
  }

  async addTrainerSlots(userId: string, slots: { dayOfWeek: number; startTime: string; endTime: string }[]) {
    const trainer = await this.prisma.trainer.findUnique({ where: { userId } });
    if (!trainer) throw new NotFoundException('Trainer profile not found');
    return this.prisma.trainingSlot.createMany({
      data: slots.map((s) => ({ trainerId: trainer.id, ...s })),
    });
  }

  async removeTrainerSlot(userId: string, slotId: string) {
    const trainer = await this.prisma.trainer.findUnique({ where: { userId } });
    if (!trainer) throw new NotFoundException('Trainer profile not found');
    const slot = await this.prisma.trainingSlot.findUnique({ where: { id: slotId } });
    if (!slot || slot.trainerId !== trainer.id) throw new NotFoundException('Slot not found');
    return this.prisma.trainingSlot.delete({ where: { id: slotId } });
  }
}
