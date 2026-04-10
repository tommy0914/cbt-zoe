import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, QuestionType, Difficulty } from '@prisma/client';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.QuestionCreateInput) {
    return this.prisma.question.create({ data });
  }

  async findAll() {
    return this.prisma.question.findMany({
      include: { createdBy: { select: { name: true, email: true } } }
    });
  }

  async findOne(id: string) {
    return this.prisma.question.findUnique({
      where: { id },
      include: { createdBy: { select: { name: true, email: true } } }
    });
  }

  async update(id: string, data: Prisma.QuestionUpdateInput) {
    return this.prisma.question.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.question.delete({ where: { id } });
  }
}
