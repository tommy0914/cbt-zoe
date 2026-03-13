# CBT Software (YoungEmeritus)

This repository contains the CBT platform backend and frontend for YoungEmeritus.

## School Management

### Listing
- Any authenticated user can now fetch the list of all schools via `GET /api/schools`.
  previously this route was restricted to super‑admins; the frontend's “Join School” page uses it to display available schools.

### Creating a School
There are two supported flows for creating a new school:

1. **Superadmin API** – A superadmin can still create a school for someone else using `POST /api/schools` with `name` and `adminId`.
2. **Direct/Self‑service** – If you set the environment variable `ALLOW_DIRECT_SCHOOL_CREATE=true` on the backend (and `VITE_ALLOW_DIRECT_SCHOOL_CREATE=true` on the frontend), any authenticated user can create a school for themselves by calling `POST /api/schools/create-direct` with `{ name }`. The creator becomes both the school’s admin and its superadmin, and their user role will be updated accordingly.

> **Note:** in earlier versions there was an OTP-based registration flow (`/api/schools/request-otp` and `/api/schools/register`), but those endpoints are not currently implemented in the codebase. The README references are kept for historical context.

### OTP Registration (legacy info)
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

## Codebase Architecture and Recent Changes

### Authentication & Role-Based Access Control (RBAC)
Recent updates to the codebase overhauled the centralized authentication and permission system to support multi-tenant schools robustly:
- **Token Verification:** The backend includes robust JWT verification that supports fallback development secrets and accurately extracts a user's targeted `schoolId` and applicable `role` context based on their memberships (`backend/middleware/auth.js`). 
- **SuperAdmin Enhancements:** A `superAdmin` role is explicitly granted universal permission across all API actions (`view_audit`, `manage_classes`, `manage_users`, etc.). 
- **Expanded Token Payloads:** The authentication service explicitly embeds user roles directly in the JWT payload to assist the frontend with strict routing and rendering of administrative features (`backend/services/authService.js`).
- **Frontend Context:** The React app expertly manages auth context (`AuthContext.jsx`), including automated redirection to the landing page on session invalidation, and processes API requests natively via a unified `api.js` wrapper stripped of unnecessary `Content-Type` properties for GET methods.
- **Admin Management UI:** Newly implemented React frontend components (`AdminDashboard.jsx`, `EnrollmentManagement.jsx`, `UserManagement.jsx`) securely consume these properties via `ProtectedRoute.jsx`. This architecture restricts critical administrative and school on-boarding flows entirely to `admin` and `superAdmin` accounts.

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
