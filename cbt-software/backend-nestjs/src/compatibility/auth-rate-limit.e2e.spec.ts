// Ensure required envs for ConfigModule validation during tests
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/testdb';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-that-is-long-enough-32chars!';
process.env.NODE_ENV = 'test';

import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppModule } from '../../src/app.module';

jest.setTimeout(20000);

describe('Auth Rate Limiting (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        // minimal mock: user model methods used by users service
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
          findMany: jest.fn().mockResolvedValue([]),
          update: jest.fn().mockResolvedValue(null),
        },
      } as any)
      .compile();

    app = moduleRef.createNestApplication();
    // apply same per-route rate limiters as main.ts for test
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const rateLimit = require('express-rate-limit');
    const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 8 });
    const authSensitiveLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5 });
    app.use('/api/auth/login', authLimiter);
    app.use('/api/auth/register', authLimiter);
    app.use('/api/auth/refresh', authSensitiveLimiter);
    app.use('/api/auth/verify-token', authSensitiveLimiter);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should limit repeated failed login attempts', async () => {
    const agent = request(app.getHttpServer());
    // Make rapid failed login attempts and expect rate limiter to block after limit
    let blocked = false;
    for (let i = 0; i < 12; i++) {
      const res = await agent.post('/api/auth/login').send({ loginIdentifier: 'no-such-user', password: 'wrong' });
      if (res.status === 429) {
        blocked = true;
        break;
      }
    }
    expect(blocked).toBe(true);
  });
});