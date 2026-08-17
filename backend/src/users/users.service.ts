import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(role?: string) {
    return this.prisma.user.findMany({
      where: role ? { role: role as Role } : {},
      include: {
        organization: { select: { name: true, type: true } },
        _count: {
          select: {
            progress: true,
            labSubmissions: true,
            quizSubmissions: true,
            achievements: true,
          },
        },
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
        _count: {
          select: {
            progress: true,
            labSubmissions: true,
            quizSubmissions: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(
    id: string,
    data: {
      name?: string;
      email?: string;
      role?: string;
      bio?: string;
      city?: string;
      xp?: number;
      organizationId?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const { role, ...rest } = data;
    const updateData: {
      name?: string;
      email?: string;
      role?: Role;
      bio?: string;
      city?: string;
      xp?: number;
      organizationId?: string | null;
    } = rest;
    if (role) updateData.role = role as Role;
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

    await this.prisma.$transaction([
      this.prisma.activityEvent.deleteMany({ where: { userId: id } }),
      this.prisma.shortlist.deleteMany({ where: { OR: [{ recruiterId: id }, { studentId: id }] } }),
      this.prisma.labSubmission.deleteMany({ where: { userId: id } }),
      this.prisma.labInstance.deleteMany({ where: { userId: id } }),
      this.prisma.quizSubmission.deleteMany({ where: { userId: id } }),
      this.prisma.userAchievement.deleteMany({ where: { userId: id } }),
      this.prisma.progress.deleteMany({ where: { userId: id } }),
      this.prisma.notification.deleteMany({ where: { userId: id } }),
      this.prisma.booking.deleteMany({ where: { studentId: id } }),
      this.prisma.refreshToken.deleteMany({ where: { userId: id } }),
    ]);

    return this.prisma.user.delete({ where: { id } });
  }

  async batchRemove(ids: string[], actorId?: string) {
    const targetIds = actorId ? ids.filter((id) => id !== actorId) : ids;

    await this.prisma.$transaction([
      this.prisma.activityEvent.deleteMany({ where: { userId: { in: targetIds } } }),
      this.prisma.shortlist.deleteMany({ where: { OR: [{ recruiterId: { in: targetIds } }, { studentId: { in: targetIds } }] } }),
      this.prisma.labSubmission.deleteMany({ where: { userId: { in: targetIds } } }),
      this.prisma.labInstance.deleteMany({ where: { userId: { in: targetIds } } }),
      this.prisma.quizSubmission.deleteMany({ where: { userId: { in: targetIds } } }),
      this.prisma.userAchievement.deleteMany({ where: { userId: { in: targetIds } } }),
      this.prisma.progress.deleteMany({ where: { userId: { in: targetIds } } }),
      this.prisma.notification.deleteMany({ where: { userId: { in: targetIds } } }),
      this.prisma.booking.deleteMany({ where: { studentId: { in: targetIds } } }),
      this.prisma.refreshToken.deleteMany({ where: { userId: { in: targetIds } } }),
    ]);

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
