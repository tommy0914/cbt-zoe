import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
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
import { MaterialsModule } from './modules/materials/materials.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { QuickWinsModule } from './modules/quickwins/quickwins.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { AdminModule } from './modules/admin/admin.module';
import { ReportsModule } from './modules/reports/reports.module';
import { CalendarModule } from './modules/calendar/calendar.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(5000),
        DATABASE_URL: Joi.string().uri().required(),
        JWT_SECRET: Joi.string().min(16).required(),
        FRONTEND_URL: Joi.string().uri().optional(),
        ENABLE_SWAGGER: Joi.string().valid('true', 'false').default('false'),
        RATE_LIMIT_MAX: Joi.number().default(100),
      }),
    }),
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
    MaterialsModule,
    NotificationsModule,
    MessagingModule,
    QuickWinsModule,
    AdminModule,
    ReportsModule,
    CalendarModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
