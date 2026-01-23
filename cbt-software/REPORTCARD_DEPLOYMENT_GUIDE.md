# 🚀 Report Card Feature - Deployment Guide

## Overview
Complete deployment instructions for the Subject-wise Report Card feature.

---

## 📋 Pre-Deployment Checklist

### Code Quality
- [ ] All linting warnings resolved
- [ ] No console errors
- [ ] No deprecated code
- [ ] Code reviewed by team
- [ ] Tests passed

### Backend
- [ ] `StudentResult.js` enhanced with SubjectPerformanceSchema
- [ ] `ReportCard.js` model created
- [ ] `reports.js` routes updated (6 new endpoints)
- [ ] API endpoints tested
- [ ] Error handling complete
- [ ] Audit logging implemented

### Frontend
- [ ] `ReportCard.jsx` component created
- [ ] `ReportCard.css` styling complete
- [ ] `StudentResults.jsx` integrated
- [ ] `StudentResults.css` updated
- [ ] Responsive design verified
- [ ] Print functionality working
- [ ] PDF export tested

### Database
- [ ] MongoDB connection verified
- [ ] Collections created
- [ ] Indexes created (optional)
- [ ] Backup taken
- [ ] Migration scripts ready (if needed)

### Configuration
- [ ] Environment variables set
- [ ] API endpoints configured
- [ ] Database URLs correct
- [ ] JWT secrets configured
- [ ] CORS settings updated

---

## 🔧 Deployment Steps

### Step 1: Backup Current System

```bash
# Backup database
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/cbt" \
  --out=./backup/$(date +%Y%m%d_%H%M%S)

# Backup application
tar -czf backup/app_$(date +%Y%m%d_%H%M%S).tar.gz ./backend ./frontend

# Backup important configs
cp .env .env.backup
cp package.json package.json.backup
```

**Verify Backups:**
- [ ] Database dump complete
- [ ] Files backed up
- [ ] Configs backed up
- [ ] Backup size verified
- [ ] Restore tested (on dev)

---

### Step 2: Deploy Backend

#### 2a. Update Models
```bash
# Copy updated model files
cp backend/models/StudentResult.js /prod/backend/models/
cp backend/models/ReportCard.js /prod/backend/models/

# Verify file permissions
chmod 644 /prod/backend/models/ReportCard.js
```

**Checklist:**
- [ ] StudentResult.js copied
- [ ] ReportCard.js copied
- [ ] File permissions correct
- [ ] No syntax errors

#### 2b. Update Routes
```bash
# Copy updated routes
cp backend/routes/reports.js /prod/backend/routes/

# Verify endpoints
curl http://localhost:3000/api/reports/health
```

**Checklist:**
- [ ] reports.js copied
- [ ] All 6 endpoints accessible
- [ ] Authentication working
- [ ] Endpoints return correct status

#### 2c. Update Dependencies (if needed)
```bash
cd /prod/backend
npm install
npm audit
```

**Checklist:**
- [ ] Dependencies installed
- [ ] No vulnerabilities
- [ ] Package-lock.json updated
- [ ] Correct versions

#### 2d. Restart Backend Service
```bash
# Stop current process
pm2 stop cbt-backend

# Start new process
pm2 start server.js --name cbt-backend

# Verify running
pm2 status
pm2 logs cbt-backend
```

**Checklist:**
- [ ] Process stopped gracefully
- [ ] Process started successfully
- [ ] No startup errors
- [ ] Logs show "Server running"
- [ ] Health check passes

---

### Step 3: Deploy Frontend

#### 3a. Copy Component Files
```bash
# Copy new components
cp frontend/src/components/ReportCard.jsx \
   /prod/frontend/src/components/

# Copy updated components
cp frontend/src/components/StudentResults.jsx \
   /prod/frontend/src/components/
```

**Checklist:**
- [ ] ReportCard.jsx copied
- [ ] StudentResults.jsx copied
- [ ] File permissions correct

#### 3b. Copy Stylesheet Files
```bash
# Copy new styles
cp frontend/src/styles/ReportCard.css \
   /prod/frontend/src/styles/

# Copy updated styles
cp frontend/src/styles/StudentResults.css \
   /prod/frontend/src/styles/
```

**Checklist:**
- [ ] ReportCard.css copied
- [ ] StudentResults.css copied
- [ ] CSS syntax valid

#### 3c. Build Frontend
```bash
cd /prod/frontend/cbt-admin-frontend

# Install dependencies
npm install

# Build for production
npm run build

# Verify build
ls -la dist/
```

**Checklist:**
- [ ] Dependencies installed
- [ ] Build successful
- [ ] dist/ folder created
- [ ] Bundle size reasonable
- [ ] No build warnings

#### 3d. Deploy to Server
```bash
# Copy built files to web server
cp -r dist/* /var/www/html/cbt-frontend/

# Set proper permissions
chmod -R 755 /var/www/html/cbt-frontend/

# Clear browser cache (optional)
# Usually done on client side
```

**Checklist:**
- [ ] Files copied
- [ ] Permissions set
- [ ] Web server configured
- [ ] SSL working (if applicable)

#### 3e. Verify Frontend
```bash
# Check if accessible
curl https://yourdomain.com/cbt-frontend/

# Check for console errors (manual verification)
# Open DevTools → Console tab
```

**Checklist:**
- [ ] Frontend loads
- [ ] No 404 errors
- [ ] Assets loading
- [ ] API calls working

---

### Step 4: Database Migration (if needed)

#### 4a. Create Collections (if not exist)
```bash
# Connect to MongoDB
mongosh mongodb+srv://user:pass@cluster.mongodb.net/cbt

# Create ReportCard collection
db.createCollection("reportcards")

# Create index for faster queries
db.reportcards.createIndex({ classId: 1 })
db.reportcards.createIndex({ studentId: 1 })
db.reportcards.createIndex({ createdAt: -1 })

# Verify indexes
db.reportcards.getIndexes()
```

**Checklist:**
- [ ] Collection created
- [ ] Indexes created
- [ ] Query performance verified

#### 4b. Migrate Existing Data (if applicable)
```bash
# Run migration script (if created)
node scripts/migrate-reportcards.js

# Verify migration
db.reportcards.count()
db.studentresults.count()
```

**Checklist:**
- [ ] Migration completed
- [ ] Data counts verified
- [ ] No data loss
- [ ] Relationships intact

---

### Step 5: Configuration Update

#### 5a. Environment Variables
```bash
# Update .env file
nano /prod/.env

# Add/verify these variables
API_URL=https://yourdomain.com/api
FRONTEND_URL=https://yourdomain.com
MONGO_URI=mongodb+srv://user:pass@cluster/cbt
JWT_SECRET=your-secret-key
REPORT_CARD_EXPIRY=2592000  # 30 days
```

**Checklist:**
- [ ] All variables set
- [ ] No hardcoded values
- [ ] Secrets stored securely
- [ ] URLs correct

#### 5b. CORS Settings
```javascript
// In backend/server.js
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**Checklist:**
- [ ] CORS configured
- [ ] Frontend origin whitelisted
- [ ] Preflight requests handled

#### 5c. API Rate Limiting
```javascript
// Optional: Add rate limiting for new endpoints
const rateLimit = require('express-rate-limit');

const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  message: 'Too many requests, try again later'
});

app.use('/api/reports', reportLimiter);
```

**Checklist:**
- [ ] Rate limiting configured
- [ ] Limits reasonable
- [ ] Error messages set

---

### Step 6: Testing in Production

#### 6a. Smoke Tests
```bash
# Test basic connectivity
curl -X GET http://api.yourdomain.com/api/health

# Test authentication
curl -X POST http://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@test.com","password":"password"}'

# Test report generation
curl -X POST http://api.yourdomain.com/api/reports/generate-report-card/[ID]/[CLASS_ID] \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json"
```

**Checklist:**
- [ ] API responds
- [ ] Authentication works
- [ ] Report generation works
- [ ] Response codes correct

#### 6b. User Acceptance Testing
```
1. Login as teacher
   [ ] Successfully authenticated
   [ ] Dashboard loads

2. Generate report card
   [ ] Can select student
   [ ] Button appears
   [ ] Generation works
   [ ] No errors

3. View report card
   [ ] All sections visible
   [ ] Data accurate
   [ ] Formatting correct

4. Add remarks
   [ ] Textarea works
   [ ] Save button functional
   [ ] Changes persist

5. Print/Export
   [ ] Print dialog opens
   [ ] PDF downloads
   [ ] File readable

6. Approve/Publish
   [ ] Checkboxes work
   [ ] Status updates
   [ ] Audit logged
```

**Checklist:**
- [ ] All UAT steps pass
- [ ] No critical issues
- [ ] Performance acceptable
- [ ] Users satisfied

#### 6c. Performance Testing
```bash
# Load test the report generation endpoint
ab -n 100 -c 10 \
  -H "Authorization: Bearer [TOKEN]" \
  http://api.yourdomain.com/api/reports/report-cards/[CLASS_ID]

# Monitor response times
- p50 < 500ms
- p95 < 1000ms
- p99 < 2000ms
- Error rate < 0.1%
```

**Checklist:**
- [ ] Response times acceptable
- [ ] No timeouts
- [ ] Server handles load
- [ ] Database performs well

---

### Step 7: Monitoring & Logging

#### 7a. Set Up Monitoring
```bash
# Monitor application logs
tail -f /var/log/cbt-backend.log | grep -E "ERROR|WARN"

# Monitor database
mongosh
db.currentOp()  # Check active operations
db.stat()       # Check storage

# Monitor server resources
top
ps aux | grep node
```

**Checklist:**
- [ ] Logs configured
- [ ] Log rotation set
- [ ] Alerts configured
- [ ] Dashboard visible

#### 7b. Audit Logging Verification
```javascript
// Verify audit logs for report card actions
db.audits.find({
  action: { $in: ['REPORT_CARD_GENERATED', 'REPORT_CARD_APPROVED'] }
}).limit(10)
```

**Checklist:**
- [ ] Actions logged
- [ ] Timestamps recorded
- [ ] User tracking works
- [ ] Details captured

#### 7c. Error Tracking
```bash
# Set up error tracking (e.g., Sentry)
# - Install error reporting SDK
# - Configure endpoint
# - Test error capture

# Verify in logs
grep "REPORT_CARD_ERROR" /var/log/cbt-backend.log
```

**Checklist:**
- [ ] Error tracking active
- [ ] Sample error logged
- [ ] Notifications working
- [ ] Dashboard accessible

---

## 🔍 Post-Deployment Verification

### Immediate (First 1 hour)

```
[ ] Backend responding
[ ] Frontend loads
[ ] No console errors
[ ] API endpoints accessible
[ ] Database connected
[ ] Authentication working
[ ] Basic report generation works
```

### Short-term (First 24 hours)

```
[ ] No critical errors
[ ] Performance metrics normal
[ ] User feedback positive
[ ] Audit logs complete
[ ] All features functioning
[ ] Print/export working
[ ] Mobile responsive
```

### Long-term (First week)

```
[ ] Stability verified
[ ] Performance consistent
[ ] No memory leaks
[ ] Data integrity confirmed
[ ] User adoption good
[ ] Support tickets minimal
[ ] System behaving as expected
```

---

## 🚨 Rollback Plan

### If Critical Issues Found

#### Step 1: Stop Current Deployment
```bash
# Stop processes
pm2 stop cbt-backend
pm2 stop cbt-frontend

# Prevent auto-restart
pm2 save
```

#### Step 2: Restore from Backup
```bash
# Restore database
mongorestore --uri="mongodb+srv://user:pass@cluster/cbt" \
  ./backup/[DATE]

# Restore application
cd /prod
tar -xzf backup/app_[DATE].tar.gz

# Restore config
cp .env.backup .env
```

#### Step 3: Restart Services
```bash
# Restart backend
pm2 start server.js --name cbt-backend

# Restart frontend
cd frontend/cbt-admin-frontend
npm run dev  # or appropriate start command
```

#### Step 4: Verify Rollback
```bash
# Test basic functionality
curl http://api.yourdomain.com/api/health

# Check logs
pm2 logs cbt-backend

# User verification
# - Login as teacher
# - Check if old version working
- No report card feature visible (should be reverted)
```

**Rollback Checklist:**
- [ ] Processes stopped
- [ ] Backup restored
- [ ] Services restarted
- [ ] Functionality verified
- [ ] Team notified

---

## 📞 Post-Deployment Support

### Issue Resolution Process

**1. Issue Reported**
- [ ] Gather details
- [ ] Reproduce issue
- [ ] Log in system

**2. Triage**
- [ ] Severity: Critical/High/Medium/Low
- [ ] Scope: UI/API/Database
- [ ] Impact: How many users

**3. Investigation**
- [ ] Check logs
- [ ] Check database
- [ ] Check API responses
- [ ] Reproduce on dev

**4. Fix**
- [ ] Code fix
- [ ] Test fix
- [ ] Deploy fix

**5. Verification**
- [ ] Issue resolved
- [ ] No regressions
- [ ] User satisfied
- [ ] Document solution

---

## 📊 Deployment Report Template

```
DEPLOYMENT REPORT
=================

Date: __________
Deployed By: __________
Duration: __________

VERSION:
- Backend: v1.0
- Frontend: v1.0
- Database: Schema v1.0

FILES DEPLOYED:
- backend/models/ReportCard.js
- backend/routes/reports.js (updated)
- frontend/src/components/ReportCard.jsx
- frontend/src/styles/ReportCard.css
- [other files]

TESTING RESULTS:
- Unit Tests: PASSED
- Integration Tests: PASSED
- UAT: PASSED
- Performance: ACCEPTABLE

ISSUES FOUND:
- None

ROLLBACK STATUS:
- Not required

MONITORING STATUS:
- Active
- No alerts

SIGN-OFF:
- Backend Team: __________ 
- Frontend Team: __________ 
- QA Team: __________
- Deployment Team: __________

NEXT STEPS:
1. Monitor for 24 hours
2. Collect user feedback
3. Weekly performance review
4. Plan Phase 2 features
```

---

## ✅ Feature Activation Checklist

After deployment, verify:

- [ ] Report Card tab visible in StudentResults
- [ ] Generate button functional
- [ ] Report cards displaying correctly
- [ ] Grades calculated accurately
- [ ] Print/Export working
- [ ] Remarks editor functional
- [ ] Approval workflow operational
- [ ] Audit logging complete
- [ ] Performance acceptable
- [ ] No user complaints

---

## 🎯 Success Criteria

Deployment considered successful when:

✅ All components deployed without errors  
✅ All tests pass  
✅ Performance metrics acceptable  
✅ No critical issues  
✅ Users can generate report cards  
✅ Report cards display correctly  
✅ Print/export functionality works  
✅ Audit logs complete  
✅ Team confident in stability  
✅ Ready for production use  

---

## 📞 Support Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Backend Lead | ______ | ______ | ______ |
| Frontend Lead | ______ | ______ | ______ |
| DevOps Lead | ______ | ______ | ______ |
| Database Admin | ______ | ______ | ______ |

---

**Deployment Date:** __________  
**Deployed By:** __________  
**Status:** [ ] Successful [ ] With Issues [ ] Rolled Back  

---

**END OF DEPLOYMENT GUIDE**
