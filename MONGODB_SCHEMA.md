# MongoDB Schema Documentation - Metis-Hire Backend

## Overview
The metis-hire backend uses MongoDB to store application, job posting, candidate assessment, and interview data. The database name is `metis_db`.

---

## Collections Overview

### 1. **users** Collection
Stores user profiles for HR managers and job candidates.

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | ✓ | MongoDB unique identifier |
| `email` | String | ✓ | User email (unique index recommended) |
| `password` | String | ✓ | Hashed password (should be hashed in production) |
| `firstName` | String | Optional | Candidate first name |
| `lastName` | String | Optional | Candidate last name |
| `phone` | String | Optional | Contact phone number |
| `role` | String | ✓ | User role: `"hr"` or `"candidate"` |
| `linkedinUrl` | String | Optional | LinkedIn profile URL |
| `githubUrl` | String | Optional | GitHub profile URL |
| `portfolioUrl` | String | Optional | Portfolio website URL |
| `oauthProvider` | String | Optional | OAuth provider (e.g., "google", "github") |
| `oauthProviderId` | String | Optional | OAuth provider's user ID |
| `image` | String | Optional | Profile image URL |
| `resume` | Object | Optional | Resume object (see structure below) |
| `resume.rawText` | String | Optional | Full resume text |
| `skills` | Array[String] | Optional | List of user skills |
| `createdAt` | Date | ✓ | Account creation timestamp |
| `credibilityScore` | Object | Optional | Trust/reliability score (candidates only) |
| `credibilityScore.score` | Number (0-100) | Optional | Current credibility score |
| `credibilityScore.incidents` | Array | Optional | List of credibility incidents |
| `updatedAt` | Date | Optional | Last profile update timestamp |

**Example Document:**
```json
{
  "_id": ObjectId("..."),
  "email": "john@example.com",
  "password": "hashed_password",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "555-1234",
  "role": "candidate",
  "linkedinUrl": "https://linkedin.com/in/johndoe",
  "githubUrl": "https://github.com/johndoe",
  "portfolioUrl": "https://johndoe.dev",
  "skills": ["Python", "JavaScript", "React"],
  "resume": {
    "rawText": "John Doe...\nExperienced...",
  },
  "credibilityScore": {
    "score": 100,
    "incidents": []
  },
  "createdAt": ISODate("2024-01-15T10:30:00Z")
}
```

---

### 2. **jobs** Collection
Stores job postings created by HR managers.

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | ✓ | Job posting ID |
| `hrId` | ObjectId | ✓ | HR user ID who created the job |
| `title` | String | ✓ | Job title |
| `description` | String | Optional | Full job description text |
| `location` | String | Optional | Job location |
| `type` | String | Optional | Employment type (e.g., "full-time", "part-time") |
| `rawText` | String | Optional | Raw/unparsed job description |
| `createdAt` | Date | ✓ | Job creation timestamp |
| `updatedAt` | Date | Optional | Last update timestamp |
| `parsedData` | Object | Optional | Structured parsed job data |
| `skillWeights` | Array[Object] | Optional | Weighted required skills (see structure) |
| `skillWeights[].skill` | String | Optional | Skill name |
| `skillWeights[].weight` | Number (0-1) | Optional | Weight in final score (sum = 1.0) |
| `skillWeights[].importance` | Number (1-10) | Optional | Importance rating |
| `status` | String | ✓ | Job status: `"open"`, `"closed"`, or `"filled"` |
| `autoSelectTopCandidate` | Boolean | Optional | Auto-select best candidate feature enabled |
| `autoSelectDate` | Date | Optional | Auto-select execution date |
| `autoCloseEnabled` | Boolean | Optional | Auto-close job feature enabled |
| `autoCloseDate` | Date | Optional | Auto-close job deadline |
| `deadline` | Date | Optional | Application deadline (alias for autoCloseDate) |
| `maxApplicationsEnabled` | Boolean | Optional | Max applications limit enabled |
| `maxApplications` | Number | Optional | Maximum allowed applications |
| `applicationCount` | Number | ✓ | Current application count (default: 0) |
| `selectedCandidateId` | ObjectId | Optional | ID of selected candidate |
| `closedAt` | Date | Optional | When job was closed |

**Example Document:**
```json
{
  "_id": ObjectId("..."),
  "hrId": ObjectId("..."),
  "title": "Senior Python Developer",
  "description": "We are looking for...",
  "location": "San Francisco, CA",
  "type": "full-time",
  "status": "open",
  "skillWeights": [
    {
      "skill": "Python",
      "weight": 0.4,
      "importance": 9
    },
    {
      "skill": "Django",
      "weight": 0.3,
      "importance": 8
    }
  ],
  "autoCloseEnabled": true,
  "autoCloseDate": ISODate("2024-02-28T23:59:59Z"),
  "applicationCount": 12,
  "createdAt": ISODate("2024-01-20T08:00:00Z")
}
```

---

### 3. **applications** Collection
Stores job applications from candidates.

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | ✓ | Application ID |
| `jobId` | ObjectId | ✓ | Reference to job posting |
| `candidateId` | ObjectId | ✓ | Reference to candidate user |
| `candidateName` | String | ✓ | Candidate name (stored snapshot) |
| `candidateEmail` | String | ✓ | Candidate email (stored snapshot) |
| `status` | String | ✓ | Status: `"pending"`, `"under_review"`, `"assessment_sent"`, `"assessment_completed"`, `"rejected"`, `"accepted"` |
| `stage` | String | ✓ | Application stage: `"application_submitted"`, `"resume_reviewed"`, `"assessment_pending"`, `"assessment_completed"`, `"interview_scheduled"`, `"offer_sent"` |
| `appliedAt` | Date | ✓ | Application submission timestamp |
| `resumeScore` | Number (0-100) | ✓ | METIS resume evaluation score |
| `metisEvaluation` | Object | Optional | Full METIS evaluation result |
| `evaluatedAt` | Date | Optional | Evaluation completion timestamp |
| `eligible` | Boolean | ✓ | Whether candidate passed initial screening |
| `profileSnapshot` | Object | ✓ | Snapshot of candidate profile at application time |
| `profileSnapshot.firstName` | String | Optional | Candidate first name |
| `profileSnapshot.lastName` | String | Optional | Candidate last name |
| `profileSnapshot.email` | String | ✓ | Email |
| `profileSnapshot.skills` | Array[String] | Optional | Skills list |
| `profileSnapshot.resumeText` | String | Optional | Resume text |
| `profileSnapshot.githubUrl` | String | Optional | GitHub URL |
| `profileSnapshot.portfolioUrl` | String | Optional | Portfolio URL |
| `assessmentId` | ObjectId | Optional | Reference to linked assessment |
| `metisScore` | Number (0-100) | Optional | Overall METIS evaluation score |
| `round1_score` | Number (0-100) | Optional | Round 1 assessment score |
| `round1_complete` | Boolean | Optional | Round 1 completion status |
| `round2_complete` | Boolean | Optional | Round 2 completion status |

**Example Document:**
```json
{
  "_id": ObjectId("..."),
  "jobId": ObjectId("..."),
  "candidateId": ObjectId("..."),
  "candidateName": "Jane Smith",
  "candidateEmail": "jane@example.com",
  "status": "assessment_sent",
  "stage": "assessment_pending",
  "appliedAt": ISODate("2024-01-25T14:20:00Z"),
  "resumeScore": 78,
  "metisEvaluation": {
    "model": "metis_core_v1",
    "overall_score": 78,
    "section_scores": { ... }
  },
  "eligible": true,
  "profileSnapshot": {
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "skills": ["Python", "Django", "PostgreSQL"],
    "resumeText": "..."
  },
  "assessmentId": ObjectId("...")
}
```

---

### 4. **assessments** Collection
Stores skill-based assessments for candidates.

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | ✓ | Assessment ID |
| `jobId` | ObjectId | ✓ | Reference to job posting |
| `candidateId` | ObjectId/String | ✓ | Candidate ID (may be string for test data) |
| `applicationId` | ObjectId | Optional | Reference to application |
| `status` | String | ✓ | Status: `"pending"`, `"in_progress"`, `"completed"` |
| `createdAt` | Date | ✓ | Assessment creation timestamp |
| `startedAt` | Date | Optional | When candidate started assessment |
| `completedAt` | Date | Optional | When candidate completed assessment |
| `questions` | Array[Object] | ✓ | Assessment questions |
| `questions[].questionId` | String | Optional | Unique question ID |
| `questions[].skill` | String | Optional | Related skill |
| `questions[].question` | String | Optional | Question text |
| `questions[].correctAnswer` | String | Optional | Correct answer |
| `questions[].explanation` | String | Optional | Answer explanation |
| `questions[].difficulty` | Number (1-10) | Optional | Question difficulty |
| `responses` | Array[Object] | ✓ | Candidate's answers |
| `responses[].questionId` | String | Optional | Question ID |
| `responses[].answer` | String | Optional | Candidate's answer |
| `responses[].isCorrect` | Boolean | Optional | Answer correctness |
| `responses[].timestamp` | Date | Optional | Answer submission time |
| `responses[].skill` | String | Optional | Associated skill |
| `overallScore` | Number (0-100) | Optional | Final assessment score |

**Example Document:**
```json
{
  "_id": ObjectId("..."),
  "jobId": ObjectId("..."),
  "candidateId": ObjectId("..."),
  "status": "completed",
  "createdAt": ISODate("2024-01-26T10:00:00Z"),
  "startedAt": ISODate("2024-01-26T11:00:00Z"),
  "completedAt": ISODate("2024-01-26T12:30:00Z"),
  "questions": [
    {
      "questionId": "q1",
      "skill": "Python",
      "question": "What is a decorator in Python?",
      "correctAnswer": "answer_2",
      "difficulty": 5
    }
  ],
  "responses": [
    {
      "questionId": "q1",
      "answer": "answer_2",
      "isCorrect": true,
      "timestamp": ISODate("2024-01-26T11:05:00Z")
    }
  ],
  "overallScore": 85
}
```

---

### 5. **interview_questions** Collection
Stores generated interview questions for assessments.

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | ✓ | Record ID |
| `assessmentId` | ObjectId | ✓ | Reference to assessment |
| `questions` | Object | ✓ | Interview questions grouped by type |
| `questions.strengths` | Array[Object] | Optional | Questions exploring strengths |
| `questions.strengths[].skill` | String | Optional | Related skill |
| `questions.strengths[].question` | String | Optional | Question text |
| `questions.weaknesses` | Array[Object] | Optional | Questions exploring weaknesses |
| `questions.clarifications` | Array[Object] | Optional | Clarification questions |
| `generatedAt` | Date | ✓ | Generation timestamp |

**Example Document:**
```json
{
  "_id": ObjectId("..."),
  "assessmentId": ObjectId("..."),
  "questions": {
    "strengths": [
      {
        "skill": "Python",
        "question": "Tell us about your most complex Python project..."
      }
    ],
    "weaknesses": [
      {
        "skill": "DevOps",
        "question": "Have you worked with container orchestration?"
      }
    ],
    "clarifications": []
  },
  "generatedAt": ISODate("2024-01-27T09:15:00Z")
}
```

---

### 6. **interviews** Collection
Stores live interview sessions and transcripts.

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | ✓ | Interview ID |
| `jobId` | ObjectId | ✓ | Reference to job posting |
| `applicationId` | ObjectId | ✓ | Reference to application |
| `candidateId` | ObjectId | ✓ | Reference to candidate |
| `candidateName` | String | ✓ | Candidate name |
| `startedAt` | Date | ✓ | Interview start timestamp |
| `endedAt` | Date | Optional | Interview end timestamp |
| `duration` | Number | Optional | Interview duration in seconds |
| `messages` | Array[Object] | ✓ | Interview conversation |
| `messages[].role` | String | Optional | `"ai"` or `"candidate"` |
| `messages[].text` | String | Optional | Message text |
| `messages[].timestamp` | Date | Optional | Message timestamp |
| `transcript` | String | Optional | Full interview transcript text |
| `evaluation` | Object | Optional | Interview evaluation scores |
| `evaluation.personality_score` | Number (0-100) | Optional | Personality assessment score |
| `evaluation.technical_approach_score` | Number (0-100) | Optional | Technical approach score |
| `evaluation.communication_score` | Number (0-100) | Optional | Communication score |
| `evaluation.problem_solving_score` | Number (0-100) | Optional | Problem-solving score |
| `evaluation.strengths` | Array[String] | Optional | Interview strengths |
| `evaluation.areas_for_improvement` | Array[String] | Optional | Areas needing improvement |
| `evaluation.overall_assessment` | String | Optional | Summary assessment |
| `evaluation.hire_recommendation` | String | Optional | Recommendation: `"strong_yes"`, `"yes"`, `"maybe"`, `"no"`, `"strong_no"` |
| `evaluationScore` | Number (0-100) | Optional | Overall interview score |

**Example Document:**
```json
{
  "_id": ObjectId("..."),
  "jobId": ObjectId("..."),
  "applicationId": ObjectId("..."),
  "candidateId": ObjectId("..."),
  "candidateName": "Jane Smith",
  "startedAt": ISODate("2024-01-28T14:00:00Z"),
  "endedAt": ISODate("2024-01-28T14:45:00Z"),
  "duration": 2700,
  "messages": [
    {
      "role": "ai",
      "text": "Hello Jane, thanks for joining...",
      "timestamp": ISODate("2024-01-28T14:00:30Z")
    },
    {
      "role": "candidate",
      "text": "Thank you for having me...",
      "timestamp": ISODate("2024-01-28T14:01:15Z")
    }
  ],
  "evaluation": {
    "personality_score": 85,
    "technical_approach_score": 78,
    "communication_score": 88,
    "problem_solving_score": 82,
    "hire_recommendation": "yes"
  }
}
```

---

### 7. **rankings** Collection
Stores candidate rankings and leaderboards for jobs (Round 1 and Round 2).

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | ✓ | Ranking record ID |
| `jobId` | ObjectId | ✓ | Reference to job posting |
| `generatedAt` | Date | ✓ | Ranking generation timestamp |
| `rankings` | Array[Object] | ✓ | List of ranked candidates |
| `rankings[].candidateId` | ObjectId | ✓ | Candidate ID |
| `rankings[].candidateName` | String | ✓ | Candidate name |
| `rankings[].weightedScore` | Number (0-100) | ✓ | Weighted assessment score |
| `rankings[].skillBreakdown` | Object | Optional | Skill-by-skill scores |
| `rankings[].skillBreakdown.<skill>` | Number (0-100) | Optional | Score for each skill |
| `rankings[].strengths` | Array[String] | Optional | Top 3 strength areas |
| `rankings[].weaknesses` | Array[String] | Optional | Top 3 weakness areas |
| `rankings[].recommendation` | String | Optional | Recommendation: `"strong_hire"`, `"hire"`, `"maybe"`, `"no_hire"` |
| `rankings[].credibilityScore` | Number (0-100) | Optional | Candidate credibility |
| `rankings[].rank` | Number | ✓ | Ranking position (1-indexed) |
| `rankings[].integrity_score` | Number (0-100) | Optional | Resume vs assessment consistency |
| `rankings[].final_score` | Number (0-100) | Optional | Final weighted score after integrity check |
| `rankings[].shortlist_status` | String | Optional | `"round_1"`, `"round_2"`, `"rejected"`, `"pending"` |
| `total_applicants` | Number | Optional | Total applications for job |
| `round_1_count` | Number | Optional | Candidates advancing to Round 1 |
| `round_2_count` | Number | Optional | Candidates advancing to Round 2 |
| `rejected_count` | Number | Optional | Rejected candidates count |

**Example Document:**
```json
{
  "_id": ObjectId("..."),
  "jobId": ObjectId("..."),
  "generatedAt": ISODate("2024-01-29T16:00:00Z"),
  "rankings": [
    {
      "candidateId": ObjectId("..."),
      "candidateName": "Jane Smith",
      "weightedScore": 87.5,
      "skillBreakdown": {
        "Python": 90,
        "Django": 85,
        "PostgreSQL": 85
      },
      "strengths": ["Python", "Django", "PostgreSQL"],
      "weaknesses": ["DevOps"],
      "recommendation": "strong_hire",
      "credibilityScore": 100,
      "rank": 1,
      "final_score": 87.5,
      "shortlist_status": "round_2"
    }
  ],
  "total_applicants": 45,
  "round_1_count": 28,
  "round_2_count": 12,
  "rejected_count": 5
}
```

---

## Data Type Reference

| Type | Description | MongoDB Type |
|------|-------------|--------------|
| `ObjectId` | MongoDB unique identifier | ObjectId |
| `String` | Text data | String |
| `Number` | Integer or floating-point | Int32, Int64, or Double |
| `Boolean` | true/false value | Boolean |
| `Date` | ISO 8601 timestamp | ISODate |
| `Array[Type]` | List of items | Array |
| `Object` | Nested document | Document |

---

## Indexes (Recommended)

For optimal query performance, create these indexes:

```javascript
// Users collection
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

// Jobs collection
db.jobs.createIndex({ hrId: 1 });
db.jobs.createIndex({ status: 1 });
db.jobs.createIndex({ createdAt: -1 });

// Applications collection
db.applications.createIndex({ jobId: 1 });
db.applications.createIndex({ candidateId: 1 });
db.applications.createIndex({ jobId: 1, candidateId: 1 }, { unique: true });
db.applications.createIndex({ status: 1 });
db.applications.createIndex({ appliedAt: -1 });

// Assessments collection
db.assessments.createIndex({ jobId: 1 });
db.assessments.createIndex({ candidateId: 1 });
db.assessments.createIndex({ applicationId: 1 });
db.assessments.createIndex({ status: 1 });

// Interview questions collection
db.interview_questions.createIndex({ assessmentId: 1 });

// Interviews collection
db.interviews.createIndex({ jobId: 1 });
db.interviews.createIndex({ applicationId: 1 });
db.interviews.createIndex({ candidateId: 1 });

// Rankings collection
db.rankings.createIndex({ jobId: 1 }, { unique: true });
```

---

## Key Relationships

```
users (HR)
  └─ creates → jobs
              ├─ receives → applications (from candidates)
              │               └─ generates → assessments
              │                   ├─ creates → interview_questions
              │                   └─ leads_to → interviews
              └─ produces → rankings
                  (aggregates assessment & interview scores)
```

---

## Notes on Data Consistency

1. **Snapshot Data**: Applications store a `profileSnapshot` of the candidate's profile at application time. This prevents changes to the user profile from affecting historical application data.

2. **Skill Weights**: Jobs contain `skillWeights` from JD parsing. These determine how much each skill contributes to the final assessment score.

3. **Resume Evaluation**: Applications capture the `metisEvaluation` (METIS-CORE evaluation) and `resumeScore` at application time.

4. **Score Calculation**:
   - **Round 1**: Resume evaluation + Assessment scores weighted by job requirements
   - **Round 2**: Interview evaluation scores
   - **Final Score**: Weighted average considering both rounds

5. **Status Progression**:
   - Application: `pending` → `under_review` → `assessment_sent` → `assessment_completed` → `rejected`/`accepted`
   - Assessment: `pending` → `in_progress` → `completed`
   - Interview: Created after assessment, evaluated upon completion

---

## Generated vs. User-Provided Data

- **Generated**: Assessment questions (via AI), Interview questions, Rankings, Scores
- **User-Provided**: Resumes, skills, contact info, job descriptions
- **AI-Enhanced**: METIS evaluations, Interview transcripts and evaluations

