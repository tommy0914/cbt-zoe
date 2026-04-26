import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, QuestionType, Difficulty } from '@prisma/client';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.QuestionCreateInput) {
    return this.prisma.question.create({ data });
  }

  async bulkCreate(questions: any[]) {
    return this.prisma.question.createMany({
      data: questions,
    });
  }

  async findAll(schoolId?: string) {
    return this.prisma.question.findMany({
      where: schoolId ? { schoolId } : {},
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

  async getSubjects(schoolId?: string) {
    const questions = await this.prisma.question.findMany({
      where: schoolId ? { schoolId } : {},
      select: { tags: true },
    });
    const allTags = questions.flatMap(q => q.tags);
    return Array.from(new Set(allTags));
  }

  async findBySubject(subject: string, schoolId?: string) {
    return this.prisma.question.findMany({
      where: {
        tags: { has: subject },
        ...(schoolId ? { schoolId } : {})
      },
      include: { createdBy: { select: { name: true, email: true } } }
    });
  }

  async remove(id: string) {
    return this.prisma.question.delete({ where: { id } });
  }
}
