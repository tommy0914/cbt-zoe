# Teacher UI Login & Access Flow

## Complete Teacher Journey

### Step 1: Teacher Account Creation (by Admin)

**Admin Dashboard → Create New Teacher**
- Enter: Name, Email, Department, Staff ID
- System generates: Secure temporary password
- Email sent to teacher with credentials

**Email Teacher Receives:**
```
Subject: Your YoungEmeritus Account Created - Login Details Inside

Welcome to YoungEmeritus, [Teacher Name]!

Your account has been created at [School Name].

Your Login Details:
Email: [teacher@school.com]
Temporary Password: [RANDOM_12_CHARS]

⚠️ Important: You must change your password on your first login.
```

---

### Step 2: Teacher Logs In (First Time)

**URL:** `http://localhost:5000` → Click Login
**Page:** Login page (`/login`)

**Teacher enters:**
- Email: their school email (from credentials email)
- Password: temporary password (from credentials email)

**UI shows:** "👥 For Students, Teachers & Admins"

**After clicking "Sign In":**
- ✅ Credentials verified
- 🔐 Forced password change modal appears
- Cannot proceed without changing password

---

### Step 3: Forced Password Change Modal

**Modal appears with:**
- Title: "🔐 Change Your Password"
- Message: "Please create a new password for your account. You must change your temporary password before continuing."

**Teacher fills:**
1. **Current Password** - temporary password from email
2. **New Password** - their desired password (min 6 chars)
3. **Confirm New Password** - repeat new password

**Validations:**
- All fields required
- Passwords must match
- New password must be different from current
- Minimum 6 characters

**After clicking "Change Password":**
- ✅ Password updated in database
- 🔓 Modal closes
- ✅ Teacher gains full system access

---

### Step 4: Teacher Dashboard

**After password change, teacher sees navbar with:**

```
Logo: YoungEmeritus
Navigation:
├── Join School
├── Student Test  
├── My Classes ← Teacher specific
├── Logout
```

**Routing:**
- Teachers with role `teacher` or `admin` see "My Classes" link
- Admins also see "Admin Dashboard"

---

### Step 5: My Classes Page (`/teacher`)

**Header:** "👨‍🏫 My Classes"

**Two Sections:**

#### A. Enrollment Requests (if any pending)
- **Card Background:** Light green with green left border
- **Shows:**
  - "📋 Student Enrollment Requests" 
  - Count of pending requests
  - "View" button to expand/collapse
- **When expanded, displays each request:**
  - Student name and email
  - Class they want to join
  - Date requested
  - Two action buttons: "✓ Approve" (green) and "✕ Reject" (red)
- **Teacher can:**
  - Approve: Student added to class
  - Reject: Request rejected, can send reason

#### B. Assigned Classes
- **Shows:** List of classes teacher teaches
- **For each class displays:**
  - Class name
  - Subjects (comma-separated)
  - Members count: "Members (X)"
  - List of enrolled students
  - Remove button for each student
  - "Add member by email" search field
- **Teacher can:**
  - Remove students from class
  - Add students by searching email
  - Approve student enrollment requests

**If no classes assigned:**
- Message: "You haven't been assigned to any classes yet."
- Hint: "Once an admin assigns you to classes, they will appear here."

---

## Complete Teacher Workflow Example

### Example: Teacher First Day

**Step 1:** Teacher gets hired
- Admin creates teacher account in Admin Dashboard
- System generates temp password: `K9M2P5X7L3R8`
- Email sent to teacher@school.com

**Step 2:** Teacher checks email
- Reads credentials email
- Copies email and password

**Step 3:** Teacher logs in
- Visits YoungEmeritus login page
- Enters: `teacher@school.com` and `K9M2P5X7L3R8`
- Clicks "Sign In"

**Step 4:** Password change modal appears
- Enters current password: `K9M2P5X7L3R8`
- Enters new password: `MySecurePass123`
- Confirms new password: `MySecurePass123`
- Clicks "Change Password"
- Modal closes, gains access

**Step 5:** Teacher navigates to "My Classes"
- Sees 2 pending enrollment requests:
  - John Doe wants to join "Grade 10 Math"
  - Jane Smith wants to join "Grade 10 Math"
- Views class list:
  - "Grade 10 Math" (15 students)
  - "Grade 9 Science" (12 students)

**Step 6:** Teacher approves requests
- Clicks "✓ Approve" for John Doe
- John added to "Grade 10 Math"
- Jane Smith request still pending
- Clicks "✕ Reject" for Jane Smith
- Jane's request rejected

**Step 7:** Teacher manages class
- Views "Grade 10 Math" class members
- Removes a student who transferred
- Adds a new student by email search

---

## Navigation Flow Diagram

```
Login Page (/login)
   ↓
Enter email & password
   ↓
Authenticate
   ↓
Forced Password Change Modal (if first login)
   ↓
Change password
   ↓
Home Page (redirects based on role)
   ↓
Navbar shows:
├─ Join School (/join-school)
├─ Student Test (/student)
├─ My Classes (/teacher) ← Teacher can click here
└─ Logout

Teacher clicks "My Classes" (/teacher)
   ↓
My Classes Page shows:
├─ Enrollment Requests section
│  ├─ View pending requests
│  ├─ Approve button
│  └─ Reject button
│
└─ Assigned Classes section
   ├─ View class details
   ├─ Add students
   └─ Remove students
```

---

## UI States & Transitions

### Login Page States
- **Default:** Empty form, "Sign In" button enabled
- **Loading:** "Signing in..." button disabled
- **Error:** Red error message appears
- **Success:** Redirects to password change or home

### Password Change Modal
- **Initial:** All fields empty, "Change Password" button enabled
- **Validating:** Button disabled, checking password strength
- **Error:** Red error message (password mismatch, etc.)
- **Success:** Green success message, closes automatically

### My Classes Page States
- **Loading:** "Loading your classes..." message
- **No requests:** Enrollment requests section hidden
- **With requests:** Green card shows, count displayed
- **Expanded:** Each request shown with approve/reject buttons
- **No classes:** Empty state message with hint
- **With classes:** Each class card shows members and actions

---

## Key UI Components

### ProtectedRoute Component
- Checks if user is authenticated
- Verifies user has required role (e.g., 'teacher')
- If not: Shows "Not Authorized" and redirects
- If yes: Shows page content

### NavBar Component
- Shows "My Classes" only for teachers/admins
- Shows "Admin Dashboard" only for admins
- Dynamic based on user.schools role

### ChangePassword Component
- Modal with backdrop overlay
- Prevents bypassing password change
- On success: Updates auth context, clears modal

### EnrollmentRequests Section
- Collapsible card in My Classes
- Shows only if requests exist
- Interactive approve/reject buttons
- Real-time updates when action taken

---

## Responsive UI Features

✅ **Mobile-Friendly**
- Cards stack vertically
- Buttons respond to touch
- Readable font sizes
- Proper spacing

✅ **Accessibility**
- Clear button labels
- Hover states
- Color contrasts
- Tab navigation

✅ **Real-Time Updates**
- Enrollment requests auto-refresh
- Classes list updates after actions
- Modal closes on success
- Alerts on errors

---

## Common Teacher Actions & UI Responses

| Action | Page | UI Response |
|--------|------|-------------|
| First login | Any → Password Change Modal | Modal appears, must change password |
| Click "My Classes" | Any → /teacher | Loads classes and pending requests |
| Approve request | /teacher | Request removed from list, student added to class |
| Reject request | /teacher | Request removed, student notified (via email in future) |
| Add student | /teacher | Search by email, click to add, list updates |
| Remove student | /teacher | Confirm removal, student removed from class |
| Logout | Any → /login | Session cleared, redirected to login |

---

## Error Messages Teachers See

**Failed to approve request:**
- "Failed to approve request: [specific error]"
- Alert dialog displays
- Can retry

**Failed to reject request:**
- "Failed to reject request: [specific error]"
- Alert dialog displays
- Can retry

**Failed to add member:**
- "Failed to add member"
- Alert dialog displays
- Can try different email

**Failed to remove member:**
- "Failed to remove member: [specific error]"
- Alert dialog displays
- Can retry

---

## UI Verification Checklist

✅ **Login Page**
- Shows subtitle "👥 For Students, Teachers & Admins"
- Login form for email/password
- Link to Sign Up page

✅ **Password Change Modal**
- Appears on first login
- Cannot bypass or close
- Validates passwords
- Shows success/error messages

✅ **Navbar (After Login)**
- "Join School" link visible
- "Student Test" link visible
- "My Classes" link visible (for teachers)
- "Admin Dashboard" link visible (for admins)
- "Logout" button visible

✅ **My Classes Page**
- Shows pending enrollment requests if any
- Requests are expandable
- Shows all assigned classes
- Shows class members
- Add/remove student functionality

✅ **Error Handling**
- Invalid credentials show error
- Wrong password shows error
- Failed actions show alerts
- Loading states show feedback
