import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Priority } from '@prisma/client';
import * as XLSX from 'xlsx';

@Injectable()
export class QuickWinsService {
  constructor(private prisma: PrismaService) {}

  // ============ ANNOUNCEMENTS ============

  async createAnnouncement(data: { title: string; content: string; classId: string; createdById: string; priority?: Priority; schoolId?: string }) {
    return this.prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        classId: data.classId,
        createdById: data.createdById,
        priority: data.priority || Priority.low,
        schoolId: data.schoolId,
      },
      include: { createdBy: { select: { name: true, email: true } } },
    });
  }

  async getAnnouncements(classId: string) {
    return this.prisma.announcement.findMany({
      where: { classId },
      include: { createdBy: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============ LEADERBOARD ============

  async getLeaderboard(classId: string, limit: number = 15) {
    const leaderboard = await this.prisma.leaderboard.findMany({
      where: { classId },
      orderBy: [
        { averageScore: 'desc' },
        { points: 'desc' }
      ],
      take: limit,
    });

    return leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
  }

  async getStudentRank(studentId: string, classId: string) {
    const entry = await this.prisma.leaderboard.findFirst({
      where: { studentId, classId },
    });

    if (!entry) return null;

    const rank = await this.prisma.leaderboard.count({
      where: {
        classId,
        averageScore: { gt: entry.averageScore }
      }
    }) + 1;

    return { ...entry, rank };
  }

  // ============ CERTIFICATES ============

  async getStudentCertificates(studentId: string) {
    return this.prisma.certificate.findMany({
      where: { studentId },
      orderBy: { issuedDate: 'desc' },
    });
  }

  async getCertificate(id: string) {
    const cert = await this.prisma.certificate.findUnique({ where: { id } });
    if (!cert) throw new NotFoundException('Certificate not found');
    return cert;
  }

  async sendCertificate(id: string) {
    return this.prisma.certificate.update({
      where: { id },
      data: { status: 'sent', sentAt: new Date() },
    });
  }

  // ============ EXPORT TO CSV/EXCEL ============

  async exportTestResults(testId: string) {
    const attempts = await this.prisma.attempt.findMany({
      where: { testId },
      include: { student: { select: { name: true, email: true } } },
    });

    if (!attempts.length) throw new NotFoundException('No attempts found for this test');

    const data = attempts.map(a => ({
      'Student Name': a.student?.name || 'N/A',
      'Student Email': a.student?.email || 'N/A',
      'Score': a.totalScore,
      'Percentage': a.percentage,
      'Status': a.status,
      'Started At': a.startTime,
      'Submitted At': a.submitTime || 'N/A',
    }));

    return this.generateExcelBuffer(data, 'Test Results');
  }

  async exportClassReport(classId: string) {
    const attempts = await this.prisma.attempt.findMany({
      where: { test: { classId } },
      include: { 
        student: { select: { name: true, email: true } },
        test: { select: { title: true } }
      },
    });

    if (!attempts.length) throw new NotFoundException('No attempts found for this class');

    const data = attempts.map(a => ({
      'Student Name': a.student?.name || 'N/A',
      'Test Title': a.test?.title || 'N/A',
      'Score': a.totalScore,
      'Percentage': a.percentage,
      'Status': a.status,
      'Date': a.submitTime || a.createdAt,
    }));

    return this.generateExcelBuffer(data, 'Class Report');
  }

  async exportLeaderboard(classId: string) {
    const leaderboard = await this.prisma.leaderboard.findMany({
      where: { classId },
      orderBy: { averageScore: 'desc' },
    });

    if (!leaderboard.length) throw new NotFoundException('No leaderboard data found');

    const data = leaderboard.map((entry, index) => ({
      'Rank': index + 1,
      'Student Name': entry.studentName,
      'Student Email': entry.studentEmail,
      'Average Score': entry.averageScore.toFixed(2),
      'Tests Attempted': entry.testsAttempted,
      'Passed': entry.passCount,
      'Points': entry.points,
      'Streak': entry.streak,
    }));

    return this.generateExcelBuffer(data, 'Leaderboard');
  }

  private generateExcelBuffer(data: any[], sheetName: string): Buffer {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    // Set column widths
    const keys = Object.keys(data[0] || {});
    ws['!cols'] = keys.map(() => ({ wch: 20 }));

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }
}
