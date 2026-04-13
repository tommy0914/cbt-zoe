import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MaterialsService {
  constructor(private prisma: PrismaService) {}

  async create(data: { title: string; description?: string; fileUrl: string; fileName: string; classId: string; subject?: string; uploadedById: string }) {
    return this.prisma.studyMaterial.create({
      data,
    });
  }

  async findByClass(classId: string) {
    return this.prisma.studyMaterial.findMany({
      where: { classId },
      include: { uploadedBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const material = await this.prisma.studyMaterial.findUnique({ where: { id } });
    if (!material) throw new NotFoundException('Material not found');
    return material;
  }

  async remove(id: string) {
    return this.prisma.studyMaterial.delete({ where: { id } });
  }
}
