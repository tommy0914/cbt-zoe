# Specification: NestJS & Prisma Migration (PostgreSQL)

## 1. Overview
This project involves migrating the existing Express/Mongoose backend of the Computer-Based Test (CBT) system to a modern architecture using **NestJS**, **Prisma**, and **PostgreSQL**. The goal is to improve type safety, scalability, and maintainability while transitioning from a NoSQL to a relational database.

## 2. Objectives
- Implement a relational database schema in PostgreSQL using Prisma.
- Replicate and enhance existing backend functionality in NestJS.
- Maintain multi-tenancy (School-based) support.
- Ensure a smooth incremental migration from the current Express app.

## 3. Architecture & Tech Stack
- **Framework:** NestJS (TypeScript)
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Architecture:** Modular (per-domain) with Dependency Injection.
- **Migration Strategy:** Option 1 (Incremental Big Bang) – running NestJS in parallel with Express during development.

## 4. Proposed Directory Structure
The new backend will reside in `cbt-software/backend-nestjs/` to avoid conflicts with the legacy app.
```text
backend-nestjs/
├── prisma/
│   └── schema.prisma (The refined schema)
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── schools/
│   │   ├── classrooms/
│   │   ├── questions/
│   │   ├── tests/
│   │   ├── attempts/
│   │   └── analytics/
│   ├── common/ (guards, interceptors, decorators)
│   ├── config/ (environment variables)
│   ├── main.ts
│   └── app.module.ts
├── test/
├── .env
├── package.json
└── tsconfig.json
```

## 5. Data Schema (Refined Prisma)
The schema will use PostgreSQL-specific features like `String[]` for options and tags, and `Json` for audit details. Relationships are explicitly defined to enforce referential integrity.

### Core Entities:
- **User:** Extended with security fields and multi-role support.
- **School:** Central to multi-tenancy; linked to Admins and SuperAdmins.
- **Classroom:** Groups students and tests within a school.
- **Question:** Supports multiple types and difficulty levels.
- **Test:** Time-bound assessments with marks calculation logic.
- **Attempt & Response:** Tracks student performance in real-time.
- **StudentResult:** Aggregated analytics and subject-wise performance.
- **Audit, Announcement, Attendance, Leaderboard:** Supporting administrative and social features.

## 6. Implementation Plan Highlights
1. **Module 1: Infrastructure & Auth**
   - Setup Prisma client and PostgreSQL connection.
   - Implement JWT-based Auth with Role-Based Access Control (RBAC).
2. **Module 2: School & User Management**
   - CRUD for Schools and Users.
   - Permission logic for Teachers and Admins.
3. **Module 3: Assessment Engine**
   - Question bank management.
   - Test scheduling and logic.
4. **Module 4: Student Portal & Analytics**
   - Attempt submission and auto-grading.
   - Performance report generation (StudentResult).

## 7. Success Criteria
- [ ] Prisma schema successfully migrated to PostgreSQL.
- [ ] All existing business logic (marks calculation, result aggregation) replicated in NestJS.
- [ ] API parity with the current Express backend for migrated endpoints.
- [ ] Performance benchmarks meet or exceed the current system.
