# 🧪 Report Card Feature - Testing Guide

## Overview
Complete testing checklist for the Subject-wise Report Card feature.

---

## ✅ Pre-Testing Setup

### 1. Database Setup
- [ ] MongoDB running
- [ ] School and class created
- [ ] Teachers assigned to class
- [ ] Students enrolled in class
- [ ] Multiple tests created with different subjects
- [ ] Test attempts submitted by students

### 2. Test Data Requirements
```
Minimum:
- 1 school
- 1 class
- 1 teacher (logged in)
- 3 students
- 3 tests (Math, Science, English)
- Each student has attempted all tests

Recommended:
- 1 school, 3 classes
- 5 teachers
- 20 students
- 10 tests across subjects
- Mixed pass/fail scores
```

### 3. Environment Check
- [ ] Backend server running
- [ ] Frontend running
- [ ] Database connected
- [ ] API routes accessible
- [ ] Authentication working
- [ ] No console errors

---

## 🎯 Feature Testing

### Test 1: Generate Report Card

**Steps:**
1. Login as teacher
2. Go to My Classes
3. Select a class → View Details
4. Click Results List tab
5. View a student result
6. Click "Generate Report Card" button

**Expected:**
- [ ] Button shows "⏳ Generating..." while processing
- [ ] Report card modal opens automatically
- [ ] No console errors
- [ ] Response time < 2 seconds
- [ ] ReportCard appears in 3rd tab

**Validation:**
```
✅ Report card created in database
✅ All student info populated
✅ Subject grades calculated
✅ Test breakdown organized
✅ Timestamps recorded
```

---

### Test 2: Report Card Display

**Sections to Verify:**

#### School Header
- [ ] School name visible
- [ ] Academic term displayed
- [ ] Academic year shown
- [ ] Gradient background applied

#### Student Information
- [ ] Student name correct
- [ ] Email displayed
- [ ] Roll number correct
- [ ] Class name shown
- [ ] Total tests counted

#### Overall Performance
- [ ] GPA calculated correctly
- [ ] Overall grade assigned (A-F)
- [ ] Average percentage computed
- [ ] Ranking shown

#### Subject Grades Table
- [ ] All subjects listed
- [ ] Percentages accurate
- [ ] Grades correct (A-F)
- [ ] Test count matches
- [ ] Performance status shown
- [ ] Color coding applied

#### Test Breakdown
- [ ] Tests grouped by subject
- [ ] All tests listed
- [ ] Dates displayed
- [ ] Marks shown (obtained/total)
- [ ] Percentages calculated
- [ ] Grade assigned per test

---

### Test 3: Grade Calculations

**Verify Accuracy:**

| Subject | Tests | Scores | Expected % | Grade | ✅ |
|---------|-------|--------|-----------|-------|-----|
| Math | 3 | 95,90,88 | 91% | A | [ ] |
| Science | 3 | 82,85,80 | 82% | B | [ ] |
| English | 3 | 75,78,70 | 74% | C | [ ] |

**Overall Calculation:**
- [ ] GPA = Average(A, B, C) = 3.0
- [ ] Overall % = Average(91%, 82%, 74%) = 82%
- [ ] Overall Grade = B

---

### Test 4: Teacher Remarks

**Steps:**
1. Open report card
2. Scroll to Remarks section
3. Click textarea
4. Type test remarks
5. Click "Save Remarks"

**Validations:**
- [ ] Textarea focuses properly
- [ ] Text input works
- [ ] Save button enabled
- [ ] Success message shown
- [ ] Remarks saved in database
- [ ] Remarks persist on reload

---

### Test 5: Approval Workflow

**Steps:**
1. Open report card
2. Scroll to Approval section
3. Check "Approved by Principal"
4. Verify "Published to Parents"

**Validations:**
- [ ] Checkbox toggles on/off
- [ ] isApproved field updates
- [ ] Timestamp recorded
- [ ] User tracked (approvedBy)
- [ ] Publish checkbox functional
- [ ] isPublished field updates

---

### Test 6: Print Functionality

**Steps:**
1. Open report card
2. Click "🖨️ Print Report Card"
3. Browser print dialog appears

**Validations:**
- [ ] Print preview shows correctly
- [ ] All sections visible in print
- [ ] Colors render properly
- [ ] Tables not broken
- [ ] Buttons hidden in print
- [ ] PDF saves successfully
- [ ] File name correct

**Print Preview Checklist:**
- [ ] Header with school info
- [ ] Student details
- [ ] Overall stats
- [ ] Subject table
- [ ] Test breakdown
- [ ] Remarks
- [ ] Professional formatting

---

### Test 7: PDF Export

**Steps:**
1. Open report card
2. Click "📄 Export as PDF"

**Validations:**
- [ ] PDF downloads
- [ ] File name contains student ID
- [ ] PDF opens correctly
- [ ] All content visible
- [ ] Images display
- [ ] No corrupted text
- [ ] File size < 2MB

---

### Test 8: Responsive Design

**Mobile (480px width):**
- [ ] Report card stacks vertically
- [ ] Text readable
- [ ] Buttons clickable
- [ ] Tables scrollable
- [ ] Images scale
- [ ] No horizontal scroll needed

**Tablet (768px width):**
- [ ] Two-column layout
- [ ] Tables fit properly
- [ ] Buttons aligned
- [ ] Spacing adequate

**Desktop (1920px width):**
- [ ] Full layout
- [ ] All sections visible
- [ ] Professional appearance
- [ ] No wasted space

---

### Test 9: API Endpoints

#### POST /api/reports/generate-report-card/:studentId/:classId
```javascript
Request:
POST /api/reports/generate-report-card/[ID]/[CLASS_ID]
Headers: { Authorization: Bearer TOKEN }
Body: { academicTerm: "Term 1", academicYear: "2025-2026" }

Expected Response:
{
  success: true,
  reportCard: { _id, studentId, classId, ... },
  message: "Report card generated successfully"
}

Validations:
- [ ] Status 201 Created
- [ ] Report card ID returned
- [ ] Data persisted in DB
- [ ] No SQL injection possible
- [ ] Authorization checked
```

#### GET /api/reports/report-card/:reportCardId
```javascript
Request:
GET /api/reports/report-card/[REPORT_ID]
Headers: { Authorization: Bearer TOKEN }

Expected Response:
{
  success: true,
  reportCard: { Full object }
}

Validations:
- [ ] Status 200 OK
- [ ] All fields populated
- [ ] Relationships populated (student, class)
- [ ] No sensitive data leaked
```

#### GET /api/reports/report-cards/:classId
```javascript
Request:
GET /api/reports/report-cards/[CLASS_ID]

Expected Response:
{
  success: true,
  reportCards: [ {...}, {...} ],
  total: 25
}

Validations:
- [ ] Returns all class report cards
- [ ] Pagination works (if implemented)
- [ ] Filtering works
```

#### PUT /api/reports/report-card/:reportCardId
```javascript
Request:
PUT /api/reports/report-card/[REPORT_ID]
Body: {
  remarks: "Good performance",
  isApproved: true,
  isPublished: true
}

Expected Response:
{
  success: true,
  reportCard: { Updated object },
  message: "Report card updated"
}

Validations:
- [ ] Status 200 OK
- [ ] Fields updated
- [ ] Previous data preserved
- [ ] Timestamps updated
```

---

### Test 10: Error Handling

**Test Cases:**

#### Invalid Student ID
- [ ] Returns 404 error
- [ ] Clear error message
- [ ] No server crash
- [ ] Logged in audit

#### No Authorization
- [ ] Returns 401 Unauthorized
- [ ] Redirects to login
- [ ] Token validated

#### Class Not Found
- [ ] Returns 404 error
- [ ] Friendly message shown
- [ ] Fallback handling

#### No Test Attempts
- [ ] Shows error message
- [ ] "No tests found for this student"
- [ ] Graceful handling

#### Database Error
- [ ] Returns 500 error
- [ ] Generic message to user
- [ ] Detailed log server-side
- [ ] Monitoring alert triggered

---

### Test 11: Data Validation

#### Score Validation
- [ ] Scores must be 0-100
- [ ] Decimal scores accepted
- [ ] Negative scores rejected
- [ ] Invalid types rejected

#### Subject Validation
- [ ] Subject cannot be empty
- [ ] Must match test subject
- [ ] Case sensitivity handled
- [ ] Duplicates handled

#### Student Validation
- [ ] Student must exist
- [ ] Student must be in class
- [ ] Student must have tests
- [ ] Email format validated

---

### Test 12: Access Control

**Teacher Access:**
- [ ] Can generate own class reports
- [ ] Cannot generate other class reports
- [ ] Cannot delete reports
- [ ] Cannot modify approval status

**Admin Access:**
- [ ] Can access all reports
- [ ] Can approve/publish
- [ ] Can delete reports
- [ ] Can view all schools

**Student/Parent Access:**
- [ ] Cannot generate reports
- [ ] Cannot modify reports
- [ ] Can view if published
- [ ] Cannot delete

---

### Test 13: Performance Testing

| Operation | Target Time | Actual | ✅ |
|-----------|-------------|--------|-----|
| Generate report | < 2s | ___ | [ ] |
| Load report list | < 1s | ___ | [ ] |
| Get single report | < 500ms | ___ | [ ] |
| Update remarks | < 1s | ___ | [ ] |
| Export to PDF | < 3s | ___ | [ ] |
| Print render | < 2s | ___ | [ ] |

**Load Testing:**
- [ ] 100 simultaneous requests
- [ ] No timeout errors
- [ ] Response time stable
- [ ] Database handles load

---

### Test 14: Data Integrity

**Verify:**
- [ ] No orphaned records
- [ ] All relationships valid
- [ ] No duplicate reports
- [ ] Historical data preserved
- [ ] Timestamps accurate
- [ ] User tracking complete

**Database Query:**
```javascript
db.reportcards.find({ classId: "xyz" }).count()
// Should match number visible in UI
```

---

### Test 15: Edge Cases

| Case | Expected | ✅ |
|------|----------|-----|
| Student with 1 test | Report card generates | [ ] |
| 100+ tests per subject | All listed | [ ] |
| Very long student name | Truncates with ellipsis | [ ] |
| Very long remarks | Textarea scrolls | [ ] |
| Special characters in name | Handled safely | [ ] |
| Zero scores | Report generates (F grade) | [ ] |
| All 100 scores | Report generates (A grade) | [ ] |

---

## 🔍 Regression Testing

**Areas to Check After Changes:**

- [ ] Student results still generate
- [ ] Existing reports accessible
- [ ] Print functionality works
- [ ] Remarks saved correctly
- [ ] Approval workflow functions
- [ ] List displays all reports
- [ ] Filtering works
- [ ] Delete functionality safe
- [ ] API responses consistent
- [ ] Error messages clear

---

## 📊 Test Report Template

```
DATE: __________
TESTER: __________
BUILD: __________

PASSED: ___ / ___
FAILED: ___ / ___
BLOCKED: ___ / ___

CRITICAL ISSUES:
1. ________________
2. ________________

MAJOR ISSUES:
1. ________________
2. ________________

MINOR ISSUES:
1. ________________
2. ________________

RECOMMENDATIONS:
1. ________________
2. ________________

SIGN-OFF: __________ DATE: __________
```

---

## ✅ Pre-Production Checklist

- [ ] All tests passed
- [ ] No critical issues
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Error handling complete
- [ ] Documentation updated
- [ ] Audit logging working
- [ ] Backup procedure ready
- [ ] Rollback plan prepared
- [ ] Team briefed
- [ ] Production config set
- [ ] Monitoring active

---

## 🚀 Deployment

**After all tests pass:**

1. [ ] Deploy backend
2. [ ] Deploy frontend
3. [ ] Run smoke tests
4. [ ] Monitor for errors
5. [ ] Notify users
6. [ ] Collect feedback
7. [ ] Monitor performance

---

**Testing Date:** __________  
**Tester Name:** __________  
**Status:** [ ] Ready for Production [ ] Needs Fixes

---

**END OF TESTING GUIDE**
