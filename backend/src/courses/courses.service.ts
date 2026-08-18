import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class CoursesService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async findAll(opts?: { skip?: number; take?: number }) {
    return this.prisma.course.findMany({
      skip: opts?.skip ?? 0,
      take: opts?.take ?? 50,
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
              include: {
                quiz: true,
                lab: { select: { id: true, title: true, difficulty: true } },
              },
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
            questions: { include: { answers: true } },
          },
        },
        section: { select: { courseId: true, title: true } },
      },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    if (lesson.quiz) {
      return {
        ...lesson,
        quiz: {
          ...lesson.quiz,
          questions: lesson.quiz.questions.map((q) => ({
            ...q,
            answers: q.answers.map((a) => ({
              id: a.id,
              questionId: a.questionId,
              text: a.text,
            })),
          })),
        },
      };
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

    const lessons = await this.prisma.lesson.findMany({
      where: { section: { courseId: id } },
      select: { id: true },
    });
    const lessonIds = lessons.map((l) => l.id);

    await this.prisma.$transaction([
      this.prisma.progress.deleteMany({ where: { lessonId: { in: lessonIds } } }),
      this.prisma.quizSubmission.deleteMany({ where: { quiz: { lessonId: { in: lessonIds } } } }),
      this.prisma.question.deleteMany({ where: { quiz: { lessonId: { in: lessonIds } } } }),
      this.prisma.quiz.deleteMany({ where: { lessonId: { in: lessonIds } } }),
      this.prisma.lesson.deleteMany({ where: { section: { courseId: id } } }),
      this.prisma.section.deleteMany({ where: { courseId: id } }),
    ]);

    return this.prisma.course.delete({ where: { id } });
  }

  async batchRemove(ids: string[]) {
    for (const id of ids) {
      await this.remove(id);
    }
    return { deleted: ids.length };
  }

  // === SECTIONS ===

  async findSections(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
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

  async createSection(
    courseId: string,
    data: { title: string; order?: number },
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException('Course not found');
    const order =
      data.order ?? (await this.prisma.section.count({ where: { courseId } }));
    return this.prisma.section.create({
      data: { courseId, title: data.title, order },
    });
  }

  async updateSection(
    courseId: string,
    sectionId: string,
    data: { title?: string; order?: number },
  ) {
    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, courseId },
    });
    if (!section) throw new NotFoundException('Section not found');
    return this.prisma.section.update({ where: { id: sectionId }, data });
  }

  async removeSection(courseId: string, sectionId: string) {
    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, courseId },
    });
    if (!section) throw new NotFoundException('Section not found');

    const lessons = await this.prisma.lesson.findMany({
      where: { sectionId },
      select: { id: true },
    });
    const lessonIds = lessons.map((l) => l.id);

    await this.prisma.$transaction([
      this.prisma.progress.deleteMany({ where: { lessonId: { in: lessonIds } } }),
      this.prisma.quizSubmission.deleteMany({ where: { quiz: { lessonId: { in: lessonIds } } } }),
      this.prisma.question.deleteMany({ where: { quiz: { lessonId: { in: lessonIds } } } }),
      this.prisma.quiz.deleteMany({ where: { lessonId: { in: lessonIds } } }),
      this.prisma.lesson.deleteMany({ where: { sectionId } }),
    ]);

    return this.prisma.section.delete({ where: { id: sectionId } });
  }

  // === LESSONS ===

  async findLessons(sectionId: string) {
    return this.prisma.lesson.findMany({
      where: { sectionId },
      include: {
        quiz: true,
        lab: { select: { id: true, title: true, difficulty: true } },
      },
      orderBy: { order: 'asc' },
    });
  }

  async createLesson(
    sectionId: string,
    data: {
      title: string;
      videoUrl?: string;
      content?: string;
      labId?: string;
      order?: number;
    },
  ) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
    });
    if (!section) throw new NotFoundException('Section not found');
    const order =
      data.order ?? (await this.prisma.lesson.count({ where: { sectionId } }));
    return this.prisma.lesson.create({
      data: {
        sectionId,
        title: data.title,
        videoUrl: data.videoUrl,
        content: data.content,
        labId: data.labId,
        order,
      },
    });
  }

  async updateLesson(
    sectionId: string,
    lessonId: string,
    data: {
      title?: string;
      videoUrl?: string;
      content?: string;
      labId?: string;
      order?: number;
    },
  ) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, sectionId },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    return this.prisma.lesson.update({ where: { id: lessonId }, data });
  }

  async removeLesson(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    await this.prisma.$transaction([
      this.prisma.progress.deleteMany({ where: { lessonId } }),
      this.prisma.quizSubmission.deleteMany({ where: { quiz: { lessonId } } }),
      this.prisma.question.deleteMany({ where: { quiz: { lessonId } } }),
      this.prisma.quiz.deleteMany({ where: { lessonId } }),
    ]);

    return this.prisma.lesson.delete({ where: { id: lessonId } });
  }

  // === QUIZZES ===

  async findQuiz(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    return this.prisma.quiz.findUnique({
      where: { lessonId },
      include: {
        questions: {
          include: {
            answers: { select: { id: true, text: true } },
          },
        },
      },
    });
  }

  async createQuiz(
    lessonId: string,
    data: {
      questions: {
        text: string;
        answers: { text: string; isCorrect: boolean }[];
      }[];
    },
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    const existing = await this.prisma.quiz.findUnique({ where: { lessonId } });
    if (existing)
      throw new BadRequestException('Quiz already exists for this lesson');

    for (const q of data.questions) {
      if (!q.answers.some((a) => a.isCorrect)) {
        throw new BadRequestException('Each question must have at least one correct answer');
      }
    }

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

  async updateQuiz(
    quizId: string,
    data: {
      questions: {
        id?: string;
        text: string;
        answers: { id?: string; text: string; isCorrect: boolean }[];
      }[];
    },
  ) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException('Quiz not found');

    for (const q of data.questions) {
      if (!q.answers.some((a) => a.isCorrect)) {
        throw new BadRequestException('Each question must have at least one correct answer');
      }
    }

    // Delete existing questions and recreate — inside transaction
    return this.prisma.$transaction(async (tx) => {
      await tx.question.deleteMany({ where: { quizId } });
      return tx.quiz.update({
        where: { id: quizId },
        data: {
          questions: {
            create: data.questions.map((q) => ({
              text: q.text,
              answers: {
                create: q.answers.map((a) => ({
                  text: a.text,
                  isCorrect: a.isCorrect,
                })),
              },
            })),
          },
        },
        include: {
          questions: { include: { answers: true } },
        },
      });
    });
  }

  async removeQuiz(quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException('Quiz not found');
    return this.prisma.$transaction(async (tx) => {
      await tx.question.deleteMany({ where: { quizId } });
      return tx.quiz.delete({ where: { id: quizId } });
    });
  }

  // === ENROLLMENTS ===

  async enroll(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    const existing = await this.prisma.courseEnrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) return existing;

    const enrollment = await this.prisma.courseEnrollment.create({
      data: { userId, courseId },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.email) {
      this.emailService.sendCourseStarted(user.email, user.name, course.title, courseId).catch(() => {});
    }

    return enrollment;
  }

  async getEnrollment(userId: string, courseId: string) {
    return this.prisma.courseEnrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
  }

  async getEnrollmentsForUser(userId: string) {
    return this.prisma.courseEnrollment.findMany({
      where: { userId },
      select: { courseId: true, enrolledAt: true, lastActivityAt: true },
    });
  }

  async touchEnrollment(userId: string, courseId: string) {
    await this.prisma.courseEnrollment.updateMany({
      where: { userId, courseId },
      data: { lastActivityAt: new Date() },
    });
  }

  async getInactiveEnrollments(daysInactive: number) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysInactive);

    return this.prisma.courseEnrollment.findMany({
      where: {
        lastActivityAt: { lt: cutoff },
        OR: [
          { lastReminderSentAt: null },
          { lastReminderSentAt: { lt: cutoff } },
        ],
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
        course: { select: { id: true, title: true } },
      },
    });
  }

  async markReminderSent(userId: string, courseId: string) {
    await this.prisma.courseEnrollment.updateMany({
      where: { userId, courseId },
      data: { lastReminderSentAt: new Date() },
    });
  }
}
