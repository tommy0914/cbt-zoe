import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { SchoolsModule } from './modules/schools/schools.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { TestsModule } from './modules/tests/tests.module';
import { AttemptsModule } from './modules/attempts/attempts.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { ClassroomsModule } from './modules/classrooms/classrooms.module';
import { EnrollmentModule } from './modules/enrollment/enrollment.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    SchoolsModule,
    QuestionsModule,
    TestsModule,
    AttemptsModule,
    AnalyticsModule,
    AnnouncementsModule,
    AttendanceModule,
    ClassroomsModule,
    EnrollmentModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
