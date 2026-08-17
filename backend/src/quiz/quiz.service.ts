import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuizService {
  private recentSubmissions = new Map<string, number>();
  private readonly QUIZ_SUBMISSION_COOLDOWN_MS = 10000;

  constructor(private prisma: PrismaService) {}

  async getQuizByLesson(lessonId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { lessonId },
      include: {
        questions: {
          include: {
            answers: true,
          },
        },
      },
    });

    if (!quiz) throw new NotFoundException('Quiz not found for this lesson');

    const sanitizedQuestions = quiz.questions.map((q) => ({
      ...q,
      answers: q.answers.map((a) => ({
        id: a.id,
        questionId: a.questionId,
        text: a.text,
      })),
    }));

    return {
      ...quiz,
      questions: sanitizedQuestions,
    };
  }

  async submitQuiz(
    userId: string,
    quizId: string,
    answers: Record<string, string>,
  ) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            answers: true,
          },
        },
      },
    });

    if (!quiz) throw new NotFoundException('Quiz not found');

    const lastSubmission = this.recentSubmissions.get(`${userId}:${quizId}`);
    if (lastSubmission && Date.now() - lastSubmission < this.QUIZ_SUBMISSION_COOLDOWN_MS) {
      throw new HttpException('Please wait before submitting again', HttpStatus.TOO_MANY_REQUESTS);
    }

    const existingPassed = await this.prisma.quizSubmission.findFirst({
      where: { userId, quizId, passed: true },
    });
    if (existingPassed) {
      return {
        submission: existingPassed,
        score: existingPassed.score,
        passed: true,
        correctCount: 0,
        totalCount: quiz.questions.length,
        details: [],
      };
    }

    let correctCount = 0;
    const totalCount = quiz.questions.length;

    const details = quiz.questions.map((question) => {
      const selectedAnswerId = answers[question.id];
      const correctAnswer = question.answers.find((a) => a.isCorrect);
      const isCorrect = selectedAnswerId === correctAnswer?.id;
      if (isCorrect) correctCount++;

      return {
        questionId: question.id,
        isCorrect,
        // Do NOT reveal correctAnswerId — prevents cheating on retry
      };
    });

    const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    const passed = score >= 80;

    const submission = await this.prisma.quizSubmission.create({
      data: {
        userId,
        quizId,
        score,
        passed,
      },
    });

    this.recentSubmissions.set(`${userId}:${quizId}`, Date.now());

    return {
      submission,
      score,
      passed,
      correctCount,
      totalCount,
      details,
    };
  }
}
