import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private analyticsService: AnalyticsService,
  ) {}

  async getOverallPerformance(schoolId?: string) {
    const where: any = { status: 'graded' };
    if (schoolId) where.test = { classroom: { schoolId } };
    const attempts = await this.prisma.attempt.findMany({ where, select: { percentage: true, totalScore: true } });
    const total = attempts.length;
    const averagePercentage = total ? attempts.reduce((s, a) => s + (a.percentage || 0), 0) / total : 0;
    return { totalAttempts: total, averagePercentage };
  }

  async getQuestionDifficulty(schoolId: string) {
    return this.analyticsService.getQuestionDifficulty(schoolId);
  }

  async getClassPerformance(classId?: string) {
    if (!classId) {
      return { averageScore: 0, totalAttempts: 0, distribution: {} };
    }
    return this.analyticsService.getClassPerformance(classId);
  }

  async getStudentResults(classId: string) {
    const results = await this.prisma.studentResult.findMany({
      where: { classId },
      include: {
        student: { select: { id: true, name: true, email: true } },
        testAttemptMetrics: true,
      },
      orderBy: { averageScore: 'desc' },
    });
    return results.map((r: any) => ({
      ...r,
      _id: r.id,
      studentId: r.student ? { ...r.student, _id: r.student.id } : null,
      testAttempts: r.testAttemptMetrics.map((m: any) => ({
        testName: m.testName,
        score: m.score,
        totalQuestions: m.totalQuestions,
        correctAnswers: m.correctAnswers,
        duration: m.duration || 0,
        status: m.status,
        isPassed: m.isPassed,
        completedAt: m.completedAt || r.generatedAt,
        attemptId: m.attemptId,
      })),
    }));
  }

  async generateStudentResult(studentId: string, classId: string, generatedById: string, notes?: string) {
    const result = await this.analyticsService.generateStudentReport(studentId, classId);
    if (!result) return null;
    const updated = await this.prisma.studentResult.update({
      where: { id: result.id },
      data: { notes: notes || result.notes, generatedById },
      include: { student: { select: { id: true, name: true, email: true } }, testAttemptMetrics: true },
    });
    return {
      ...updated,
      _id: updated.id,
      studentId: updated.student ? { ...updated.student, _id: updated.student.id } : null,
      testAttempts: updated.testAttemptMetrics,
    };
  }

  async getStudentResult(id: string) {
    const result = await this.prisma.studentResult.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, name: true, email: true } },
        testAttemptMetrics: true,
      },
    });
    if (!result) return null;
    return {
      ...result,
      _id: result.id,
      studentId: result.student ? { ...result.student, _id: result.student.id } : null,
      testAttempts: result.testAttemptMetrics,
    };
  }

  async updateStudentResult(id: string, body: any) {
    return this.prisma.studentResult.update({ where: { id }, data: { notes: body.notes } });
  }

  async deleteStudentResult(id: string) {
    return this.prisma.studentResult.delete({ where: { id } });
  }

  async generateReportCard(studentId: string, classId: string, generatedById: string, dto: any) {
    return this.analyticsService.generateReportCard(studentId, classId, generatedById, dto);
  }

  async getReportCard(id: string) {
    return this.prisma.reportCard.findUnique({ where: { id } });
  }

  async updateReportCard(id: string, body: any, userId: string) {
    return this.prisma.reportCard.update({
      where: { id },
      data: {
        isApproved: body?.isApproved ?? undefined,
        isPublished: body?.isPublished ?? undefined,
        approvedById: body?.isApproved ? userId : undefined,
        approvedAt: body?.isApproved ? new Date() : undefined,
        publishedAt: body?.isPublished ? new Date() : undefined,
      },
    });
  }
}

