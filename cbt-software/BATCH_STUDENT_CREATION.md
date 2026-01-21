# Batch Student Creation Guide

The system supports bulk creation of students through CSV file upload. This is perfect for enrolling multiple students at once.

## How It Works

### 1. **Endpoint**
```
POST /api/enrollment/bulk-enroll
```

### 2. **Permissions**
- **Admin Only** - Only admins can upload bulk student files
- Authentication required (Bearer token)

### 3. **CSV File Format**

The CSV file should have the following columns:

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| `email` | ✅ Yes | Student email address | john.doe@school.com |
| `name` | ❌ Optional | Student full name (if not provided, uses email prefix) | John Doe |
| `className` | ✅ Yes* | Name of the class to enroll in | Mathematics 101 |
| `classId` | ✅ Yes* | MongoDB ID of class (alternative to className) | 507f1f77bcf86cd799439011 |

**Note:** Either `className` OR `classId` is required. If both are provided, `classId` takes precedence.

### 4. **CSV Example**

**Option A: Using class names**
```csv
email,name,className
alice@school.com,Alice Johnson,Mathematics 101
bob@school.com,Bob Smith,Mathematics 101
charlie@school.com,Charlie Brown,Physics 101
diana@school.com,Diana Prince,Chemistry 101
```

**Option B: Using class IDs**
```csv
email,name,classId
alice@school.com,Alice Johnson,507f1f77bcf86cd799439011
bob@school.com,Bob Smith,507f1f77bcf86cd799439012
charlie@school.com,Charlie Brown,507f1f77bcf86cd799439013
```

**Option C: Without names (will use email prefix)**
```csv
email,className
alice@school.com,Mathematics 101
bob@school.com,Mathematics 101
charlie@school.com,Physics 101
```

## Process Flow

### New Student Account Creation
When a student email **does not exist** in the system:
1. ✅ New User account created
2. ✅ Temporary password generated (12 random characters)
3. ✅ `mustChangePassword` flag set to `true`
4. ✅ Credentials email sent to student with:
   - Their email
   - Temporary password
   - Instructions to change password on first login
5. ✅ Student enrolled in the specified class

### Existing Student Account
When a student email **already exists** in the system:
1. ✅ Existing account used (no new account created)
2. ✅ No credentials email sent
3. ✅ Student enrolled in the specified class
4. ✅ Error if already enrolled in that class

## How to Upload via Frontend

### Using Admin Dashboard

1. **Login** as admin with email: `sobalajetomiwa@gmail.com`
2. **Navigate** to Admin Dashboard
3. **Find** the "Enrollment Management" section
4. **Select** "Bulk Enroll Students" tab
5. **Upload** your CSV file
6. **Review** results showing:
   - ✅ Successfully enrolled students
   - ❌ Failed enrollments with reasons

## How to Upload via API

### Using cURL
```bash
curl -X POST http://localhost:5000/api/enrollment/bulk-enroll \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "file=@students.csv"
```

### Using JavaScript/Node.js
```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

const formData = new FormData();
formData.append('file', fs.createReadStream('students.csv'));

const response = await axios.post(
  'http://localhost:5000/api/enrollment/bulk-enroll',
  formData,
  {
    headers: {
      ...formData.getHeaders(),
      'Authorization': `Bearer ${adminToken}`
    }
  }
);

console.log(response.data);
// Response:
// {
//   message: 'Bulk enrollment completed',
//   results: {
//     success: [
//       { email: 'alice@school.com', className: 'Mathematics 101', isNewStudent: true },
//       { email: 'bob@school.com', className: 'Mathematics 101', isNewStudent: false }
//     ],
//     failed: [
//       { row: {...}, error: 'Class not found' }
//     ]
//   }
// }
```

### Using Postman
1. **Method:** POST
2. **URL:** `http://localhost:5000/api/enrollment/bulk-enroll`
3. **Headers:** 
   - `Authorization: Bearer YOUR_ADMIN_TOKEN`
4. **Body:** Select `form-data`
   - Key: `file`
   - Value: Select your CSV file
5. **Send** and view results

## Response Format

### Success Response
```json
{
  "message": "Bulk enrollment completed",
  "results": {
    "success": [
      {
        "email": "alice@school.com",
        "className": "Mathematics 101",
        "isNewStudent": true
      },
      {
        "email": "bob@school.com",
        "className": "Mathematics 101",
        "isNewStudent": false
      }
    ],
    "failed": [
      {
        "row": {
          "email": "charlie@invalid.com",
          "name": "Charlie",
          "className": "Physics 201"
        },
        "error": "Class not found"
      }
    ]
  }
}
```

### Fields
- **`success`**: Array of successfully enrolled students
  - `email`: Student email
  - `className`: Class name they were enrolled in
  - `isNewStudent`: Whether account was newly created
- **`failed`**: Array of failed enrollments with error reasons

## Possible Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| CSV file is required | No file uploaded | Upload a CSV file |
| CSV file is empty | File has no rows | Add data rows to CSV |
| Email is required | Row missing email column | Add email column with values |
| Class not found | className/classId doesn't exist | Verify class names/IDs are correct |
| Student already enrolled in this class | Student already in class | Remove from CSV or use different class |
| School not found | Admin's school not found | Contact system admin |

## Important Notes

### Password Management
- **New students** receive temporary passwords via email
- **First login**: Students see password change modal
- **Must change password** before accessing full system
- Temporary passwords are 12 random characters (secure)

### Email Delivery
- Emails sent via Brevo (SendinBlue) in production
- Console log in development mode
- Check spam/junk folder if students don't receive emails

### Data Validation
- Email addresses are normalized to lowercase
- Duplicate rows in CSV are processed (may cause "already enrolled" errors)
- Names are optional (will use email prefix if not provided)

### Permissions & Audit
- ✅ Only admins can perform bulk enrollment
- ✅ All bulk enrollments are logged to audit trail
- ✅ Audit includes: success count, failure count, admin user, timestamp, IP

## Example Workflow

### Step 1: Prepare CSV
```csv
email,name,className
alice@school.com,Alice Johnson,Mathematics 101
bob@school.com,Bob Smith,Mathematics 101
charlie@school.com,Charlie Brown,Physics 101
diana@school.com,Diana Prince,Chemistry 101
```

### Step 2: Login as Admin
- Email: `sobalajetomiwa@gmail.com`
- Password: `Adetunji0914+` (change on first login)

### Step 3: Upload CSV
- Navigate to Admin Dashboard → Enrollment Management
- Select CSV file from Step 1
- Click Upload

### Step 4: Review Results
- See which students were successfully enrolled
- See which enrollments failed and why
- Students receive credentials email for new accounts

### Step 5: Student Login
- Students receive email with temporary password
- Login with email and temporary password
- Change password on first login (modal appears)
- Access their classes and tests

## Troubleshooting

### Students not receiving emails
1. Check if email domain is in Brevo whitelist
2. Check spam/junk folder
3. Verify Brevo API key is configured in backend
4. Check backend logs for email errors

### "Class not found" error
1. Verify class exists in Admin Dashboard
2. Check spelling of class name (case-sensitive)
3. Use class ID instead of name for accuracy
4. Ensure you're in correct school context

### Students can't login after enrollment
1. Check if account was created (isNewStudent: true in results)
2. Verify email address is correct
3. Check if account is missing schoolId (may need manual fix)
4. Verify admin account has schoolId set

### Bulk upload seems slow
1. System processes one student at a time
2. Email sending adds ~1 second per new student
3. Large CSV files (100+ rows) may take 2-3 minutes
4. This is normal - check response for all results

## Limits & Best Practices

### File Size
- Max recommended: 1000 rows per CSV
- Larger files may timeout after ~30 seconds

### Best Practices
✅ **Do:**
- Include name column for better user experience
- Use class ID if you have it (faster lookup)
- Remove duplicate emails from CSV
- Test with small CSV (5-10 rows) first

❌ **Don't:**
- Mix className and classId in same CSV
- Upload malformed CSV files
- Enroll same student in same class twice (will fail)
- Include spaces before/after email addresses

