import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TestsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.TestCreateInput) {
    // Note: totalMarks calculation usually happens here or via a dedicated method
    return this.prisma.test.create({ data });
  }

  async calculateTotalMarks(testId: string) {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: { questions: { select: { points: true } } },
    });

    if (!test) return 0;

    const totalMarks = test.questions.reduce((sum, q) => sum + q.points, 0);

    return this.prisma.test.update({
      where: { id: testId },
      data: { totalMarks },
    });
  }

  async findAll() {
    return this.prisma.test.findMany({
      include: { 
        classroom: true, 
        createdBy: { select: { name: true } },
        _count: { select: { questions: true } }
      }
    });
  }

  async findOne(id: string) {
    return this.prisma.test.findUnique({
      where: { id },
      include: { questions: true, classroom: true }
    });
  }
}
