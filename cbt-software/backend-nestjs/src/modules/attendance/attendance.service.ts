import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AttendanceStatus } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async takeAttendance(classId: string, date: string, takenById: string, records: { studentId: string; status: AttendanceStatus; note?: string }[]) {
    return this.prisma.attendance.upsert({
      where: { classId_date: { classId, date } },
      update: {
        records: {
          deleteMany: {},
          create: records,
        },
      },
      create: {
        classId,
        date,
        takenById,
        records: {
          create: records,
        },
      },
    });
  }

  async getAttendance(classId: string, date: string) {
    return this.prisma.attendance.findUnique({
      where: { classId_date: { classId, date } },
      include: { records: true },
    });
  }
}
