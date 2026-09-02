import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LearningPathsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const paths = await this.prisma.learningPath.findMany({
      include: {
        courses: {
          orderBy: { order: 'asc' },
          include: {
            course: {
              select: {
                id: true,
                title: true,
                description: true,
                imageUrl: true,
                estimatedHours: true,
              },
            },
          },
        },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return paths.map((p) => ({
      ...p,
      courseCount: p.courses.length,
      enrollmentCount: p._count.enrollments,
      totalEstimatedHours: p.courses.reduce(
        (acc, c) => acc + (c.course.estimatedHours || 0),
        0,
      ),
    }));
  }

  async findOne(id: string, userId?: string) {
    const path = await this.prisma.learningPath.findUnique({
      where: { id },
      include: {
        courses: {
          orderBy: { order: 'asc' },
          include: {
            course: {
              include: {
                sections: { include: { lessons: true } },
                _count: { select: { enrollments: true, reviews: true } },
              },
            },
          },
        },
        _count: { select: { enrollments: true } },
      },
    });
    if (!path) throw new NotFoundException('Learning path not found');

    let enrollment: {
      id: string;
      learningPathId: string;
      userId: string;
      enrolledAt: Date;
      completedAt: Date | null;
    } | null = null;
    const courseProgress: Record<
      string,
      { completed: number; total: number; percentage: number }
    > = {};

    if (userId) {
      enrollment = await this.prisma.learningPathEnrollment.findUnique({
        where: { userId_learningPathId: { userId, learningPathId: id } },
      });

      for (const lpc of path.courses) {
        const total = await this.prisma.lesson.count({
          where: { section: { courseId: lpc.course.id } },
        });
        const completed = await this.prisma.progress.count({
          where: {
            userId,
            completed: true,
            lesson: { section: { courseId: lpc.course.id } },
          },
        });
        courseProgress[lpc.course.id] = {
          completed,
          total,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      }
    }

    const overallProgress =
      path.courses.length > 0
        ? Math.round(
            path.courses.reduce(
              (acc, c) => acc + (courseProgress[c.course.id]?.percentage || 0),
              0,
            ) / path.courses.length,
          )
        : 0;

    return {
      ...path,
      enrollment,
      courseProgress,
      overallProgress,
      courseCount: path.courses.length,
    };
  }

  async create(data: {
    title: string;
    description: string;
    imageUrl?: string;
    difficulty?: string;
    courses?: { courseId: string; order?: number }[];
  }) {
    return this.prisma.learningPath.create({
      data: {
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        difficulty: data.difficulty || 'BEGINNER',
        courses: data.courses
          ? {
              create: data.courses.map((c, i) => ({
                courseId: c.courseId,
                order: c.order ?? i,
              })),
            }
          : undefined,
      },
      include: {
        courses: { include: { course: { select: { id: true, title: true } } } },
      },
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      imageUrl?: string;
      difficulty?: string;
      courses?: { courseId: string; order?: number }[];
    },
  ) {
    const existing = await this.prisma.learningPath.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Learning path not found');

    if (data.courses) {
      await this.prisma.learningPathCourse.deleteMany({
        where: { learningPathId: id },
      });
    }

    return this.prisma.learningPath.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        difficulty: data.difficulty,
        courses: data.courses
          ? {
              create: data.courses.map((c, i) => ({
                courseId: c.courseId,
                order: c.order ?? i,
              })),
            }
          : undefined,
      },
      include: {
        courses: { include: { course: { select: { id: true, title: true } } } },
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.learningPath.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Learning path not found');
    return this.prisma.learningPath.delete({ where: { id } });
  }

  async enroll(userId: string, learningPathId: string) {
    const path = await this.prisma.learningPath.findUnique({
      where: { id: learningPathId },
    });
    if (!path) throw new NotFoundException('Learning path not found');

    return this.prisma.learningPathEnrollment.upsert({
      where: { userId_learningPathId: { userId, learningPathId } },
      update: {},
      create: { userId, learningPathId },
    });
  }

  async getMyEnrollments(userId: string) {
    const enrollments = await this.prisma.learningPathEnrollment.findMany({
      where: { userId },
      include: {
        learningPath: {
          include: {
            courses: {
              orderBy: { order: 'asc' },
              include: {
                course: { select: { id: true, title: true, imageUrl: true } },
              },
            },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    return enrollments.map((e) => ({
      ...e.learningPath,
      enrolledAt: e.enrolledAt,
      completedAt: e.completedAt,
      courseCount: e.learningPath.courses.length,
    }));
  }
}
