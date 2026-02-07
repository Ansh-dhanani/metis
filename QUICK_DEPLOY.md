# Quick Deploy to Vercel

## 🎯 One-Click Setup

### Prerequisites
1. GitHub account with this repo
2. MongoDB Atlas account ([free](https://www.mongodb.com/cloud/atlas/register))
3. Groq API key ([free](https://console.groq.com))
4. Railway account ([free](https://railway.app))
5. Vercel account ([free](https://vercel.com))

---

## 🚂 Step 1: Deploy Backend to Railway (5 mins)

### Via Railway UI:
1. Go to [railway.app/new](https://railway.app/new)
2. Click **"Deploy from GitHub repo"**
3. Select `metis` repository
4. Click **"Add variables"** and paste:
   ```env
   MONGO_URI=your-mongodb-connection-string-here
   GROQ_API_KEY=your-groq-api-key-here
   FLASK_ENV=production
   SECRET_KEY=your-random-secret-key-here
   JWT_SECRET_KEY=your-random-jwt-secret-here
   FRONTEND_URL=https://your-app-name.vercel.app
   PRODUCTION_FRONTEND_URL=https://your-app-name.vercel.app
   RATE_LIMIT_ENABLED=true
   RATE_LIMIT_PER_MINUTE=60
   LOG_LEVEL=INFO
   ```
5. In **Settings** → **Root Directory** → Enter `backend`
6. Click **"Deploy"**
7. Copy your Railway URL: `https://metis-backend-production.up.railway.app`

---

## 🎨 Step 2: Deploy Frontend to Vercel (3 mins)

### Via Vercel UI:
1. Go to [vercel.com/new](https://vercel.com/new)
2. **Import Git Repository** → Select `metis`
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: Leave default
4. **Environment Variables** → Add:
   ```env
   NEXT_PUBLIC_API_URL=https://metis-backend-production.up.railway.app
   NEXT_PUBLIC_WS_URL=https://metis-backend-production.up.railway.app
   NODE_ENV=production
   ```
   *(Replace with your actual Railway URL from Step 1)*
5. Click **"Deploy"**
6. Copy your Vercel URL: `https://metis-ai.vercel.app`

---

## 🔄 Step 3: Update Backend CORS (1 min)

1. Go back to **Railway dashboard**
2. Click your backend service → **Variables**
3. Update these variables with your Vercel URL:
   ```env
   FRONTEND_URL=https://metis-ai.vercel.app
   PRODUCTION_FRONTEND_URL=https://metis-ai.vercel.app
   ```
4. Service will auto-redeploy

---

## ✅ Step 4: Test Your Deployment

Visit your Vercel URL: `https://metis-ai.vercel.app`

**Test Flow**:
1. ✅ Register as candidate
2. ✅ Browse jobs
3. ✅ Upload resume (auto-parse)
4. ✅ Submit application (auto-evaluate)
5. ✅ Complete AI interview (WebSocket)
6. ✅ View results (final score)
7. ✅ Login as HR → See leaderboard

---

## 🔑 Environment Variables Reference

### MongoDB (Required)
Get from MongoDB Atlas → Database → Connect → Drivers:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/metis
```

### Groq API (Required)
Get from [console.groq.com](https://console.groq.com) → API Keys:
```
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx
```

### Generate Secrets (Required)
```bash
# In Python
python -c "import secrets; print(secrets.token_hex(32))"

# Or in PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

---

## 🐛 Common Issues

### "Failed to fetch" in browser
**Cause**: CORS mismatch  
**Fix**: Verify `FRONTEND_URL` in Railway matches your Vercel URL exactly

### Interview WebSocket won't connect
**Cause**: Wrong WebSocket URL  
**Fix**: Verify `NEXT_PUBLIC_WS_URL` in Vercel matches Railway URL

### "MongoDB connection failed"
**Cause**: Wrong connection string or IP not whitelisted  
**Fix**: 
1. MongoDB Atlas → Network Access → Add `0.0.0.0/0`
2. Verify connection string format

### Build fails on Vercel
**Cause**: Bun installation  
**Fix**: Already configured in `vercel.json` - contact support if persists

---

## 💡 Pro Tips

1. **Custom Domain**: Add in Vercel → Settings → Domains
2. **View Logs**: 
   - Railway: Dashboard → Deployments → View Logs
   - Vercel: Dashboard → Deployments → Function Logs
3. **Auto-Deploy**: Both platforms auto-deploy on git push to main
4. **Monitoring**: Add Sentry for error tracking (free tier available)

---

## 📞 Need Help?

**Railway Issues**: [Discord](https://discord.gg/railway)  
**Vercel Issues**: [Discord](https://vercel.com/discord)  
**METIS Issues**: Check logs in platform dashboards

---

**Total Time**: ~10 minutes  
**Cost**: $0 (free tiers) or ~$5-20/month (production)  
**Status**: Production ready ✅
