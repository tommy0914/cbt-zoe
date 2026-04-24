import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EnrollmentService } from './enrollment.service';
import { CreateEnrollmentRequestDto, HandleEnrollmentRequestDto } from './dto/enrollment.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as xlsx from 'xlsx';

@Controller('enrollment')
@UseGuards(JwtAuthGuard)
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Post('request')
  async createRequest(@Req() req: any, @Body() dto: CreateEnrollmentRequestDto) {
    const request = await this.enrollmentService.createRequest(req.user.userId, dto.classId);
    return { request: { ...request, _id: request.id } };
  }

  @Post('approve/:id')
  async approve(@Req() req: any, @Param('id') id: string) {
    const request = await this.enrollmentService.handleRequest(id, req.user.userId, 'approved');
    return { message: 'Enrollment approved', request: { ...request, _id: request.id } };
  }

  @Post('reject/:id')
  async reject(@Req() req: any, @Param('id') id: string, @Body() dto: HandleEnrollmentRequestDto) {
    const request = await this.enrollmentService.handleRequest(id, req.user.userId, 'rejected', dto.reason);
    return { message: 'Enrollment rejected', request: { ...request, _id: request.id } };
  }

  @Get('requests')
  async getRequests(@Query('schoolId') schoolId: string, @Req() req: any) {
    const sId = schoolId || req.user.schoolId;
    const requests = await this.enrollmentService.getPendingRequests(sId);
    return {
      requests: requests.map((r: any) => ({
        ...r,
        _id: r.id,
        studentId: r.student ? { ...r.student, _id: r.student.id } : null,
        classId: r.classroom ? { ...r.classroom, _id: r.classroom.id } : null,
      })),
    };
  }

  @Get('available-classes')
  async getAvailableClasses() {
    const classes = await this.enrollmentService.getAvailableClasses();
    return { classes: classes.map((c: any) => ({ ...c, _id: c.id })) };
  }

  @Post('bulk/:classId')
  async bulkEnroll(
    @Param('classId') classId: string,
    @Body('students') students: any[],
    @Req() req: any,
    @Query('schoolId') schoolId: string,
  ) {
    const sId = schoolId || req.user.schoolId;
    const results = await this.enrollmentService.bulkEnroll(classId, students, sId);
    return {
      results: {
        success: results.filter((r: any) => r.status === 'enrolled'),
        failed: results.filter((r: any) => r.status !== 'enrolled'),
      },
    };
  }

  @Post('bulk-enroll')
  @UseInterceptors(FileInterceptor('file'))
  async bulkEnrollUpload(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
    @Query('schoolId') schoolId: string,
  ) {
    const sId = schoolId || req.user.schoolId;
    if (!file) {
      return { results: { success: [], failed: [{ message: 'No file uploaded' }] } };
    }

    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rows: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const parsed = rows.map((r) => ({
      name: r.name || r.Name || r.studentName || '',
      email: r.email || r.Email || '',
      classId: r.classId || r.class || r.ClassId || '',
      matricNo: r.matricNo || r.matricNumber || r.MatricNumber || '',
    }));

    const grouped = new Map<string, any[]>();
    for (const row of parsed) {
      const cid = row.classId;
      if (!cid) continue;
      if (!grouped.has(cid)) grouped.set(cid, []);
      grouped.get(cid)!.push(row);
    }

    const success: any[] = [];
    const failed: any[] = [];
    for (const [classId, students] of grouped.entries()) {
      const result = await this.enrollmentService.bulkEnroll(classId, students, sId);
      for (const r of result) {
        if (r.status === 'enrolled') success.push(r);
        else failed.push(r);
      }
    }
    return { results: { success, failed } };
  }
}
