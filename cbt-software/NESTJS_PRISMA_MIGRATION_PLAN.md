# NestJS & Prisma Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the CBT backend from Express/Mongoose to NestJS/Prisma/PostgreSQL while maintaining multi-tenancy and core business logic.

**Architecture:** A modular NestJS application using Prisma for relational data access. Each domain (Auth, Users, Schools, etc.) is isolated into its own module with clear boundaries.

**Tech Stack:** NestJS, TypeScript, Prisma, PostgreSQL, Passport.js (JWT), Jest.

---

### Task 1: Project Scaffolding & Dependencies

**Files:**
- Create: `cbt-software/backend-nestjs/package.json`
- Create: `cbt-software/backend-nestjs/tsconfig.json`
- Create: `cbt-software/backend-nestjs/src/main.ts`
- Create: `cbt-software/backend-nestjs/src/app.module.ts`

- [ ] **Step 1: Initialize package.json and install core dependencies**
```bash
mkdir cbt-software/backend-nestjs
cd cbt-software/backend-nestjs
npm init -y
npm install @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt reflect-metadata rxjs @prisma/client bcrypt
npm install --save-dev @nestjs/cli @nestjs/schematics @nestjs/testing prisma typescript @types/node @types/express @types/bcrypt @types/passport-jwt jest ts-jest ts-node
```

- [ ] **Step 2: Initialize NestJS boilerplate**
```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  await app.listen(3001);
}
bootstrap();
```

- [ ] **Step 3: Run project to verify it starts**
Run: `npm run start`
Expected: "Nest application successfully started"

- [ ] **Step 4: Commit**
```bash
git add cbt-software/backend-nestjs/
git commit -m "chore: scaffold nestjs backend"
```

---

### Task 2: Prisma Initialization & Schema Setup

**Files:**
- Create: `cbt-software/backend-nestjs/prisma/schema.prisma`
- Create: `cbt-software/backend-nestjs/.env`

- [ ] **Step 1: Initialize Prisma**
Run: `npx prisma init`

- [ ] **Step 2: Add refined schema to schema.prisma**
(Copy the refined schema from the specification into `prisma/schema.prisma`)

- [ ] **Step 3: Generate Prisma Client**
Run: `npx prisma generate`
Expected: "Generated Prisma Client ... to ./node_modules/@prisma/client"

- [ ] **Step 4: Commit**
```bash
git add cbt-software/backend-nestjs/prisma/schema.prisma
git commit -m "feat: initialize prisma schema"
```

---

### Task 3: Database & Prisma Module

**Files:**
- Create: `cbt-software/backend-nestjs/src/prisma/prisma.service.ts`
- Create: `cbt-software/backend-nestjs/src/prisma/prisma.module.ts`

- [ ] **Step 1: Implement PrismaService**
```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

- [ ] **Step 2: Export PrismaModule for global use**
```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- [ ] **Step 3: Run: `npm run build`**
Expected: Success

- [ ] **Step 4: Commit**
```bash
git add cbt-software/backend-nestjs/src/prisma/
git commit -m "feat: add prisma service and module"
```

---

### Task 4: User Module & Repository

**Files:**
- Create: `cbt-software/backend-nestjs/src/modules/users/users.service.ts`
- Create: `cbt-software/backend-nestjs/src/modules/users/users.module.ts`

- [ ] **Step 1: Implement UsersService with basic lookup**
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
```

- [ ] **Step 2: Create unit test for UsersService**
```typescript
// src/modules/users/users.service.spec.ts
import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: {} }],
    }).compile();
    service = module.get(UsersService);
  });
  it('should be defined', () => expect(service).toBeDefined());
});
```

- [ ] **Step 3: Run test**
Run: `npm test users.service.spec.ts`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add cbt-software/backend-nestjs/src/modules/users/
git commit -m "feat: add basic users service"
```

---

### Task 5: Auth Module & JWT Strategy

**Files:**
- Create: `cbt-software/backend-nestjs/src/modules/auth/auth.service.ts`
- Create: `cbt-software/backend-nestjs/src/modules/auth/auth.controller.ts`
- Create: `cbt-software/backend-nestjs/src/modules/auth/jwt.strategy.ts`
- Modify: `cbt-software/backend-nestjs/src/modules/auth/auth.module.ts`

- [ ] **Step 1: Implement AuthService login logic**
```typescript
// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(pass, user.password)) {
      const payload = { sub: user.id, email: user.email, role: user.role };
      return { access_token: await this.jwtService.signAsync(payload) };
    }
    throw new UnauthorizedException();
  }
}
```

- [ ] **Step 2: Implement JWT Strategy**
```typescript
// src/modules/auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
```

- [ ] **Step 3: Implement AuthController login endpoint**
```typescript
// src/modules/auth/auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    return this.authService.login(body.email, body.password);
  }
}
```

- [ ] **Step 4: Commit**
```bash
git add cbt-software/backend-nestjs/src/modules/auth/
git commit -m "feat: implement jwt auth modules"
```

---

### Task 6: School Management Module

**Files:**
- Create: `cbt-software/backend-nestjs/src/modules/schools/schools.service.ts`
- Create: `cbt-software/backend-nestjs/src/modules/schools/schools.controller.ts`

- [ ] **Step 1: Implement SchoolsService CRUD**
Include logic for `dbName` generation if not provided.

- [ ] **Step 2: Implement SchoolsController**
Secure with RolesGuard (SuperAdmin only).

- [ ] **Step 3: Commit**
```bash
git add cbt-software/backend-nestjs/src/modules/schools/
git commit -m "feat: add school management module"
```

---

### Task 7: Assessment Engine (Questions & Tests)

**Files:**
- Create: `cbt-software/backend-nestjs/src/modules/questions/questions.service.ts`
- Create: `cbt-software/backend-nestjs/src/modules/tests/tests.service.ts`

- [ ] **Step 1: Implement QuestionsService CRUD**
- [ ] **Step 2: Implement TestsService with marks calculation logic**
The `totalMarks` should be derived from the sum of points of linked questions.

- [ ] **Step 3: Commit**
```bash
git add cbt-software/backend-nestjs/src/modules/questions/ cbt-software/backend-nestjs/src/modules/tests/
git commit -m "feat: add questions and tests modules"
```

---

### Task 8: Attempts & Real-time Grading

**Files:**
- Create: `cbt-software/backend-nestjs/src/modules/attempts/attempts.service.ts`
- Create: `cbt-software/backend-nestjs/src/modules/attempts/attempts.controller.ts`

- [ ] **Step 1: Implement Attempt start and submission logic**
- [ ] **Step 2: Implement auto-grading logic**
Compare `Response.answer` with `Question.correctAnswer` and update `totalScore`.

- [ ] **Step 3: Commit**
```bash
git add cbt-software/backend-nestjs/src/modules/attempts/
git commit -m "feat: add assessment grading logic"
```

---

### Task 9: Analytics & Student Results

**Files:**
- Create: `cbt-software/backend-nestjs/src/modules/analytics/analytics.service.ts`

- [ ] **Step 1: Implement result aggregation logic**
Calculate `averageScore`, `highestScore`, and `passingRate` per student and subject.

- [ ] **Step 2: Implement StudentResult generation**
Persist aggregated stats to the `StudentResult` table.

- [ ] **Step 3: Commit**
```bash
git add cbt-software/backend-nestjs/src/modules/analytics/
git commit -m "feat: add analytics and reporting"
```

---

### Task 10: Administrative Features (Audit, Announcements, Attendance)

**Files:**
- Create: `cbt-software/backend-nestjs/src/common/interceptors/audit.interceptor.ts`
- Create: `cbt-software/backend-nestjs/src/modules/announcements/announcements.service.ts`
- Create: `cbt-software/backend-nestjs/src/modules/attendance/attendance.service.ts`

- [ ] **Step 1: Implement Audit Interceptor**
Capture request/response metadata and log to the `Audit` table.

- [ ] **Step 2: Implement CRUD for Announcements and Attendance**

- [ ] **Step 3: Commit**
```bash
git add cbt-software/backend-nestjs/src/
git commit -m "feat: add administrative modules"
```

---

### Task 11: Final Integration & Parallel Execution Setup

**Files:**
- Create: `cbt-software/backend-nestjs/scripts/seed.ts`
- Modify: `cbt-software/backend/server.js` (Optional: route proxying)

- [ ] **Step 1: Create initial database seed script**
- [ ] **Step 2: Verify PostgreSQL connection and Prisma migrations**
- [ ] **Step 3: Final System Check**
Run: `npm run build`
Expected: Success

- [ ] **Step 4: Commit**
```bash
git add cbt-software/backend-nestjs/
git commit -m "chore: finalize nestjs migration setup"
```
