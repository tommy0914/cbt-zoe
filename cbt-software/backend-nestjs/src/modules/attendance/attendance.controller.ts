import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AttendanceStatus } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post(':classId')
  async takeAttendance(
    @Request() req: any,
    @Param('classId') classId: string,
    @Body() body: { date: string; records: { studentId: string; status: AttendanceStatus; note?: string }[] },
  ) {
    return this.attendanceService.takeAttendance(classId, body.date, req.user.userId, body.records);
  }

  @Get(':classId')
  async getAttendance(@Param('classId') classId: string, @Query('date') date: string) {
    return this.attendanceService.getAttendance(classId, date);
  }

  @Get(':classId/:date')
  async getAttendanceByPath(@Param('classId') classId: string, @Param('date') date: string) {
    return this.attendanceService.getAttendance(classId, date);
  }
}
