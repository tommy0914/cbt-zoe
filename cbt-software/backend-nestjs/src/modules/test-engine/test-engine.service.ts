import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AttemptStatus } from '@prisma/client';

@Injectable()
export class TestEngineService {
  constructor(private prisma: PrismaService) {}

  async getTestsByClass(classId: string) {
    return this.prisma.test.findMany({
      where: { classId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTestWithQuestions(testId: string) {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: { questions: true },
    });
    if (!test) throw new NotFoundException('Test not found');
    return test;
  }

  async startOrResumeAttempt(studentId: string, testId: string) {
    const existing = await this.prisma.attempt.findFirst({
      where: { studentId, testId, status: AttemptStatus.in_progress },
    });

    if (existing) return existing;

    return this.prisma.attempt.create({
      data: {
        studentId,
        testId,
        status: AttemptStatus.in_progress,
        startTime: new Date(),
      },
    });
  }

  async saveProgress(studentId: string, testId: string, responses: { questionId: string; answer: string }[]) {
    const attempt = await this.prisma.attempt.findFirst({
      where: { studentId, testId, status: AttemptStatus.in_progress },
    });

    if (!attempt) throw new NotFoundException('Active attempt not found');

    // Simple overwrite of responses for auto-save
    await this.prisma.response.deleteMany({ where: { attemptId: attempt.id } });

    return this.prisma.response.createMany({
      data: responses.map((r) => ({
        attemptId: attempt.id,
        questionId: r.questionId,
        answer: r.answer,
      })),
    });
  }

  async submitTest(studentId: string, testId: string, responses: { questionId: string; answer: string }[]) {
    const attempt = await this.prisma.attempt.findFirst({
      where: { studentId, testId, status: AttemptStatus.in_progress },
      include: { test: true }
    });

    if (!attempt) throw new NotFoundException('Active attempt not found');

    let totalScore = 0;
    const gradedResponses = [];

    for (const r of responses) {
      const question = await this.prisma.question.findUnique({ where: { id: r.questionId } });
      if (!question) continue;

      const isCorrect = question.correctAnswer.toLowerCase().trim() === r.answer?.toLowerCase().trim();
      const pointsAwarded = isCorrect ? question.points : 0;
      totalScore += pointsAwarded;

      gradedResponses.push({
        questionId: r.questionId,
        answer: r.answer,
        isCorrect,
        pointsAwarded,
      });
    }

    await this.prisma.response.deleteMany({ where: { attemptId: attempt.id } });
    await this.prisma.response.createMany({
      data: gradedResponses.map(gr => ({ ...gr, attemptId: attempt.id }))
    });

    const percentage = Math.round((totalScore / attempt.test.totalMarks) * 100);

    return this.prisma.attempt.update({
      where: { id: attempt.id },
      data: {
        totalScore,
        percentage,
        status: AttemptStatus.graded,
        submitTime: new Date(),
      },
    });
  }
}
