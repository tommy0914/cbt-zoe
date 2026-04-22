import { Controller, Get, Post, Param, Body, Res, UseGuards, Request, Query } from '@nestjs/common';
import { Response } from 'express';
import { QuickWinsService } from './quickwins.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Priority } from '@prisma/client';

@Controller('quickwins')
@UseGuards(JwtAuthGuard)
export class QuickWinsController {
  constructor(private readonly quickWinsService: QuickWinsService) {}

  // ============ ANNOUNCEMENTS ============

  @Post('announcements/create')
  async createAnnouncement(@Request() req: any, @Body() body: { title: string; content: string; classId: string; priority?: Priority }) {
    return this.quickWinsService.createAnnouncement({ 
      ...body, 
      createdById: req.user.userId,
      schoolId: req.user.schoolId 
    });
  }

  @Get('announcements/class/:classId')
  async getAnnouncements(@Param('classId') classId: string) {
    return this.quickWinsService.getAnnouncements(classId);
  }

  // ============ LEADERBOARD ============

  @Get('leaderboard/class/:classId')
  async getLeaderboard(@Param('classId') classId: string, @Query('limit') limit?: string) {
    return this.quickWinsService.getLeaderboard(classId, limit ? parseInt(limit) : 15);
  }

  @Get('leaderboard/student/:studentId/class/:classId')
  async getStudentRank(@Param('studentId') studentId: string, @Param('classId') classId: string) {
    return this.quickWinsService.getStudentRank(studentId, classId);
  }

  // ============ CERTIFICATES ============

  @Get('certificates/student/:studentId')
  async getStudentCertificates(@Param('studentId') studentId: string) {
    return this.quickWinsService.getStudentCertificates(studentId);
  }

  @Get('certificates/:id')
  async getCertificate(@Param('id') id: string) {
    return this.quickWinsService.getCertificate(id);
  }

  @Post('certificates/:id/send')
  async sendCertificate(@Param('id') id: string) {
    return this.quickWinsService.sendCertificate(id);
  }

  // ============ EXPORT TO CSV/EXCEL ============

  @Get('export/test-results/:testId')
  async exportTestResults(@Param('testId') testId: string, @Res() res: Response) {
    const buffer = await this.quickWinsService.exportTestResults(testId);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=test-results-${testId}.xlsx`);
    res.send(buffer);
  }

  @Get('export/class-report/:classId')
  async exportClassReport(@Param('classId') classId: string, @Res() res: Response) {
    const buffer = await this.quickWinsService.exportClassReport(classId);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=class-report-${classId}.xlsx`);
    res.send(buffer);
  }

  @Get('export/leaderboard/:classId')
  async exportLeaderboard(@Param('classId') classId: string, @Res() res: Response) {
    const buffer = await this.quickWinsService.exportLeaderboard(classId);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=leaderboard-${classId}.xlsx`);
    res.send(buffer);
  }
}
