import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async generateStudentReport(studentId: string, classId: string) {
    const attempts = await this.prisma.attempt.findMany({
      where: {
        studentId,
        test: { classId },
        status: 'graded',
      },
      include: { test: true },
    });

    if (attempts.length === 0) return null;

    const totalTestsTaken = attempts.length;
    const totalScoreObtained = attempts.reduce((sum, a) => sum + a.totalScore, 0);
    const averageScore = totalScoreObtained / totalTestsTaken;
    const highestScore = Math.max(...attempts.map(a => a.totalScore));
    const lowestScore = Math.min(...attempts.map(a => a.totalScore));

    const user = await this.prisma.user.findUnique({ where: { id: studentId } });
    const classroom = await this.prisma.classroom.findUnique({ where: { id: classId } });

    return this.prisma.studentResult.upsert({
      where: { id: `${studentId}_${classId}` }, // Assuming we handle ID generation or use unique constraint
      update: {
        totalTestsTaken,
        totalScoreObtained,
        averageScore,
        highestScore,
        lowestScore,
        updatedAt: new Date(),
      },
      create: {
        studentId,
        studentName: user?.name || 'Unknown',
        studentEmail: user?.email || 'Unknown',
        classId,
        className: classroom?.name || 'Unknown',
        schoolId: classroom?.schoolId || '',
        totalTestsTaken,
        totalScoreObtained,
        averageScore,
        highestScore,
        lowestScore,
      },
    });
  }

  async getStudentResult(studentId: string, classId: string) {
    return this.prisma.studentResult.findFirst({
      where: { studentId, classId },
      include: { subjectPerformance: true, testAttemptMetrics: true },
    });
  }

  async getClassPerformance(classId: string) {
    const attempts = await this.prisma.attempt.findMany({
      where: { test: { classId }, status: 'graded' },
      select: { percentage: true },
    });

    if (attempts.length === 0) return { averageScore: 0, totalAttempts: 0, distribution: {} };

    const averageScore = attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / attempts.length;

    // Simple Score Distribution (Bell Curve)
    const distribution = {
      '0-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0,
    };

    attempts.forEach(a => {
      const p = a.percentage || 0;
      if (p <= 40) distribution['0-40']++;
      else if (p <= 60) distribution['41-60']++;
      else if (p <= 80) distribution['61-80']++;
      else distribution['81-100']++;
    });

    return {
      averageScore,
      totalAttempts: attempts.length,
      distribution,
    };
  }

  async getQuestionDifficulty(schoolId: string) {
    const responses = await this.prisma.response.findMany({
      where: { attempt: { test: { classroom: { schoolId } } } },
      include: { question: { select: { text: true } } },
    });

    const questionStats: Record<string, { text: string; total: number; correct: number }> = {};

    responses.forEach(r => {
      if (!questionStats[r.questionId]) {
        questionStats[r.questionId] = { text: r.question.text, total: 0, correct: 0 };
      }
      questionStats[r.questionId].total++;
      if (r.isCorrect) questionStats[r.questionId].correct++;
    });

    return Object.entries(questionStats)
      .map(([id, stats]) => ({
        questionId: id,
        questionText: stats.text,
        successRate: stats.correct / stats.total,
        totalAttempts: stats.total,
      }))
      .filter(q => q.successRate < 0.4)
      .sort((a, b) => a.successRate - b.successRate);
  }

  async generateReportCard(studentId: string, classId: string, adminId: string, dto: any) {
    const studentResult = await this.prisma.studentResult.findFirst({
      where: { studentId, classId },
    });

    if (!studentResult) throw new Error('Student result must be generated first');

    return this.prisma.reportCard.create({
      data: {
        studentId,
        studentName: studentResult.studentName,
        studentEmail: studentResult.studentEmail,
        studentRoll: dto?.studentRoll,
        classId,
        className: studentResult.className,
        schoolId: studentResult.schoolId,
        academicTerm: dto?.academicTerm,
        academicYear: dto?.academicYear,
        overallGPA: studentResult.overallGPA,
        overallGrade: studentResult.performanceGrade,
        totalTestsTaken: studentResult.totalTestsTaken,
        averagePercentage: studentResult.averageScore,
        generatedById: adminId,
      },
    });
  }

  async getReportCards(classId: string) {
    return this.prisma.reportCard.findMany({
      where: { classId },
      include: { student: { select: { name: true, email: true } } },
      orderBy: { overallGPA: 'desc' },
    });
  }
}
