# Railway Deployment Troubleshooting

## 🔍 Your Deployment Failed - Let's Fix It!

### Step 1: Check Error Logs

In Railway dashboard, click on your deployment → **Deploy Logs** tab

**Common Errors & Solutions:**

---

## ❌ Error: "No module named 'X'"

**Cause**: Missing Python package in requirements.txt

**Fix**:
```bash
cd c:\Users\Ansh\Desktop\web\metis\backend
pip freeze > requirements.txt
git add requirements.txt
git commit -m "Update requirements.txt"
git push
```

---

## ❌ Error: "Port 5000 already in use" or "Address already in use"

**Cause**: Hardcoded port instead of using Railway's $PORT

**Fix**: Already configured in wsgi.py to use `$PORT` environment variable

---

## ❌ Error: "Could not connect to MongoDB"

**Cause**: Missing or incorrect MONGO_URI

**Fix**:
1. Railway Dashboard → **Variables** tab
2. Add/Update:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/metis
   ```
3. Make sure MongoDB Atlas Network Access allows 0.0.0.0/0

---

## ❌ Error: "ModuleNotFoundError: No module named 'eventlet'"

**Cause**: Missing eventlet in requirements.txt

**Fix**: Check if `requirements.txt` includes:
```
eventlet>=0.33.3
flask-socketio>=5.3.6
```

---

## ❌ Error: "Application failed to respond"

**Cause**: App not binding to correct host/port

**Fix**: Already configured - gunicorn binds to 0.0.0.0:$PORT

---

## ❌ Error: "Build Command not found" or "nixpacks error"

**Cause**: Railway can't detect Python project or wrong root directory

**Fix**:
1. Railway Settings → **Root Directory** → Set to: `backend`
2. Or ensure `nixpacks.toml` is in backend directory

---

## 🛠️ Quick Fixes

### Fix 1: Verify Root Directory

1. Railway Dashboard → Service → **Settings**
2. **Source** section → **Root Directory** → Enter: `backend`
3. Click **Update**
4. **Redeploy**

### Fix 2: Set Start Command Manually

1. **Settings** → **Deploy** section
2. **Start Command** → Enter:
   ```
   gunicorn -k eventlet -w 1 --bind 0.0.0.0:$PORT --timeout 120 wsgi:app
   ```
3. **Custom Build Command** → Enter:
   ```
   pip install -r requirements.txt
   ```

### Fix 3: Check Environment Variables

Required variables in Railway:
```
MONGO_URI=mongodb+srv://...
GROQ_API_KEY=gsk_...
FLASK_ENV=production
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
FRONTEND_URL=https://your-frontend.vercel.app
PRODUCTION_FRONTEND_URL=https://your-frontend.vercel.app
```

### Fix 4: Rebuild from Scratch

```bash
cd c:\Users\Ansh\Desktop\web\metis

# Ensure all config files are present
git add backend/railway.json backend/nixpacks.toml backend/start.sh
git commit -m "Add Railway config files"
git push origin main
```

Then in Railway:
1. Delete current service
2. Create new service
3. Deploy from GitHub
4. Set Root Directory to `backend`
5. Add environment variables
6. Deploy

---

## 📋 Deployment Checklist

- [ ] Root Directory set to `backend`
- [ ] MONGO_URI environment variable added
- [ ] GROQ_API_KEY environment variable added
- [ ] SECRET_KEY and JWT_SECRET_KEY set
- [ ] requirements.txt includes all packages
- [ ] wsgi.py exists in backend folder
- [ ] MongoDB Atlas allows connections from Railway IP
- [ ] No hardcoded ports in code

---

## 🔬 Debug Commands

If you have Railway CLI installed:

```bash
# View logs
railway logs

# SSH into container
railway run bash

# Check environment
railway variables
```

---

## 💡 Alternative: Use Render Instead

If Railway continues to have issues, try Render:

1. Go to [render.com](https://render.com)
2. New Web Service
3. Connect GitHub → Select `metis` repo
4. Settings:
   - Name: `metis-backend`
   - Root Directory: `backend`
   - Runtime: **Docker**
   - Dockerfile Path: `Dockerfile`
5. Add same environment variables
6. Create Service

Render has better Docker support and clearer error messages.

---

## 🆘 Share Your Logs

To get specific help, share your error logs:

1. Railway → Your service → Deployments
2. Click failed deployment
3. Go to **Deploy Logs** tab
4. Copy the error message (usually near the end)
5. Share it here

---

**Most Common Issue**: Root Directory not set to `backend`

**Quick Test**: 
1. Set Root Directory to `backend`
2. Redeploy
3. Check if it works
