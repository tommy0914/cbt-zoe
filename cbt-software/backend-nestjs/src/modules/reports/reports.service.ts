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
    return this.analyticsService.getClassPerformance(schoolId || '');
  }

  async getQuestionDifficulty(schoolId: string) {
    return this.analyticsService.getQuestionDifficulty(schoolId);
  }

  async getStudentResults(classId: string) {
    const results = await this.prisma.studentResult.findMany({
      where: { classId },
      include: { 
        student: { select: { id: true, name: true, email: true } },
        testAttemptMetrics: true,
        subjectPerformance: true,
      },
      orderBy: { averageScore: 'desc' },
    });
    
    return {
      results: results.map((r: any) => ({
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
      })),
    };
  }

  async generateStudentResult(studentId: string, classId: string, generatedById: string, notes?: string) {
    const result = await this.analyticsService.generateStudentReport(studentId, classId);
    if (!result) return { error: 'No attempts found to generate result' };

    await this.prisma.studentResult.update({
      where: { id: result.id },
      data: { generatedById, notes },
    });

    return { result: { ...result, _id: result.id } };
  }

  async getStudentResult(id: string) {
    const result = await this.prisma.studentResult.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, name: true, email: true } },
        classroom: { select: { name: true } },
        testAttemptMetrics: true,
      },
    });
    return { ...result, _id: result?.id };
  }

  async updateStudentResult(id: string, body: any) {
    const result = await this.prisma.studentResult.update({
      where: { id },
      data: { 
        notes: body.notes !== undefined ? body.notes : undefined,
        isPublished: body.isPublished !== undefined ? body.isPublished : undefined,
      },
    });
    return { result: { ...result, _id: result.id } };
  }

  async deleteStudentResult(id: string) {
    return this.prisma.studentResult.delete({ where: { id } });
  }

  async generateReportCard(studentId: string, classId: string, generatedById: string, dto: any) {
    return this.analyticsService.generateReportCard(studentId, classId, generatedById, dto);
  }

  async getReportCard(id: string) {
    const report = await this.prisma.reportCard.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, name: true, email: true } },
        classroom: { select: { name: true } },
      },
    });
    return { ...report, _id: report?.id };
  }

  async updateReportCard(id: string, body: any, userId: string) {
    return this.prisma.reportCard.update({
      where: { id },
      data: {
        teacherRemarks: body.teacherRemarks,
        principalRemarks: body.principalRemarks,
        isApproved: body.isApproved ?? undefined,
        isPublished: body.isPublished ?? undefined,
        approvedById: body.isApproved ? userId : undefined,
        approvedAt: body.isApproved ? new Date() : undefined,
        publishedAt: body.isPublished ? new Date() : undefined,
      },
    });
  }

  async getReportCards(classId: string) {
    return this.analyticsService.getReportCards(classId);
  }

  async publishReportCard(id: string, isPublished: boolean) {
    return this.prisma.reportCard.update({
      where: { id },
      data: { 
        isPublished,
        publishedAt: isPublished ? new Date() : null 
      }
    });
  }

  async getStudentReportCards(studentId: string) {
    return this.prisma.reportCard.findMany({
      where: { studentId, isPublished: true },
      include: { classroom: { select: { name: true } } },
      orderBy: { generatedAt: 'desc' }
    });
  }
}
