# METIS - AI-Powered Recruitment Platform

> Automated candidate evaluation with resume parsing, live AI interviews, and intelligent scoring

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/metis)

## 🚀 Quick Deploy

**⚡ 10-minute deployment** with free tiers:

1. **Backend** → Railway/Render (WebSocket support)
2. **Frontend** → Vercel (Next.js optimized)

👉 **[Quick Deploy Guide →](QUICK_DEPLOY.md)**

---

## ✨ Features

### 🤖 Automated Pipeline
- **Resume Upload** → AI parsing with auto-fill
- **Round 1 (30%)** → Resume evaluation with METIS AI
- **Round 2 (70%)** → Live AI interview (10 questions)
- **Final Score** → Weighted scoring + HR leaderboard

### 💬 Live AI Interview
- Real-time WebSocket connection
- Voice + text input support
- Contextual questions based on resume
- Auto-evaluation with detailed feedback

### 📊 Smart Leaderboard
- Final scores with round breakdowns
- Auto-sorted by performance
- Complete candidate summaries
- Interview transcript viewing

---

## 🛠️ Tech Stack

**Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui  
**Backend**: Flask, Python 3.11, SocketIO, MongoDB  
**AI Models**: Groq (LLM), METIS (Resume Parser), LangGraph (Scoring)

---

## 📦 Local Development

### Prerequisites
- Python 3.11+
- Bun (or Node.js 20+)
- MongoDB (local or Atlas)
- Groq API key

### Setup

```bash
# Clone repository
git clone https://github.com/yourusername/metis.git
cd metis

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials
python app.py

# Frontend setup (new terminal)
cd frontend
bun install
cp .env.local.example .env.local
# Edit .env.local if needed
bun run dev
```

Visit: http://localhost:3000

---

## 🌐 Production Deployment

### Option 1: Docker (Recommended)

**Easiest way to deploy - works on any platform!**

```bash
# Copy environment template
cp .env.example .env
# Edit .env with your credentials

# Deploy with Docker Compose
docker-compose up -d
```

📘 **[Complete Docker Guide →](DOCKER_DEPLOYMENT.md)**

Supports:
- Render
- Railway  
- Fly.io
- DigitalOcean
- AWS/GCP/Azure

### Option 2: Vercel + Railway

**Frontend** on Vercel, **Backend** on Railway

📘 **[Vercel Deployment Guide →](VERCEL_DEPLOYMENT.md)**

### Option 3: Quick Deploy Script

**Windows:**
```powershell
.\deploy-docker.ps1
```

**Linux/Mac:**
```bash
chmod +x deploy-docker.sh
./deploy-docker.sh
```

---

## 📚 Documentation

- [Quick Deploy Guide](QUICK_DEPLOY.md) - 10-minute setup
- [Vercel Deployment](VERCEL_DEPLOYMENT.md) - Detailed Vercel + Railway guide
- [Production Ready](PRODUCTION_READY.md) - Checklist and features
- [Pipeline Documentation](PIPELINE_FINAL_COMPLETE.md) - Complete technical docs

---

## 🔐 Environment Variables

### Backend (.env)
```env
MONGO_URI=mongodb+srv://...
GROQ_API_KEY=gsk_...
FLASK_ENV=production
SECRET_KEY=random-secret-here
FRONTEND_URL=https://your-app.vercel.app
```

### Frontend (.env.production)
```env
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
NEXT_PUBLIC_WS_URL=https://your-backend.up.railway.app
NODE_ENV=production
```

---

## 🎯 User Flows

### Candidate Journey
1. Register/Login
2. Browse jobs
3. Upload resume (auto-parsed)
4. Submit application (auto-evaluated)
5. Complete AI interview
6. View results with detailed feedback

### HR Journey
1. Register/Login (as HR)
2. Create job posting
3. View candidate leaderboard
4. See final scores (ranked)
5. Review interview transcripts
6. Select top candidates

---

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
bun test

# E2E tests
bun run test:e2e
```

---

## 📊 Features in Detail

### Resume Parser (METIS)
- Extracts skills, experience, education
- PDF/DOC/DOCX support
- Auto-fills application form
- Proficiency scoring

### AI Interviewer
- Contextual questions based on resume
- Voice recognition (STT)
- Natural conversation flow
- Real-time transcript

### Scoring Engine
- Resume analysis (30%)
- Interview performance (70%)
- Skill matching
- Experience validation
- Final weighted score

---

## 🔧 Project Structure

```
metis/
├── backend/
│   ├── models/metis/          # AI models
│   ├── routes/                # API endpoints
│   ├── config/                # Production config
│   ├── app.py                 # Flask app
│   └── wsgi.py                # Production entry
├── frontend/
│   ├── app/                   # Next.js pages
│   ├── components/            # React components
│   ├── lib/                   # API services, config
│   └── vercel.json            # Vercel config
└── docs/                      # Documentation
```

---

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

## 🙏 Acknowledgments

- Groq for LLM API
- MongoDB for database
- Vercel for hosting
- Railway for backend hosting
- shadcn/ui for components

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/metis/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/metis/discussions)
- **Email**: your-email@example.com

---

**Built with ❤️ for smarter recruitment**

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/metis)
[![Deploy to Railway](https://railway.app/button.svg)](https://railway.app/new/template)
