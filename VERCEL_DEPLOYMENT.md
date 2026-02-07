# Vercel Deployment Guide for METIS

## 🚀 Architecture Overview

**Frontend**: Vercel (Next.js - Perfect fit!)  
**Backend**: Railway/Render (Flask + WebSocket - Needs persistent server)

> ⚠️ **Important**: Vercel serverless functions don't support WebSocket connections needed for live interviews. Deploy backend on Railway or Render instead.

---

## 📦 Part 1: Deploy Backend (Railway)

### Option A: Railway (Recommended)

1. **Sign up**: https://railway.app
2. **New Project** → **Deploy from GitHub repo**
3. **Select** `metis` repository
4. **Root Directory**: Set to `backend`
5. **Add Environment Variables**:
   ```
   MONGO_URI=mongodb+srv://your-connection-string
   GROQ_API_KEY=your-groq-api-key
   FLASK_ENV=production
   SECRET_KEY=generate-strong-random-key
   JWT_SECRET_KEY=generate-strong-random-key
   FRONTEND_URL=https://your-vercel-app.vercel.app
   PRODUCTION_FRONTEND_URL=https://your-vercel-app.vercel.app
   RATE_LIMIT_ENABLED=true
   RATE_LIMIT_PER_MINUTE=60
   LOG_LEVEL=INFO
   ```

6. **Deploy Settings**:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn -k eventlet -w 1 --bind 0.0.0.0:$PORT --timeout 120 wsgi:app`
   - Port: Railway will auto-assign

7. **Deploy** and copy your Railway URL (e.g., `https://metis-backend.up.railway.app`)

### Option B: Render

1. **Sign up**: https://render.com
2. **New Web Service** → Connect GitHub repo
3. **Configure**:
   - Root Directory: `backend`
   - Environment: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn -k eventlet -w 1 --bind 0.0.0.0:$PORT --timeout 120 wsgi:app`
4. **Add Environment Variables** (same as Railway above)
5. **Create Web Service** and copy URL

---

## 🎨 Part 2: Deploy Frontend (Vercel)

### Step 1: Prepare Repository

Make sure your code is pushed to GitHub:
```bash
cd c:\Users\Ansh\Desktop\web\metis
git add .
git commit -m "Production deployment ready"
git push origin main
```

### Step 2: Deploy to Vercel

1. **Sign up/Login**: https://vercel.com
2. **Import Project** → Select your GitHub repository
3. **Configure Project**:
   - Framework Preset: **Next.js**
   - Root Directory: **frontend**
   - Build Command: `bun run build` (or leave default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install -g bun && bun install`

4. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-backend-url.up.railway.app
   NEXT_PUBLIC_WS_URL=https://your-railway-backend-url.up.railway.app
   NODE_ENV=production
   ```

5. **Deploy!**

### Step 3: Update Backend with Frontend URL

After Vercel deploys and gives you a URL (e.g., `https://metis-ai.vercel.app`):

1. Go back to **Railway/Render**
2. Update environment variables:
   ```
   FRONTEND_URL=https://metis-ai.vercel.app
   PRODUCTION_FRONTEND_URL=https://metis-ai.vercel.app
   ```
3. **Redeploy backend**

---

## 🔧 Configuration Files

### ✅ Already Created:
- `frontend/vercel.json` - Vercel configuration
- `frontend/next.config.ts` - Next.js standalone output
- `frontend/.env.production` - Production environment template
- `backend/Procfile` - Works for Railway/Render
- `backend/wsgi.py` - Production WSGI entry point

---

## 🧪 Testing Deployment

### 1. Test Backend
```bash
curl https://your-backend-url.up.railway.app/
# Should return: "Hello, World! MongoDB is connected..."
```

### 2. Test Frontend
Visit your Vercel URL: `https://metis-ai.vercel.app`

### 3. Test Full Flow
1. Register as candidate
2. Upload resume → Auto-parse ✅
3. Submit application → Auto-evaluate ✅
4. Start AI interview → WebSocket connection ✅
5. Complete interview → Auto-evaluate ✅
6. View results → Final score ✅

---

## 🐛 Troubleshooting

### Frontend can't connect to backend
**Issue**: CORS errors in browser console  
**Fix**: 
1. Verify `NEXT_PUBLIC_API_URL` in Vercel env vars
2. Verify `FRONTEND_URL` in Railway env vars
3. Check backend logs for CORS config

### WebSocket connection fails
**Issue**: Interview page can't connect  
**Fix**:
1. Ensure backend deployed on Railway/Render (not Vercel)
2. Verify `NEXT_PUBLIC_WS_URL` matches backend URL
3. Check backend supports eventlet: `pip list | grep eventlet`

### Build fails on Vercel
**Issue**: TypeScript errors  
**Fix**: Already configured to ignore during builds in `next.config.ts`

### Backend crashes on startup
**Issue**: Missing environment variables  
**Fix**: Check all required vars are set in Railway/Render

---

## 📊 Monitoring

### Railway/Render
- View logs in platform dashboard
- Check `/logs/metis.log` for detailed application logs
- Monitor CPU/Memory usage

### Vercel
- Analytics tab shows performance metrics
- Logs tab shows function execution logs
- Integrations for monitoring (Sentry, etc.)

---

## 💰 Cost Estimate

**Free Tier**:
- Vercel: Free for hobby projects
- Railway: $5 credit/month (enough for small projects)
- Render: Free tier available (sleeps after inactivity)
- MongoDB Atlas: Free tier (512MB)

**Paid (Recommended for Production)**:
- Vercel Pro: $20/month
- Railway: ~$10-20/month (usage-based)
- Render: $7/month (always-on)
- MongoDB Atlas: $9/month (shared cluster)

---

## 🎯 Quick Commands

```bash
# Deploy frontend to Vercel
cd frontend
vercel --prod

# Check backend logs (Railway CLI)
railway logs

# Local test with production env
FLASK_ENV=production python backend/app.py
NODE_ENV=production bun run build && bun run start
```

---

## ✅ Pre-Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Groq API key obtained
- [ ] All environment variables documented
- [ ] Backend deployed to Railway/Render
- [ ] Backend URL added to frontend env vars
- [ ] Frontend deployed to Vercel
- [ ] Frontend URL added to backend CORS
- [ ] Complete user flow tested
- [ ] Error monitoring configured
- [ ] Logs checked for errors

---

**Status**: Ready to deploy!  
**Estimated Time**: 30-45 minutes  
**Difficulty**: Intermediate

Need help? Check platform documentation:
- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
