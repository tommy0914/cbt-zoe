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
  create(@Body() createClassroomDto: CreateClassroomDto, @Req() req: any) {
    return this.classroomsService.create(createClassroomDto, req.user);
  }

  @Get()
  findAll(@Query('schoolId') schoolId: string, @Req() req: any) {
    const sId = schoolId || req.user.schoolId;
    return this.classroomsService.findAll(sId, req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.classroomsService.findOne(id);
  }

  @Post(':id/teacher')
  assignTeacher(@Param('id') id: string, @Body() dto: AssignTeacherDto) {
    return this.classroomsService.assignTeacher(id, dto.teacherId);
  }

  @Post(':id/members')
  addMember(@Param('id') id: string, @Body() dto: AddMemberDto) {
    return this.classroomsService.addMember(id, dto.userId);
  }

  @Delete(':id/members/:memberId')
  removeMember(@Param('id') id: string, @Param('memberId') memberId: string) {
    return this.classroomsService.removeMember(id, memberId);
  }
}
