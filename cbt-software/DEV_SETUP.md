# Developer Setup — CBT Platform

Quick steps to run the project locally (backend + frontend)

Prerequisites

- Node.js 18+ (recommend 20+)
- npm or yarn
- PostgreSQL database

Backend (NestJS + Prisma)

1. Copy environment variables

- Copy `.env.example` to `.env` in `cbt-software/backend-nestjs/` and fill values. Example fields:

```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgres://user:password@localhost:5432/cbt_db
JWT_SECRET=replace_with_a_strong_secret_at_least_32_chars
FRONTEND_URL=http://localhost:5173
ENABLE_SWAGGER=false
RATE_LIMIT_MAX=100
```

2. Install and run

```bash
cd cbt-software/backend-nestjs
npm install
npx prisma migrate dev --name init
npm run start:dev
```

3. Seeds (if present):

```bash
# if seed script exists
npx ts-node prisma/seed.ts
```

Frontend (React + Vite)

```bash
cd cbt-software/frontend/cbt-admin-frontend
npm install
npm run dev
```

Notes

- To enable Swagger UI at runtime set `ENABLE_SWAGGER=true` in the backend `.env`.
- To render architecture diagrams see `cbt-software/ARCHITECTURE/diagrams/README.md`.
