# 🗄️ MongoDB Atlas Setup (Free)

**Time:** 3 minutes  
**Cost:** Free (M0 cluster)  
**Difficulty:** Very Easy

---

## Step 1: Create MongoDB Account

1. Go to https://www.mongodb.com/cloud/atlas
2. Click **"Try Free"**
3. Fill in signup form:
   - Email: (your email)
   - Password: (strong password)
   - First/Last Name
4. Click **"Create account"**
5. Verify email address (check inbox)

---

## Step 2: Create a Free Cluster

1. After login, click **"Create Deployment"**
2. Select **"M0 FREE"** (at the bottom)
3. Keep these settings:
   - Provider: AWS
   - Region: **us-east-1** (or closest to you)
4. Click **"Create Deployment"**
5. Wait 1-2 minutes for cluster to create

---

## Step 3: Create Database User

1. Click **"Database Access"** (left sidebar)
2. Click **"Add New Database User"**
3. Set credentials:
   - **Username:** `cbt_admin`
   - **Password:** Generate one (use random, at least 12 chars)
   - **User Privileges:** Atlas admin
4. Click **"Add User"**
5. **Save these credentials!**

---

## Step 4: Allow Network Access

1. Click **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"**
4. Add `0.0.0.0/0`
5. Click **"Confirm"**

---

## Step 5: Get Connection String

1. Click **"Clusters"** (left sidebar)
2. Click **"Connect"** button
3. Select **"Drivers"**
4. Select **"Node.js"** from dropdown
5. Copy the connection string (looks like):
   ```
   mongodb+srv://cbt_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

---

## Step 6: Update Connection String

Replace `<password>` with your actual password from Step 3

**Example:**
```
BEFORE:
mongodb+srv://cbt_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority

AFTER:
mongodb+srv://cbt_admin:MySuper123SecurePass@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

---

## Step 7: Add Database Name (Optional)

You can specify which database to use by adding `/cbt-software` before the query string:

```
mongodb+srv://cbt_admin:password@cluster0.xxxxx.mongodb.net/cbt-software?retryWrites=true&w=majority
```

---

## ✅ You now have your MongoDB Connection String!

**Copy this and save it safely.** You'll need it for:
- Render environment variables
- Local `.env` file (if developing locally)

---

## 🔒 Security Notes

- Never commit `.env` files to GitHub
- Rotate password every 90 days
- Use strong passwords (20+ chars recommended)
- Consider IP whitelisting later (not needed for development)

---

## Troubleshooting

### "Connection refused"
- Wait 5 minutes after creating cluster
- Check username/password are exact
- Verify network access is set to `0.0.0.0/0`

### "Invalid connection string"
- Check for typos in password
- Ensure `@` and `:` are not URL-encoded
- Verify `<password>` was replaced with actual password

### "Authentication failed"
- Double-check username is `cbt_admin`
- Verify password matches exactly
- Try resetting database user password

---

## Next Steps

Once you have the connection string:

1. Go to [DEPLOYMENT_WALKTHROUGH.md](./DEPLOYMENT_WALKTHROUGH.md)
2. Use this connection string for Render environment variable `MONGO_URI`
3. Deploy backend to Render
4. Deploy frontend to Vercel

---

**Connection String Format:**
```
mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DATABASE?retryWrites=true&w=majority
```

**Your values:**
```
USERNAME: cbt_admin
PASSWORD: [from Step 3]
CLUSTER: [from Step 5]
DATABASE: cbt-software
```

✅ **Ready to deploy once you have this connection string!**

