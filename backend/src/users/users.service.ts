import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(role?: string) {
    return this.prisma.user.findMany({
      where: role ? { role: role as any } : {},
      include: {
        organization: { select: { name: true, type: true } },
        _count: { select: { progress: true, labSubmissions: true, quizSubmissions: true, achievements: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        organization: { select: { name: true, type: true } },
        progress: { include: { lesson: { select: { title: true } } } },
        achievements: { include: { achievement: true } },
        _count: { select: { progress: true, labSubmissions: true, quizSubmissions: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, data: { name?: string; email?: string; role?: string; bio?: string; city?: string; xp?: number; organizationId?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const updateData: any = { ...data };
    if (data.role) updateData.role = data.role as any;
    if (data.organizationId === null) updateData.organizationId = null;
    return this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { organization: { select: { name: true } } },
    });
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.delete({ where: { id } });
  }

  async batchRemove(ids: string[], actorId?: string) {
    const targetIds = actorId ? ids.filter((id) => id !== actorId) : ids;
    const result = await this.prisma.user.deleteMany({
      where: { id: { in: targetIds } },
    });
    return { deleted: result.count };
  }

  async batchSetRole(ids: string[], role: Role, actorId?: string) {
    const targetIds = actorId ? ids.filter((id) => id !== actorId) : ids;
    const result = await this.prisma.user.updateMany({
      where: { id: { in: targetIds } },
      data: { role },
    });
    return { updated: result.count };
  }

  async getStats() {
    const [total, byRole] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.groupBy({ by: ['role'], _count: true }),
    ]);
    return { total, byRole };
  }
}
