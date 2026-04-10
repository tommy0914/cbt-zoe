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
        if (method !== 'GET') {
          await this.prisma.audit.create({
            data: {
              action: `${method} ${url}`,
              resourceType: url.split('/')[2] || 'unknown',
              userId: user?.userId,
              username: user?.email,
              role: user?.role,
              ip,
              details: body,
            },
          });
        }
      }),
    );
  }
}
