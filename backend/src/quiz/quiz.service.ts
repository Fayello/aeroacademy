import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuizService {
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
    
    const sanitizedQuestions = quiz.questions.map(q => ({
      ...q,
      answers: q.answers.map(a => {
        const { isCorrect, ...rest } = a;
        return rest;
      }),
    }));

    return {
      ...quiz,
      questions: sanitizedQuestions,
    };
  }

  async submitQuiz(userId: string, quizId: string, answers: Record<string, string>) {
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

    let correctCount = 0;
    const totalCount = quiz.questions.length;

    const details = quiz.questions.map(question => {
      const selectedAnswerId = answers[question.id];
      const correctAnswer = question.answers.find(a => a.isCorrect);
      const isCorrect = selectedAnswerId === correctAnswer?.id;
      if (isCorrect) correctCount++;
      
      return {
        questionId: question.id,
        isCorrect,
        // Do NOT reveal correctAnswerId — prevents cheating on retry
      };
    });

    const score = Math.round((correctCount / totalCount) * 100);
    const passed = score >= 80;

    const submission = await this.prisma.quizSubmission.create({
      data: {
        userId,
        quizId,
        score,
        passed,
      },
    });

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
