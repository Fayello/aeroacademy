import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CoursesService } from '../courses/courses.service';

@Injectable()
export class AssessmentsService {
  constructor(
    private prisma: PrismaService,
    private coursesService: CoursesService,
  ) {}

  async getAllAssessments() {
    return this.prisma.skillAssessment.findMany({
      select: { id: true, title: true, description: true, category: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAssessment(id: string) {
    const assessment = await this.prisma.skillAssessment.findUnique({ where: { id } });
    if (!assessment) throw new NotFoundException('Assessment not found');
    return assessment;
  }

  async submitAssessment(userId: string, assessmentId: string, answers: Record<string, string>) {
    const assessment = await this.prisma.skillAssessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) throw new NotFoundException('Assessment not found');

    const questions = assessment.questions as Array<{
      id: string;
      text: string;
      options: { key: string; text: string }[];
      correctAnswer: string;
      category: string;
    }>;

    let score = 0;
    const results: Array<{ questionId: string; correct: boolean; correctAnswer: string }> = [];

    for (const q of questions) {
      const userAnswer = answers[q.id];
      const isCorrect = userAnswer === q.correctAnswer;
      if (isCorrect) score++;
      results.push({ questionId: q.id, correct: isCorrect, correctAnswer: q.correctAnswer });
    }

    const categoryScores: Record<string, { correct: number; total: number }> = {};
    for (const q of questions) {
      if (!categoryScores[q.category]) categoryScores[q.category] = { correct: 0, total: 0 };
      categoryScores[q.category].total++;
      if (answers[q.id] === q.correctAnswer) categoryScores[q.category].correct++;
    }

    const weakCategories = Object.entries(categoryScores)
      .filter(([, v]) => v.correct / v.total < 0.6)
      .map(([k]) => k);

    const recommendations = await this.getRecommendations(weakCategories);

    const result = await this.prisma.assessmentResult.create({
      data: {
        assessmentId,
        userId,
        score,
        maxScore: questions.length,
        answers,
        recommendedPath: recommendations,
      },
    });

    return {
      score,
      maxScore: questions.length,
      percentage: Math.round((score / questions.length) * 100),
      categoryScores,
      recommendations,
      resultId: result.id,
    };
  }

  private async getRecommendations(weakCategories: string[]) {
    if (weakCategories.length === 0) return [];

    const allCourses = await this.coursesService.findAll();
    const recommendations: Array<{ courseId: string; title: string; reason: string }> = [];

    const categoryMap: Record<string, string[]> = {
      LINUX: ['Linux Fundamentals', 'Linux'],
      NETWORKING: ['Networking', 'Security'],
      WEB_SECURITY: ['Web', 'OWASP', 'Security'],
      CRYPTO: ['Crypto', 'Encryption'],
    };

    for (const category of weakCategories) {
      const keywords = categoryMap[category] || [category];
      for (const course of allCourses) {
        const titleLower = course.title.toLowerCase();
        if (keywords.some((k) => titleLower.includes(k.toLowerCase()))) {
          if (!recommendations.find((r) => r.courseId === course.id)) {
            recommendations.push({
              courseId: course.id,
              title: course.title,
              reason: `Strengthen your ${category.toLowerCase()} skills`,
            });
          }
        }
      }
    }

    return recommendations;
  }

  async createAssessment(data: {
    title: string;
    description: string;
    category: string;
    questions: Array<{
      text: string;
      options: { key: string; text: string }[];
      correctAnswer: string;
      category: string;
    }>;
  }) {
    return this.prisma.skillAssessment.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        questions: data.questions,
      },
    });
  }

  async getUserResults(userId: string) {
    return this.prisma.assessmentResult.findMany({
      where: { userId },
      include: { assessment: { select: { title: true, category: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
