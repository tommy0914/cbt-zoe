## Summary

Describe the changes in this PR and the motivation.

## Changes
- Security hardening (Helmet, rate-limiting, env validation)
- CI workflow (GitHub Actions) for backend tests and frontend build
- Frontend chunking and lazy-loading improvements
- OpenAPI dump script + runtime OpenAPI added earlier
- Tests: rate-limit e2e test added
- Docs: `.env.example`, `DEV_SETUP.md`, `ARCHITECTURE` updates

## How to test
- Backend:
  ```bash
  cd backend-nestjs
  npm ci
  npm test
  ```
- Frontend:
  ```bash
  cd frontend/cbt-admin-frontend
  npm ci
  npm run build
  ```

## Checklist
- [ ] Tests added / updated
- [ ] Lint passed
- [ ] Changelog updated

## Notes
If the PR includes enabling Swagger, ensure `ENABLE_SWAGGER` is not set in production environments.
