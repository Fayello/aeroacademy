import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MasterClassesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { category?: string; status?: string; limit?: number }) {
    const where: any = {};
    if (query?.category) where.category = query.category;
    if (query?.status) where.status = query.status;

    return this.prisma.masterClass.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      take: query?.limit || 50,
      include: {
        _count: { select: { registrations: true } },
      },
    });
  }

  async findOne(id: string) {
    const mc = await this.prisma.masterClass.findUnique({
      where: { id },
      include: {
        registrations: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        _count: { select: { registrations: true } },
      },
    });
    if (!mc) throw new NotFoundException('Master class not found');
    return mc;
  }

  async register(masterClassId: string, userId: string) {
    const mc = await this.prisma.masterClass.findUnique({ where: { id: masterClassId } });
    if (!mc) throw new NotFoundException('Master class not found');
    if (mc.status === 'COMPLETED' || mc.status === 'CANCELLED') {
      throw new BadRequestException('Cannot register for this master class');
    }
    if (mc.maxParticipants) {
      const count = await this.prisma.masterClassRegistration.count({ where: { masterClassId } });
      if (count >= mc.maxParticipants) throw new BadRequestException('Master class is full');
    }

    const existing = await this.prisma.masterClassRegistration.findUnique({
      where: { masterClassId_userId: { masterClassId, userId } },
    });
    if (existing) throw new BadRequestException('Already registered');

    return this.prisma.masterClassRegistration.create({
      data: { masterClassId, userId },
    });
  }

  async unregister(masterClassId: string, userId: string) {
    const registration = await this.prisma.masterClassRegistration.findUnique({
      where: { masterClassId_userId: { masterClassId, userId } },
    });
    if (!registration) throw new NotFoundException('Not registered');

    return this.prisma.masterClassRegistration.delete({
      where: { masterClassId_userId: { masterClassId, userId } },
    });
  }

  async getMyRegistrations(userId: string) {
    return this.prisma.masterClassRegistration.findMany({
      where: { userId },
      include: {
        masterClass: true,
      },
      orderBy: { registeredAt: 'desc' },
    });
  }

  async create(data: {
    title: string;
    description: string;
    instructorName?: string;
    instructorBio?: string;
    category?: string;
    scheduledAt?: string;
    duration?: number;
    maxParticipants?: number;
    isLive?: boolean;
  }) {
    return this.prisma.masterClass.create({
      data: {
        ...data,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      },
    });
  }

  async update(id: string, data: Record<string, any>) {
    const mc = await this.prisma.masterClass.findUnique({ where: { id } });
    if (!mc) throw new NotFoundException('Master class not found');

    if (data.scheduledAt) data.scheduledAt = new Date(data.scheduledAt);

    return this.prisma.masterClass.update({ where: { id }, data });
  }

  async remove(id: string) {
    const mc = await this.prisma.masterClass.findUnique({ where: { id } });
    if (!mc) throw new NotFoundException('Master class not found');
    return this.prisma.masterClass.delete({ where: { id } });
  }
}
