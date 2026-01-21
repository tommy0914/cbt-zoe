# Student Enrollment System Implementation

## Overview
The system implements a comprehensive three-tier student enrollment strategy:
1. **Admin Bulk CSV Enrollment** - Admins can upload CSV files to enroll multiple students at once
2. **Teacher/Admin Approval Workflow** - Students submit enrollment requests that teachers/admins approve or reject
3. **Student Self-Enrollment** - Students can browse available classes and request enrollment

## Backend Implementation

### Models
#### EnrollmentRequest (`/backend/models/EnrollmentRequest.js`)
Tracks student enrollment requests with approval workflow:
- `studentId` - Reference to the student user
- `classId` - Reference to the class being joined
- `schoolId` - Reference to the school
- `status` - Enum: 'pending', 'approved', 'rejected'
- `createdAt`, `updatedAt` - Timestamps
- `respondedBy` - User ID of the approver/rejector
- `rejectionReason` - Reason for rejection (if rejected)

### API Routes (`/backend/routes/enrollment.js`)

#### 1. GET `/available-classes`
Returns classes available to enroll in (excludes already enrolled and pending requests)
- **Auth**: Required (JWT)
- **Returns**: Array of classes with ID, name, subject, teacher info

#### 2. POST `/request`
Student submits enrollment request for a class
- **Auth**: Required (JWT)
- **Body**: `{ classId }`
- **Permissions**: Students only (role: 'student')
- **Returns**: Enrollment request confirmation

#### 3. GET `/requests`
Get pending enrollment requests
- **Auth**: Required (JWT)
- **Query**: `?status=pending` (optional)
- **Permissions**: Admin or teacher
- **Returns**: Array of pending requests with student/class details

#### 4. POST `/approve/:requestId`
Approve an enrollment request and add student to class
- **Auth**: Required (JWT)
- **Permissions**: Admin or teacher
- **Effect**: Updates request status to 'approved', adds student to class members

#### 5. POST `/reject/:requestId`
Reject an enrollment request with optional reason
- **Auth**: Required (JWT)
- **Body**: `{ reason }` (optional)
- **Permissions**: Admin or teacher
- **Effect**: Updates request status to 'rejected', optionally stores reason

#### 6. POST `/bulk-enroll`
Admin bulk enrollment via CSV file upload
- **Auth**: Required (JWT)
- **Permissions**: Admin only
- **File**: CSV file (form-data)
- **CSV Format**: 
  ```
  email,classId
  student@example.com,classId1
  student2@example.com,classId2
  ```
  OR
  ```
  email,className
  student@example.com,Grade 10
  student2@example.com,Grade 11
  ```
- **Returns**: Success/failure summary with enrolled count

## Frontend Implementation

### Components

#### JoinSchool.jsx (`/frontend/src/pages/JoinSchool.jsx`)
Student-facing page redesigned with two-view system:
- **View 1: Schools** - Browse and join schools
- **View 2: Classes** - Once in a school, view available classes and request enrollment
- **Features**:
  - `fetchAvailableClasses()` - Get list of classes student can join
  - `handleRequestEnrollment()` - Submit enrollment request
  - Two-panel UI with school list and class grid
  - Request status indicators

#### EnrollmentManagement.jsx (`/frontend/src/components/EnrollmentManagement.jsx`)
Admin/teacher component for managing enrollments:
- **Features**:
  - View pending enrollment requests
  - Approve/reject individual requests
  - Bulk enrollment via CSV upload
  - File upload with XLSX validation
  - Request polling for real-time updates
- **Functions**:
  - `fetchEnrollmentRequests()` - Get pending requests
  - `handleApprove()` - Approve a request
  - `handleReject()` - Reject a request
  - `handleBulkEnroll()` - Process CSV file

#### AdminDashboard.jsx (Updated)
Main admin control panel now includes:
- Toggle button for "Manage Student Enrollments"
- Lazy-loaded EnrollmentManagement component
- Suspense fallback for loading state

## Server Configuration

### Backend Server (`/backend/server.js`)
- Added import: `const enrollmentRoute = require('./routes/enrollment');`
- Added route: `app.use('/api/enrollment', enrollmentRoute);`

## Key Features

### Audit Logging
All enrollment actions are logged to the Audit collection:
- Student requests
- Admin approvals/rejections
- Bulk enrollments
- User IDs and timestamps recorded

### Multi-Tenant Support
All enrollment operations use the school-specific database via dbManager:
- EnrollmentRequest documents stored in school database
- User and class lookups scoped to school
- Maintains data isolation between schools

### Permission System
Role-based access control for each endpoint:
- **Students**: Can request enrollment, view available classes
- **Teachers**: Can approve/reject requests for their school
- **Admins**: Full access including bulk enrollment

### Error Handling
Comprehensive error handling with meaningful messages:
- Validation errors for CSV format
- Duplicate enrollment prevention
- Invalid user/class lookups
- Proper HTTP status codes

## Data Flow

### Student Self-Enrollment Flow
1. Student logs in and navigates to JoinSchool
2. Student joins a school (if not already member)
3. Student switches to Classes view
4. System fetches available classes (excluding already enrolled/pending)
5. Student clicks "Request Enrollment" on a class
6. EnrollmentRequest created with status='pending'
7. Teacher/admin sees request in EnrollmentManagement
8. Teacher approves → student added to class members
9. Or teacher rejects → request status updated

### Admin Bulk Enrollment Flow
1. Admin navigates to AdminDashboard
2. Clicks "Manage Student Enrollments"
3. Sees file upload section for CSV
4. Selects CSV file with email and classId/className columns
5. System parses CSV and creates enrollments
6. Returns summary of successes and failures

## Dependencies Required
- **Backend**: multer (v2.0.2), xlsx (v0.18.5)
- **Frontend**: react (v18.2.0), react-router-dom (v6.14.1)

Both are already installed in package.json files.

## Testing Endpoints

### Using curl or Postman

```bash
# Get available classes for student
GET /api/enrollment/available-classes
Headers: Authorization: Bearer {token}

# Request enrollment
POST /api/enrollment/request
Headers: Authorization: Bearer {token}
Body: { "classId": "classId" }

# Get pending requests (admin/teacher)
GET /api/enrollment/requests?status=pending
Headers: Authorization: Bearer {token}

# Approve request
POST /api/enrollment/approve/requestId
Headers: Authorization: Bearer {token}

# Reject request
POST /api/enrollment/reject/requestId
Headers: Authorization: Bearer {token}
Body: { "reason": "Optional rejection reason" }

# Bulk enroll
POST /api/enrollment/bulk-enroll
Headers: Authorization: Bearer {token}
Content-Type: multipart/form-data
File: enrollment.csv
```

## Files Modified/Created

### Created
- `/backend/models/EnrollmentRequest.js` - New model for enrollment requests
- `/backend/routes/enrollment.js` - New enrollment API routes
- `/frontend/src/components/EnrollmentManagement.jsx` - New admin component

### Modified
- `/backend/server.js` - Added enrollment routes registration
- `/frontend/src/pages/AdminDashboard.jsx` - Added EnrollmentManagement UI
- `/frontend/src/pages/JoinSchool.jsx` - Redesigned with two-view system
- `/backend/models/User.js` - Fixed syntax error (missing comma)

## Future Enhancements
- Email notifications for enrollment approvals/rejections
- Bulk reject functionality
- CSV template download
- Student enrollment history/analytics
- Enrollment approval workflows (auto-approve for certain criteria)
