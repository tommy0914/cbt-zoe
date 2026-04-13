import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';

@Injectable()
export class ClassroomsService {
  constructor(private prisma: PrismaService) {}

  async create(createClassroomDto: CreateClassroomDto, user: any) {
    const { name, schoolId, subjects, teacherId } = createClassroomDto;
    let assignedTeacherId = teacherId;
    if (user.role === 'teacher' && !assignedTeacherId) {
      assignedTeacherId = user.userId;
    }
    return this.prisma.classroom.create({
      data: {
        name,
        schoolId,
        subjects: subjects || [],
        teacherId: assignedTeacherId,
      },
    });
  }

  async findAll(schoolId: string, user: any) {
    const where: any = { schoolId };
    if (user.role === 'teacher') {
      where.teacherId = user.userId;
    } else if (user.role === 'student') {
      where.members = { some: { id: user.userId } };
    }
    return this.prisma.classroom.findMany({
      where,
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        _count: { select: { members: true } },
      },
    });
  }

  async findOne(id: string) {
    const classroom = await this.prisma.classroom.findUnique({
      where: { id },
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        members: { select: { id: true, name: true, email: true } },
        tests: true,
      },
    });
    if (!classroom) throw new NotFoundException('Classroom not found');
    return classroom;
  }

  async assignTeacher(id: string, teacherId: string) {
    return this.prisma.classroom.update({
      where: { id },
      data: { teacherId },
    });
  }

  async addMember(id: string, userId: string) {
    return this.prisma.classroom.update({
      where: { id },
      data: { members: { connect: { id: userId } } },
    });
  }

  async removeMember(id: string, memberId: string) {
    return this.prisma.classroom.update({
      where: { id },
      data: { members: { disconnect: { id: memberId } } },
    });
  }
}
