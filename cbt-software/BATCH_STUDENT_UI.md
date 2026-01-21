# Batch Student Creation UI Guide

The Admin Dashboard includes a complete UI for bulk enrolling students with CSV files.

## Where to Find It

1. **Login** as admin: `sobalajetomiwa@gmail.com` / `Adetunji0914+`
2. **Navigate** to Admin Dashboard
3. **Scroll down** to find: **"Manage Student Enrollments"** button
4. **Click** to expand the Enrollment Management section

## UI Components

### 1. Bulk Enroll Students Section

#### File Upload
```
📤 Bulk Enroll Students
Upload CSV with columns: email, className (or classId)
[Choose File] → students.csv
[Upload & Enroll]
```

**Features:**
- ✅ Accepts `.csv`, `.xls`, `.xlsx` files
- ✅ File preview before upload
- ✅ Clear instructions on required columns
- ✅ Upload button shows "Processing..." during upload
- ✅ Disabled when loading to prevent multiple uploads

#### Upload Results
After uploading, you'll see:
- ✅ Count of successfully enrolled students (green text)
- ❌ Count of failed enrollments (red text if any failed)
- Example: `✓ 5 enrolled, 0 failed`

Failed enrollments are logged to browser console with details like:
```javascript
{
  row: { email: "charlie@school.com", name: "Charlie", className: "Physics 401" },
  error: "Class not found"
}
```

### 2. Pending Enrollment Requests Section

Shows all students waiting for enrollment approval.

#### Request Card Display
Each pending request shows:
```
┌─────────────────────────────────┐
│ John Doe (john@school.com)      │
│ Class: Mathematics 101          │
│ Requested: Jan 21, 2026 2:30 PM │
│ [Approve]  [Reject]             │
└─────────────────────────────────┘
```

#### Request Status Colors
- **Yellow border** (left): Indicates pending status
- **Yellow background**: Easy to spot in the list

#### Actions
- **[Approve]** - Green button, adds student to class
- **[Reject]** - Red button, removes request with optional reason

#### Empty State
If no requests pending:
```
⏳ Pending Enrollment Requests
No pending enrollment requests.
```

## Step-by-Step Usage

### Step 1: Prepare CSV File

Create a file named `students.csv`:
```
email,name,className
alice@school.com,Alice Johnson,Mathematics 101
bob@school.com,Bob Smith,Mathematics 101
charlie@school.com,Charlie Brown,Physics 101
```

### Step 2: Navigate to Admin Dashboard

1. Login with admin credentials
2. You'll see the Admin Dashboard page

### Step 3: Locate Enrollment Management

```
┌─ Admin Dashboard ────────────────────┐
│                                      │
│ [+ Create Class]                     │
│ [+ Create Question]                  │
│ [+ Create Test]                      │
│ ...                                  │
│ [Manage Student Enrollments]         │  ← Click here
│                                      │
└──────────────────────────────────────┘
```

### Step 4: Upload CSV

1. Click button to expand section
2. Click **"Choose File"**
3. Select your `students.csv`
4. Click **"Upload & Enroll"**

### Step 5: View Results

The system will show:
- **Success count**: Students enrolled (new + existing)
- **Failure count**: Enrollments that failed with reasons
- **Console**: Detailed error logs if any failed

### Step 6: Email Delivery (Automatic)

For each **new student** created:
- ✅ Temporary password generated
- ✅ Credentials email sent automatically
- ✅ Email includes:
  - Email address
  - Temporary password
  - Login instructions
  - Password change requirement

### Step 7: Student First Login

When student logs in with temporary credentials:
1. ✅ Password change modal appears
2. ✅ Must enter current password + new password
3. ✅ After change, normal dashboard loads

## UI Features

### Smart Feedback

✅ **During Processing:**
- Button text changes: `[Processing...]`
- Upload disabled to prevent duplicate uploads
- File input disabled

✅ **After Upload:**
- Clear success/failure count
- Green color for successes
- Red color if any failures
- Results persist until next upload

✅ **Error Handling:**
- File required error: "Please select a file"
- Network error: Shows error message
- Server error: Displays error from API
- Failed enrollments shown with reasons

### User-Friendly Design

- **Large file input**: Easy to click
- **Clear instructions**: Column names listed
- **File type info**: Accepts CSV/Excel formats
- **Action buttons**: Color-coded (green/red)
- **Status messages**: Real-time feedback
- **Responsive**: Works on desktop and tablet

## Common Workflows

### Workflow 1: Bulk Enroll New Students

1. Admin prepares CSV with new student emails
2. Upload CSV file
3. System creates accounts and sends credentials
4. Students receive login emails
5. Students login and change password
6. Students access classes

### Workflow 2: Enroll Existing Students

1. Admin uploads CSV with existing student emails
2. System finds existing accounts
3. Students added to classes (no new account/email)
4. Students immediately have access

### Workflow 3: Handle Requests

1. Student requests to join class (via JoinSchool page)
2. Request appears in **"Pending Enrollment Requests"** section
3. Admin reviews student and class info
4. Click **[Approve]** to add student
5. Student notified (in next version) and added to class

## Visual Layout

```
Admin Dashboard Page
│
├─ [Navigation Header]
│   ├─ Join School
│   ├─ Student Test
│   ├─ My Classes
│   ├─ Admin Dashboard (current)
│   └─ Logout
│
├─ [Quick Stats Section]
│
├─ [Create Options]
│   ├─ [+ Create Class]
│   ├─ [+ Create Question]
│   ├─ [+ Create Test]
│   └─ ...
│
├─ [Manage Student Enrollments] ← Toggle button
│   ├─ ┌─ 📤 Bulk Enroll Students ────────┐
│   │ │                                   │
│   │ │ Upload CSV with columns:          │
│   │ │ email, className (or classId)    │
│   │ │                                   │
│   │ │ [Choose File: students.csv]      │
│   │ │ [Upload & Enroll]                │
│   │ │                                   │
│   │ │ ✓ 3 enrolled, 0 failed           │
│   │ └─────────────────────────────────┘
│   │
│   └─ ┌─ ⏳ Pending Enrollment Requests ─┐
│     │                                   │
│     │ ┌─ John Doe (john@...)          │
│     │ │ Class: Math 101                │
│     │ │ [Approve] [Reject]             │
│     │ └─────────────────────────────────┤
│     │                                   │
│     │ ┌─ Jane Smith (jane@...)         │
│     │ │ Class: Physics 101             │
│     │ │ [Approve] [Reject]             │
│     │ └─────────────────────────────────┤
│     │                                   │
│     └─────────────────────────────────┘
│
└─ [Lazy-loaded Components]
   ├─ Questions Management
   ├─ User Search
   ├─ Grading Dashboard
   └─ ...
```

## Tips & Tricks

### Pro Tips

✅ **Always include name column** - Better user experience  
✅ **Use class IDs for speed** - Faster than class name lookup  
✅ **Test with 5 rows first** - Verify CSV format before bulk  
✅ **Keep file under 1000 rows** - Faster processing  
✅ **Remove duplicate emails** - Avoid "already enrolled" errors  

### Troubleshooting

❌ **Button disabled after upload?**
- Page is still processing, wait 2-3 seconds
- Reload page if stuck longer than 5 seconds

❌ **Can't select file?**
- Verify file is CSV/XLSX format
- Check file isn't corrupted
- Try different file

❌ **Upload shows errors?**
- Check CSV column names are exact: `email`, `className`
- Verify all class names exist
- Look at console for detailed error logs

❌ **No students enrolled?**
- Check results message for failure reasons
- All students failed = class names or IDs don't match
- Open browser console (F12) to see details

❌ **Enrollment requests not showing?**
- Refresh page (F5)
- Navigate away and back to Admin Dashboard
- Check if requests were already approved/rejected

## API Integration

The UI uses the following API endpoints:

### Bulk Enroll
```
POST /api/enrollment/bulk-enroll
Content-Type: multipart/form-data
Authorization: Bearer {token}

Body: FormData with 'file' field
```

### Get Enrollment Requests
```
GET /api/enrollment/requests
Authorization: Bearer {token}
```

### Approve Request
```
POST /api/enrollment/approve/{requestId}
Authorization: Bearer {token}
```

### Reject Request
```
POST /api/enrollment/reject/{requestId}
Authorization: Bearer {token}
Body: { reason: "optional reason" }
```

## Keyboard Shortcuts

- **F12** - Open browser console to see error logs
- **Ctrl+F5** - Hard refresh if UI looks broken
- **Ctrl+Shift+C** - Inspect element (helpful for debugging)

## Accessibility

✅ **Keyboard navigable** - Tab through buttons
✅ **Clear labels** - All inputs labeled
✅ **Color contrast** - Red/green buttons meet WCAG AA
✅ **Error messages** - Clear and actionable
✅ **Loading states** - Button text updates

