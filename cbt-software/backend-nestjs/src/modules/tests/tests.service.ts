import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, AttemptStatus } from '@prisma/client';

@Injectable()
export class TestsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.TestCreateInput) {
    // Note: totalMarks calculation usually happens here or via a dedicated method
    return this.prisma.test.create({ data });
  }

  async calculateTotalMarks(testId: string) {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: { questions: { select: { points: true } } },
    });

    if (!test) return null;

    const totalMarks = test.questions.reduce((sum, q) => sum + q.points, 0);

    return this.prisma.test.update({
      where: { id: testId },
      data: { totalMarks },
    });
  }

  async findAll() {
    return this.prisma.test.findMany({
      include: { 
        classroom: true, 
        createdBy: { select: { name: true } },
        _count: { select: { questions: true } }
      }
    });
  }

  async findOne(id: string) {
    return this.prisma.test.findUnique({
      where: { id },
      include: { questions: true, classroom: true }
    });
  }

  async list(page = 1, pageSize = 10) {
    const take = Math.max(1, pageSize);
    const skip = (Math.max(1, page) - 1) * take;
    const [tests, total] = await Promise.all([
      this.prisma.test.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { classroom: true },
      }),
      this.prisma.test.count(),
    ]);

    return { tests, total, page: Math.max(1, page), pageSize: take, totalPages: Math.ceil(total / take) };
  }

  async search(page = 1, pageSize = 10) {
    return this.list(page, pageSize);
  }

  async startAttempt(studentId: string, testId: string) {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: { questions: true },
    });
    if (!test) return { message: 'Test not found' };

    let attempt = await this.prisma.attempt.findFirst({
      where: { studentId, testId, status: AttemptStatus.in_progress },
    });
    if (!attempt) {
      attempt = await this.prisma.attempt.create({
        data: { studentId, testId, status: AttemptStatus.in_progress, startTime: new Date() },
      });
    }

    return {
      attemptId: attempt.id,
      durationMinutes: test.durationMinutes,
      questions: test.questions.map((q: any) => ({
        _id: q.id,
        questionText: q.text,
        options: q.options,
      })),
    };
  }

  async submitAttempt(studentId: string, payload: { attemptId: string; answers: { questionId: string; selectedAnswer: string }[] }) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: payload.attemptId },
      include: { test: { include: { questions: true } } },
    });
    if (!attempt || attempt.studentId !== studentId) {
      return { message: 'Attempt not found' };
    }

    const byQuestion = new Map(attempt.test.questions.map((q: any) => [q.id, q]));
    const graded = payload.answers.map((ans) => {
      const q = byQuestion.get(ans.questionId);
      if (!q) return null;
      const isCorrect = (q.correctAnswer || '').trim().toLowerCase() === (ans.selectedAnswer || '').trim().toLowerCase();
      const pointsAwarded = isCorrect ? q.points : 0;
      return {
        questionId: q.id,
        answer: ans.selectedAnswer,
        isCorrect,
        pointsAwarded,
        correctAnswer: q.correctAnswer,
      };
    }).filter(Boolean) as any[];

    const score = graded.reduce((sum, g) => sum + g.pointsAwarded, 0);
    const total = attempt.test.totalMarks || attempt.test.questions.reduce((sum: number, q: any) => sum + q.points, 0) || 1;
    const percentage = (score / total) * 100;
    const isPassed = score >= attempt.test.passingMarks;

    await this.prisma.response.deleteMany({ where: { attemptId: attempt.id } });
    await this.prisma.response.createMany({
      data: graded.map((g) => ({
        attemptId: attempt.id,
        questionId: g.questionId,
        answer: g.answer,
        isCorrect: g.isCorrect,
        pointsAwarded: g.pointsAwarded,
      })),
    });

    await this.prisma.attempt.update({
      where: { id: attempt.id },
      data: {
        totalScore: score,
        percentage: Math.round(percentage),
        status: AttemptStatus.graded,
        submitTime: new Date(),
      },
    });

    return {
      score,
      total,
      percentage,
      isPassed,
      detailedResults: graded.map((g) => ({
        questionId: g.questionId,
        isCorrect: g.isCorrect,
        correctAnswer: g.correctAnswer,
      })),
    };
  }

  async updateTest(id: string, body: any) {
    return this.prisma.test.update({
      where: { id },
      data: {
        title: body.title || body.testName,
        description: body.description,
        durationMinutes: body.durationMinutes,
        passingMarks: body.passingScore ?? body.passingMarks,
      },
    });
  }
}
