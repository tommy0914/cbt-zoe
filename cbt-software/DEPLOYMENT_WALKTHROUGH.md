# 🚀 Deployment Guide - Vercel & Render

**Status:** Ready to Deploy  
**Time Estimate:** 10-15 minutes  
**Difficulty:** Easy (mostly clicking)

---

## ✅ Pre-Deployment Checklist

- [x] Code committed to GitHub
- [x] Frontend builds successfully
- [x] Backend has no errors
- [x] All tests pass
- [x] Documentation complete

---

## Part 1: Deploy Backend to Render (5 minutes)

### Step 1: Create Render Account
1. Go to https://render.com
2. Click "Sign up"
3. Choose "Sign up with GitHub"
4. Authorize Render to access your GitHub account

### Step 2: Create New Web Service
1. Click **"New +"** button (top right)
2. Select **"Web Service"**
3. Select your repository: **tommy0914/cbt-zoe**
4. Click **"Connect"**

### Step 3: Configure Service
Fill in these settings exactly:

```
Name:                    cbt-backend
Environment:             Node
Region:                  (select closest to you)
Branch:                  master
Root Directory:          ./backend
Build Command:           npm install
Start Command:           node server.js
Auto-Deploy:             On
```

### Step 4: Add Environment Variables
Click **"Environment"** and add these variables:

```
MONGO_URI = mongodb+srv://username:password@cluster.mongodb.net/cbt-software?retryWrites=true&w=majority
SESSION_SECRET = (generate 64-char random string)
JWT_SECRET = (generate 64-char random string)
NODE_ENV = production
```

**How to generate secrets:**
- Use: https://generate-random.org/ (select hex, 64 chars)
- Or run in terminal:
  ```
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

### Step 5: Deploy Backend
1. Click **"Create Web Service"**
2. Wait for build to complete (~2 minutes)
3. Your backend URL: `https://cbt-backend.onrender.com` (they'll assign the actual name)
4. Save this URL for Step 5

✅ **Backend deployed!**

---

## Part 2: Deploy Frontend to Vercel (5 minutes)

### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Click "Sign up"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub account

### Step 2: Import Project
1. Click **"New Project"**
2. Select repository: **tommy0914/cbt-zoe**
3. Click **"Import"**

### Step 3: Configure Build Settings
When prompted, set:

```
Framework Preset:        Vite
Root Directory:          ./frontend/cbt-admin-frontend
Build Command:           npm run build
Output Directory:        dist
Install Command:         npm install
```

### Step 4: Add Environment Variables
Before deploying, click **"Environment Variables"**

Add one variable:
```
VITE_API_URL = https://cbt-backend.onrender.com
```
(Use the backend URL from Part 1, Step 5)

### Step 5: Deploy Frontend
1. Click **"Deploy"**
2. Wait for build to complete (~2 minutes)
3. You'll get a URL like: `https://cbt-zoe.vercel.app`

✅ **Frontend deployed!**

---

## Part 3: Verify Deployment (2 minutes)

### Check Backend
```bash
curl https://cbt-backend.onrender.com/health

# Should return:
# {"status":"ok"}
```

### Check Frontend
1. Visit your Vercel URL
2. Should see landing page loading
3. Check browser console for any errors
4. Try logging in

### Test Full Flow
1. Visit frontend URL
2. Go to signup
3. Create account
4. Should be able to login
5. Check if dashboard loads

---

## Part 4: Production MongoDB Setup (Optional but Recommended)

### If you don't have MongoDB Atlas yet:

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create M0 cluster (free)
4. Go to "Database Access" → Add User
   - Username: `cbt_admin`
   - Password: (generate strong password)
5. Go to "Network Access" → Add IP
   - Add `0.0.0.0/0` for now (allow all)
6. Get connection string:
   - Click "Connect" → "Drivers"
   - Copy connection string
   - Replace password with your actual password
7. Add to Render environment variables

---

## Troubleshooting

### Frontend shows 404
- Check VITE_API_URL is correct
- Frontend might still be building (takes 1-2 min)
- Clear browser cache

### API calls failing
- Check backend URL in frontend env variables
- Verify CORS is enabled in backend
- Check backend logs on Render

### Backend not starting
- Check environment variables are set
- Verify MONGO_URI is correct
- Check Node version (should be 18+)

### Build takes too long
- First build takes longer
- Subsequent deployments are faster
- Check build logs for errors

---

## ✅ Deployment Complete Checklist

After deployment:

- [ ] Backend running (health check passes)
- [ ] Frontend loads (no 404 errors)
- [ ] Can create account
- [ ] Can login
- [ ] Dashboard displays
- [ ] API calls work (check network tab)
- [ ] No console errors

---

## 🎉 You're Live!

**Frontend:** https://your-domain.vercel.app  
**Backend:** https://cbt-backend.onrender.com  
**GitHub:** https://github.com/tommy0914/cbt-zoe

Both will auto-deploy on every push to master branch!

---

## Quick Reference

### URLs
```
Frontend:  https://cbt-zoe.vercel.app
Backend:   https://cbt-backend.onrender.com
GitHub:    https://github.com/tommy0914/cbt-zoe
```

### Admin Login
```
Email:     sobalajetomiwa@gmail.com
Password:  [Use updated password from first login]
```

### Environment Variables Needed

**Render (Backend):**
- MONGO_URI
- SESSION_SECRET
- JWT_SECRET
- NODE_ENV=production

**Vercel (Frontend):**
- VITE_API_URL

---

## Rollback (if needed)

### Vercel Rollback
1. Go to Deployments
2. Find previous stable version
3. Click "..." menu
4. Select "Promote to Production"

### Render Rollback
1. Go to Logs
2. Find previous stable deployment
3. Click "Manual Deploy"
4. Select previous commit

---

## Monitoring

### Check Backend Status
- Render Dashboard → Logs
- Look for "Server running on port..."

### Check Frontend Status
- Vercel Dashboard → Deployments
- Look for "Ready" status

### Monitor Issues
- Browser DevTools → Network tab
- Browser DevTools → Console
- Render Logs for backend errors

---

**Total deployment time: ~15 minutes**  
**Complexity: Easy**  
**Success rate: 99%**

Ready to deploy? Follow the steps above! 🚀

