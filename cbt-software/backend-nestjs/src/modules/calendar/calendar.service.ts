import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TermName } from '@prisma/client';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async createSession(schoolId: string, name: string) {
    // Check if session already exists
    const existing = await this.prisma.academicSession.findUnique({
      where: { name_schoolId: { name, schoolId } },
    });
    if (existing) throw new BadRequestException('Session already exists');

    // Create session and its three terms
    return this.prisma.academicSession.create({
      data: {
        name,
        schoolId,
        isActive: true,
        terms: {
          create: [
            { name: TermName.FIRST, isCurrent: true, isOpen: true },
            { name: TermName.SECOND, isCurrent: false, isOpen: false },
            { name: TermName.THIRD, isCurrent: false, isOpen: false },
          ],
        },
      },
      include: { terms: true },
    });
  }

  async getSessions(schoolId: string) {
    return this.prisma.academicSession.findMany({
      where: { schoolId },
      include: { terms: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCurrentCalendar(schoolId: string) {
    const session = await this.prisma.academicSession.findFirst({
      where: { schoolId, isActive: true },
      include: { terms: true },
    });
    if (!session) return null;

    const currentTerm = session.terms.find((t) => t.isCurrent);
    return { session, currentTerm };
  }

  async openTerm(termId: string) {
    const term = await this.prisma.academicTerm.findUnique({
      where: { id: termId },
      include: { session: true },
    });
    if (!term) throw new NotFoundException('Term not found');

    // Close all other terms in the same session
    await this.prisma.academicTerm.updateMany({
      where: { sessionId: term.sessionId },
      data: { isCurrent: false, isOpen: false },
    });

    // Open this term
    return this.prisma.academicTerm.update({
      where: { id: termId },
      data: { isCurrent: true, isOpen: true },
    });
  }

  async closeTerm(termId: string) {
    return this.prisma.academicTerm.update({
      where: { id: termId },
      data: { isOpen: false },
    });
  }

  async activateSession(sessionId: string, schoolId: string) {
    // Deactivate all other sessions
    await this.prisma.academicSession.updateMany({
      where: { schoolId, id: { not: sessionId } },
      data: { isActive: false },
    });

    return this.prisma.academicSession.update({
      where: { id: sessionId },
      data: { isActive: true },
    });
  }
}
