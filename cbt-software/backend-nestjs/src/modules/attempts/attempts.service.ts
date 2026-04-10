import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AttemptStatus } from '@prisma/client';

@Injectable()
export class AttemptsService {
  constructor(private prisma: PrismaService) {}

  async startAttempt(studentId: string, testId: string) {
    return this.prisma.attempt.create({
      data: {
        studentId,
        testId,
        status: AttemptStatus.in_progress,
        startTime: new Date(),
      },
    });
  }

  async submitResponse(attemptId: string, questionId: string, answer: string) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) throw new NotFoundException('Question not found');

    const isCorrect = question.correctAnswer === answer;
    const pointsAwarded = isCorrect ? question.points : 0;

    return this.prisma.response.create({
      data: {
        attemptId,
        questionId,
        answer,
        isCorrect,
        pointsAwarded,
      },
    });
  }

  async finishAttempt(attemptId: string) {
    const responses = await this.prisma.response.findMany({
      where: { attemptId },
    });

    const totalScore = responses.reduce((sum, r) => sum + r.pointsAwarded, 0);

    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: { test: true },
    });

    if (!attempt) throw new NotFoundException('Attempt not found');

    const percentage = Math.round((totalScore / attempt.test.totalMarks) * 100);

    return this.prisma.attempt.update({
      where: { id: attemptId },
      data: {
        totalScore,
        percentage,
        submitTime: new Date(),
        status: AttemptStatus.graded,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.attempt.findUnique({
      where: { id },
      include: { responses: true, test: true },
    });
  }
}
