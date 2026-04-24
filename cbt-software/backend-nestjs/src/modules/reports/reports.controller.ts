import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overall-performance')
  async overall(@Query('schoolId') schoolId: string) {
    return this.reportsService.getOverallPerformance(schoolId);
  }

  @Get('question-difficulty')
  async questionDifficulty(@Req() req: any, @Query('schoolId') schoolId: string) {
    const sId = schoolId || req.user.schoolId;
    return this.reportsService.getQuestionDifficulty(sId);
  }

  @Get('class-performance')
  async classPerformance(@Query('classId') classId: string) {
    return this.reportsService.getClassPerformance(classId);
  }

  @Get('student-results/:classId')
  async studentResults(@Param('classId') classId: string) {
    const results = await this.reportsService.getStudentResults(classId);
    return { results };
  }

  @Post('generate-student-result/:studentId/:classId')
  async generateStudentResult(
    @Req() req: any,
    @Param('studentId') studentId: string,
    @Param('classId') classId: string,
    @Body() body: any,
  ) {
    const result = await this.reportsService.generateStudentResult(studentId, classId, req.user.userId, body?.notes);
    if (!result) return { error: 'No graded attempts found for this student in the selected class' };
    return { result };
  }

  @Get('student-result/:id')
  async studentResult(@Param('id') id: string) {
    const result = await this.reportsService.getStudentResult(id);
    if (!result) return { error: 'Result not found' };
    return result;
  }

  @Put('student-result/:id')
  async updateStudentResult(@Param('id') id: string, @Body() body: any) {
    const result = await this.reportsService.updateStudentResult(id, body);
    return { result };
  }

  @Delete('student-result/:id')
  async deleteStudentResult(@Param('id') id: string) {
    await this.reportsService.deleteStudentResult(id);
    return { success: true };
  }

  @Post('generate-report-card/:studentId/:classId')
  async generateReportCard(
    @Req() req: any,
    @Param('studentId') studentId: string,
    @Param('classId') classId: string,
    @Body() body: any,
  ) {
    const reportCard = await this.reportsService.generateReportCard(studentId, classId, req.user.userId, body);
    return { reportCard: { ...reportCard, _id: reportCard.id } };
  }

  @Get('report-card/:id')
  async getReportCard(@Param('id') id: string) {
    const reportCard = await this.reportsService.getReportCard(id);
    if (!reportCard) return { error: 'Report card not found' };
    return { reportCard: { ...reportCard, _id: reportCard.id } };
  }

  @Put('report-card/:id')
  async updateReportCard(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const reportCard = await this.reportsService.updateReportCard(id, body, req.user.userId);
    return { reportCard: { ...reportCard, _id: reportCard.id } };
  }
}

