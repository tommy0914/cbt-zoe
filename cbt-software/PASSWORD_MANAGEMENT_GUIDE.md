# Student Login & Password Management System

## Overview
A complete password management system for student accounts with automatic credential generation, email delivery, and forced password change on first login.

## How It Works

### 1️⃣ Student Account Creation (3 Ways)

#### Method A: Admin Creates Individual Student
- Admin goes to Admin Dashboard
- Creates student with name, email, matriculation number, level
- System generates **secure temporary password**
- **Credentials emailed** to student immediately
- Student receives: email + temporary password

#### Method B: Admin Bulk CSV Upload
- Admin uploads CSV with student data:
  ```csv
  email,name,classId
  john@school.com,John Doe,class123
  jane@school.com,Jane Smith,class456
  ```
- System creates accounts for non-existent students
- **Auto-generates temp passwords**
- **Emails credentials** to each student
- Existing students are enrolled in classes without creating new accounts

#### Method C: Student Self-Signup
- Student goes to Signup page
- Creates account with name, email, **chooses own password**
- Account created immediately, no password change required
- Can login directly

### 2️⃣ Student Receives Credentials

**Email Content** (sent for admin-created accounts):
```
Subject: Your YoungEmeritus Account Created - Login Details Inside

Welcome to YoungEmeritus, [Student Name]!

Your account has been created at [School Name].

Your Login Details:
Email: [student@school.com]
Temporary Password: [RANDOM_12_CHARS]

⚠️ Important: You must change your password on your first login.
```

**Email Delivery**:
- Uses existing OTP Mailer service (Brevo/SendinBlue)
- Falls back to console logging if not configured
- Reliable delivery with error handling

### 3️⃣ First Login Experience

**Student logs in with:**
- Email: their school email
- Password: temporary password from email

**Upon successful login:**
- System detects `mustChangePassword = true`
- Shows **forced password change modal**
- Modal overlays entire screen (cannot bypass)
- Student must:
  1. Enter temporary password
  2. Enter new password (min 6 chars)
  3. Confirm new password
  4. Click "Change Password"

**After password change:**
- `mustChangePassword` flag set to false
- Student gains full access to system
- Can proceed to join schools, take tests, etc.

## Technical Architecture

### Database Schema Changes

#### User Model Updates
```javascript
User = {
  name: String,
  email: String (unique),
  password: String (hashed),
  schools: [SchoolMembership],
  mustChangePassword: Boolean,           // NEW - Force password change
  passwordResetToken: String (nullable), // NEW - For future password reset
  passwordResetExpires: Date (nullable), // NEW - Token expiration
  createdAt: Date
}
```

### Backend Services

#### 1. Password Service (`/backend/services/passwordService.js`)
Generates secure temporary passwords:
```javascript
generateTemporaryPassword() 
  // Returns: 12-char random alphanumeric string (uppercase)
  // Example: "A7K2M9P4X1Z5"

generatePasswordResetToken()
  // Returns: { token, hashedToken, expiresAt }
  // Token sent to user, hashedToken stored in DB
  // Expires in 24 hours
```

#### 2. Updated OTP Mailer (`/backend/services/otpMailer.js`)
New function for credential emails:
```javascript
sendCredentialsEmail(email, tempPassword, name, schoolName)
  // Sends formatted email with login credentials
  // Falls back to console logging if BREVO_API_KEY not set
```

### API Endpoints

#### Authentication Routes

**POST /api/auth/login**
- Accepts: `{ email, password }`
- Returns: `{ token, user: { ..., mustChangePassword } }`
- **NEW**: Includes `mustChangePassword` flag in response

**POST /api/auth/register** (unchanged)
- Student self-signup
- Does not set `mustChangePassword` (user chose own password)

**POST /api/auth/change-password** (NEW)
- Requires: JWT token
- Accepts: `{ currentPassword, newPassword }`
- Returns: `{ message: "Password changed successfully" }`
- Clears `mustChangePassword` flag after success

### Admin Routes

**POST /api/admin/students** (UPDATED)
- Creates student with generated temp password
- Sends credentials email
- Sets `mustChangePassword = true`
- Returns: `{ message: "Student created. Credentials sent to email." }`

### Enrollment Routes

**POST /api/enrollment/bulk-enroll** (UPDATED)
- If student doesn't exist:
  - Creates account with temp password
  - Sends credentials email
  - Sets `mustChangePassword = true`
  - Returns: `{ isNewStudent: true }`
- If student exists:
  - Just enrolls in class
  - Returns: `{ isNewStudent: false }`

## Frontend Components

### 1. ChangePassword Component (`/src/components/ChangePassword.jsx`)
Modal for changing password:
- Form fields:
  - Current Password (temporary password from email)
  - New Password (min 6 chars)
  - Confirm New Password
- Validation:
  - All fields required
  - New passwords must match
  - New password different from current
  - Minimum 6 characters
- Error/success messaging
- Calls `/api/auth/change-password` endpoint

### 2. Updated App Layout (`/src/App.jsx`)
- Detects `mustChangePassword` flag on login
- Shows modal overlay (cannot close/bypass)
- Disables navigation until password changed
- Updates auth context after successful change

## Email Configuration

### Setup (Optional but Recommended)
In `.env` file:
```
BREVO_API_KEY=your_brevo_api_key_here
FROM_EMAIL=noreply@yourdomain.com
```

### Without Configuration
- Emails logged to console (DEV mode)
- Passwords still generated
- System fully functional for testing
- Credentials visible in console

## User Journey Examples

### Example 1: Admin Creates Student
1. Admin navigates to Admin Dashboard
2. Clicks "Create New Student"
3. Fills: Name, Email, Matriculation #, Level
4. Clicks "Create"
5. System:
   - Generates: `K5M2N7P9X3Z1`
   - Sends email to student
   - Shows confirmation message
6. Student receives email with credentials
7. Student goes to Login
8. Enters email and temp password
9. Password change modal appears
10. Student creates new password
11. System grants access
12. Student can join schools and take tests

### Example 2: Admin Bulk Enrolls Students
1. Admin goes to Admin Dashboard → Manage Student Enrollments
2. Uploads CSV:
   ```csv
   email,name,classId
   student1@school.com,Student One,class123
   student2@school.com,Student Two,class123
   ```
3. System:
   - Creates accounts (students don't exist)
   - Generates temp passwords for each
   - Sends 2 credential emails
   - Enrolls both in class123
4. Students receive emails
5. Each follows first login → password change flow

### Example 3: Self-Signup Student
1. Student goes to Signup page
2. Creates account with own password
3. `mustChangePassword = false` (user chose password)
4. Student can login immediately
5. No password change modal shown
6. Direct access to join schools

## Security Features

✅ **Secure Temporary Passwords**
- 12-character random alphanumeric
- Generated via crypto.randomBytes()
- No hardcoded defaults

✅ **Forced Password Change**
- Cannot access system without changing password
- Modal overlay prevents bypassing
- Flag prevents multiple logins with temp password

✅ **Password Hashing**
- bcrypt with 10 salt rounds
- Applied on save (User model pre-hook)

✅ **Email Verification**
- Credentials only sent to registered email
- Student must have email access to get credentials

✅ **Audit Logging**
- Student creation logged
- Bulk enrollments logged
- Password changes tracked

## Error Handling

**Invalid temporary password:**
- Login fails with "Login failed" message
- No indication password is temporary

**Incorrect current password in change:**
- Returns "Current password is incorrect"
- Change operation cancelled

**Password change failure:**
- User keeps `mustChangePassword = true` flag
- Must retry on next login

**Email send failure:**
- System continues (DEV mode logs to console)
- Student can still reset password through OTP (future feature)

## Testing Checklist

- [ ] Admin can create student with credentials email
- [ ] CSV bulk upload creates accounts and sends emails
- [ ] Students receive emails with correct credentials
- [ ] Login with temporary password works
- [ ] Password change modal appears on first login
- [ ] Cannot proceed without changing password
- [ ] Password change with correct current password succeeds
- [ ] Password change with incorrect current password fails
- [ ] New password accepted after change
- [ ] Cannot login with old temporary password after change
- [ ] Self-signup students don't see password change modal
- [ ] mustChangePassword flag correctly set/cleared
- [ ] Audit logs contain creation and password change events

## Future Enhancements

1. **Email-based Password Reset**
   - Students can request password reset
   - Unique reset token emailed
   - 24-hour expiration

2. **Admin Bulk Password Reset**
   - Admin can reset passwords for students
   - New temp passwords generated and emailed

3. **Password Requirements**
   - Enforce complexity (uppercase, numbers, special chars)
   - History to prevent reuse
   - Expiration policies

4. **Two-Factor Authentication**
   - OTP via email on login
   - Optional for enhanced security

5. **Login Notifications**
   - Email when account created
   - Email on successful login
   - Email on suspicious activity

## Files Created/Modified

### Created
- `/backend/services/passwordService.js` - Password generation utilities
- `/frontend/src/components/ChangePassword.jsx` - Password change modal

### Modified
- `/backend/models/User.js` - Added mustChangePassword, passwordResetToken fields
- `/backend/services/otpMailer.js` - Added sendCredentialsEmail function
- `/backend/routes/admin.js` - Generate temp passwords, send emails
- `/backend/routes/auth.js` - Added change-password endpoint, include mustChangePassword in login response
- `/backend/routes/enrollment.js` - Create accounts with temp passwords, send emails on bulk enrollment
- `/frontend/src/App.jsx` - Added password change modal logic and overlay
