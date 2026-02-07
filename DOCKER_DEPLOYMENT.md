# Docker Deployment Guide

## 🐳 Deploy with Docker

This is the **recommended** deployment method for METIS. Docker provides consistent environments and easy scaling.

---

## 🚀 Quick Start (Local Testing)

### Test Full Stack with Docker Compose

```bash
cd c:\Users\Ansh\Desktop\web\metis

# Create production .env file
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# Start both frontend and backend
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Access**: 
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

---

## ☁️ Cloud Deployment Options

### Option 1: Render (Recommended - Free Tier Available)

**Backend:**
1. Go to [render.com](https://render.com)
2. New → **Web Service**
3. Connect GitHub repo → Select `metis`
4. Configure:
   - **Name**: `metis-backend`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Docker`
   - **Docker Build Context**: `backend`
   - **Dockerfile Path**: `Dockerfile`
5. Add Environment Variables:
   ```
   MONGO_URI=your-mongodb-connection-string
   GROQ_API_KEY=your-groq-api-key
   FLASK_ENV=production
   SECRET_KEY=your-secret-key
   JWT_SECRET_KEY=your-jwt-secret
   FRONTEND_URL=https://your-frontend.onrender.com
   PRODUCTION_FRONTEND_URL=https://your-frontend.onrender.com
   RATE_LIMIT_ENABLED=true
   RATE_LIMIT_PER_MINUTE=60
   LOG_LEVEL=INFO
   ```
6. **Create Web Service**
7. Copy your backend URL: `https://metis-backend.onrender.com`

**Frontend:**
1. New → **Web Service**
2. Configure:
   - **Name**: `metis-frontend`
   - **Root Directory**: `frontend`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `Dockerfile`
3. Add Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://metis-backend.onrender.com
   NEXT_PUBLIC_WS_URL=https://metis-backend.onrender.com
   NODE_ENV=production
   ```
4. **Create Web Service**

**Update Backend:**
- Go back to backend service → Environment
- Update `FRONTEND_URL` and `PRODUCTION_FRONTEND_URL` with frontend URL
- Redeploy

---

### Option 2: Railway (Docker Support)

**Backend:**
1. [railway.app/new](https://railway.app/new)
2. Deploy from GitHub → Select `metis`
3. Settings:
   - **Root Directory**: `backend`
   - **Build Method**: Dockerfile
4. Add environment variables (same as above)
5. Deploy

**Frontend:**
1. New Service from same repo
2. Settings:
   - **Root Directory**: `frontend`
   - **Build Method**: Dockerfile
3. Add environment variables
4. Deploy

---

### Option 3: Fly.io

**Install Fly CLI:**
```bash
# PowerShell (Windows)
iwr https://fly.io/install.ps1 -useb | iex
```

**Backend:**
```bash
cd backend
fly launch --name metis-backend --region fra
fly secrets set MONGO_URI="your-connection-string"
fly secrets set GROQ_API_KEY="your-api-key"
fly secrets set FLASK_ENV=production
fly secrets set FRONTEND_URL="https://metis-frontend.fly.dev"
fly deploy
```

**Frontend:**
```bash
cd frontend
fly launch --name metis-frontend --region fra
fly secrets set NEXT_PUBLIC_API_URL="https://metis-backend.fly.dev"
fly secrets set NEXT_PUBLIC_WS_URL="https://metis-backend.fly.dev"
fly secrets set NODE_ENV=production
fly deploy
```

---

### Option 4: DigitalOcean App Platform

1. Go to [cloud.digitalocean.com/apps](https://cloud.digitalocean.com/apps)
2. **Create App** → GitHub → Select `metis`
3. **Backend Component**:
   - Type: Web Service
   - Source Directory: `backend`
   - Dockerfile: `backend/Dockerfile`
   - HTTP Port: 5000
   - Add environment variables
4. **Frontend Component**:
   - Type: Web Service
   - Source Directory: `frontend`
   - Dockerfile: `frontend/Dockerfile`
   - HTTP Port: 3000
   - Add environment variables
5. **Create Resources**

---

### Option 5: AWS/GCP/Azure (Advanced)

Use managed container services:
- **AWS**: ECS + Fargate
- **GCP**: Cloud Run
- **Azure**: Container Instances

See `DOCKER_CLOUD_DEPLOY.md` for detailed instructions.

---

## 🔧 Docker Configuration

### Backend Dockerfile
```dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN mkdir -p logs
EXPOSE 5000
CMD ["gunicorn", "-k", "eventlet", "-w", "1", "--bind", "0.0.0.0:5000", "--timeout", "120", "wsgi:app"]
```

### Frontend Dockerfile
- Multi-stage build for optimal size
- Standalone Next.js output
- Production optimized

### Docker Compose
- Both services connected
- Shared network
- Volume mounting for logs
- Environment variable support

---

## 🧪 Local Testing

### Build and Run

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Check status
docker-compose ps

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

### Test Endpoints

```bash
# Backend health check
curl http://localhost:5000/

# Frontend
curl http://localhost:3000/
```

---

## 📊 Environment Variables

### Backend (.env)
```env
# Required
MONGO_URI=mongodb+srv://...
GROQ_API_KEY=gsk_...

# Production
FLASK_ENV=production
SECRET_KEY=<generate-random-string>
JWT_SECRET_KEY=<generate-random-string>

# CORS
FRONTEND_URL=http://localhost:3000
PRODUCTION_FRONTEND_URL=https://your-domain.com

# Optional
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=60
LOG_LEVEL=INFO
```

### Frontend (.env.production)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=http://localhost:5000
NODE_ENV=production
```

---

## 🔐 Security Checklist

- [ ] Generate strong SECRET_KEY and JWT_SECRET_KEY
- [ ] Use MongoDB connection string with authentication
- [ ] Set FLASK_ENV=production
- [ ] Enable rate limiting
- [ ] Configure CORS with specific origins
- [ ] Use HTTPS in production
- [ ] Keep API keys in environment variables (never commit)
- [ ] Regular security updates: `docker-compose pull && docker-compose up -d`

---

## 📈 Monitoring

### View Logs
```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Health Checks
```bash
# Backend
docker-compose exec backend curl http://localhost:5000/

# Database connection
docker-compose exec backend python -c "from app import client; client.admin.command('ping'); print('MongoDB OK')"
```

### Resource Usage
```bash
docker stats
```

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Clean build
docker-compose build --no-cache

# Check Dockerfile syntax
docker build -t test-backend backend/
```

### Container Crashes
```bash
# Check logs
docker-compose logs backend

# Interactive shell
docker-compose exec backend bash
```

### WebSocket Not Working
- Ensure backend uses gunicorn with eventlet worker
- Check `NEXT_PUBLIC_WS_URL` matches backend URL
- Verify firewall allows WebSocket connections

### MongoDB Connection Fails
- Check connection string format
- Verify network access in MongoDB Atlas (allow 0.0.0.0/0)
- Test connection: `mongosh "your-connection-string"`

---

## 💰 Cost Comparison

| Platform | Free Tier | Paid |
|----------|-----------|------|
| **Render** | ✅ 750 hrs/month | $7/month per service |
| **Railway** | $5 credit/month | Usage-based (~$10-20/month) |
| **Fly.io** | 3 VMs free | ~$5-15/month |
| **DigitalOcean** | ❌ | $5/month (basic droplet) |
| **Vercel** | ✅ Unlimited (frontend only) | $20/month |

**Recommended**: Render (free tier) or Railway (pay-as-you-go)

---

## ✅ Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Groq API key obtained
- [ ] Backend .env configured
- [ ] Frontend environment variables set
- [ ] Docker images build successfully
- [ ] Local test with docker-compose passes
- [ ] Pushed to GitHub
- [ ] Backend deployed to cloud
- [ ] Frontend deployed (or use Vercel)
- [ ] CORS updated with frontend URL
- [ ] Complete user flow tested
- [ ] SSL/HTTPS enabled
- [ ] Monitoring configured

---

## 🚀 Next Steps

1. **Choose a platform** (Render recommended for beginners)
2. **Set up MongoDB Atlas** (free tier)
3. **Get Groq API key**
4. **Configure environment variables**
5. **Deploy backend with Docker**
6. **Deploy frontend** (Docker or Vercel)
7. **Test complete flow**
8. **Monitor and optimize**

---

**Status**: Production Ready with Docker 🐳  
**Total Setup Time**: 20-30 minutes  
**Difficulty**: Beginner-Intermediate
