import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, ip, body } = request;

    return next.handle().pipe(
      tap(async () => {
        if (method !== 'GET' && user) {
          const description = this.generateDescription(method, url, body, user);
          
          await this.prisma.audit.create({
            data: {
              action: `${method} ${url}`,
              description,
              resourceType: url.split('/')[2] || 'unknown',
              userId: user.userId,
              username: user.email,
              role: user.role,
              ip,
              details: body,
            },
          });
        }
      }),
    );
  }

  private generateDescription(method: string, url: string, body: any, user: any): string {
    const role = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    const path = url.split('?')[0];

    // Auth actions
    if (path.includes('/auth/login')) return `${role} logged into the system`;
    if (path.includes('/auth/logout')) return `${role} logged out`;

    // Class actions
    if (path.endsWith('/api/classes') && method === 'POST') return `${role} created a new class: ${body.name || 'Unnamed'}`;
    if (path.includes('/api/classes') && method === 'DELETE') return `${role} deleted a class`;
    if (path.includes('/members') && method === 'POST') return `${role} added a member to a class`;
    if (path.includes('/members') && method === 'DELETE') return `${role} removed a member from a class`;

    // Test actions
    if (path.endsWith('/api/tests') && method === 'POST') return `${role} created a new assessment: ${body.testName || body.title || 'Untitled'}`;
    if (path.includes('/api/tests') && method === 'PUT') return `${role} updated an assessment`;
    if (path.includes('/api/tests') && method === 'DELETE') return `${role} deleted an assessment`;

    // Question actions
    if (path.includes('/api/questions/upload')) return `${role} uploaded questions via Excel`;
    if (path.endsWith('/api/questions') && method === 'POST') return `${role} manually created a new question`;

    // Student actions
    if (path.includes('/admin/students') && method === 'POST') return `${role} registered a new student: ${body.name}`;
    if (path.includes('/admin/promote-student')) return `${role} promoted a student to a new class`;
    if (path.includes('/admin/reset-password')) return `${role} reset a student's password`;
    if (path.includes('/api/attempts') && method === 'DELETE') return `${role} reset a student's test attempt`;

    // Calendar actions
    if (path.includes('/calendar/session') && method === 'POST') return `${role} created academic session: ${body.name}`;
    if (path.includes('/calendar/term') && path.includes('/open')) return `${role} opened an academic term`;
    if (path.includes('/calendar/term') && path.includes('/close')) return `${role} closed an academic term`;

    return `${role} performed ${method} action on ${url.split('/')[2] || 'resource'}`;
  }
}
