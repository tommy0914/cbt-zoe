import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EnrollmentStatus } from '@prisma/client';

@Injectable()
export class EnrollmentService {
  constructor(private prisma: PrismaService) {}

  async createRequest(studentId: string, classId: string) {
    const classroom = await this.prisma.classroom.findUnique({ where: { id: classId } });
    if (!classroom) throw new NotFoundException('Classroom not found');

    const existing = await this.prisma.enrollmentRequest.findFirst({
      where: { studentId, classId },
    });
    if (existing) throw new ConflictException('Request already exists');

    return this.prisma.enrollmentRequest.create({
      data: {
        studentId,
        classId,
        schoolId: classroom.schoolId,
        status: EnrollmentStatus.pending,
      },
    });
  }

  async handleRequest(requestId: string, adminId: string, status: EnrollmentStatus, reason?: string) {
    const request = await this.prisma.enrollmentRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Request not found');

    const updated = await this.prisma.enrollmentRequest.update({
      where: { id: requestId },
      data: {
        status,
        rejectionReason: reason,
        respondedById: adminId,
        respondedAt: new Date(),
      },
    });

    if (status === EnrollmentStatus.approved) {
      await this.prisma.classroom.update({
        where: { id: request.classId },
        data: {
          members: { connect: { id: request.studentId } },
        },
      });
    }

    return updated;
  }

  async getPendingRequests(schoolId: string) {
    return this.prisma.enrollmentRequest.findMany({
      where: { schoolId, status: EnrollmentStatus.pending },
      include: { student: { select: { name: true, email: true } }, classroom: { select: { name: true } } },
    });
  }

  async getAvailableClasses() {
    return this.prisma.classroom.findMany({
      include: { school: { select: { name: true } }, teacher: { select: { name: true } } },
    });
  }

  async bulkEnroll(classId: string, students: { name: string; email: string; matricNo?: string }[], schoolId: string) {
    const classroom = await this.prisma.classroom.findUnique({ where: { id: classId } });
    if (!classroom) throw new NotFoundException('Classroom not found');

    const results = [];
    for (const s of students) {
      try {
        // Find or create user
        let user = await this.prisma.user.findUnique({ where: { email: s.email } });
        if (!user) {
          user = await this.prisma.user.create({
            data: {
              name: s.name,
              email: s.email,
              password: '$2b$10$UnPredictablePasswordHashForBulkStudentEnrollment12345', // Use a standard default hash or generate one
              role: 'student',
              schoolId: schoolId,
              mustChangePassword: true,
            },
          });
        }

        // Connect to classroom
        await this.prisma.classroom.update({
          where: { id: classId },
          data: {
            members: { connect: { id: user.id } },
          },
        });
        results.push({ email: s.email, status: 'enrolled' });
      } catch (err: any) {
        results.push({ email: s.email, status: 'error', message: err.message });
      }
    }
    return results;
  }
  }
