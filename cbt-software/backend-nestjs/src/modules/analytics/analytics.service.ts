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

    // Calculate Subject Performance for the StudentResult summary
    const subjects: Record<string, { total: number; correct: number; count: number; tests: any[] }> = {};
    attempts.forEach(a => {
      const subj = a.test.title.split(' ')[0] || 'General'; // fallback if no specific subject field
      if (!subjects[subj]) subjects[subj] = { total: 0, correct: 0, count: 0, tests: [] };
      subjects[subj].total += a.test.totalMarks;
      subjects[subj].correct += a.totalScore;
      subjects[subj].count++;
      subjects[subj].tests.push(a);
    });

    const gpaPoints: Record<string, number> = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0 };
    let totalGPAPoints = 0;
    let subjectCount = 0;

    const subjectPerformanceData = Object.entries(subjects).map(([name, stats]) => {
      const percentage = (stats.correct / (stats.total || 1)) * 100;
      const grade = this.calculateGrade(percentage);
      totalGPAPoints += gpaPoints[grade] || 0;
      subjectCount++;
      return {
        subject: name,
        percentage,
        grade,
        totalTests: stats.count,
        totalMarks: stats.total,
        obtainedMarks: stats.correct,
        remarks: percentage >= 50 ? 'Pass' : 'Fail',
        performanceStatus: this.getPerformanceStatus(percentage)
      };
    });

    const overallGPA = subjectCount ? totalGPAPoints / subjectCount : 0;
    const overallGrade = this.calculateGrade(averageScore);

    return this.prisma.studentResult.upsert({
      where: { id: `${studentId}_${classId}` },
      update: {
        totalTestsTaken,
        totalScoreObtained,
        averageScore,
        highestScore,
        lowestScore,
        overallGPA,
        performanceGrade: overallGrade,
        updatedAt: new Date(),
      },
      create: {
        id: `${studentId}_${classId}`,
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
        overallGPA,
        performanceGrade: overallGrade,
      },
    });
  }

  private calculateGrade(percentage: number): string {
    if (percentage >= 70) return 'A';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 45) return 'D';
    if (percentage >= 40) return 'E';
    return 'F';
  }

  private getPerformanceStatus(percentage: number): string {
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 70) return 'Very Good';
    if (percentage >= 60) return 'Good';
    if (percentage >= 50) return 'Credit';
    if (percentage >= 40) return 'Pass';
    return 'Poor';
  }

  async generateReportCard(studentId: string, classId: string, adminId: string, dto: any) {
    // 1. Ensure latest performance data is calculated
    await this.generateStudentReport(studentId, classId);
    
    const studentResult = await this.prisma.studentResult.findFirst({
      where: { studentId, classId },
      include: { testAttemptMetrics: { include: { test: true } } }
    });

    if (!studentResult) throw new Error('Failed to retrieve student metrics');

    // 2. Aggregate Subject Grades and Test Breakdown
    const attempts = await this.prisma.attempt.findMany({
      where: { studentId, test: { classId }, status: 'graded' },
      include: { test: true }
    });

    const subjects: Record<string, any> = {};
    attempts.forEach(a => {
      // In a real system, we'd use test.subject, but here we'll infer or use tags
      const subj = a.test.title.split(':')[0] || 'General'; 
      if (!subjects[subj]) subjects[subj] = { name: subj, totalMarks: 0, obtained: 0, count: 0, tests: [] };
      
      subjects[subj].totalMarks += a.test.totalMarks;
      subjects[subj].obtained += a.totalScore;
      subjects[subj].count++;
      subjects[subj].tests.push({
        testName: a.test.title,
        date: a.submitTime,
        marksObtained: a.totalScore,
        totalMarks: a.test.totalMarks,
        percentage: a.percentage,
        grade: this.calculateGrade(a.percentage),
        status: a.percentage >= 50 ? 'Pass' : 'Fail'
      });
    });

    const subjectGrades = Object.entries(subjects).map(([name, s]) => {
      const percentage = (s.obtained / (s.totalMarks || 1)) * 100;
      return {
        subject: name,
        percentage,
        grade: this.calculateGrade(percentage),
        totalTests: s.count,
        totalMarks: s.totalMarks,
        obtainedMarks: s.obtained,
        remarks: percentage >= 50 ? 'Pass' : 'Fail',
        performanceStatus: this.getPerformanceStatus(percentage)
      };
    });

    const testBreakdown = Object.entries(subjects).map(([name, s]) => ({
      subject: name,
      tests: s.tests
    }));

    // 3. Create the ReportCard
    return this.prisma.reportCard.create({
      data: {
        studentId,
        studentName: studentResult.studentName,
        studentEmail: studentResult.studentEmail,
        studentRoll: dto?.studentRoll,
        classId,
        className: studentResult.className,
        schoolId: studentResult.schoolId,
        academicTerm: dto?.academicTerm || 'First Term',
        academicYear: dto?.academicYear || '2025/2026',
        overallGPA: studentResult.overallGPA,
        overallGrade: studentResult.performanceGrade,
        totalTestsTaken: studentResult.totalTestsTaken,
        averagePercentage: studentResult.averageScore,
        subjectGrades: subjectGrades as any,
        testBreakdown: testBreakdown as any,
        teacherRemarks: "Satisfactory performance. Keep it up.",
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

  async getStudentResult(studentId: string, classId: string) {
    return this.prisma.studentResult.findUnique({
      where: { id: `${studentId}_${classId}` },
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

  async getClassInsights(classId: string) {
    const attempts = await this.prisma.attempt.findMany({
      where: { test: { classId }, status: 'graded' },
      include: { 
        responses: { include: { question: true } },
        student: { select: { id: true, name: true, email: true } }
      },
    });

    if (attempts.length === 0) return { subjectPerformance: [], atRiskStudents: [] };

    const subjects: Record<string, { total: number; correct: number }> = {};
    
    attempts.forEach(attempt => {
      attempt.responses.forEach(resp => {
        const questionTags = resp.question.tags || ['General'];
        questionTags.forEach(tag => {
          if (!subjects[tag]) subjects[tag] = { total: 0, correct: 0 };
          subjects[tag].total += resp.question.points;
          if (resp.isCorrect) subjects[tag].correct += resp.pointsAwarded;
        });
      });
    });

    const subjectPerformance = Object.entries(subjects).map(([name, stats]) => ({
      subject: name,
      score: Math.round((stats.correct / (stats.total || 1)) * 100),
      isWeakness: (stats.correct / (stats.total || 1)) < 0.5,
    })).sort((a, b) => a.score - b.score);

    const studentAverages: Record<string, number[]> = {};
    attempts.forEach(a => {
      if (!studentAverages[a.studentId]) studentAverages[a.studentId] = [];
      studentAverages[a.studentId].push(a.percentage);
    });

    const atRiskStudents = [];
    for (const [studentId, scores] of Object.entries(studentAverages)) {
      if (scores.length < 2) continue;
      
      const latest = scores[scores.length - 1];
      const previous = scores[scores.length - 2];
      const drop = previous - latest;

      if (drop > 10 || latest < 45) {
        const student = attempts.find(a => a.studentId === studentId)?.student;
        atRiskStudents.push({
          id: studentId,
          name: student?.name,
          latestScore: latest,
          previousScore: previous,
          drop: drop > 0 ? drop : 0,
          reason: latest < 45 ? 'Consistently Low Score' : `Performance Drop (${Math.round(drop)}%)`
        });
      }
    }

    return {
      subjectPerformance,
      atRiskStudents: atRiskStudents.sort((a, b) => b.drop - a.drop),
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
}
