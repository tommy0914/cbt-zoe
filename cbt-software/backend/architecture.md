# System Architecture

## Overview
Multi-tenant school management system using RBAC and modular services.

## Architecture Style
- Monolithic (Phase 1)
- Microservices-ready (Phase 3)

## Core Modules
- Authentication Service
- User Management
- School Management
- Academic Module (Classes, Subjects)
- Assessment Module
- Reporting & Analytics

## Multi-Tenant Strategy
- Shared database
- Tenant isolation via `school_id`
- Row-level security enforced in services

## High-Level Flow
Client → API → Auth Middleware → Authorization → Service Layer → Database

## Tech Stack
- Backend: Node.js (NestJS preferred)
- DB: PostgreSQL
- ORM: Prisma
- Auth: JWT + Refresh Tokens


