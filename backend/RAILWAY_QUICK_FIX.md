# 🚀 Fix Railway MongoDB Connection - Quick Guide

Your backend is running on Railway but can't connect to MongoDB. Follow these steps:

## ⚡ Quick Fix (5 minutes)

### Step 1: Allow Railway IPs in MongoDB Atlas

1. Go to: https://cloud.mongodb.com/
2. Select your cluster
3. Click **"Network Access"** (left sidebar)
4. Click **"Add IP Address"** button
5. Select **"Allow Access from Anywhere"**
   - It will auto-fill: `0.0.0.0/0`
   - Description: `Railway deployment`
6. Click **"Confirm"**
7. Wait ~2 minutes for changes to apply

### Step 2: Verify MONGO_URI in Railway

1. Go to your Railway dashboard
2. Click your **backend service**
3. Click **"Variables"** tab
4. Check if `MONGO_URI` exists and is correct

**Should look like:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/metis_db?retryWrites=true&w=majority&tls=true&tlsAllowInvalidCertificates=false
```

**Common issues:**
- ❌ Missing database name: `...mongodb.net/?retry...` 
- ✅ Should have: `...mongodb.net/metis_db?retry...`

- ❌ Special characters in password not encoded
- ✅ Encode: `@` → `%40`, `:` → `%3A`

- ❌ Missing TLS: `...net/metis_db?retry...`
- ✅ Should have: `...metis_db?retryWrites=true&w=majority&tls=true`

### Step 3: Redeploy (if needed)

Railway auto-deploys when you change variables, but if not:

1. Go to **"Deployments"** tab
2. Click **"Deploy"** on latest deployment

### Step 4: Verify Connection

1. Open your Railway backend URL in browser
2. Should show:
```json
{
  "status": "ok",
  "message": "Metis API is running",
  "mongodb": "connected",
  "database": "metis_db",
  "environment": "production"
}
```

If still `"mongodb": "disconnected"`, check logs:
1. Railway → Your service → **"Deployments"**
2. Click latest deployment
3. Check for error messages

## 🔍 If Still Not Working

### Check Railway Logs

Look for these messages:

✅ **Success:**
```
✅ MongoDB connected successfully
📊 MongoDB database: metis_db
```

❌ **Timeout Error:**
```
❌ MongoDB connection error: ServerSelectionTimeoutError
💡 Tip: Add 0.0.0.0/0 to MongoDB Atlas Network Access allowlist
```
→ **Fix:** Complete Step 1 above

❌ **Auth Error:**
```
❌ MongoDB connection error: Authentication failed
💡 Tip: Check MongoDB username/password in URI
```
→ **Fix:** Check credentials in MongoDB Atlas → Database Access

❌ **SSL Error:**
```
❌ MongoDB connection error: SSL handshake failed
💡 Tip: Ensure URI has tls=true parameter
```
→ **Fix:** Add `tls=true` to your MONGO_URI

❌ **No URI Error:**
```
⚠️ WARNING: No MONGO_URI, MONGO_URL, or DATABASE_URL found
💡 Set MONGO_URI in Railway variables
```
→ **Fix:** Add MONGO_URI in Railway Variables tab

### Get Your MongoDB Connection String

If you don't have your MONGO_URI:

1. MongoDB Atlas → Clusters → **"Connect"**
2. Choose **"Connect your application"**
3. Driver: **Python**, Version: **3.11 or later**
4. Copy connection string
5. Replace `<password>` with your actual password
6. Add database name: `/metis_db` before the `?`
7. Ensure parameters: `?retryWrites=true&w=majority&tls=true&tlsAllowInvalidCertificates=false`

**Final format:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/metis_db?retryWrites=true&w=majority&tls=true&tlsAllowInvalidCertificates=false&appName=Cluster0
```

### Check MongoDB Atlas Database User

1. MongoDB Atlas → **Database Access**
2. Verify user exists with **"Read and write to any database"** role
3. Username must match the one in MONGO_URI
4. If password has special characters, URL-encode them

## 🎯 Success Indicators

After fixing, you should see:

✅ Railway URL responds with `"mongodb": "connected"`
✅ Railway logs show `✅ MongoDB connected successfully`
✅ Your frontend can authenticate users
✅ No timeout errors in logs

## 🆘 Still Need Help?

If after following all steps it still doesn't work:

1. **Paste your Railway logs** showing the error
2. **Check** the root endpoint response (paste the JSON)
3. **Verify** MongoDB Atlas Network Access shows `0.0.0.0/0`
4. **Try** Railway's MongoDB plugin instead (see full guide)

## 📚 Additional Resources

- Full guide: `RAILWAY_MONGODB_FIX.md`
- Environment setup: `.env.railway.example`
- Railway config: `railway.toml`

## 🔐 Security Note

Allowing `0.0.0.0/0` in MongoDB Atlas means any IP can attempt connection (but still needs username/password). For production, consider:

- **Railway Static IP** (if available as addon)
- **MongoDB Private Endpoint** (paid feature)
- **VPN/Proxy Service** with fixed IP

For now, it's safe to proceed with `0.0.0.0/0` since your database still requires authentication.
