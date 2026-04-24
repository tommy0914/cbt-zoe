import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('teachers')
  async createTeacher(@Body() body: any) {
    return this.adminService.createTeacher(body);
  }

  @Post('students')
  async createStudent(@Body() body: any) {
    return this.adminService.createStudent(body);
  }

  @Post('assign-teacher')
  async assignTeacher(@Body('email') email: string, @Req() req: any) {
    return this.adminService.assignTeacher(email, req.user.schoolId);
  }

  @Get('audit')
  async getAudit(@Query() query: any) {
    return this.adminService.getAudit(query);
  }
}

