import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async searchByEmail(query: string) {
    if (!query) return [];
    return this.prisma.user.findMany({
      where: {
        email: { contains: query, mode: 'insensitive' },
      },
      take: 20,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        username: true,
        profilePicture: true,
      },
    });
  }

  async searchUsers(query: string, schoolId?: string) {
    if (!query) return [];
    return this.prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
              { username: { contains: query, mode: 'insensitive' } },
            ],
          },
          schoolId ? { schoolId } : {},
          { role: 'student' } // Typically teachers search for students
        ]
      },
      take: 20,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        username: true,
        profilePicture: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        username: true,
        profilePicture: true,
        schoolId: true,
      },
    });
  }

  async updateProfile(id: string, updates: any) {
    const data: any = {};
    if (typeof updates.name === 'string') data.name = updates.name.trim();
    if (typeof updates.email === 'string') data.email = updates.email.trim().toLowerCase();
    if (typeof updates.profilePicture === 'string') data.profilePicture = updates.profilePicture;
    if (typeof updates.matricNumber === 'string') data.username = updates.matricNumber.trim().toLowerCase();

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        username: true,
        profilePicture: true,
      },
    });
  }
}
