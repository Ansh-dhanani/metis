# Metis Hackathon API Documentation

## Base URL
`http://localhost:5000`

## Jobs

### Create a Job
**Endpoint:** `POST /api/jobs/`
**Description:** Creates a new job description entry.
**Body:**
```json
{
  "title": "Senior React Developer",
  "rawText": "Looking for a senior developer with React, Node.js, and MongoDB experience."
}
```
**Response:**
```json
{
  "jobId": "<ID>",
  "message": "Job created successfully"
}
```

### Parse Job Description
**Endpoint:** `POST /api/jobs/<job_id>/parse`
**Description:** Triggers the AI parsing of the JD (Mocked) and calculates skill weights.
**Response:**
```json
{
  "parsedData": {
    "requiredSkills": [...],
    "experienceLevel": "..."
  },
  "skillWeights": [...]
}
```

## Assessments

### Create Assessment (Helper)
**Endpoint:** `POST /api/assessments/create`
**Description:** Creates a pending assessment for a candidate.
**Body:**
```json
{
  "jobId": "<JOB_ID>",
  "candidateId": "dummy_candidate_001"
}
```
**Response:**
```json
{
  "assessmentId": "<ID>",
  "message": "Assessment created"
}
```

### Start Assessment
**Endpoint:** `POST /api/assessments/<assessment_id>/start`
**Description:** Generates initial questions and starts the timer.
**Response:**
```json
{
  "questions": [
    {
      "questionId": "...",
      "difficulty": 5,
      "text": "..."
    }
  ]
}
```

### Submit Answer
**Endpoint:** `POST /api/assessments/<assessment_id>/submit`
**Description:** Submits an answer to a question.
**Body:**
```json
{
  "questionId": "<QUESTION_ID>",
  "answer": "Option A"
}
```
**Response:**
```json
{
  "isCorrect": true,
  "explanation": "...",
  "nextQuestion": {...}
}
```

## Rankings

### Generate Rankings
**Endpoint:** `POST /api/rankings/job/<job_id>/generate`
**Description:** Generates/Updates rankings for all candidates associated with a job.
**Response:**
```json
{
  "rankings": [
    {
      "candidateId": "...",
      "rank": 1,
      "weightedScore": ...
    }
  ]
}
```

### Get Rankings
**Endpoint:** `GET /api/rankings/job/<job_id>`
**Description:** Retrieves the latest rankings.

## Interviews

### Generate Interview Questions
**Endpoint:** `POST /api/interview/generate`
**Description:** Generates follow-up interview questions based on assessment performance.
**Body:**
```json
{
  "assessmentId": "<ASSESSMENT_ID>"
}
```
**Response:**
```json
{
  "questions": {
    "strengths": [...],
    "weaknesses": [...]
  }
}
```

### Get Interview Questions
**Endpoint:** `GET /api/interview/assessment/<assessment_id>`
**Description:** Retrieves generated interview questions.

## Users

### Register (HR/Candidate)
**Endpoint:** `POST /api/users/register`
**Body:**
```json
{
  "email": "hr@example.com",
  "password": "securepassword",
  "role": "hr", // or "candidate"
  "firstName": "John",
  "lastName": "Doe",
  "linkedinUrl": "https://linkedin.com/in/johndoe",
  "githubUrl": "https://github.com/johndoe",
  "portfolioUrl": "https://johndoe.com"
}
```
**Response:**
```json
{
  "userId": "<ID>",
  "message": "User registered successfully"
}
```

### Login
**Endpoint:** `POST /api/users/login`
**Body:**
```json
{
  "email": "hr@example.com",
  "password": "securepassword"
}
```
**Response:**
```json
{
  "userId": "<ID>",
  "role": "hr",
  "name": "John Doe"
}
```

### Upload Resume (Candidate Only)
**Endpoint:** `POST /api/users/<user_id>/resume`
**Body:**
```json
{
  "rawText": "Resume content... I know Python and React..."
}
```
**Response:**
```json
{
  "message": "Resume processed",
  "parsedData": {...}
}
```

### Get Profile
**Endpoint:** `GET /api/users/<user_id>`
**Description:** Get detailed user profile.

### Update Profile
**Endpoint:** `PUT /api/users/<user_id>`
**Description:** Update user profile details.
**Body:**
```json
{
  "firstName": "John",
  "linkedinUrl": "https://linkedin.com/in/new-url",
  "portfolioUrl": "https://new-portfolio.com"
}
```
**Response:**
```json
{
  "message": "Profile updated successfully"
}
```
