import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async createTeacher(body: any) {
    const email = String(body.email || '').toLowerCase().trim();
    const name = String(body.name || '').trim();
    const schoolId = body.schoolId || null;
    const department = body.department || null;
    const staffId = body.staffId || null;
    const password = body.password || 'ChangeMe123!';
    const hashed = await bcrypt.hash(password, 10);

    const teacher = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: Role.teacher,
        schoolId,
        department,
        staffId,
        username: staffId || email.split('@')[0],
        mustChangePassword: true,
      },
    });

    return { message: 'Teacher created successfully', teacher: { ...teacher, _id: teacher.id } };
  }

  async createStudent(body: any) {
    const matric = body.matricNumber ? String(body.matricNumber).trim() : undefined;
    const email = body.email ? String(body.email).toLowerCase().trim() : null;
    const name = String(body.name || '').trim();
    const level = body.level || null;
    const schoolId = body.schoolId || null;
    const password = body.password || 'ChangeMe123!';
    const mustChange = body.mustChangePassword !== undefined ? body.mustChangePassword : true;
    
    if (!email && !matric) throw new Error('Either Email or Matric Number is required');

    const hashed = await bcrypt.hash(password, 10);

    const student = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: Role.student,
        schoolId,
        level,
        matricNumber: matric,
        username: matric || email?.split('@')[0],
        mustChangePassword: mustChange,
      },
    });

    return { message: 'Student created successfully', student: { ...student, _id: student.id } };
  }

  async resetPassword(userId: string, newPassword?: string) {
    const password = newPassword || 'ChangeMe123!';
    const hashed = await bcrypt.hash(password, 10);
    
    await this.prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashed,
        mustChangePassword: true
      }
    });
    
    return { success: true, message: 'Password has been reset successfully' };
  }

  async promoteStudent(studentId: string, fromClassId: string, toClassId: string) {
    // 1. Remove from old class
    if (fromClassId) {
      await this.prisma.classroom.update({
        where: { id: fromClassId },
        data: {
          members: {
            disconnect: { id: studentId }
          }
        }
      });
    }

    // 2. Add to new class
    await this.prisma.classroom.update({
      where: { id: toClassId },
      data: {
        members: {
          connect: { id: studentId }
        }
      }
    });

    return { success: true, message: 'Student promoted successfully' };
  }

  async assignTeacher(email: string, schoolId?: string) {
    const normalized = String(email || '').toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email: normalized } });
    if (!user) return { message: 'User not found' };

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { role: Role.teacher, schoolId: schoolId || user.schoolId || null },
    });
    return { message: 'Teacher assigned successfully', user: { ...updated, _id: updated.id } };
  }

  async getAudit(query: any) {
    const where: any = {};
    if (query.userId) where.userId = query.userId;
    if (query.action) where.action = { contains: query.action, mode: 'insensitive' };
    if (query.resourceType) where.resourceType = { contains: query.resourceType, mode: 'insensitive' };
    const limit = query.limit ? Number(query.limit) : 100;

    const logs = await this.prisma.audit.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.max(1, Math.min(limit, 500)),
    });

    return {
      logs: logs.map((l: any) => ({
        ...l,
        _id: l.id,
        userName: l.username,
        userRole: l.role,
      })),
    };
  }
}

