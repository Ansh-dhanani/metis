# Railway Deployment - MongoDB Connection Fix

## Problem
Your backend is running on Railway but showing:
```json
{"message":"Metis API is running","mongodb":"disconnected","status":"ok"}
```

## Root Cause
Railway servers cannot connect to MongoDB Atlas. This is typically due to:
1. **IP Allowlist** - Railway IPs not allowlisted in MongoDB Atlas
2. **Environment Variables** - MONGO_URI not set correctly in Railway
3. **Connection Settings** - Network/firewall issues

## Solution Steps

### Step 1: Fix MongoDB Atlas IP Allowlist

Railway uses dynamic IPs, so you need to allow all IPs:

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Select your cluster
3. Click **"Network Access"** in sidebar
4. Click **"Add IP Address"**
5. Choose **"Allow Access from Anywhere"**
   - IP: `0.0.0.0/0`
   - Description: `Railway deployment`
6. Click **"Confirm"**

⚠️ **Important:** This allows all IPs. For production, you can:
- Use MongoDB's Private Endpoint (paid feature)
- Use Railway's static IP addon (if available)
- Use a VPN/proxy service

### Step 2: Verify Environment Variables in Railway

1. Go to your Railway project
2. Click on your backend service
3. Go to **"Variables"** tab
4. Ensure `MONGO_URI` is set correctly:

```
MONGO_URI=mongodb+srv://username:password@cluster0.lmu9mbh.mongodb.net/metis_db?retryWrites=true&w=majority&tls=true&tlsAllowInvalidCertificates=false&appName=Cluster0
```

**Key parameters:**
- Database name: `/metis_db`
- TLS enabled: `tls=true`
- Certificate validation: `tlsAllowInvalidCertificates=false`
- Retry writes: `retryWrites=true`

### Step 3: Update Railway Environment Variables

Add these variables in Railway:

```bash
# Required
MONGO_URI=<your-mongodb-uri-with-tls>
JWT_SECRET=<your-jwt-secret>
FLASK_ENV=production

# Optional
PORT=5000
FRONTEND_URL=https://your-frontend.vercel.app
PRODUCTION_FRONTEND_URL=https://your-frontend.vercel.app
```

### Step 4: Verify MongoDB URI Format

Your MongoDB URI should look like this:

```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?<options>
```

**Common Issues:**
- ❌ Missing database name: `...mongodb.net/?retry...`
- ✅ Correct: `...mongodb.net/metis_db?retry...`

- ❌ Special characters in password not URL-encoded
- ✅ Use URL encoding: `@` → `%40`, `:` → `%3A`, etc.

- ❌ Missing TLS parameters
- ✅ Include: `tls=true&tlsAllowInvalidCertificates=false`

### Step 5: Test the Connection

After making changes:

1. Railway will auto-redeploy
2. Wait ~1-2 minutes for deployment
3. Check your Railway URL in browser
4. Should see:
```json
{
  "status": "ok",
  "message": "Metis API is running",
  "mongodb": "connected"
}
```

### Step 6: Check Railway Logs

If still not working:

1. Go to Railway project
2. Click on backend service
3. Click **"Deployments"** tab
4. Click latest deployment
5. Check logs for errors

**Look for:**
- ✅ `MongoDB connected successfully`
- ❌ `ServerSelectionTimeoutError`
- ❌ `Authentication failed`
- ❌ `SSL handshake failed`

## Alternative: Use Railway MongoDB Plugin

Instead of MongoDB Atlas, you can use Railway's built-in MongoDB:

1. In Railway dashboard, click **"New"**
2. Select **"Database"** → **"Add MongoDB"**
3. Railway will automatically set `MONGO_URL` variable
4. Update your `app.py` to check for `MONGO_URL` too:

```python
MONGO_URI = os.getenv("MONGO_URI", os.getenv("MONGO_URL", os.getenv("DATABASE_URL")))
```

This gives you a MongoDB instance directly in Railway (no IP allowlist issues).

## Quick Fix for Temporary Testing

If you just want to test quickly:

### Option A: Allow All IPs (Already mentioned above)
In MongoDB Atlas → Network Access → `0.0.0.0/0`

### Option B: Use Connection String Without TLS (Not Recommended)
```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/metis_db?retryWrites=true&w=majority&tls=false
```

⚠️ **Not secure for production!**

## Verification Checklist

- [ ] MongoDB Atlas → Network Access shows `0.0.0.0/0`
- [ ] Railway Variables has correct `MONGO_URI` with database name
- [ ] MONGO_URI includes `tls=true`
- [ ] Password in URI is URL-encoded if it has special chars
- [ ] JWT_SECRET is set in Railway
- [ ] Railway deployment finished successfully
- [ ] Railway logs show `✅ MongoDB connected successfully`
- [ ] Railway URL shows `"mongodb": "connected"`

## Debugging Commands

### Test MongoDB Connection from Local Machine
```bash
cd backend
python -c "from pymongo import MongoClient; client = MongoClient('YOUR_MONGO_URI', serverSelectionTimeoutMS=5000); client.admin.command('ping'); print('Connected!')"
```

### Check Environment Variables in Railway
Railway CLI:
```bash
railway run env
```

### View Real-time Logs
```bash
railway logs
```

## Common Error Messages & Solutions

### Error: `ServerSelectionTimeoutError`
**Cause:** Railway can't reach MongoDB
**Solution:** Add `0.0.0.0/0` to MongoDB Atlas allowlist

### Error: `Authentication failed`
**Cause:** Wrong username/password
**Solution:** Check credentials in MongoDB Atlas → Database Access

### Error: `SSL handshake failed`
**Cause:** TLS configuration mismatch
**Solution:** Ensure URI has `tls=true` parameter

### Error: `No MONGO_URI found`
**Cause:** Environment variable not set in Railway
**Solution:** Add MONGO_URI in Railway Variables tab

### Error: `Failed to parse MongoDB URI`
**Cause:** Invalid URI format or unencoded special characters
**Solution:** URL-encode password, check URI format

## Production Best Practices

Once working, secure your setup:

1. **Restrict IP Access:**
   - Use Railway static IP (if available)
   - Or use MongoDB Private Link (paid)

2. **Use Secrets:**
   - Store MONGO_URI as Railway secret
   - Don't commit `.env` file

3. **Enable Monitoring:**
   - MongoDB Atlas Monitoring
   - Railway deployment notifications

4. **Set Connection Limits:**
   - MongoDB Atlas → Cluster → Configuration → Connection Limits
   - Prevent connection pool exhaustion

5. **Use Read Replicas:**
   - For better performance
   - MongoDB Atlas → Clusters → Add Read Replica

## Need More Help?

If still not working after following this guide:

1. Check Railway deployment logs (copy full error)
2. Check MongoDB Atlas logs (Clusters → Metrics → Logs)
3. Try Railway's MongoDB plugin as alternative
4. Verify network connectivity: `curl https://cloud.mongodb.com`

## Expected Final State

✅ Railway deployment logs show:
```
✅ MongoDB connected successfully
MongoDB database: metis_db
* Running on http://0.0.0.0:5000
```

✅ Railway URL response:
```json
{
  "status": "ok",
  "message": "Metis API is running",
  "mongodb": "connected"
}
```

✅ Frontend can connect and authenticate users successfully
