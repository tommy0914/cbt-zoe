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
    const password = body.password || 'ChangeMe123!';
    const hashed = await bcrypt.hash(password, 10);

    const teacher = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: Role.teacher,
        schoolId,
        username: email.split('@')[0],
        mustChangePassword: true,
      },
    });

    return { message: 'Teacher created successfully', teacher: { ...teacher, _id: teacher.id } };
  }

  async createStudent(body: any) {
    const matric = body.matricNumber ? String(body.matricNumber).toLowerCase().trim() : undefined;
    const email = body.email ? String(body.email).toLowerCase().trim() : `${matric || Date.now()}@student.local`;
    const name = String(body.name || '').trim();
    const schoolId = body.schoolId || null;
    const hashed = await bcrypt.hash('ChangeMe123!', 10);

    const student = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: Role.student,
        schoolId,
        username: matric || email.split('@')[0],
        mustChangePassword: true,
      },
    });

    return { message: 'Student created successfully', student: { ...student, _id: student.id } };
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

