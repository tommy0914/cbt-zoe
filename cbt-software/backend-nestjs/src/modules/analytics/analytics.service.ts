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
}
