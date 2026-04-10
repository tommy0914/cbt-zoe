import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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
}
