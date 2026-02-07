# METIS - Production Deployment Guide

## 🚀 Overview

This guide covers deploying the METIS recruitment platform to production environments.

## 📋 Prerequisites

- Python 3.11+
- Node.js 20+
- MongoDB Atlas account
- Groq API key
- Domain name (for production)

## 🔧 Environment Setup

### Backend (.env)

Create a `.env` file in the `backend/` directory:

```env
# MongoDB Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=Cluster0
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/?appName=Cluster0

# Server Configuration
PORT=5000
FLASK_ENV=production
SECRET_KEY=your-secret-key-here-change-in-production

# Frontend URLs (for CORS)
FRONTEND_URL=https://your-frontend-domain.com
PRODUCTION_FRONTEND_URL=https://your-frontend-domain.com

# AI Services
GROQ_API_KEY=your-groq-api-key-here

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key-here
JWT_ACCESS_TOKEN_EXPIRES=3600

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=60

# Logging
LOG_LEVEL=INFO
```

### Frontend (.env.production)

Create `.env.production` in the `frontend/` directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
NEXT_PUBLIC_WS_URL=https://your-backend-domain.com

# Environment
NODE_ENV=production
```

## 🐳 Docker Deployment

### Option 1: Docker Compose (Recommended for VPS)

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd metis
   ```

2. **Create environment file:**
   ```bash
   cp backend/.env.example backend/.env
   # Edit .env with your production values
   ```

3. **Build and run:**
   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Option 2: Individual Docker Containers

**Backend:**
```bash
cd backend
docker build -t metis-backend .
docker run -d -p 5000:5000 --env-file .env metis-backend
```

**Frontend:**
```bash
cd frontend
docker build -t metis-frontend .
docker run -d -p 3000:3000 -e NEXT_PUBLIC_API_URL=https://your-backend.com metis-frontend
```

## ☁️ Cloud Platform Deployment

### Vercel (Frontend)

1. **Connect your repository to Vercel**

2. **Configure environment variables:**
   - `NEXT_PUBLIC_API_URL`: Your backend URL
   - `NEXT_PUBLIC_WS_URL`: Your backend URL
   - `NODE_ENV`: production

3. **Deploy:**
   ```bash
   vercel --prod
   ```

### Railway/Render (Backend)

1. **Create new project**

2. **Add environment variables:**
   - All variables from `.env.example`
   - Set `FLASK_ENV=production`

3. **Configure build:**
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn -k eventlet -w 1 --bind 0.0.0.0:$PORT --timeout 120 wsgi:app`

### Heroku (Backend)

1. **Create Heroku app:**
   ```bash
   heroku create metis-backend
   ```

2. **Set environment variables:**
   ```bash
   heroku config:set FLASK_ENV=production
   heroku config:set MONGO_URI=your_mongo_uri
   heroku config:set GROQ_API_KEY=your_api_key
   ```

3. **Deploy:**
   ```bash
   git push heroku main
   ```

## 🔐 Security Checklist

- [ ] Change all default secrets and API keys
- [ ] Enable HTTPS/SSL on both frontend and backend
- [ ] Set `FLASK_ENV=production` in backend
- [ ] Configure CORS with specific frontend domains (no wildcards)
- [ ] Enable rate limiting
- [ ] Set strong `SECRET_KEY` and `JWT_SECRET_KEY`
- [ ] Use MongoDB Atlas with IP whitelisting
- [ ] Review and restrict firewall rules
- [ ] Enable logging and monitoring
- [ ] Set up automated backups for MongoDB

## 📊 Monitoring

### Logs

**Backend logs location:** `backend/logs/metis.log`

**View logs in Docker:**
```bash
docker-compose logs -f backend
```

### Health Check

**Backend health endpoint:**
```bash
curl https://your-backend-domain.com/
```

Should return: "MongoDB is connected. API routes are ready."

## 🔄 Updates and Maintenance

### Update Backend

```bash
cd backend
git pull
docker-compose build backend
docker-compose up -d backend
```

### Update Frontend

```bash
cd frontend
git pull
docker-compose build frontend
docker-compose up -d frontend
```

### Database Backups

Use MongoDB Atlas automated backups or:

```bash
mongodump --uri="$MONGO_URI" --out=./backup-$(date +%Y%m%d)
```

## 🐛 Troubleshooting

### Issue: CORS errors

**Solution:** Verify `FRONTEND_URL` and `PRODUCTION_FRONTEND_URL` in backend `.env`

### Issue: WebSocket connection failed

**Solution:** 
- Ensure backend supports WebSocket (using eventlet worker)
- Check firewall allows WebSocket connections
- Verify `NEXT_PUBLIC_WS_URL` points to correct backend

### Issue: 500 errors

**Solution:**
- Check backend logs: `docker-compose logs backend`
- Verify MongoDB connection string
- Ensure all required environment variables are set

### Issue: Rate limit errors

**Solution:** Adjust `RATE_LIMIT_PER_MINUTE` in backend `.env`

## 📈 Performance Optimization

1. **Enable CDN** for frontend static assets
2. **Use MongoDB Atlas clusters** in the same region as your server
3. **Enable Redis caching** for frequent API calls (optional)
4. **Scale horizontally** by adding more backend instances
5. **Use load balancer** for high traffic scenarios

## 🔗 Post-Deployment

1. Test complete user flows:
   - User registration/login
   - Resume upload and parsing
   - AI interview
   - HR leaderboard

2. Monitor initial traffic:
   - Check logs for errors
   - Verify API response times
   - Monitor database connections

3. Set up alerts:
   - Server downtime
   - High error rates
   - Database connection issues

## 📞 Support

For issues or questions:
- Check logs first
- Review environment variables
- Verify all services are running
- Contact development team

---

**Last Updated:** February 2026
