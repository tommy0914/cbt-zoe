import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overall-performance')
  async overallPerformance(@Req() req: any, @Query('schoolId') schoolId: string) {
    const sId = schoolId || req.user.schoolId;
    return this.reportsService.getOverallPerformance(sId);
  }

  @Get('question-difficulty')
  async questionDifficulty(@Req() req: any, @Query('schoolId') schoolId: string) {
    const sId = schoolId || req.user.schoolId;
    return this.reportsService.getQuestionDifficulty(sId);
  }

  @Get('student-results/:classId')
  async getStudentResults(@Param('classId') classId: string) {
    const results = await this.reportsService.getStudentResults(classId);
    return { results };
  }

  @Post('generate-student-result/:studentId/:classId')
  async generateStudentResult(@Req() req: any, @Param('studentId') studentId: string, @Param('classId') classId: string, @Body('notes') notes: string) {
    return this.reportsService.generateStudentResult(studentId, classId, req.user.userId, notes);
  }

  @Get('student-result/:id')
  async getStudentResult(@Param('id') id: string) {
    return this.reportsService.getStudentResult(id);
  }

  @Put('student-result/:id')
  async updateStudentResult(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.reportsService.updateStudentResult(id, body);
  }

  @Delete('student-result/:id')
  async deleteStudentResult(@Param('id') id: string) {
    return this.reportsService.deleteStudentResult(id);
  }

  @Post('generate-report-card/:studentId/:classId')
  async generateReportCard(@Req() req: any, @Param('studentId') studentId: string, @Param('classId') classId: string, @Body() dto: any) {
    return this.reportsService.generateReportCard(studentId, classId, req.user.userId, dto);
  }

  @Get('report-card/:id')
  async getReportCard(@Param('id') id: string) {
    return this.reportsService.getReportCard(id);
  }

  @Put('report-card/:id')
  async updateReportCard(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const reportCard = await this.reportsService.updateReportCard(id, body, req.user.userId);
    return { reportCard: { ...reportCard, _id: reportCard.id } };
  }

  @Get('report-cards/:classId')
  async getReportCards(@Param('classId') classId: string) {
    return this.reportsService.getReportCards(classId);
  }

  @Put('report-card/:id/publish')
  async publishReportCard(@Param('id') id: string, @Body('isPublished') isPublished: boolean) {
    return this.reportsService.publishReportCard(id, isPublished);
  }

  @Get('student/report-cards')
  async getStudentReportCards(@Req() req: any) {
    return this.reportsService.getStudentReportCards(req.user.userId);
  }
}
