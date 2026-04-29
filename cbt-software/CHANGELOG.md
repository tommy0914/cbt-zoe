# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

### Added
- Security: Helmet and per-route `express-rate-limit` applied in `backend-nestjs/src/main.ts`.
- Config validation: `@nestjs/config` + Joi validation schema in `backend-nestjs/src/app.module.ts`.
- Env example: `backend-nestjs/.env.example` and `src/config/configuration.ts`.
- CI: GitHub Actions workflow at `.github/workflows/ci.yml` to run backend tests and frontend lint/build.
- Frontend: Vite `manualChunks` and lazy-loaded admin pages to reduce main bundle.
- Tests: Added e2e test for auth rate-limiting `src/compatibility/auth-rate-limit.e2e.spec.ts`.
- Docs: `DEV_SETUP.md` updated with `.env.example` instructions.

### Changed
- `backend-nestjs/src/main.ts` now gates Swagger in non-production and fails fast on missing envs.
- ESLint fixes and build adjustments for frontend.

### Fixed
- API contract compatibility for reports endpoint (controller response wrapper).

### Notes
- Mermaid diagram rendering is left as manual due to Puppeteer download issues in this environment. See `ARCHITECTURE/diagrams/README.md` for instructions.

