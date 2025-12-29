# CBT Software (YoungEmeritus)

This repository contains the CBT platform backend and frontend for YoungEmeritus.

## OTP / School Registration

- The backend exposes `/api/schools/request-otp` which generates a one-time code (OTP) and stores it in `SchoolRegistration`.
- In development (no email provider configured) the OTP is logged and returned in the API response to ease testing. In production the OTP will NOT be returned.
- To complete registration call `/api/schools/register` with `registrationId`, `otp`, and `adminPassword`.

### Environment variables (backend)

- `MONGO_URI` - base MongoDB URI (used to connect to the system DB). Example: `mongodb://localhost:27017/cbt-software`
- `SENDGRID_API_KEY` - (optional) SendGrid API key. When set, OTP emails are sent.
- `FROM_EMAIL` - (optional) Verified sender email for SendGrid. Default: `no-reply@youngemeritus.com`.
- `NODE_ENV` - set to `production` in production to avoid exposing OTPs in API responses.
- `ALLOW_DIRECT_SCHOOL_CREATE` - set to `true` only for backwards-compatibility to allow `POST /api/schools/create-direct`.
- `SCHOOL_OTP_TTL_MINUTES` - OTP expiration in minutes (default 15)
- `SCHOOL_OTP_LENGTH` - OTP length (default 6)

## Migration

A migration script was added to move existing system-level users, classrooms, questions and tests into per-school databases.

Location: `backend/scripts/migrate-schools.js`

Usage (dry-run, safe):

```powershell
cd 'c:\Users\ADMIN\Desktop\computer base test\cbt-software\backend'
node scripts/migrate-schools.js
```

To apply the migration:

```powershell
node scripts/migrate-schools.js --apply
# or via npm
npm run migrate -- --apply
```

To apply and remove original system documents (use with caution):

```powershell
node scripts/migrate-schools.js --apply --cleanup
```

Notes:
- The script is dry-run by default and will report what it would copy.
- When `--apply` is used, the script will create per-school DBs (if `dbName` missing) and copy documents.
- When `--cleanup` is used with `--apply`, the script will delete system-level users and classrooms that were migrated.

## Frontend

- Frontend lives in `frontend/cbt-admin-frontend` (Vite + React).
- The login/register page supports a school-first flow: requesting an OTP for school registration, completing registration with OTP, then creating admin/account in the school's DB.
- In development, the OTP is returned by `/api/schools/request-otp` (unless `NODE_ENV=production`). The frontend persists `registrationId` in `localStorage` so users can continue the flow after refresh.

## Next steps / Recommendations

- Configure `SENDGRID_API_KEY` and `FROM_EMAIL` in production to enable real OTP emails.
- Review and test the migration script in a staging environment before running in production.
- Optionally add more UX polish to the frontend: show clearer OTP delivery status and server errors.

If you need me to run the migration, update the frontend further, or add automated rollback support, tell me which you'd like next.
