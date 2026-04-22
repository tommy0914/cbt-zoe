# NestJS & Prisma Migration - Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the migration of all remaining modules to achieve full feature parity with the frontend.

**Tech Stack:** NestJS, Prisma, PostgreSQL, Multer (for materials).

---

### Task 12: Classes & Membership

**Files:**
- Create: `src/modules/classrooms/classrooms.service.ts`
- Create: `src/modules/classrooms/classrooms.controller.ts`
- Create: `src/modules/classrooms/classrooms.module.ts`

- [ ] **Step 1: Implement ClassroomsService**
CRUD for classrooms, adding/removing members, and assigning teachers.
- [ ] **Step 2: Implement ClassroomsController**
Endpoints for `/api/classes` corresponding to frontend usage.
- [ ] **Step 3: Commit**
`git add src/modules/classrooms/ && git commit -m "feat: add classrooms and membership logic"`

---

### Task 13: Enrollment System

**Files:**
- Create: `src/modules/enrollment/enrollment.service.ts`
- Create: `src/modules/enrollment/enrollment.controller.ts`

- [ ] **Step 1: Implement EnrollmentRequest flow**
Handle `/api/enrollment/request`, `approve`, and `reject`.
- [ ] **Step 2: Bulk Enrollment logic**
Implement CSV/JSON bulk student enrollment into classes.
- [ ] **Step 3: Commit**
`git add src/modules/enrollment/ && git commit -m "feat: add enrollment request system"`

---

### Task 14: Study Materials (Resource Library)

**Files:**
- Create: `src/modules/materials/materials.service.ts`
- Create: `src/modules/materials/materials.controller.ts`

- [ ] **Step 1: Setup Multer for file uploads**
Handle study material uploads and storage (local or cloud).
- [ ] **Step 2: Implement Materials CRUD**
Endpoints for class-specific study resources.
- [ ] **Step 3: Commit**
`git add src/modules/materials/ && git commit -m "feat: add study materials module"`

---

### Task 15: Enhanced Test Engine

**Files:**
- Create: `src/modules/test-engine/test-engine.service.ts`
- Create: `src/modules/test-engine/test-engine.controller.ts`

- [ ] **Step 1: Implement Save Progress logic**
Allow students to save intermediate answers during an active test.
- [ ] **Step 2: Class-based test listing**
Specific routes for students to see tests available for their class.
- [ ] **Step 3: Commit**
`git add src/modules/test-engine/ && git commit -m "feat: enhance test engine with progress saving"`

---

### Task 16: Advanced Reporting & Analytics

**Files:**
- Modify: `src/modules/analytics/analytics.service.ts`
- Create: `src/modules/analytics/reports.controller.ts`

- [ ] **Step 1: Detailed Report Card Generation**
Aggregating subject performance and test attempt metrics into a finalized report card.
- [ ] **Step 2: Performance Trends**
Logic for class-wide averages and difficulty indexing.
- [ ] **Step 3: Commit**
`git commit -m "feat: add advanced reporting and class performance analytics"`
