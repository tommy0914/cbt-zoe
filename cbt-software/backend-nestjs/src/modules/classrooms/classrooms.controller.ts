import { Controller, Get, Post, Delete, Body, Param, UseGuards, Query, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClassroomsService } from './classrooms.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { AssignTeacherDto } from './dto/assign-teacher.dto';
import { AddMemberDto } from './dto/add-member.dto';

@Controller('classes')
@UseGuards(JwtAuthGuard)
export class ClassroomsController {
  constructor(private readonly classroomsService: ClassroomsService) {}

  @Post()
  async create(@Body() createClassroomDto: CreateClassroomDto, @Req() req: any) {
    const classroom = await this.classroomsService.create(createClassroomDto, req.user);
    return { message: 'Class created', class: { ...classroom, _id: classroom.id } };
  }

  @Get()
  async findAll(@Query('schoolId') schoolId: string, @Req() req: any) {
    const sId = schoolId || req.user.schoolId;
    const classes = await this.classroomsService.findAll(sId, req.user);
    return {
      classes: classes.map((c: any) => ({
        ...c,
        _id: c.id,
        teacher: c.teacher ? { ...c.teacher, _id: c.teacher.id } : null,
        members: (c.members || []).map((m: any) => ({ ...m, _id: m.id })),
      })),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const classroom = await this.classroomsService.findOne(id);
    return {
      class: {
        ...classroom,
        _id: classroom.id,
        teacher: classroom.teacher ? { ...classroom.teacher, _id: classroom.teacher.id } : null,
        members: (classroom.members || []).map((m: any) => ({ ...m, _id: m.id })),
        tests: (classroom.tests || []).map((t: any) => ({ ...t, _id: t.id, testName: t.title })),
      },
    };
  }

  @Post(':id/teacher')
  async assignTeacher(@Param('id') id: string, @Body() dto: AssignTeacherDto) {
    const classroom = await this.classroomsService.assignTeacher(id, dto.teacherId);
    return { message: 'Teacher assigned', class: { ...classroom, _id: classroom.id } };
  }

  @Post(':id/members')
  async addMember(@Param('id') id: string, @Body() dto: AddMemberDto) {
    const classroom = await this.classroomsService.addMember(id, dto.userId);
    return { message: 'Member added', class: { ...classroom, _id: classroom.id } };
  }

  @Post(':id/subjects')
  async addSubject(@Param('id') id: string, @Body('subject') subject: string) {
    const classroom = await this.classroomsService.addSubject(id, subject);
    return { message: 'Subject added', class: { ...classroom, _id: classroom.id } };
  }

  @Delete(':id/subjects/:subject')
  async removeSubject(@Param('id') id: string, @Param('subject') subject: string) {
    const classroom = await this.classroomsService.removeSubject(id, decodeURIComponent(subject));
    return { message: 'Subject removed', class: { ...classroom, _id: classroom.id } };
  }

  @Delete(':id/members/:memberId')
  async removeMember(@Param('id') id: string, @Param('memberId') memberId: string) {
    const classroom = await this.classroomsService.removeMember(id, memberId);
    return { message: 'Member removed', class: { ...classroom, _id: classroom.id } };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.classroomsService.remove(id);
    return { message: 'Class deleted' };
  }

  @Get(':id/students')
  async getStudents(@Param('id') id: string) {
    const students = await this.classroomsService.getStudents(id);
    return { students: students.map((s: any) => ({ ...s, _id: s.id })) };
  }
}
