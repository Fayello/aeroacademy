import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.course.findMany({
      include: {
        _count: { select: { sections: true } },
        sections: {
          include: {
            _count: { select: { lessons: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
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
              include: { quiz: true, lab: { select: { id: true, title: true, difficulty: true } } },
            },
          },
        },
      },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async findLesson(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        lab: { select: { id: true, title: true, description: true, difficulty: true } },
        quiz: {
          include: {
            questions: { include: { answers: true } },
          },
        },
        section: { select: { courseId: true, title: true } },
      },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
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

  // === SECTIONS ===

  async findSections(courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    return this.prisma.section.findMany({
      where: { courseId },
      include: {
        _count: { select: { lessons: true } },
        lessons: { orderBy: { order: 'asc' } },
      },
      orderBy: { order: 'asc' },
    });
  }

  async createSection(courseId: string, data: { title: string; order?: number }) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    const order = data.order ?? (await this.prisma.section.count({ where: { courseId } }));
    return this.prisma.section.create({
      data: { courseId, title: data.title, order },
    });
  }

  async updateSection(courseId: string, sectionId: string, data: { title?: string; order?: number }) {
    const section = await this.prisma.section.findFirst({ where: { id: sectionId, courseId } });
    if (!section) throw new NotFoundException('Section not found');
    return this.prisma.section.update({ where: { id: sectionId }, data });
  }

  async removeSection(courseId: string, sectionId: string) {
    const section = await this.prisma.section.findFirst({ where: { id: sectionId, courseId } });
    if (!section) throw new NotFoundException('Section not found');
    return this.prisma.section.delete({ where: { id: sectionId } });
  }

  // === LESSONS ===

  async findLessons(sectionId: string) {
    return this.prisma.lesson.findMany({
      where: { sectionId },
      include: { quiz: true, lab: { select: { id: true, title: true, difficulty: true } } },
      orderBy: { order: 'asc' },
    });
  }

  async createLesson(sectionId: string, data: { title: string; videoUrl?: string; content?: string; labId?: string; order?: number }) {
    const section = await this.prisma.section.findUnique({ where: { id: sectionId } });
    if (!section) throw new NotFoundException('Section not found');
    const order = data.order ?? (await this.prisma.lesson.count({ where: { sectionId } }));
    return this.prisma.lesson.create({
      data: { sectionId, title: data.title, videoUrl: data.videoUrl, content: data.content, labId: data.labId, order },
    });
  }

  async updateLesson(sectionId: string, lessonId: string, data: { title?: string; videoUrl?: string; content?: string; labId?: string; order?: number }) {
    const lesson = await this.prisma.lesson.findFirst({ where: { id: lessonId, sectionId } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    return this.prisma.lesson.update({ where: { id: lessonId }, data });
  }

  async removeLesson(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    return this.prisma.lesson.delete({ where: { id: lessonId } });
  }

  // === QUIZZES ===

  async findQuiz(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    return this.prisma.quiz.findUnique({
      where: { lessonId },
      include: {
        questions: {
          include: { answers: { select: { id: true, text: true, isCorrect: true } } },
        },
      },
    });
  }

  async createQuiz(lessonId: string, data: { questions: { text: string; answers: { text: string; isCorrect: boolean }[] }[] }) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    const existing = await this.prisma.quiz.findUnique({ where: { lessonId } });
    if (existing) throw new BadRequestException('Quiz already exists for this lesson');

    return this.prisma.quiz.create({
      data: {
        lessonId,
        questions: {
          create: data.questions.map((q) => ({
            text: q.text,
            answers: { create: q.answers },
          })),
        },
      },
      include: {
        questions: { include: { answers: true } },
      },
    });
  }

  async updateQuiz(quizId: string, data: { questions: { id?: string; text: string; answers: { id?: string; text: string; isCorrect: boolean }[] }[] }) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException('Quiz not found');

    // Delete existing questions and recreate
    await this.prisma.question.deleteMany({ where: { quizId } });

    return this.prisma.quiz.update({
      where: { id: quizId },
      data: {
        questions: {
          create: data.questions.map((q) => ({
            text: q.text,
            answers: { create: q.answers.map((a) => ({ text: a.text, isCorrect: a.isCorrect })) },
          })),
        },
      },
      include: {
        questions: { include: { answers: true } },
      },
    });
  }

  async removeQuiz(quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException('Quiz not found');
    await this.prisma.question.deleteMany({ where: { quizId } });
    return this.prisma.quiz.delete({ where: { id: quizId } });
  }
}
