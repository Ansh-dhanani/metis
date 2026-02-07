# Railway Deployment Configuration

## Issue: "Script start.sh not found"

Railway couldn't detect your app because it's looking at the **root directory** which contains multiple folders (backend, frontend, model).

## ✅ Solution

### Option 1: Deploy Backend Only (Recommended)

When creating the Railway service:

1. **In Railway Dashboard** → New Project → Deploy from GitHub
2. **After selecting repository**, click **"Settings"**
3. **Root Directory** → Enter: `backend`
4. **Build Command** → Enter: `pip install -r requirements.txt`
5. **Start Command** → Enter: `gunicorn -k eventlet -w 1 --bind 0.0.0.0:$PORT --timeout 120 wsgi:app`
6. Deploy!

### Option 2: Use Configuration Files (Already Added)

I've created these files in the backend directory:
- `railway.json` - Railway-specific config
- `nixpacks.toml` - Nixpacks build config  
- `start.sh` - Startup script

**Make the script executable:**
```bash
cd backend
chmod +x start.sh
git add .
git commit -m "Add Railway deployment configs"
git push
```

Then redeploy on Railway.

---

## 🚀 Quick Deploy Steps

### Step 1: Push Configuration Files

```bash
cd c:\Users\Ansh\Desktop\web\metis
git add backend/railway.json backend/nixpacks.toml backend/start.sh
git commit -m "Add Railway deployment configuration"
git push origin main
```

### Step 2: Configure Railway Service

1. Go to your Railway project
2. Click on the service → **Settings** tab
3. **Source** section:
   - Root Directory: `backend`
   - Branch: `main`
4. **Build** section:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn -k eventlet -w 1 --bind 0.0.0.0:$PORT --timeout 120 wsgi:app`
5. **Deploy** section:
   - Click **"Redeploy"**

### Step 3: Set Environment Variables

In Railway → Variables tab, add:
```
MONGO_URI=your-mongodb-connection-string
GROQ_API_KEY=your-groq-api-key
FLASK_ENV=production
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
FRONTEND_URL=https://your-vercel-app.vercel.app
PRODUCTION_FRONTEND_URL=https://your-vercel-app.vercel.app
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=60
LOG_LEVEL=INFO
```

### Step 4: Verify Deployment

Once deployed, Railway will give you a URL like:
`https://metis-backend-production.up.railway.app`

Test it:
```bash
curl https://your-railway-url.up.railway.app/
# Should return: "Hello, World! MongoDB is connected..."
```

---

## 🐛 Troubleshooting

### "Could not determine how to build"
**Fix**: Set **Root Directory** to `backend` in Railway settings

### "Module not found: eventlet"
**Fix**: Ensure `requirements.txt` includes `eventlet>=0.33.3`

### "Permission denied: start.sh"
**Fix**: 
```bash
chmod +x backend/start.sh
git add backend/start.sh
git commit -m "Make start.sh executable"
git push
```

### Build succeeds but app crashes on start
**Fix**: Check Railway logs for the actual error. Common issues:
- Missing environment variables
- MongoDB connection failed (check MONGO_URI)
- Port binding (Railway sets $PORT automatically)

---

## 📊 Expected Build Output

```
[nixpacks] Detected Python project
[nixpacks] Installing Python 3.11
[nixpacks] Running: pip install -r requirements.txt
[nixpacks] Successfully installed packages
[nixpacks] Starting: gunicorn -k eventlet...
[app] Starting METIS Backend...
[app] 🚀 Production server starting on port 5000
```

---

## ✅ Verification Checklist

- [ ] Pushed railway.json, nixpacks.toml, start.sh to GitHub
- [ ] Set Root Directory to `backend` in Railway settings
- [ ] Added all environment variables
- [ ] Build completed successfully
- [ ] Service is running (green status)
- [ ] Can access the health endpoint
- [ ] No errors in Railway logs

---

**Next**: Once backend is deployed, update your Vercel frontend environment variables with the Railway URL!
