import { Controller, Get, Post, Param, UseGuards, Request, Query } from '@nestjs/common';
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
}
