import { Controller, Get, Post, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('generate/:classId')
  async generate(@Request() req: any, @Param('classId') classId: string) {
    return this.analyticsService.generateStudentReport(req.user.userId, classId);
  }

  @Get('report')
  async getReport(@Request() req: any, @Query('classId') classId: string) {
    return this.analyticsService.getStudentResult(req.user.userId, classId);
  }

  @Get('class-performance/:classId')
  async getClassPerformance(@Param('classId') classId: string) {
    return this.analyticsService.getClassPerformance(classId);
  }

  @Get('class-insights/:classId')
  async getClassInsights(@Param('classId') classId: string) {
    return this.analyticsService.getClassInsights(classId);
  }

  @Get('question-difficulty')
  async getQuestionDifficulty(@Request() req: any, @Query('schoolId') schoolId: string) {
    const sId = schoolId || req.user.schoolId;
    return this.analyticsService.getQuestionDifficulty(sId);
  }

  @Post('generate-report-card/:studentId/:classId')
  async generateReportCard(
    @Request() req: any,
    @Param('studentId') studentId: string,
    @Param('classId') classId: string,
    @Body() dto: any
  ) {
    return this.analyticsService.generateReportCard(studentId, classId, req.user.userId, dto);
  }

  @Get('report-cards/:classId')
  async getReportCards(@Param('classId') classId: string) {
    return this.analyticsService.getReportCards(classId);
  }
}
