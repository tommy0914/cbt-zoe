import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request = require('supertest');

import { AuthController } from '../modules/auth/auth.controller';
import { AuthService } from '../modules/auth/auth.service';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { ClassroomsController } from '../modules/classrooms/classrooms.controller';
import { ClassroomsService } from '../modules/classrooms/classrooms.service';
import { TestsController } from '../modules/tests/tests.controller';
import { TestsService } from '../modules/tests/tests.service';
import { ReportsController } from '../modules/reports/reports.controller';
import { ReportsService } from '../modules/reports/reports.service';
import { AdminController } from '../modules/admin/admin.controller';
import { AdminService } from '../modules/admin/admin.service';
import { SchoolsController } from '../modules/schools/schools.controller';
import { SchoolsService } from '../modules/schools/schools.service';

describe('API Compatibility (e2e)', () => {
  let app: INestApplication;

  const authServiceMock = {
    login: jest.fn(async () => ({
      success: true,
      token: 'tok',
      accessToken: 'acc',
      refreshToken: 'ref',
      userId: 'u1',
      user: { _id: 'u1', id: 'u1', role: 'admin', schools: [{ schoolId: 's1', role: 'admin' }] },
      expiresIn: 900,
    })),
    register: jest.fn(async () => ({
      success: true,
      token: 'tok',
      accessToken: 'acc',
      refreshToken: 'ref',
      userId: 'u1',
      user: { _id: 'u1', id: 'u1', role: 'student', schools: [] },
      expiresIn: 900,
    })),
    changePassword: jest.fn(async () => ({ success: true, message: 'Password changed successfully' })),
    verifyToken: jest.fn(async () => ({ valid: true })),
    refreshToken: jest.fn(async () => ({ success: true, token: 'new', accessToken: 'new', refreshToken: 'newr', expiresIn: 900 })),
  };

  const classesMock = [
    {
      id: 'c1',
      name: 'Class A',
      subjects: ['Math'],
      teacher: { id: 't1', name: 'Teacher', email: 't@example.com' },
      members: [{ id: 's1', name: 'Student', email: 's@example.com', username: 'st01', profilePicture: null }],
      _count: { members: 1, tests: 1 },
    },
  ];
  const classroomsServiceMock = {
    create: jest.fn(async () => ({ id: 'c1', name: 'Class A', schoolId: 's1', subjects: [], teacherId: null })),
    findAll: jest.fn(async () => classesMock),
    findOne: jest.fn(async () => ({
      id: 'c1',
      name: 'Class A',
      teacher: { id: 't1', name: 'Teacher', email: 't@example.com' },
      members: [],
      tests: [{ id: 'tt1', title: 'Unit Test' }],
    })),
    assignTeacher: jest.fn(async () => ({ id: 'c1' })),
    addMember: jest.fn(async () => ({ id: 'c1' })),
    addSubject: jest.fn(async () => ({ id: 'c1' })),
    removeSubject: jest.fn(async () => ({ id: 'c1' })),
    removeMember: jest.fn(async () => ({ id: 'c1' })),
    remove: jest.fn(async () => ({})),
    getStudents: jest.fn(async () => [{ id: 's1', name: 'Student', email: 's@example.com', username: 'st01', profilePicture: null }]),
  };

  const testsServiceMock = {
    create: jest.fn(async () => ({ id: 't1', title: 'Test 1' })),
    calculateTotalMarks: jest.fn(async () => ({ id: 't1', title: 'Test 1' })),
    findAll: jest.fn(async () => [{ id: 't1', title: 'Test 1' }]),
    findOne: jest.fn(async () => ({ id: 't1', title: 'Test 1', questions: [], classroom: null })),
    list: jest.fn(async () => ({ tests: [{ id: 't1', title: 'Test 1' }], total: 1, page: 1, pageSize: 10, totalPages: 1 })),
    search: jest.fn(async () => ({ tests: [{ id: 't1', title: 'Test 1' }], total: 1, page: 1, pageSize: 10, totalPages: 1 })),
    startAttempt: jest.fn(async () => ({ attemptId: 'a1', durationMinutes: 30, questions: [{ _id: 'q1', questionText: 'Q', options: ['A'] }] })),
    submitAttempt: jest.fn(async () => ({ score: 1, total: 1, percentage: 100, isPassed: true, detailedResults: [] })),
    updateTest: jest.fn(async () => ({ id: 't1', title: 'Test 1' })),
  };

  const reportsServiceMock = {
    getOverallPerformance: jest.fn(async () => ({ totalAttempts: 10, averagePercentage: 80 })),
    getQuestionDifficulty: jest.fn(async () => []),
    getClassPerformance: jest.fn(async () => ({ averageScore: 70, totalAttempts: 10, distribution: {} })),
    getStudentResults: jest.fn(async () => [{ _id: 'r1', studentName: 'Student 1' }]),
    generateStudentResult: jest.fn(async () => ({ _id: 'r1' })),
    getStudentResult: jest.fn(async () => ({ _id: 'r1', notes: '', testAttempts: [] })),
    updateStudentResult: jest.fn(async () => ({ id: 'r1' })),
    deleteStudentResult: jest.fn(async () => ({})),
    generateReportCard: jest.fn(async () => ({ id: 'rc1' })),
    getReportCard: jest.fn(async () => ({ id: 'rc1' })),
    updateReportCard: jest.fn(async () => ({ id: 'rc1' })),
  };

  const adminServiceMock = {
    createTeacher: jest.fn(async () => ({ message: 'Teacher created successfully' })),
    createStudent: jest.fn(async () => ({ message: 'Student created successfully' })),
    assignTeacher: jest.fn(async () => ({ message: 'Teacher assigned successfully' })),
    getAudit: jest.fn(async () => ({ logs: [{ _id: 'a1', action: 'create_user' }] })),
  };

  const schoolsServiceMock = {
    createSchool: jest.fn(async () => ({ id: 's1', name: 'School 1' })),
    createDirect: jest.fn(async () => ({ id: 's1', name: 'School 1' })),
    joinSchool: jest.fn(async () => ({ id: 'u1', email: 'u@example.com' })),
    findAll: jest.fn(async () => [{ id: 's1', name: 'School 1' }]),
    findOne: jest.fn(async () => ({ id: 's1', name: 'School 1' })),
  };

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [
        AuthController,
        ClassroomsController,
        TestsController,
        ReportsController,
        AdminController,
        SchoolsController,
      ],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: ClassroomsService, useValue: classroomsServiceMock },
        { provide: TestsService, useValue: testsServiceMock },
        { provide: ReportsService, useValue: reportsServiceMock },
        { provide: AdminService, useValue: adminServiceMock },
        { provide: SchoolsService, useValue: schoolsServiceMock },
      ],
    });

    moduleBuilder.overrideGuard(JwtAuthGuard).useValue({
      canActivate: (context: any) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId: 'u1', role: 'admin', schoolId: 's1' };
        return true;
      },
    });

    const moduleRef = await moduleBuilder.compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/auth/* contracts', () => {
    it('POST /api/auth/login returns token fields expected by frontend', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ loginIdentifier: 'admin@example.com', password: 'Secret123!' })
        .expect(201);

      expect(res.body).toMatchObject({
        success: true,
        token: expect.any(String),
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        userId: expect.any(String),
      });
      expect(res.body.user).toBeDefined();
    });

    it('POST /api/auth/refresh returns new token pair', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: 'x' })
        .expect(201)
        .expect(({ body }) => {
          expect(body).toMatchObject({
            success: true,
            token: expect.any(String),
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
          });
        });
    });
  });

  describe('/api/classes/* contracts', () => {
    it('GET /api/classes returns wrapper with classes[] and _id alias', async () => {
      await request(app.getHttpServer())
        .get('/api/classes?schoolId=s1')
        .expect(200)
        .expect(({ body }) => {
          expect(Array.isArray(body.classes)).toBe(true);
          expect(body.classes[0]).toMatchObject({ _id: expect.any(String) });
        });
    });
  });

  describe('/api/tests compatibility routes', () => {
    it('GET /api/tests/list returns paginated tests with _id/testName', async () => {
      await request(app.getHttpServer())
        .get('/api/tests/list?page=1&pageSize=10')
        .expect(200)
        .expect(({ body }) => {
          expect(body.tests[0]).toMatchObject({ _id: expect.any(String), testName: expect.any(String) });
        });
    });

    it('GET /api/tests/search works for public list', async () => {
      await request(app.getHttpServer())
        .get('/api/tests/search?page=1&pageSize=10')
        .expect(200)
        .expect(({ body }) => {
          expect(Array.isArray(body.tests)).toBe(true);
        });
    });

    it('GET /api/tests/start/:id returns attempt payload', async () => {
      await request(app.getHttpServer())
        .get('/api/tests/start/t1')
        .expect(200)
        .expect(({ body }) => {
          expect(body).toHaveProperty('attemptId');
          expect(Array.isArray(body.questions)).toBe(true);
        });
    });

    it('POST /api/tests/submit returns score payload', async () => {
      await request(app.getHttpServer())
        .post('/api/tests/submit')
        .send({ attemptId: 'a1', answers: [] })
        .expect(201)
        .expect(({ body }) => {
          expect(body).toMatchObject({ score: expect.any(Number), total: expect.any(Number) });
        });
    });
  });

  describe('/api/reports/* contracts', () => {
    it('GET /api/reports/student-results/:classId returns wrapper with results[]', async () => {
      await request(app.getHttpServer())
        .get('/api/reports/student-results/c1')
        .expect(200)
        .expect(({ body }) => {
          expect(Array.isArray(body.results)).toBe(true);
        });
    });
  });

  describe('/api/admin/* contracts', () => {
    it('GET /api/admin/audit returns logs wrapper', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/audit?limit=10')
        .expect(200)
        .expect(({ body }) => {
          expect(Array.isArray(body.logs)).toBe(true);
        });
    });
  });

  describe('/api/schools contract wrapper', () => {
    it('GET /api/schools returns schools[] with _id alias', async () => {
      await request(app.getHttpServer())
        .get('/api/schools')
        .expect(200)
        .expect(({ body }) => {
          expect(Array.isArray(body.schools)).toBe(true);
          expect(body.schools[0]).toMatchObject({ _id: expect.any(String) });
        });
    });
  });
});

