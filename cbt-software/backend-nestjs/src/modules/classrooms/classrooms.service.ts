import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';

@Injectable()
export class ClassroomsService {
  constructor(private prisma: PrismaService) {}

  async create(createClassroomDto: CreateClassroomDto, user: any) {
    const { name, schoolId, subjects, teacherId } = createClassroomDto;
    const resolvedSchoolId = schoolId || user.schoolId;
    if (!resolvedSchoolId) {
      throw new NotFoundException('School ID required');
    }
    let assignedTeacherId = teacherId;
    if (user.role === 'teacher' && !assignedTeacherId) {
      assignedTeacherId = user.userId;
    }
    const classroom = await this.prisma.classroom.create({
      data: {
        name,
        schoolId: resolvedSchoolId,
        subjects: subjects || [],
        teacherId: assignedTeacherId,
      },
    });
    return classroom;
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
        members: { select: { id: true, name: true, email: true, username: true, profilePicture: true } },
        _count: { select: { members: true, tests: true } },
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

  async addSubject(id: string, subject: string) {
    const classroom = await this.prisma.classroom.findUnique({ where: { id } });
    if (!classroom) throw new NotFoundException('Classroom not found');
    if (classroom.subjects.includes(subject)) return classroom;
    return this.prisma.classroom.update({
      where: { id },
      data: { subjects: { set: [...classroom.subjects, subject] } },
    });
  }

  async removeSubject(id: string, subject: string) {
    const classroom = await this.prisma.classroom.findUnique({ where: { id } });
    if (!classroom) throw new NotFoundException('Classroom not found');
    return this.prisma.classroom.update({
      where: { id },
      data: { subjects: { set: classroom.subjects.filter((s) => s !== subject) } },
    });
  }

  async remove(id: string) {
    return this.prisma.classroom.delete({ where: { id } });
  }

  async getStudents(id: string) {
    const classroom = await this.prisma.classroom.findUnique({
      where: { id },
      include: {
        members: {
          select: { id: true, name: true, email: true, username: true, profilePicture: true },
        },
      },
    });
    if (!classroom) throw new NotFoundException('Classroom not found');
    return classroom.members;
  }
}
