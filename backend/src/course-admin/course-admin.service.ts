import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CourseAdminService {
  constructor(private prisma: PrismaService) {}

  async getCourseStructure(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              include: {
                lab: { select: { id: true, title: true } },
                quiz: { select: { id: true } },
                inlinePractices: {
                  orderBy: { order: 'asc' },
                  select: {
                    id: true,
                    title: true,
                    type: true,
                    prompt: true,
                    instructions: true,
                    expectedAnswer: true,
                    validationMode: true,
                    hints: true,
                    maxAttempts: true,
                    xpReward: true,
                    required: true,
                    order: true,
                  },
                },
                _count: { select: { progress: true } },
              },
            },
            _count: { select: { lessons: true } },
          },
        },
        _count: { select: { sections: true, enrollments: true } },
      },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async reorderSection(
    courseId: string,
    sectionId: string,
    newOrder: number,
    actorId: string,
  ) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
    });
    if (!section || section.courseId !== courseId)
      throw new NotFoundException('Section not found');

    const sections = await this.prisma.section.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
    });

    const oldOrder = section.order;
    const updates: Promise<any>[] = [];

    if (newOrder > oldOrder) {
      for (const s of sections) {
        if (s.id === sectionId) continue;
        if (s.order > oldOrder && s.order <= newOrder) {
          updates.push(
            this.prisma.section.update({
              where: { id: s.id },
              data: { order: s.order - 1 },
            }),
          );
        }
      }
    } else {
      for (const s of sections) {
        if (s.id === sectionId) continue;
        if (s.order >= newOrder && s.order < oldOrder) {
          updates.push(
            this.prisma.section.update({
              where: { id: s.id },
              data: { order: s.order + 1 },
            }),
          );
        }
      }
    }

    updates.push(
      this.prisma.section.update({
        where: { id: sectionId },
        data: { order: newOrder },
      }),
    );

    await Promise.all(updates);

    await this.prisma.courseReorderHistory.create({
      data: {
        courseId,
        entityType: 'SECTION',
        entityId: sectionId,
        oldOrder,
        newOrder,
        actorId,
      },
    });

    return this.getCourseStructure(courseId);
  }

  async reorderLesson(
    courseId: string,
    sectionId: string,
    lessonId: string,
    newOrder: number,
    actorId: string,
  ) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
    });
    if (!section || section.courseId !== courseId)
      throw new NotFoundException('Section not found');

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson || lesson.sectionId !== sectionId)
      throw new NotFoundException('Lesson not found');

    const lessons = await this.prisma.lesson.findMany({
      where: { sectionId },
      orderBy: { order: 'asc' },
    });

    const oldOrder = lesson.order;
    const updates: Promise<any>[] = [];

    if (newOrder > oldOrder) {
      for (const l of lessons) {
        if (l.id === lessonId) continue;
        if (l.order > oldOrder && l.order <= newOrder) {
          updates.push(
            this.prisma.lesson.update({
              where: { id: l.id },
              data: { order: l.order - 1 },
            }),
          );
        }
      }
    } else {
      for (const l of lessons) {
        if (l.id === lessonId) continue;
        if (l.order >= newOrder && l.order < oldOrder) {
          updates.push(
            this.prisma.lesson.update({
              where: { id: l.id },
              data: { order: l.order + 1 },
            }),
          );
        }
      }
    }

    updates.push(
      this.prisma.lesson.update({
        where: { id: lessonId },
        data: { order: newOrder },
      }),
    );

    await Promise.all(updates);

    await this.prisma.courseReorderHistory.create({
      data: {
        courseId,
        entityType: 'LESSON',
        entityId: lessonId,
        oldOrder,
        newOrder,
        actorId,
      },
    });

    return this.getCourseStructure(courseId);
  }

  async createSection(
    courseId: string,
    data: { title: string; order?: number },
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { sections: { orderBy: { order: 'desc' }, take: 1 } },
    });
    if (!course) throw new NotFoundException('Course not found');

    const order =
      data.order ??
      (course.sections.length > 0 ? course.sections[0].order + 1 : 0);

    return this.prisma.section.create({
      data: { courseId, title: data.title, order },
    });
  }

  async updateSection(sectionId: string, data: { title?: string }) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
    });
    if (!section) throw new NotFoundException('Section not found');

    return this.prisma.section.update({ where: { id: sectionId }, data });
  }

  async deleteSection(sectionId: string) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
    });
    if (!section) throw new NotFoundException('Section not found');

    await this.prisma.section.delete({ where: { id: sectionId } });
    return { success: true };
  }

  async createLesson(
    sectionId: string,
    data: {
      title: string;
      videoUrl?: string;
      content?: string;
      labId?: string;
      order?: number;
      quiz?: {
        questions: {
          text: string;
          answers: { text: string; isCorrect: boolean }[];
        }[];
      };
    },
  ) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      include: { lessons: { orderBy: { order: 'desc' }, take: 1 } },
    });
    if (!section) throw new NotFoundException('Section not found');

    const order =
      data.order ??
      (section.lessons.length > 0 ? section.lessons[0].order + 1 : 0);

    const lesson = await this.prisma.lesson.create({
      data: {
        sectionId,
        title: data.title,
        videoUrl: data.videoUrl,
        content: data.content,
        labId: data.labId || null,
        order,
      },
    });

    if (data.quiz && data.quiz.questions.length > 0) {
      await this.prisma.quiz.create({
        data: {
          lessonId: lesson.id,
          questions: {
            create: data.quiz.questions.map((q) => ({
              text: q.text,
              answers: { create: q.answers },
            })),
          },
        },
      });
    }

    return lesson;
  }

  async updateLesson(
    lessonId: string,
    data: {
      title?: string;
      videoUrl?: string;
      content?: string;
      labId?: string;
    },
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    return this.prisma.lesson.update({ where: { id: lessonId }, data });
  }

  async getLessonInlinePractices(lessonId: string) {
    return this.prisma.inlinePractice.findMany({
      where: { lessonId },
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { submissions: true } },
      },
    });
  }

  async createInlinePractice(
    lessonId: string,
    data: {
      title: string;
      type?: string;
      prompt: string;
      instructions?: string | null;
      expectedAnswer?: string | null;
      validationMode?: string;
      hints?: string[];
      maxAttempts?: number;
      xpReward?: number;
      required?: boolean;
      order?: number;
    },
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        inlinePractices: { orderBy: { order: 'desc' }, take: 1 },
      },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const order =
      data.order ??
      (lesson.inlinePractices.length > 0
        ? lesson.inlinePractices[0].order + 1
        : 0);

    return this.prisma.inlinePractice.create({
      data: this.buildInlinePracticeData(lessonId, { ...data, order }),
    });
  }

  async updateInlinePractice(
    practiceId: string,
    data: {
      title?: string;
      type?: string;
      prompt?: string;
      instructions?: string | null;
      expectedAnswer?: string | null;
      validationMode?: string;
      hints?: string[];
      maxAttempts?: number;
      xpReward?: number;
      required?: boolean;
      order?: number;
    },
  ) {
    const practice = await this.prisma.inlinePractice.findUnique({
      where: { id: practiceId },
    });
    if (!practice) throw new NotFoundException('Inline practice not found');

    return this.prisma.inlinePractice.update({
      where: { id: practiceId },
      data: this.buildInlinePracticeUpdateData(data),
    });
  }

  async deleteInlinePractice(practiceId: string) {
    const practice = await this.prisma.inlinePractice.findUnique({
      where: { id: practiceId },
    });
    if (!practice) throw new NotFoundException('Inline practice not found');

    await this.prisma.inlinePractice.delete({ where: { id: practiceId } });
    return { success: true };
  }

  private buildInlinePracticeData(
    lessonId: string,
    data: {
      title: string;
      type?: string;
      prompt: string;
      instructions?: string | null;
      expectedAnswer?: string | null;
      validationMode?: string;
      hints?: string[];
      maxAttempts?: number;
      xpReward?: number;
      required?: boolean;
      order?: number;
    },
  ) {
    return {
      lessonId,
      title: data.title.trim(),
      type: data.type || 'COMMAND_ANSWER',
      prompt: data.prompt.trim(),
      instructions: data.instructions?.trim() || null,
      expectedAnswer: data.expectedAnswer?.trim() || null,
      validationMode: data.validationMode || 'EXACT',
      hints: Array.isArray(data.hints)
        ? data.hints.map((hint) => hint.trim()).filter(Boolean)
        : [],
      maxAttempts: Math.max(0, Number(data.maxAttempts ?? 0)),
      xpReward: Math.max(0, Number(data.xpReward ?? 25)),
      required: data.required ?? true,
      order: data.order ?? 0,
    };
  }

  private buildInlinePracticeUpdateData(data: {
    title?: string;
    type?: string;
    prompt?: string;
    instructions?: string | null;
    expectedAnswer?: string | null;
    validationMode?: string;
    hints?: string[];
    maxAttempts?: number;
    xpReward?: number;
    required?: boolean;
    order?: number;
  }) {
    return {
      ...(data.title !== undefined ? { title: data.title.trim() } : {}),
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.prompt !== undefined ? { prompt: data.prompt.trim() } : {}),
      ...(data.instructions !== undefined
        ? { instructions: data.instructions?.trim() || null }
        : {}),
      ...(data.expectedAnswer !== undefined
        ? { expectedAnswer: data.expectedAnswer?.trim() || null }
        : {}),
      ...(data.validationMode !== undefined
        ? { validationMode: data.validationMode }
        : {}),
      ...(data.hints !== undefined
        ? {
            hints: Array.isArray(data.hints)
              ? data.hints.map((hint) => hint.trim()).filter(Boolean)
              : [],
          }
        : {}),
      ...(data.maxAttempts !== undefined
        ? { maxAttempts: Math.max(0, Number(data.maxAttempts)) }
        : {}),
      ...(data.xpReward !== undefined
        ? { xpReward: Math.max(0, Number(data.xpReward)) }
        : {}),
      ...(data.required !== undefined ? { required: data.required } : {}),
      ...(data.order !== undefined ? { order: data.order } : {}),
    };
  }

  async deleteLesson(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    await this.prisma.lesson.delete({ where: { id: lessonId } });
    return { success: true };
  }

  async moveLessonToSection(lessonId: string, targetSectionId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const targetSection = await this.prisma.section.findUnique({
      where: { id: targetSectionId },
      include: { lessons: { orderBy: { order: 'desc' }, take: 1 } },
    });
    if (!targetSection) throw new NotFoundException('Target section not found');

    const newOrder =
      targetSection.lessons.length > 0 ? targetSection.lessons[0].order + 1 : 0;

    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: { sectionId: targetSectionId, order: newOrder },
    });
  }

  async bulkCreateLessons(
    sectionId: string,
    lessons: {
      title: string;
      videoUrl?: string;
      content?: string;
      labId?: string;
    }[],
  ) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      include: { lessons: { orderBy: { order: 'desc' }, take: 1 } },
    });
    if (!section) throw new NotFoundException('Section not found');

    let startOrder =
      section.lessons.length > 0 ? section.lessons[0].order + 1 : 0;

    const created: any[] = [];
    for (const l of lessons) {
      const lesson = await this.prisma.lesson.create({
        data: {
          sectionId,
          title: l.title,
          videoUrl: l.videoUrl,
          content: l.content,
          labId: l.labId || null,
          order: startOrder++,
        },
      });
      created.push(lesson);
    }

    return created;
  }

  async getReorderHistory(courseId: string, limit = 20) {
    return this.prisma.courseReorderHistory.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
