import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.course.findMany({
      include: {
        _count: {
          select: { sections: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async findLesson(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        lab: {
          select: {
            id: true,
            title: true,
            description: true,
            difficulty: true,
          },
        },
        quiz: {
          include: {
            questions: {
              include: {
                answers: true,
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (lesson.quiz) {
      lesson.quiz.questions = lesson.quiz.questions.map((q: any) => ({
        ...q,
        answers: q.answers.map((a: any) => {
          const { isCorrect, ...rest } = a;
          return rest;
        }),
      })) as any;
    }

    return lesson;
  }

  async create(data: { title: string; description: string }) {
    return this.prisma.course.create({ data });
  }

  async update(id: string, data: { title?: string; description?: string }) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');
    return this.prisma.course.update({ where: { id }, data });
  }

  async remove(id: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');
    return this.prisma.course.delete({ where: { id } });
  }
}
