# METIS Model Integration Documentation

## Overview

This integration combines three powerful AI models into the METIS recruitment platform:

1. **Model 1 (METIS-CORE)**: Advanced resume parsing and candidate evaluation
2. **Model 2 (AI Interviewer)**: Live AI-powered technical interviews with speech
3. **Model 3 (LangGraph Scoring)**: Intelligent candidate ranking with integrity checks

## Architecture

```
Frontend (Next.js)
    ↓
Backend (Flask + SocketIO)
    ↓
┌─────────────────┬──────────────────┬─────────────────┐
│   Model 1       │    Model 2       │    Model 3      │
│  METIS-CORE     │  AI Interviewer  │  LangGraph      │
│  (Resume Eval)  │  (Live Chat)     │  (Scoring)      │
└─────────────────┴──────────────────┴─────────────────┘
         ↓                 ↓                  ↓
       Groq API          Groq API          Groq API
```

## New Backend Routes

### 1. Evaluation Routes (`/api/evaluation`)

#### POST `/api/evaluation/parse-resume`
Parse and evaluate resume using METIS-CORE.

**Request:**
```json
{
  "resumeText": "Full resume content...",
  "githubUrl": "https://github.com/username",
  "portfolioUrl": "https://portfolio.com"
}
```

**Response:**
```json
{
  "parsed": {
    "name": "John Doe",
    "email": "john@example.com",
    "skills": ["Python", "React"],
    "experience": [...],
    "education": [...]
  },
  "evaluation": {
    "model": "metis_core_v1",
    "overall_score": 75,
    "section_scores": {
      "skill_evidence": 25,
      "project_authenticity": 20,
      "professional_signals": 12,
      "impact_outcomes": 10,
      "resume_integrity": 8
    },
    "strength_signals": ["GitHub shows real projects", ...],
    "risk_signals": ["No quantified metrics"],
    "confidence_level": "high"
  }
}
```

#### POST `/api/evaluation/evaluate/<application_id>`
Evaluate existing application with METIS.

**Response:**
```json
{
  "message": "Application evaluated successfully",
  "evaluation": {...}
}
```

#### POST `/api/evaluation/batch-evaluate/<job_id>`
Evaluate all applications for a job.

**Response:**
```json
{
  "message": "Evaluated 15 applications",
  "total": 15,
  "errors": []
}
```

---

### 2. Live Interview Routes (WebSocket)

#### Event: `start_interview`
Start a new interview session.

**Emit:**
```javascript
socket.emit('start_interview', {
  jobId: "job123",
  candidateId: "candidate456",
  candidateName: "John Doe",
  jdText: "Job description...",
  candidateContext: "Resume highlights..."
});
```

**Receive:**
```javascript
socket.on('ai_response', (data) => {
  // data.text: AI question
  // data.audio: Base64 audio
  // data.questionNumber: Current question
  // data.isComplete: Interview finished?
});
```

#### Event: `send_audio`
Send candidate audio response.

**Emit:**
```javascript
socket.emit('send_audio', {
  audio: base64AudioBlob
});
```

**Receive:**
```javascript
socket.on('user_transcript', (data) => {
  // data.text: Transcribed speech
});

socket.on('ai_response', (data) => {
  // Next AI question/response
});
```

#### Event: `send_text`
Send text response (text-only mode).

**Emit:**
```javascript
socket.emit('send_text', {
  text: "My answer is..."
});
```

#### Event: `end_interview`
Manually end interview.

**Emit:**
```javascript
socket.emit('end_interview');
```

---

### 3. Advanced Ranking Routes (`/api/advanced-ranking`)

#### POST `/api/advanced-ranking/generate/<job_id>`
Generate intelligent rankings using LangGraph.

**Response:**
```json
{
  "message": "Advanced rankings generated successfully",
  "leaderboard": {
    "job_id": "job123",
    "job_title": "Senior Developer",
    "total_applicants": 50,
    "round_1_count": 15,
    "round_2_count": 8,
    "rejected_count": 27,
    "top_candidates": [
      {
        "rank": 1,
        "candidate_id": "...",
        "candidate_name": "John Doe",
        "weighted_score": 85.5,
        "final_score": 82.3,
        "integrity_score": 0.96,
        "status": "round_2",
        "shortlist_reason": "Exceptional scores with verified skills"
      }
    ]
  }
}
```

#### GET `/api/advanced-ranking/<job_id>`
Get rankings for a job.

**Query Params:**
- `limit`: Number of results
- `offset`: Pagination offset
- `status`: Filter by status (round_1, round_2, rejected)

#### GET `/api/advanced-ranking/statistics/<job_id>`
Get statistical insights.

**Response:**
```json
{
  "total_candidates": 50,
  "average_score": 62.4,
  "median_score": 65.0,
  "min_score": 25.0,
  "max_score": 95.0,
  "round_1_count": 15,
  "round_2_count": 8,
  "rejected_count": 27,
  "score_distribution": {
    "excellent (80-100)": 8,
    "good (60-79)": 15,
    "average (40-59)": 20,
    "poor (0-39)": 7
  }
}
```

---

## Frontend Integration Guide

### 1. Add SocketIO Client

```bash
cd frontend
npm install socket.io-client
```

### 2. Create Live Interview Component

```typescript
// components/LiveInterview.tsx
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

export function LiveInterview({ jobId, candidateId, jdText }) {
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  
  useEffect(() => {
    // Start interview
    socket.emit('start_interview', {
      jobId,
      candidateId,
      candidateName: 'Candidate',
      jdText
    });
    
    // Listen for AI responses
    socket.on('ai_response', (data) => {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: data.text,
        audio: data.audio
      }]);
      
      if (data.audio) {
        playAudio(data.audio);
      }
    });
    
    socket.on('user_transcript', (data) => {
      setMessages(prev => [...prev, {
        role: 'user',
        text: data.text
      }]);
    });
    
    return () => socket.disconnect();
  }, []);
  
  const playAudio = (base64Audio) => {
    const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
    audio.play();
  };
  
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = (e) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        socket.emit('send_audio', { audio: base64 });
      };
      reader.readAsDataURL(e.data);
    };
    
    mediaRecorder.start();
    setIsRecording(true);
    
    setTimeout(() => {
      mediaRecorder.stop();
      setIsRecording(false);
    }, 5000); // 5 second recording
  };
  
  return (
    <div>
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role}>
            {msg.text}
          </div>
        ))}
      </div>
      <button onClick={startRecording} disabled={isRecording}>
        {isRecording ? 'Recording...' : 'Record Answer'}
      </button>
    </div>
  );
}
```

### 3. Add Evaluation Service

```typescript
// lib/api/services/evaluation.service.ts
export const evaluationService = {
  async parseResume(resumeText: string, githubUrl?: string, portfolioUrl?: string) {
    return apiClient.post('/evaluation/parse-resume', {
      resumeText,
      githubUrl,
      portfolioUrl
    });
  },
  
  async evaluateApplication(applicationId: string) {
    return apiClient.post(`/evaluation/evaluate/${applicationId}`);
  },
  
  async batchEvaluate(jobId: string) {
    return apiClient.post(`/evaluation/batch-evaluate/${jobId}`);
  }
};
```

### 4. Add Advanced Rankings

```typescript
// lib/api/services/ranking.service.ts
export const advancedRankingService = {
  async generateRankings(jobId: string) {
    return apiClient.post(`/advanced-ranking/generate/${jobId}`);
  },
  
  async getRankings(jobId: string, params?: {
    limit?: number;
    offset?: number;
    status?: string;
  }) {
    return apiClient.get(`/advanced-ranking/${jobId}`, { params });
  },
  
  async getStatistics(jobId: string) {
    return apiClient.get(`/advanced-ranking/statistics/${jobId}`);
  }
};
```

---

## Environment Setup

### Backend `.env`
```bash
# Groq API (Required for all models)
GROQ_API_KEY=your_groq_api_key_here

# MongoDB
MONGO_URI=your_mongodb_connection_string

# Server
PORT=5000
```

### Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

---

## Database Collections

### New Collections

#### `interviews`
```json
{
  "_id": ObjectId,
  "jobId": "string",
  "candidateId": "string",
  "messages": [
    {
      "role": "ai|candidate",
      "text": "message content",
      "timestamp": ISODate
    }
  ],
  "startedAt": ISODate,
  "completedAt": ISODate,
  "questionCount": 10,
  "status": "completed|incomplete"
}
```

#### `leaderboards`
```json
{
  "_id": ObjectId,
  "job_id": "string",
  "job_title": "string",
  "total_applicants": 50,
  "entries": [
    {
      "rank": 1,
      "candidate_id": "string",
      "candidate_name": "string",
      "weighted_score": 85.5,
      "final_score": 82.3,
      "integrity_score": 0.96,
      "status": "round_1|round_2|rejected"
    }
  ],
  "round_1_count": 15,
  "round_2_count": 8,
  "rejected_count": 27,
  "generated_at": ISODate
}
```

### Updated Collections

#### `applications` (new fields)
```json
{
  "metisEvaluation": {
    "model": "metis_core_v1",
    "overall_score": 75,
    "section_scores": {...},
    "strength_signals": [...],
    "risk_signals": [...]
  },
  "metisScore": 75,
  "evaluatedAt": ISODate,
  "hasInterview": true,
  "interviewStatus": "completed",
  "interviewedAt": ISODate
}
```

---

## Features Summary

### ✅ Implemented

1. **METIS-CORE Resume Evaluation**
   - Advanced resume parsing
   - GitHub repository analysis
   - Portfolio website analysis
   - Multi-dimensional scoring
   - Confidence levels

2. **Live AI Interviews**
   - Real-time WebSocket communication
   - Speech-to-Text transcription
   - Text-to-Speech responses
   - Context-aware questioning
   - Interview transcript storage

3. **LangGraph Intelligent Ranking**
   - Weighted skill scoring
   - Integrity checks
   - Multi-round shortlisting
   - Statistical analysis
   - Leaderboard generation

### 🎯 Next Steps

1. Create frontend UI components
2. Add interview page to dashboard
3. Add advanced rankings view
4. Add evaluation triggers (auto-eval on application)
5. Add batch processing UI

---

## Testing

### Test Resume Evaluation
```bash
curl -X POST http://localhost:5000/api/evaluation/parse-resume \
  -H "Content-Type: application/json" \
  -d '{
    "resumeText": "John Doe\\nSoftware Engineer\\nPython, React, Node.js..."
  }'
```

### Test Live Interview (requires WebSocket client)
```javascript
const socket = io('http://localhost:5000');
socket.emit('start_interview', {
  jobId: 'test123',
  candidateId: 'user456',
  candidateName: 'Test User',
  jdText: 'Senior Developer position...'
});
```

### Test Advanced Rankings
```bash
curl -X POST http://localhost:5000/api/advanced-ranking/generate/JOB_ID
```

---

## Notes

- Requires Groq API key for all AI features
- WebSocket connection needed for live interviews
- Audio recording requires browser microphone permission
- LangGraph scoring requires evaluated applications (run METIS first)
- All models work independently but are most powerful together

