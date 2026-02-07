# AI Interview Feature - Production Deployment Guide

## Problem

The AI interview feature is **NOT working in production** because it requires WebSocket support, which Vercel serverless functions **do not support**.

## Technical Details

### What's Broken
- **Live AI Interview** (Round 2) uses Flask-SocketIO for real-time bidirectional communication
- Candidates can't complete the AI interview in production
- WebSocket connections fail to establish on `https://metis-im23.vercel.app`

### Why It's Broken
- Vercel serverless functions have a maximum execution time (10-60 seconds)
- WebSockets require persistent connections that stay open
- The backend code already detects Vercel and disables WebSocket routes (see `app.py` lines 78-82)

### What Works
- ✅ Resume parsing (Round 1) - HTTP API
- ✅ Assessment scoring - HTTP API
- ✅ Rankings - HTTP API
- ❌ Live AI Interview (Round 2) - Requires WebSockets

## Solutions

### Option 1: Deploy Backend to WebSocket-Compatible Platform (Recommended)

Deploy the backend to a platform that supports long-running processes and WebSockets:

#### Recommended Platforms:
1. **Railway** (easiest, auto-deploy from GitHub)
   - Free tier available
   - Built-in PostgreSQL/MongoDB support
   - WebSocket support
   - [Deploy Guide](https://docs.railway.app/)

2. **Render**
   - Free tier available
   - WebSocket support
   - [Deploy Guide](https://render.com/docs)

3. **DigitalOcean App Platform**
   - $5/month minimum
   - Full WebSocket support
   - [Deploy Guide](https://docs.digitalocean.com/products/app-platform/)

4. **AWS EC2 / ECS**
   - Most control, more complex
   - Pay as you go

#### Deployment Steps (Railway Example):
```bash
# 1. Create Railway account at railway.app
# 2. Install Railway CLI
npm i -g @railway/cli

# 3. Login and deploy
cd metis/backend
railway login
railway init
railway up

# 4. Add environment variables in Railway dashboard
MONGO_URI=your_mongodb_uri
GROQ_API_KEY=your_groq_api_key
FLASK_ENV=production
FRONTEND_URL=https://metis-hire.vercel.app
```

#### Update Frontend Configuration:
```env
# metis/frontend/.env.production
NEXT_PUBLIC_API_URL=https://your-app.railway.app
NEXT_PUBLIC_WS_URL=https://your-app.railway.app
```

### Option 2: Convert to HTTP Polling (More Work)

Refactor the live interview to use HTTP polling instead of WebSockets:

1. Replace WebSocket events with HTTP endpoints
2. Use client-side polling every 2-3 seconds
3. Store interview state in MongoDB
4. Trade-off: Slightly higher latency

**Estimated effort:** 4-6 hours of development

### Option 3: Keep Static Questions (No Live Interview)

Simplify Round 2 to use pre-generated questions without real-time interaction:

1. Generate interview questions via API (already works)
2. Show questions one by one
3. Collect text/audio responses
4. Evaluate all at once when complete

**Estimated effort:** 2-3 hours of development

## Current Requirements Status

### Backend Dependencies (requirements.txt)
✅ **Fixed**: Added missing packages:
```txt
# PDF parsing
pdfplumber>=0.11.0
pypdf>=4.0.0

# AI Interview & Transcription
groq>=0.9.0

# LangGraph Scoring Model
langgraph>=0.2.62
langchain>=0.3.15
langchain-groq>=0.2.6
```

### Environment Variables Needed
```env
MONGO_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key
FLASK_ENV=production
FRONTEND_URL=https://metis-hire.vercel.app
PORT=5000
```

## Recommended Action Plan

### Immediate Fix (Best Solution):
1. ✅ **Already done**: Added `groq` package to requirements.txt
2. **Deploy backend to Railway**:
   - Sign up at railway.app
   - Create new project from GitHub repo
   - Add environment variables
   - Deploy takes ~5 minutes
3. **Update frontend env variables** to point to Railway URL
4. **Redeploy frontend** on Vercel

### Estimated Time to Fix: 30 minutes

## Testing Checklist

After deploying:
- [ ] Resume upload works (PDF parsing)
- [ ] Assessment scoring completes
- [ ] Rankings are calculated
- [ ] **Live interview starts** (connects via WebSocket)
- [ ] AI asks questions in real-time
- [ ] Audio transcription works
- [ ] Text-to-speech responses play
- [ ] Interview completes and saves transcript
- [ ] Final combined score calculated (30% Round 1 + 70% Round 2)

## Files Modified

1. ✅ `metis/backend/requirements.txt` - Added missing packages
2. 📝 This deployment guide created

## Next Steps

1. Choose deployment platform (Railway recommended)
2. Deploy backend to chosen platform
3. Update frontend environment variables
4. Test complete flow end-to-end
5. Monitor for any errors in production logs
