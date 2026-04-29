# ADR 0001 — Choose NestJS + Prisma

Date: 2026-04-29

Status: Accepted

Context

- The team needs a structured, maintainable backend framework with strong TypeScript support.
- Database interactions require an expressive type-safe ORM and migration tooling.

Decision

- Use NestJS for the backend framework for its modularity, DI, and developer productivity.
- Use Prisma as the primary ORM for type-safe database access and migrations.

Consequences

- Clear module boundaries and dependency injection patterns.
- Type-safe DB layer with Prisma Client; migrations via `prisma migrate`.
- Developers must follow patterns for service/repository separation and keep Prisma interactions encapsulated.

Notes

- Future ADRs should capture decisions for auth, deployment targets, observability, and any major infra changes.
