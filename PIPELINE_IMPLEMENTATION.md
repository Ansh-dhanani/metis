# METIS Complete Recruitment Pipeline

## Overview

This document describes the complete end-to-end recruitment pipeline implementation with combined scoring.

## Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CANDIDATE APPLICATION                         │
│  1. Upload Resume → Auto-parse fields                           │
│  2. Fill application form                                        │
│  3. Submit application                                           │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                    ROUND 1: RESUME EVALUATION                    │
│  ✓ METIS parser extracts structured data                        │
│  ✓ Evaluator analyzes resume quality                            │
│  ✓ GitHub/Portfolio analysis (if provided)                      │
│  ✓ Round 1 Score: 0-100                                         │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                    ROUND 2: AI INTERVIEW                         │
│  ✓ AI conducts live technical interview                         │
│  ✓ Context-aware questions based on resume                      │
│  ✓ Transcript saved to database                                 │
│  ✓ Interview evaluated for personality, technical skills        │
│  ✓ Round 2 Score: 0-100                                         │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                    FINAL SCORE CALCULATION                       │
│  Final Score = (Round 1 × 0.3) + (Round 2 × 0.7)               │
│  • Round 1 (30%): Resume/METIS evaluation                       │
│  • Round 2 (70%): Interview performance                         │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                    INTELLIGENT RANKING                           │
│  ✓ Sort candidates by final score                               │
│  ✓ Categorize: Round 1, Round 2, Rejected                      │
│  ✓ Generate leaderboard                                         │
│  ✓ Statistical analysis                                         │
└─────────────────────────────────────────────────────────────────┘
```

## Scoring Breakdown

### Round 1: Resume Evaluation (30%)
**Score Range:** 0-100

**METIS Components:**
- Skill Evidence (30 pts)
- Project Authenticity (25 pts)
- Professional Signals (20 pts)
- Impact Outcomes (15 pts)
- Resume Integrity (10 pts)

**Sources:**
- Resume text analysis
- GitHub repository analysis (if provided)
- Portfolio website analysis (if provided)

### Round 2: Interview Evaluation (70%)
**Score Range:** 0-100

**Interview Components:**
- Personality Score (25%)
- Technical Approach Score (25%)
- Communication Score (25%)
- Problem Solving Score (25%)

**Process:**
1. AI interviewer asks 10 relevant questions
2. Transcript saved to database
3. AI evaluator analyzes responses
4. Scores calculated across 4 dimensions

### Final Score
```
Final Score = (Resume Score × 0.3) + (Interview Score × 0.7)

Example:
- Resume Score: 75/100
- Interview Score: 85/100
- Final Score = (75 × 0.3) + (85 × 0.7) = 22.5 + 59.5 = 82.0
```

## Backend Implementation

### New Routes

#### 1. Evaluate Interview
```
POST /api/evaluation/evaluate-interview/<application_id>
```

**Request:** None (uses stored interview transcript)

**Response:**
```json
{
  "message": "Interview evaluated successfully",
  "round1_score": 75.0,
  "round2_score": 85.0,
  "final_score": 82.0,
  "evaluation": {
    "personality_score": 80,
    "technical_approach_score": 90,
    "communication_score": 85,
    "problem_solving_score": 85,
    "interview_score": 85.0,
    "strengths": ["Strong technical knowledge", "Clear communication"],
    "areas_for_improvement": ["Could provide more examples"],
    "overall_assessment": "Excellent candidate with solid technical skills",
    "hire_recommendation": "strong_yes"
  }
}
```

#### 2. Batch Evaluate Interviews
```
POST /api/evaluation/batch-evaluate-interviews/<job_id>
```

**Response:**
```json
{
  "message": "Evaluated 15 interviews",
  "evaluated": 15,
  "skipped": 5,
  "total": 20,
  "errors": null
}
```

### Updated Application Schema

```json
{
  "_id": "ObjectId",
  "jobId": "ObjectId",
  "candidateId": "ObjectId",
  
  // Round 1: Resume Evaluation
  "metisEvaluation": { ... },
  "metisScore": 75.0,
  "evaluatedAt": "ISODate",
  
  // Round 2: Interview Evaluation
  "interviewEvaluation": {
    "personality_score": 80,
    "technical_approach_score": 90,
    "communication_score": 85,
    "problem_solving_score": 85,
    "interview_score": 85.0,
    "strengths": [...],
    "areas_for_improvement": [...],
    "overall_assessment": "string",
    "hire_recommendation": "strong_yes"
  },
  "interviewScore": 85.0,
  "interviewEvaluatedAt": "ISODate",
  
  // Combined Score
  "finalScore": 82.0,
  "round1Score": 75.0,
  "round2Score": 85.0,
  
  "status": "interview_evaluated"
}
```

### Updated Ranking Logic

The `advanced_ranking.py` route now:
1. Retrieves all applications with METIS evaluations
2. Sorts by `finalScore` (or `metisScore` if interview not done)
3. Creates leaderboard entries with:
   - Rank (1, 2, 3...)
   - Final Score (0-100)
   - Round 1 Score (0-100)
   - Round 2 Score (0-100)
   - Status (round_1, round_2, rejected)
   - Has Interview flag

**Categorization:**
- **Round 2:** finalScore >= 70 (Top candidates)
- **Round 1:** finalScore >= 50 (Moderate candidates)
- **Rejected:** finalScore < 50

## Frontend Implementation

### Updated Services

**evaluation.service.ts:**
```typescript
evaluateInterview(applicationId: string)
batchEvaluateInterviews(jobId: string)
```

### Updated Job Details Page

**New Actions:**
1. "Evaluate Applications" button now also evaluates interviews
2. Shows combined scores in candidate list
3. Comprehensive candidate dialog with:
   - Final Score (large display)
   - Round 1 Score (resume)
   - Round 2 Score (interview)
   - Interview evaluation summary
   - Hire recommendation
   - Strengths and areas for improvement

### Candidate Dialog Display

```
┌─────────────────────────────────────────────────────┐
│              Evaluation Summary                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │  82/100 │  │ 75/100  │  │ 85/100  │            │
│  │  Final  │  │ Resume  │  │Interview│            │
│  └─────────┘  └─────────┘  └─────────┘            │
│                                                     │
│  Recommendation: STRONG YES                         │
│  "Excellent candidate with solid technical skills" │
│  Strengths: Strong technical knowledge, Clear comm.│
└─────────────────────────────────────────────────────┘
```

## HR Dashboard Workflow

### Step 1: Review Applications
- View all applicants
- See METIS scores (Round 1)
- Click "Evaluate Applications" to process resumes

### Step 2: Conduct Interviews
- Candidates complete AI interviews
- Transcripts automatically saved
- Click "Evaluate Applications" again to process interviews

### Step 3: Generate Rankings
- Click "Generate Rankings"
- View sorted leaderboard
- See final combined scores
- Filter by Round 1/Round 2/Rejected

### Step 4: Review Candidates
- Click on any candidate
- See comprehensive evaluation summary
- View both resume and interview scores
- Read AI recommendations
- Make hiring decision

## Advantages of Combined Scoring

### 1. Holistic Assessment
- Resume (30%) validates credentials and experience
- Interview (70%) validates real-world skills and fit

### 2. Reduced Bias
- Resume score prevents interview-only bias
- Interview score prevents paper qualification bias

### 3. Weighted Priorities
- Emphasizes actual performance (70%)
- Still considers background (30%)

### 4. Clear Decision Making
- Single final score for easy comparison
- Detailed breakdown for nuanced decisions
- AI recommendations for confidence

## Example Scenarios

### Scenario A: Strong Resume, Weak Interview
- Resume Score: 90/100
- Interview Score: 50/100
- Final Score = (90 × 0.3) + (50 × 0.7) = 27 + 35 = **62/100**
- **Result:** Moderate candidate, might need more practice

### Scenario B: Moderate Resume, Strong Interview
- Resume Score: 60/100
- Interview Score: 90/100
- Final Score = (60 × 0.3) + (90 × 0.7) = 18 + 63 = **81/100**
- **Result:** Top candidate, performs well under pressure

### Scenario C: Balanced Strong Candidate
- Resume Score: 85/100
- Interview Score: 85/100
- Final Score = (85 × 0.3) + (85 × 0.7) = 25.5 + 59.5 = **85/100**
- **Result:** Top candidate, consistently strong

## Database Collections

### Applications
- Stores resume evaluation
- Stores interview evaluation
- Stores final combined score

### Interviews
- Stores conversation transcript
- Links to application
- Tracks completion status

### Leaderboards
- Stores sorted rankings
- Includes all scores
- Generated per job

## Testing the Pipeline

### 1. Test Resume Evaluation
```bash
curl -X POST http://localhost:5000/api/evaluation/batch-evaluate/JOB_ID
```

### 2. Test Interview Evaluation
```bash
curl -X POST http://localhost:5000/api/evaluation/batch-evaluate-interviews/JOB_ID
```

### 3. Test Rankings
```bash
curl -X POST http://localhost:5000/api/advanced-ranking/generate/JOB_ID
```

## Future Enhancements

1. **Customizable Weights**
   - Allow HR to adjust resume/interview ratio
   - Per-job weight configuration

2. **Score Thresholds**
   - Configurable cutoffs for Round 1/2/Rejected
   - Automatic screening

3. **Interview Templates**
   - Role-specific interview questions
   - Difficulty levels

4. **Analytics Dashboard**
   - Score distribution graphs
   - Correlation analysis
   - Hiring pipeline metrics

## Conclusion

This implementation provides a complete, AI-powered recruitment pipeline that:
- ✅ Automatically evaluates resumes (30%)
- ✅ Conducts and evaluates interviews (70%)
- ✅ Combines scores intelligently
- ✅ Ranks candidates objectively
- ✅ Provides comprehensive summaries to HR
- ✅ Makes data-driven hiring decisions

The 30/70 split ensures candidates are evaluated on both credentials AND performance, leading to better hiring outcomes.
