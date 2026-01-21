# Admin Quick Control Reference

## Admin Dashboard Access
**URL:** `/admin` (requires admin role)

## Everything Admin Can Control

### 👥 USER MANAGEMENT
- ✅ Create teachers (name, email, dept, staff ID)
- ✅ Create students (name, email, matric #, level)
- ✅ Search users by email
- ✅ View user details
- ✅ Auto-generate passwords & send credentials

### 📚 CLASS MANAGEMENT
- ✅ Create classes (name + subjects)
- ✅ Delete classes
- ✅ Add subjects to classes
- ✅ Remove subjects from classes
- ✅ Assign teachers to classes
- ✅ Add students to classes
- ✅ Remove students from classes
- ✅ View all class details & members

### ❓ QUESTION MANAGEMENT
- ✅ Upload questions (bulk via Excel/CSV)
- ✅ Create questions manually
- ✅ Edit question content
- ✅ Delete questions
- ✅ View all questions
- ✅ Filter by subject/difficulty

### 📝 TEST MANAGEMENT
- ✅ Create tests (select questions, set time limit)
- ✅ Edit test details & questions
- ✅ Delete tests
- ✅ View all tests & attempt records
- ✅ Configure pass marks

### 📋 ENROLLMENT MANAGEMENT
- ✅ View pending enrollment requests
- ✅ Approve student enrollment requests (1-click)
- ✅ Reject student enrollment requests (1-click)
- ✅ Bulk enroll students via CSV upload
- ✅ Auto-create accounts during bulk enrollment
- ✅ Send credentials to new students

### 📊 GRADING & EVALUATION
- ✅ View student essays for grading
- ✅ Grade essays with numeric scores
- ✅ Add grading comments
- ✅ View student test attempts
- ✅ View student responses
- ✅ Track grade history

### 📈 REPORTS & ANALYTICS
- ✅ Overall performance report (by class/student)
- ✅ Question difficulty analysis
- ✅ Analytics dashboard (charts & trends)
- ✅ Student performance metrics
- ✅ Pass rates by class
- ✅ Test completion statistics

### 🔍 AUDIT & LOGGING
- ✅ View all system audit logs
- ✅ Filter by user, action, resource type
- ✅ See timestamps & details
- ✅ Track compliance history
- ✅ Monitor all changes

---

## Admin Dashboard Layout

```
🔧 Admin Dashboard

┌─ 📊 ANALYTICS & REPORTS
│  └─ [Overall Performance] [Question Difficulty]
│
├─ 📤 UPLOAD QUESTIONS
│  └─ File input → [Upload File]
│
├─ ❓ CREATE NEW QUESTION MANUALLY
│  └─ [Toggle] → QuestionForm
│
├─ 📝 VIEW ESSAYS FOR GRADING
│  └─ [Toggle] → GradingDashboard
│
├─ 📈 SHOW ANALYTICS DASHBOARD
│  └─ [Toggle] → AnalyticsDashboard
│
├─ 📝 CREATE NEW TEST
│  └─ [Toggle] → TestForm
│
├─ 📝 TESTS MANAGEMENT
│  ├─ Test 1 [Edit]
│  ├─ Test 2 [Edit]
│  └─ Test 3 [Edit]
│
├─ 📁 CLASSES & SUBJECTS MANAGEMENT
│  ├─ Create Class Input
│  ├─ Add Subjects Input
│  ├─ Class 1
│  │  ├─ Subjects: Math, Science
│  │  ├─ Teacher: Mr. Smith
│  │  ├─ Members: 25 students
│  │  └─ [Add/Remove] [Delete]
│  └─ Class 2
│     └─ [Similar details]
│
├─ 📋 MANAGE STUDENT ENROLLMENTS
│  ├─ Pending Requests: 5
│  │  └─ John Doe wants Grade 10
│  │     [✓ Approve] [✕ Reject]
│  └─ CSV Bulk Upload
│     └─ [Upload] Results
│
└─ 👥 USER MANAGEMENT
   ├─ CREATE TEACHER
   │  ├─ Name: ___________
   │  ├─ Email: __________
   │  ├─ Dept: ___________
   │  ├─ Staff ID: ________
   │  └─ [Create Teacher]
   │
   └─ CREATE STUDENT
      ├─ Name: ___________
      ├─ Email: __________
      ├─ Matric #: _______
      ├─ Level: __________
      └─ [Create Student]
```

---

## Common Admin Tasks

### Task 1: Set Up New School
1. Create admin account in database
2. Admin logs in (forced password change)
3. Admin goes to Admin Dashboard

### Task 2: Add Teachers
1. Dashboard → User Management → Create Teacher
2. Fill: Name, Email, Department, Staff ID
3. Click "Create Teacher"
4. System sends credentials to teacher email
5. Teacher logs in and changes password

### Task 3: Add Students
1. Dashboard → User Management → Create Student
2. Fill: Name, Email, Matriculation #, Level
3. Click "Create Student"
4. System sends credentials to student email
5. Student logs in and changes password

### Task 4: Create Class
1. Dashboard → Classes & Subjects Management
2. Enter class name (e.g., "Grade 10")
3. Enter subjects (e.g., "Math, Science")
4. Click "Create Class"
5. Class appears in list below

### Task 5: Assign Teacher to Class
1. Find class in Classes list
2. Use teacher search field
3. Search and select teacher by email
4. Teacher automatically assigned

### Task 6: Add Students to Class
1. Find class in Classes list
2. Use student search field
3. Search and select student by email
4. Student added to members list
5. Can remove anytime via "Remove" button

### Task 7: Upload Questions
1. Dashboard → Upload Questions
2. Prepare Excel file with questions
3. Select file and click "Upload File"
4. System parses and creates questions
5. View success message with count

### Task 8: Create Test
1. Dashboard → Create New Test
2. Click "Toggle" button
3. Fill: Test name, description
4. Select questions to include
5. Set time limit, pass mark
6. Assign to classes
7. Click "Create Test"

### Task 9: Approve Student Requests
1. Dashboard → Manage Student Enrollments
2. View pending requests (if any)
3. See student name, email, requested class
4. Click "✓ Approve" to add student
5. Or "✕ Reject" to deny request

### Task 10: Bulk Enroll Students
1. Dashboard → Manage Student Enrollments
2. Prepare CSV file:
   ```
   email,classId
   student1@school.com,class123
   student2@school.com,class123
   ```
3. Upload CSV file
4. System creates accounts & enrolls students
5. View results summary

### Task 11: Grade Essays
1. Dashboard → View Essays for Grading
2. Find essay submission
3. View student response
4. Enter numeric grade
5. Add comments (optional)
6. Submit grade

### Task 12: View Analytics
1. Dashboard → Show Analytics Dashboard
2. View charts and graphs
3. See student performance trends
4. Check class statistics
5. Monitor test completion rates

### Task 13: View Reports
1. Dashboard → Analytics & Reports
2. Click "Overall Performance" for summary
3. Or "Question Difficulty" for analysis
4. View detailed statistics
5. Export or print if needed

### Task 14: Check Audit Logs
1. Dashboard → (scroll to bottom)
2. View all system activities
3. Filter by user, action, type
4. See who did what, when
5. Track compliance requirements

---

## Permission Levels

### Admin (Full Control)
✅ Can do EVERYTHING
- Create/delete users
- Manage all classes
- Upload/manage questions
- Create/manage tests
- Approve/reject enrollments
- Bulk enroll students
- Grade essays
- View all analytics
- View audit logs

### Teacher (Limited Control)
⚠️ Can manage assigned classes only:
- View assigned classes
- Add/remove class members
- Approve/reject enrollment requests for their classes
- Grade essays in their classes
- View class analytics

### Student (Minimal Control)
❌ Can only:
- View their own classes
- Request enrollment in available classes
- Take assigned tests
- View their own grades

---

## Admin Checklist: First Time Setup

- [ ] Create school in system
- [ ] Login with admin account
- [ ] Change temporary password
- [ ] Create 2-3 test teachers
- [ ] Create 2-3 test students
- [ ] Create test classes
- [ ] Upload sample questions
- [ ] Create sample test
- [ ] Assign teacher to class
- [ ] Add students to class
- [ ] Test student enrollment flow
- [ ] Test grading functionality
- [ ] Verify audit logs
- [ ] Check analytics dashboard
- [ ] Test all admin functions

---

## API Endpoints Admin Uses

### User Management
- `POST /api/admin/teachers` - Create teacher
- `POST /api/admin/students` - Create student
- `GET /api/users/search?email=...` - Search users

### Class Management
- `POST /api/classes` - Create class
- `DELETE /api/classes/{id}` - Delete class
- `POST /api/classes/{id}/subjects` - Add subject
- `DELETE /api/classes/{id}/subjects/{name}` - Remove subject
- `POST /api/classes/{id}/teacher` - Assign teacher
- `POST /api/classes/{id}/members` - Add member
- `DELETE /api/classes/{id}/members/{id}` - Remove member
- `GET /api/classes` - List all classes

### Questions
- `POST /api/questions/upload` - Upload bulk
- `POST /api/questions` - Create manual
- `PUT /api/questions/{id}` - Update
- `DELETE /api/questions/{id}` - Delete
- `GET /api/questions` - List all

### Tests
- `POST /api/tests` - Create
- `PUT /api/tests/{id}` - Update
- `DELETE /api/tests/{id}` - Delete
- `GET /api/tests/list` - List all

### Enrollments
- `GET /api/enrollment/requests` - View requests
- `POST /api/enrollment/approve/{id}` - Approve
- `POST /api/enrollment/reject/{id}` - Reject
- `POST /api/enrollment/bulk-enroll` - Bulk upload

### Grading
- `POST /api/test/{id}/grade` - Submit grade

### Reports
- `GET /api/reports/overall-performance` - Overall report
- `GET /api/reports/question-difficulty` - Difficulty analysis

### Audit
- `GET /api/admin/audit` - View audit logs

---

## Admin Role Summary

**Admin = Full System Control**

```
┌─────────────────────────────────────┐
│      ADMIN DASHBOARD (/admin)       │
│  Complete Control Over Everything   │
└─────────────────────────────────────┘
         │
         ├─ Users (Create, Manage)
         ├─ Classes (Create, Edit, Delete)
         ├─ Questions (Upload, Create, Edit)
         ├─ Tests (Create, Manage)
         ├─ Enrollments (Approve, Bulk)
         ├─ Grading (Essays)
         ├─ Analytics (Reports, Trends)
         └─ Audit (Logs, Compliance)
```

---

## Remember

- ✅ Only admins can create users
- ✅ Only admins can upload questions
- ✅ Only admins can bulk enroll
- ✅ Only admins can view all analytics
- ✅ Only admins can view audit logs
- ✅ Admins inherit teacher permissions for their classes
- ✅ All admin actions are logged
- ✅ Passwords auto-generated and emailed
- ✅ All credentials are sent via email
- ✅ First-time users forced to change password
