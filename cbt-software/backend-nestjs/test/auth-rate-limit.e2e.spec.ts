import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';

jest.setTimeout(20000);

describe('Auth Rate Limiting (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should limit repeated failed login attempts', async () => {
    const agent = request(app.getHttpServer());
    // Make 10 rapid failed login attempts and expect rate limiter to block after limit
    let blocked = false;
    for (let i = 0; i < 10; i++) {
      const res = await agent.post('/api/auth/login').send({ loginIdentifier: 'no-such-user', password: 'wrong' });
      if (res.status === 429) {
        blocked = true;
        break;
      }
    }
    expect(blocked).toBe(true);
  });
});