import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
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
    const courses = await this.prisma.course.findMany({
      skip: opts?.skip ?? 0,
      take: opts?.take ?? 50,
      include: {
        _count: { select: { sections: true, enrollments: true, reviews: true } },
        sections: {
          include: {
            _count: { select: { lessons: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Batch-fetch all average ratings in a single query instead of N+1
    const ratings = await this.prisma.$queryRawUnsafe(
      `SELECT "courseId", AVG("rating")::float as "avgRating"
       FROM "CourseReview"
       GROUP BY "courseId"`
    ) as Array<{ courseId: string; avgRating: number }>;

    const ratingMap = new Map(ratings.map((r) => [r.courseId, r.avgRating || 0]));

    return courses.map((c) => ({
      ...c,
      averageRating: ratingMap.get(c.id) || 0,
    }));
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
        _count: { select: { enrollments: true, reviews: true } },
      },
    });
    if (!course) throw new NotFoundException('Course not found');

    const reviewStats = await this.prisma.courseReview.aggregate({
      where: { courseId: id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      ...course,
      reviewStats: {
        average: reviewStats._avg.rating || 0,
        total: reviewStats._count.rating,
      },
    };
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
        user: { select: { id: true, email: true, name: true, timezone: true, emailPreferences: true } },
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

  async getCertificate(userId: string, courseId: string) {
    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) {
      return { eligible: false, reason: 'Not enrolled' };
    }

    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return { eligible: false, reason: 'Course not found' };

    const totalLessons = await this.prisma.lesson.count({ where: { section: { courseId } } });
    const completedLessons = await this.prisma.progress.count({
      where: { userId, completed: true, lesson: { section: { courseId } } },
    });

    if (completedLessons < totalLessons) {
      return { eligible: false, reason: 'Course not complete', completed: completedLessons, total: totalLessons };
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
    const issuedAt = new Date();

    return {
      eligible: true,
      certificate: {
        id: `CERT-${courseId.slice(0, 8)}-${userId.slice(0, 8)}-${issuedAt.getTime()}`,
        courseName: course.title,
        userName: user?.name || user?.email || 'Student',
        issuedAt: issuedAt.toISOString(),
        credentialUrl: `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/verify/${courseId}/${userId}`,
      },
    };
  }

  async verifyCertificate(courseId: string, userId: string) {
    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) return { valid: false, reason: 'No enrollment found' };

    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return { valid: false, reason: 'Course not found' };

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
    if (!user) return { valid: false, reason: 'User not found' };

    const totalLessons = await this.prisma.lesson.count({ where: { section: { courseId } } });
    const completedLessons = await this.prisma.progress.count({
      where: { userId, completed: true, lesson: { section: { courseId } } },
    });

    if (completedLessons < totalLessons) {
      return { valid: false, reason: 'Course not complete', completed: completedLessons, total: totalLessons };
    }

    return {
      valid: true,
      certificate: {
        courseName: course.title,
        userName: user.name || user.email,
        issuedAt: enrollment.lastActivityAt.toISOString(),
      },
    };
  }

  async getRecommendations(userId: string) {
    const enrollments = await this.prisma.courseEnrollment.findMany({
      where: { userId },
      select: { courseId: true },
    });
    const enrolledIds = enrollments.map((e) => e.courseId);

    const allCourses = await this.prisma.course.findMany({
      include: {
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Batch completion check — single query instead of N+1 loop
    const completedCourses: string[] = [];
    if (enrolledIds.length > 0) {
      const completionData = await this.prisma.$queryRawUnsafe(
        `SELECT s."courseId",
                COUNT(DISTINCT l.id) as "totalLessons",
                COUNT(DISTINCT CASE WHEN p.completed = true THEN p."lessonId" END) as "completedLessons"
         FROM "CourseEnrollment" ce
         JOIN "Section" s ON s."courseId" = ce."courseId"
         JOIN "Lesson" l ON l."sectionId" = s.id
         LEFT JOIN "Progress" p ON p."lessonId" = l.id AND p."userId" = ce."userId"
         WHERE ce."userId" = $1
         GROUP BY s."courseId"`,
        userId,
      ) as Array<{ courseId: string; totalLessons: bigint; completedLessons: bigint }>;

      for (const row of completionData) {
        if (Number(row.totalLessons) > 0 && Number(row.completedLessons) === Number(row.totalLessons)) {
          completedCourses.push(row.courseId);
        }
      }
    }

    const notEnrolled = allCourses.filter((c) => !enrolledIds.includes(c.id));

    const recommended = notEnrolled
      .sort((a, b) => (b._count.enrollments || 0) - (a._count.enrollments || 0))
      .slice(0, 4)
      .map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        imageUrl: c.imageUrl,
        estimatedHours: c.estimatedHours,
        enrollmentCount: c._count.enrollments,
        reason: completedCourses.length > 0 ? 'Popular with other students' : 'Recommended for you',
      }));

    const inProgress = allCourses
      .filter((c) => enrolledIds.includes(c.id) && !completedCourses.includes(c.id))
      .slice(0, 2)
      .map((c) => ({
        id: c.id,
        title: c.title,
        reason: 'Continue where you left off',
      }));

    return { recommended, inProgress };
  }

  async getCourseReviews(courseId: string) {
    const reviews = await this.prisma.courseReview.findMany({
      where: { courseId },
      include: { user: { select: { id: true, name: true, email: true, division: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const stats = await this.prisma.courseReview.aggregate({
      where: { courseId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const distribution = await this.prisma.courseReview.groupBy({
      by: ['rating'],
      where: { courseId },
      _count: { rating: true },
    });

    return {
      reviews,
      stats: {
        average: stats._avg.rating || 0,
        total: stats._count.rating,
        distribution: distribution.reduce((acc, d) => {
          acc[d.rating] = d._count.rating;
          return acc;
        }, {} as Record<number, number>),
      },
    };
  }

  async createReview(userId: string, courseId: string, rating: number, comment?: string) {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) {
      throw new ForbiddenException('You must be enrolled to review this course');
    }

    return this.prisma.courseReview.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: { rating, comment },
      create: { userId, courseId, rating, comment },
    });
  }

  async getMyReviews(userId: string) {
    return this.prisma.courseReview.findMany({
      where: { userId },
      include: {
        course: { select: { id: true, title: true, imageUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
