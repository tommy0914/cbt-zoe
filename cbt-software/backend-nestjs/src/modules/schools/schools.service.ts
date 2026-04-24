import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class SchoolsService {
  constructor(private prisma: PrismaService) {}

  async createSchool(name: string, adminId: string, superAdminId: string) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const dbName = `${slug}_${Date.now()}`;
    
    return this.prisma.school.create({
      data: {
        name,
        dbName,
        adminId,
        superAdminId,
      },
    });
  }

  async findAll() {
    return this.prisma.school.findMany();
  }

  async findOne(id: string) {
    return this.prisma.school.findUnique({ where: { id } });
  }

  async createDirect(name: string, userId: string) {
    const school = await this.createSchool(name, userId, userId);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: Role.superAdmin,
        schoolId: school.id,
        schoolRoles: {
          upsert: {
            where: { userId_schoolId: { userId, schoolId: school.id } },
            create: { userId, schoolId: school.id, role: Role.superAdmin },
            update: { role: Role.superAdmin },
          },
        },
      },
    });
    return school;
  }

  async joinSchool(schoolId: string, userId: string) {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new Error('School not found');

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        schoolId: schoolId,
        schoolRoles: {
          upsert: {
            where: { userId_schoolId: { userId, schoolId } },
            create: { userId, schoolId, role: Role.student },
            update: { role: Role.student },
          },
        },
      },
    });
    return user;
  }
}
