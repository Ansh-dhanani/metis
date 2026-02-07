# Quick Deployment Steps - AI Interview Fix

## The Problem
❌ WebSockets don't work on Vercel
❌ Live interview stuck on "loading"
❌ Voice and transcription features broken

## The Solution: Deploy to Railway (15 min)

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub (recommended)

### Step 2: Deploy Backend
```bash
# Option A: Via Railway CLI
npm install -g @railway/cli
railway login
cd c:\Users\Ansh\Desktop\web\metis\backend
railway init
railway up

# Option B: Via Railway Dashboard (Easier)
# 1. Click "New Project" in Railway
# 2. Select "Deploy from GitHub repo"
# 3. Choose your metis repo
# 4. Set root directory to "backend"
# 5. Railway will auto-detect and deploy
```

### Step 3: Add Environment Variables in Railway
Click on your deployment → Variables tab → Add these:

```env
MONGO_URI=mongodb+srv://ladnil03:6837@cluster0.xl7pvjm.mongodb.net/?appName=Cluster0
GROQ_API_KEY=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
FLASK_ENV=production
FRONTEND_URL=https://metis-hire.vercel.app
PRODUCTION_FRONTEND_URL=https://metis-hire.vercel.app
PORT=5000
```

### Step 4: Get Your Railway URL
After deployment completes (~3 min), you'll get a URL like:
`https://metis-backend-production.up.railway.app`

### Step 5: Update Frontend Environment Variables
Edit `metis/frontend/.env.production`:

```env
NEXT_PUBLIC_API_URL=https://your-railway-url.railway.app
NEXT_PUBLIC_WS_URL=https://your-railway-url.railway.app
```

### Step 6: Redeploy Frontend on Vercel
```bash
cd c:\Users\Ansh\Desktop\web\metis\frontend
git add .
git commit -m "Update API URL to Railway"
git push
# Vercel will auto-deploy
```

## Alternative: Render (Also Free)

### Deploy to Render
1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repo
4. Root directory: `backend`
5. Build command: `pip install -r requirements.txt`
6. Start command: `gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:$PORT wsgi:app`
7. Add same environment variables
8. Deploy

## Testing After Deployment

Visit your frontend and test:
1. ✅ Login works
2. ✅ Resume upload works
3. ✅ Assessment completes
4. ✅ **Live interview starts** (no more infinite loading!)
5. ✅ AI asks questions
6. ✅ Voice recording works
7. ✅ Transcription appears
8. ✅ Interview completes with score

## Files I Just Created

1. ✅ `backend/Procfile` - Tells Railway how to start the app
2. ✅ `backend/runtime.txt` - Specifies Python version
3. ✅ `backend/railway.json` - Railway configuration
4. ✅ `requirements.txt` - Added `gunicorn` for production server

## Why This Works

- ✅ Railway/Render support persistent connections
- ✅ WebSockets work perfectly
- ✅ No timeout limits for long connections
- ✅ Better logging and monitoring
- ✅ Free tier available

## Cost
- **Railway**: Free tier (500 hours/month)
- **Render**: Free tier (750 hours/month)
- **Both**: Upgrade to $5-7/month for better reliability

## Need Help?
If you get stuck, share the error message and I'll help debug!
