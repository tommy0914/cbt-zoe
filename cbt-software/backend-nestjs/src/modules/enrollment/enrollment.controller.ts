import { Controller, Get, Post, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EnrollmentService } from './enrollment.service';
import { CreateEnrollmentRequestDto, HandleEnrollmentRequestDto } from './dto/enrollment.dto';

@Controller('enrollment')
@UseGuards(JwtAuthGuard)
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Post('request')
  async createRequest(@Req() req: any, @Body() dto: CreateEnrollmentRequestDto) {
    return this.enrollmentService.createRequest(req.user.userId, dto.classId);
  }

  @Post('approve/:id')
  async approve(@Req() req: any, @Param('id') id: string) {
    return this.enrollmentService.handleRequest(id, req.user.userId, 'approved');
  }

  @Post('reject/:id')
  async reject(@Req() req: any, @Param('id') id: string, @Body() dto: HandleEnrollmentRequestDto) {
    return this.enrollmentService.handleRequest(id, req.user.userId, 'rejected', dto.reason);
  }

  @Get('requests')
  async getRequests(@Query('schoolId') schoolId: string, @Req() req: any) {
    const sId = schoolId || req.user.schoolId;
    return this.enrollmentService.getPendingRequests(sId);
  }

  @Get('available-classes')
  async getAvailableClasses() {
    return this.enrollmentService.getAvailableClasses();
  }
}
