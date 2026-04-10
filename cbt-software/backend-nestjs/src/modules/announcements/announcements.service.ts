import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Priority } from '@prisma/client';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  async create(data: { title: string; content: string; classId: string; createdById: string; priority?: Priority }) {
    return this.prisma.announcement.create({ data });
  }

  async findByClass(classId: string) {
    return this.prisma.announcement.findMany({
      where: { classId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
