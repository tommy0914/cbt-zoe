import { Controller, Get, Post, Body, Param, UseGuards, Req, Put } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CalendarService } from './calendar.service';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post('session')
  async createSession(@Req() req: any, @Body('name') name: string) {
    const schoolId = req.user.schoolId;
    return this.calendarService.createSession(schoolId, name);
  }

  @Get('sessions')
  async getSessions(@Req() req: any) {
    const schoolId = req.user.schoolId;
    return this.calendarService.getSessions(schoolId);
  }

  @Get('current')
  async getCurrent(@Req() req: any) {
    const schoolId = req.user.schoolId;
    return this.calendarService.getCurrentCalendar(schoolId);
  }

  @Put('term/:id/open')
  async openTerm(@Param('id') id: string) {
    return this.calendarService.openTerm(id);
  }

  @Put('term/:id/close')
  async closeTerm(@Param('id') id: string) {
    return this.calendarService.closeTerm(id);
  }

  @Put('session/:id/activate')
  async activateSession(@Param('id') id: string, @Req() req: any) {
    const schoolId = req.user.schoolId;
    return this.calendarService.activateSession(id, schoolId);
  }
}
