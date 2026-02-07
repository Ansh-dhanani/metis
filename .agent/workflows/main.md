---
description: Run the METIS Scoring Model application
---

# Main Workflow - METIS Scoring Model

## Prerequisites

- Python 3.10+
- Groq API key (set in `.env` file)

## Setup

// turbo
1. Install dependencies:
```bash
pip install -r backend/requirements.txt
```

2. Configure environment variables in `backend/.env`:
```
GROQ_API_KEY=your_groq_api_key_here
```

## Running the Application

// turbo
3. Start the Flask server:
```bash
cd backend
python app.py
```

4. Access the application:
   - **Leaderboard**: http://localhost:5000/
   - **Upload Resume**: http://localhost:5000/upload
   - **Live Interview**: http://localhost:5000/interview
   - **Health Check**: http://localhost:5000/health

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload/analyze-file` | POST | Upload resume + URLs for analysis |
| `/api/scoring/demo` | GET | Run scoring with demo data |
| `/api/scoring/model1-eval` | GET | Load hackathon evaluations |
| `/api/scoring/model3` | POST | Run Model 3 with custom inputs |
| `/api/scoring/combined` | POST | Combined scoring pipeline |
| `/api/interview/status` | GET | Check interview status |
| `/api/leaderboard/<job_id>` | GET | Get ranked leaderboard |
| `/api/shortlist/<job_id>/<round>` | GET | Get Round 1 or 2 shortlist |

## Architecture

The application consists of three models:
- **Model 1**: Resume Evaluation (Round 1) - Parses and scores resumes
- **Model 2**: Live Interview (Round 2) - WebSocket-based AI interviewer
- **Model 3**: Final Scoring & Leaderboard - LangGraph-based scoring pipeline
