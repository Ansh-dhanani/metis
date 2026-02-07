 # METIS - 3-Day Hackathon Implementation Plan
## AI-Powered Recruitment Assessment Platform

---

## 🎯 EXECUTIVE SUMMARY

**Vision**: Transform hiring from manual screening to intelligent, predictive assessment in 72 hours  
**Core Value**: Automated, bias-free, competency-based candidate evaluation  
**Hackathon Goal**: Build a functional MVP demonstrating core JD parsing → Assessment generation → Candidate evaluation flow

---

## 📊 PROJECT ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                         METIS PLATFORM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  INPUT LAYER          PROCESSING LAYER         OUTPUT LAYER     │
│  ┌──────────┐        ┌──────────────┐        ┌──────────────┐  │
│  │   Job    │───────→│  NLP Parser  │───────→│  Assessment  │  │
│  │Description│        │  + AI Model  │        │  Generator   │  │
│  └──────────┘        └──────────────┘        └──────────────┘  │
│       │                      │                       │          │
│       │              ┌──────────────┐                │          │
│       │              │ Competency   │                │          │
│       └─────────────→│ Framework    │←───────────────┘          │
│                      │  Builder     │                           │
│                      └──────────────┘                           │
│                             │                                   │
│                      ┌──────────────┐                           │
│                      │ Multi-Modal  │                           │
│                      │ Assessment   │                           │
│                      │   Engine     │                           │
│                      └──────────────┘                           │
│                             │                                   │
│               ┌─────────────┼─────────────┐                     │
│               │             │             │                     │
│        ┌──────▼────┐ ┌──────▼────┐ ┌──────▼────┐               │
│        │ Knowledge │ │Situational│ │ Practical │               │
│        │   Tests   │ │ Judgment  │ │Simulation │               │
│        └───────────┘ └───────────┘ └───────────┘               │
│                             │                                   │
│                      ┌──────▼──────┐                            │
│                      │  Integrity  │                            │
│                      │    Layer    │                            │
│                      └──────┬──────┘                            │
│                             │                                   │
│                      ┌──────▼──────┐                            │
│                      │ Predictive  │                            │
│                      │Fit Report   │                            │
│                      └─────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗓️ 3-DAY SPRINT BREAKDOWN

### **DAY 1: FOUNDATION & CORE INTELLIGENCE** ⚡
**Focus**: JD Parsing + Competency Framework + Basic Assessment Generation

#### Morning (0-4 hours): Setup & Architecture
- [ ] **Environment Setup** (1h)
  - Tech stack selection & dependencies
  - Database schema design
  - API architecture planning
  
- [ ] **JD Parser Development** (3h)
  - NLP model integration (spaCy/OpenAI)
  - Entity extraction (skills, experience, tools)
  - Skill categorization logic

**Output**: Working JD parser that extracts structured data

#### Afternoon (4-8 hours): Competency Framework Builder
- [ ] **Skill Taxonomy Engine** (2h)
  - Mandatory vs Preferred skill classification
  - Seniority level mapping (Junior/Mid/Senior)
  - Domain-specific competency libraries
  
- [ ] **Assessment Blueprint Generator** (2h)
  - Question difficulty calibration
  - Multi-modal assessment type selector
  - Weightage calculation algorithm

**Output**: Competency framework + Assessment blueprint from JD

#### Evening (8-12 hours): Assessment Generation Engine
- [ ] **Knowledge Test Generator** (3h)
  - Question bank creation (API integration)
  - Adaptive difficulty logic
  - MCQ/Technical question templates
  
- [ ] **Database & Backend API** (1h)
  - CRUD operations for assessments
  - Candidate data models
  - Assessment submission endpoints

**Day 1 Deliverable**: System that converts JD → Structured competencies → Generated assessment

---

## 🔄 COMPLETE SYSTEM FLOW (8 STAGES)

### **Stage 1: JD Parser** 📄

**What Happens:**
1. Recruiter uploads job description text via frontend
2. Frontend sends POST request to `/api/jobs` with raw JD text
3. Flask backend calls `/api/jobs/{job_id}/parse`
4. AI service (OpenAI/Gemini) extracts:
   - Required skills with importance scores (1-10)
   - Experience level (entry/mid/senior/lead)
   - Skill categories (technical/soft/domain)

**Flask Implementation:**
```python
# services/ai_service.py
def parse_job_description(raw_text):
    prompt = f"""
    Extract skills from this job description and rate importance 1-10:
    {raw_text}
    
    Return JSON:
    {{
        "requiredSkills": [{{"skill": "React", "importance": 9, "category": "technical"}}],
        "experienceLevel": "senior"
    }}
    """
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    return json.loads(response.choices[0].message.content)
```

**Database Update:**
```python
# routes/jobs.py
@jobs_bp.route('/<job_id>/parse', methods=['POST'])
def parse_job_description(job_id):
    job = db.jobs.find_one({"_id": ObjectId(job_id)})
    parsed_data = ai_service.parse_job_description(job['rawText'])
    
    db.jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {"parsedData": parsed_data}}
    )
    return jsonify(parsed_data)
```

---

### **Stage 2: Skill Weighting** ⚖️

**What Happens:**
1. After parsing, calculate normalized weights for each skill
2. Weight = skill importance / total importance
3. Ensures sum of all weights = 1.0

**Flask Implementation:**
```python
# services/parser_service.py
def calculate_skill_weights(parsed_skills):
    total_importance = sum(skill['importance'] for skill in parsed_skills)
    
    weights = []
    for skill in parsed_skills:
        weight = skill['importance'] / total_importance
        weights.append({
            'skill': skill['skill'],
            'weight': round(weight, 3),
            'reasoning': f"Importance: {skill['importance']}/10"
        })
    
    return weights

# Example output:
# [
#   {"skill": "React", "weight": 0.300, "reasoning": "Importance: 9/10"},
#   {"skill": "Node.js", "weight": 0.233, "reasoning": "Importance: 7/10"},
#   {"skill": "MongoDB", "weight": 0.200, "reasoning": "Importance: 6/10"}
# ]
```

---

### **Stage 3: Adaptive Assessment Generation** 🎯

**What Happens:**
1. Candidate starts assessment via `/api/assessments/{id}/start`
2. System generates initial questions (medium difficulty = 5)
3. As candidate answers:
   - **Correct answer** → Next question difficulty +2
   - **Wrong answer** → Next question difficulty -1
4. Questions adapt in real-time based on performance

**Flask Implementation:**
```python
# routes/assessments.py
@assessments_bp.route('/<assessment_id>/start', methods=['POST'])
def start_assessment(assessment_id):
    assessment = db.assessments.find_one({"_id": ObjectId(assessment_id)})
    job = db.jobs.find_one({"_id": assessment['jobId']})
    
    # Generate initial questions (medium difficulty)
    questions = []
    for skill_weight in job['skillWeights']:
        question = ai_service.generate_question(
            skill=skill_weight['skill'],
            difficulty=5  # Start medium
        )
        questions.append(question)
    
    db.assessments.update_one(
        {"_id": ObjectId(assessment_id)},
        {"$set": {
            "questions": questions,
            "status": "in_progress",
            "startedAt": datetime.now()
        }}
    )
    
    return jsonify({"questions": questions})

@assessments_bp.route('/<assessment_id>/submit', methods=['POST'])
def submit_answer(assessment_id):
    data = request.json
    assessment = db.assessments.find_one({"_id": ObjectId(assessment_id)})
    
    # Find current question
    question = next(q for q in assessment['questions'] 
                   if q['questionId'] == data['questionId'])
    
    # Check correctness
    is_correct = (data['answer'] == question['correctAnswer'])
    
    # Save response
    db.assessments.update_one(
        {"_id": ObjectId(assessment_id)},
        {"$push": {
            "responses": {
                "questionId": data['questionId'],
                "answer": data['answer'],
                "isCorrect": is_correct,
                "timeTaken": data['timeTaken'],
                "timestamp": datetime.now()
            }
        }}
    )
    
    # Generate adaptive next question
    if is_correct:
        next_difficulty = min(question['difficulty'] + 2, 10)
    else:
        next_difficulty = max(question['difficulty'] - 1, 1)
    
    next_question = ai_service.generate_question(
        skill=question['skill'],
        difficulty=next_difficulty
    )
    
    return jsonify({
        "isCorrect": is_correct,
        "explanation": question['explanation'],
        "nextQuestion": next_question
    })
```

---

### **Stage 4: Skill Scoring** 📊

**What Happens:**
1. After assessment completion, calculate score for each skill
2. Score formula: `(accuracy × 70) + (avg_difficulty × 3)`
3. Accuracy = correct answers / total questions
4. Higher difficulty questions = bonus points

**Flask Implementation:**
```python
# services/scoring_service.py
def calculate_skill_scores(assessment):
    skill_scores = {}
    
    for response in assessment['responses']:
        question = next(q for q in assessment['questions'] 
                       if q['questionId'] == response['questionId'])
        skill = question['skill']
        
        if skill not in skill_scores:
            skill_scores[skill] = {
                'total': 0,
                'correct': 0,
                'difficulties': []
            }
        
        skill_scores[skill]['total'] += 1
        if response['isCorrect']:
            skill_scores[skill]['correct'] += 1
            skill_scores[skill]['difficulties'].append(question['difficulty'])
    
    # Calculate final scores
    results = []
    for skill, data in skill_scores.items():
        accuracy = data['correct'] / data['total']
        avg_difficulty = (sum(data['difficulties']) / len(data['difficulties']) 
                         if data['difficulties'] else 0)
        
        # Score = accuracy * 70 + difficulty_bonus * 30
        score = (accuracy * 70) + (avg_difficulty * 3)
        
        results.append({
            'skill': skill,
            'score': min(score, 100),
            'accuracy': accuracy,
            'questionsAttempted': data['total'],
            'correctAnswers': data['correct'],
            'avgDifficulty': avg_difficulty
        })
    
    return results
```

---

### **Stage 5: Resume Consistency Check** 🔍

**What Happens:**
1. Compare candidate's resume claims with actual assessment scores
2. Flag discrepancies (e.g., claims "Expert in Python" but scores 30%)
3. Update user's credibility score (starts at 100, decreases with incidents)

**Flask Implementation:**
```python
# services/scoring_service.py
def check_resume_consistency(assessment_id):
    assessment = db.assessments.find_one({"_id": ObjectId(assessment_id)})
    candidate = db.users.find_one({"_id": assessment['candidateId']})
    
    resume_skills = candidate.get('resume', {}).get('parsedData', {}).get('skills', [])
    
    # Expected scores by proficiency level
    expected_scores = {
        'Expert': 80,
        'Advanced': 70,
        'Intermediate': 50,
        'Beginner': 30
    }
    
    flags = []
    total_penalty = 0
    
    for skill_score in assessment['skillScores']:
        # Find skill in resume
        resume_skill = next((s for s in resume_skills 
                           if s['name'].lower() == skill_score['skill'].lower()), None)
        
        if resume_skill:
            claimed_level = resume_skill['proficiency']
            expected = expected_scores.get(claimed_level, 50)
            actual = skill_score['score']
            discrepancy = expected - actual
            
            if discrepancy > 20:  # Significant gap
                severity = 'high' if discrepancy > 40 else 'medium'
                
                flags.append({
                    'skill': skill_score['skill'],
                    'resumeClaim': claimed_level,
                    'assessmentScore': actual,
                    'discrepancy': discrepancy,
                    'severity': severity
                })
                
                # Calculate penalty
                penalty = discrepancy * 0.5
                total_penalty += penalty
                
                # Add incident to user's credibility record
                db.users.update_one(
                    {"_id": candidate['_id']},
                    {
                        "$inc": {"credibilityScore.score": -penalty},
                        "$push": {
                            "credibilityScore.incidents": {
                                "assessmentId": assessment_id,
                                "skill": skill_score['skill'],
                                "resumeClaim": claimed_level,
                                "actualPerformance": actual,
                                "discrepancy": discrepancy,
                                "timestamp": datetime.now()
                            }
                        }
                    }
                )
    
    # Save flags to assessment
    db.assessments.update_one(
        {"_id": ObjectId(assessment_id)},
        {"$set": {"consistencyFlags": flags}}
    )
    
    return flags
```

---

### **Stage 6: Weighted Ranking** 🏆

**What Happens:**
1. Calculate weighted score using JD-specific skill weights
2. Apply credibility penalty for consistency issues
3. Rank all candidates for the job

**Flask Implementation:**
```python
# routes/rankings.py
@rankings_bp.route('/job/<job_id>/generate', methods=['POST'])
def generate_rankings(job_id):
    job = db.jobs.find_one({"_id": ObjectId(job_id)})
    assessments = db.assessments.find({
        "jobId": ObjectId(job_id),
        "status": "completed"
    })
    
    rankings = []
    
    for assessment in assessments:
        candidate = db.users.find_one({"_id": assessment['candidateId']})
        
        # Calculate weighted score
        weighted_score = 0
        skill_breakdown = []
        
        for skill_weight in job['skillWeights']:
            # Find skill score
            skill_score = next((s for s in assessment['skillScores'] 
                              if s['skill'] == skill_weight['skill']), None)
            
            if skill_score:
                contribution = skill_score['score'] * skill_weight['weight']
                weighted_score += contribution
                
                skill_breakdown.append({
                    'skill': skill_weight['skill'],
                    'score': skill_score['score'],
                    'weight': skill_weight['weight'],
                    'contribution': contribution
                })
        
        # Apply credibility penalty
        credibility_score = candidate.get('credibilityScore', {}).get('score', 100)
        credibility_penalty = (100 - credibility_score) * 0.3
        final_score = weighted_score - credibility_penalty
        
        rankings.append({
            'candidateId': str(candidate['_id']),
            'candidateName': f"{candidate['firstName']} {candidate['lastName']}",
            'rawScore': assessment['overallScore'],
            'weightedScore': weighted_score,
            'credibilityAdjustedScore': final_score,
            'skillBreakdown': skill_breakdown,
            'hasConsistencyIssues': len(assessment.get('consistencyFlags', [])) > 0,
            'credibilityPenalty': credibility_penalty
        })
    
    # Sort by final score
    rankings.sort(key=lambda x: x['credibilityAdjustedScore'], reverse=True)
    
    # Assign ranks
    for i, ranking in enumerate(rankings):
        ranking['rank'] = i + 1
    
    # Save to database
    db.rankings.update_one(
        {"jobId": ObjectId(job_id)},
        {"$set": {
            "rankings": rankings,
            "generatedAt": datetime.now()
        }},
        upsert=True
    )
    
    return jsonify({"rankings": rankings})
```

---

### **Stage 7: Explainability** 💡

**What Happens:**
1. Generate human-readable explanation of ranking
2. Identify top 3 strengths and bottom 3 weaknesses
3. Explain why candidate ranked where they did

**Flask Implementation:**
```python
# services/scoring_service.py
def generate_explanation(ranking, assessment):
    # Sort skills by score
    sorted_skills = sorted(ranking['skillBreakdown'], 
                          key=lambda x: x['score'], reverse=True)
    
    explanation = {
        'summary': f"Ranked #{ranking['rank']} with score {ranking['credibilityAdjustedScore']:.1f}/100",
        'strengths': [],
        'weaknesses': [],
        'consistencyIssues': []
    }
    
    # Top 3 strengths
    for skill in sorted_skills[:3]:
        if skill['score'] > 70:
            explanation['strengths'].append({
                'skill': skill['skill'],
                'score': skill['score'],
                'message': f"Strong performance in {skill['skill']} (scored {skill['score']:.1f})"
            })
    
    # Bottom 3 weaknesses
    for skill in sorted_skills[-3:]:
        if skill['score'] < 50:
            explanation['weaknesses'].append({
                'skill': skill['skill'],
                'score': skill['score'],
                'message': f"Needs improvement in {skill['skill']} (scored {skill['score']:.1f})"
            })
    
    # Consistency issues
    if ranking['hasConsistencyIssues']:
        for flag in assessment.get('consistencyFlags', []):
            explanation['consistencyIssues'].append({
                'skill': flag['skill'],
                'message': f"Resume claims '{flag['resumeClaim']}' but scored {flag['assessmentScore']:.1f}"
            })
    
    return explanation
```

---

### **Stage 8: Interview Question Generator** 🟣

**What Happens:**
1. Analyze assessment results
2. Generate targeted interview questions:
   - **Strengths**: Probe depth of knowledge
   - **Weaknesses**: Explore learning potential
   - **Consistency issues**: Clarify discrepancies

**Flask Implementation:**
```python
# routes/interview.py
@interview_bp.route('/generate', methods=['POST'])
def generate_interview_questions():
    data = request.json
    assessment = db.assessments.find_one({"_id": ObjectId(data['assessmentId'])})
    
    # Sort skills by score
    sorted_skills = sorted(assessment['skillScores'], 
                          key=lambda x: x['score'], reverse=True)
    
    questions = {
        'strengths': [],
        'weaknesses': [],
        'clarifications': []
    }
    
    # Questions for top 3 skills (strengths)
    for skill in sorted_skills[:3]:
        if skill['score'] > 70:
            q = ai_service.generate_interview_question(
                skill=skill['skill'],
                type='depth_probe',
                context=f"Candidate scored {skill['score']:.1f}"
            )
            questions['strengths'].append({
                'skill': skill['skill'],
                'question': q,
                'reasoning': f"Verify depth of {skill['skill']} expertise"
            })
    
    # Questions for bottom 3 skills (weaknesses)
    for skill in sorted_skills[-3:]:
        if skill['score'] < 50:
            q = ai_service.generate_interview_question(
                skill=skill['skill'],
                type='gap_exploration',
                context=f"Candidate scored {skill['score']:.1f}"
            )
            questions['weaknesses'].append({
                'skill': skill['skill'],
                'question': q,
                'reasoning': f"Assess learning potential in {skill['skill']}"
            })
    
    # Questions for consistency issues
    for flag in assessment.get('consistencyFlags', []):
        if flag['severity'] in ['high', 'medium']:
            q = ai_service.generate_interview_question(
                skill=flag['skill'],
                type='clarification',
                context=f"Resume claims {flag['resumeClaim']} but scored {flag['assessmentScore']:.1f}"
            )
            questions['clarifications'].append({
                'skill': flag['skill'],
                'question': q,
                'reasoning': f"Clarify discrepancy in {flag['skill']}"
            })
    
    # Save to database
    interview_doc = {
        'assessmentId': ObjectId(data['assessmentId']),
        'candidateId': assessment['candidateId'],
        'jobId': assessment['jobId'],
        'questions': questions,
        'generatedAt': datetime.now()
    }
    
    result = db.interview_questions.insert_one(interview_doc)
    interview_doc['_id'] = str(result.inserted_id)
    
    return jsonify(interview_doc)

# services/ai_service.py
def generate_interview_question(skill, type, context):
    prompts = {
        'depth_probe': f"Generate a deep technical interview question about {skill}. Context: {context}",
        'gap_exploration': f"Generate an interview question to assess learning potential in {skill}. Context: {context}",
        'clarification': f"Generate an interview question to clarify expertise in {skill}. Context: {context}"
    }
    
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompts[type]}]
    )
    
    return response.choices[0].message.content
```

---

### **Frontend Routes & Integration**

#### **Recruiter Flow:**
```
1. /recruiter/jobs/new
   → POST /api/jobs (create JD)
   → POST /api/jobs/{id}/parse (parse with AI)
   
2. /recruiter/jobs/{id}/candidates
   → GET /api/assessments/job/{id} (view all assessments)
   
3. /recruiter/jobs/{id}/rankings
   → POST /api/rankings/job/{id}/generate (generate rankings)
   → GET /api/rankings/job/{id} (view rankings)
   
4. /recruiter/interview/{assessmentId}
   → POST /api/interview/generate (generate questions)
   → GET /api/interview/assessment/{id} (view questions)
```

#### **Candidate Flow:**
```
1. /candidate/profile
   → POST /api/candidates/resume (upload resume)
   
2. /candidate/assessments
   → GET /api/candidates/assessments (view available)
   
3. /candidate/assessment/{id}
   → POST /api/assessments/{id}/start (start assessment)
   → POST /api/assessments/{id}/submit (submit each answer)
   → POST /api/assessments/{id}/complete (finish)
   
4. /candidate/results/{id}
   → GET /api/assessments/{id} (view results)
```

---



### **DAY 2: ASSESSMENT EXECUTION & INTEGRITY** 🎯
**Focus**: Multi-modal assessments + Candidate experience + Fraud detection

#### Morning (0-4 hours): Situational Judgment Builder
- [ ] **Scenario Generator** (2h)
  - Role-specific scenario templates
  - AI-generated case studies (GPT-4 integration)
  - Rubric creation for subjective scoring
  
- [ ] **Practical Simulation Framework** (2h)
  - Code editor integration (Monaco/CodeMirror)
  - Spreadsheet challenge builder
  - Design canvas (for design roles)

**Output**: Working situational & practical assessment modules

#### Afternoon (4-8 hours): Candidate Assessment Interface
- [ ] **Assessment Taking UI** (3h)
  - Clean, distraction-free interface
  - Timer & progress tracking
  - Multi-question type rendering (MCQ, text, code)
  
- [ ] **Submission & Storage System** (1h)
  - Answer capture & validation
  - File upload for practical tasks
  - Session management

**Output**: Functional candidate assessment portal

#### Evening (8-12 hours): Integrity & Anti-Fraud Layer
- [ ] **Plagiarism Detection** (2h)
  - Code similarity checking (MOSS-like algorithm)
  - Text comparison for written responses
  - Pattern matching for answers
  
- [ ] **Behavioral Analytics** (2h)
  - Time-per-question tracking
  - Copy-paste detection
  - Tab-switching monitoring
  - Consistency scoring algorithm

**Day 2 Deliverable**: End-to-end candidate assessment flow with fraud detection

---

### **DAY 3: INTELLIGENCE & PRESENTATION** 📊
**Focus**: AI Scoring + Predictive Reports + Demo Polish

#### Morning (0-4 hours): AI Evaluation Engine
- [ ] **Automated Scoring System** (2h)
  - Objective question auto-grading
  - AI rubric evaluation for subjective answers
  - Code execution & test case validation
  
- [ ] **Skill Gap Analysis** (2h)
  - Competency-wise performance mapping
  - Strength/weakness identification
  - Benchmark comparison logic

**Output**: Intelligent scoring system with skill breakdown

#### Afternoon (4-6 hours): Predictive Fit Report
- [ ] **Report Generation Engine** (2h)
  - PDF/HTML report templates
  - Data visualization (charts, radar graphs)
  - Comparative candidate ranking
  - Actionable insights & recommendations

**Output**: Beautiful, data-driven candidate reports

#### Evening (6-12 hours): Demo Preparation & Polish
- [ ] **Dashboard Development** (3h)
  - Recruiter dashboard (all candidates view)
  - Filtering & sorting capabilities
  - Analytics overview
  
- [ ] **UI/UX Polish** (1.5h)
  - Design consistency
  - Mobile responsiveness
  - Loading states & error handling
  
- [ ] **Demo Preparation** (1.5h)
  - Sample JDs & test candidates
  - Presentation deck
  - Video demo recording
  - Edge case handling

**Day 3 Deliverable**: Polished MVP + Demo + Presentation

---

## 🏗️ TECHNICAL STACK RECOMMENDATIONS

### **Frontend**
```
┌─────────────────────────────────────┐
│  Framework: React.js / Next.js      │
│  UI Library: Tailwind CSS + shadcn │
│  Charts: Recharts / Chart.js       │
│  Code Editor: Monaco Editor         │
│  State: Redux Toolkit / Zustand    │
└─────────────────────────────────────┘
```

### **Backend (Flask)**
```
┌─────────────────────────────────────┐
│  Framework: Flask 3.0+              │
│  Database: MongoDB (PyMongo)        │
│  Auth: Flask-JWT-Extended           │
│  CORS: Flask-CORS                   │
│  Validation: Flask-Marshmallow      │
│  File Upload: Flask-Upload          │
│  PDF Generation: ReportLab/WeasyPrint│
└─────────────────────────────────────┘
```

### **AI/ML Services**
```
┌─────────────────────────────────────┐
│  NLP: OpenAI GPT-4 / Claude API     │
│  Entity Extraction: spaCy / BERT    │
│  Code Analysis: AST parsers         │
│  Similarity: cosine similarity      │
└─────────────────────────────────────┘
```

### **Infrastructure**
```
┌─────────────────────────────────────┐
│  Hosting: Vercel / Railway          │
│  Storage: AWS S3 / Cloudinary       │
│  Auth: Clerk / NextAuth.js          │
│  Analytics: PostHog / Mixpanel      │
└─────────────────────────────────────┘
```

---

## 🎨 CORE FEATURES BREAKDOWN

### **1. JD Intelligence Module**
```
INPUT: Job Description (Text/PDF)
         ↓
    [NLP Parser]
         ↓
    ┌────────────────────────────┐
    │ • Skills Extraction        │
    │ • Experience Requirements  │
    │ • Tool Proficiency Needs   │
    │ • Behavioral Competencies  │
    │ • Seniority Level          │
    │ • Domain Identification    │
    └────────────────────────────┘
         ↓
    STRUCTURED DATA
```

**Key Capabilities**:
- Entity recognition for technical skills
- Implicit requirement inference (e.g., "3+ years React" → Senior Frontend)
- Industry-specific taxonomy mapping
- Synonym handling (Node.js = NodeJS = Node)

---

### **2. Assessment Generation Engine**

```
COMPETENCY FRAMEWORK
         ↓
┌─────────────────────────────────────┐
│      ADAPTIVE KNOWLEDGE TESTS       │
├─────────────────────────────────────┤
│ • 15-25 MCQs based on skills        │
│ • Difficulty scaling (Junior→Senior)│
│ • Time limits per question          │
│ • Negative marking option           │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│    SITUATIONAL JUDGMENT TESTS       │
├─────────────────────────────────────┤
│ • Real-world scenarios              │
│ • Decision-making challenges        │
│ • AI-generated rubric scoring       │
│ • 2-3 case studies per role         │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│      PRACTICAL SIMULATIONS          │
├─────────────────────────────────────┤
│ Developer: Code challenges          │
│ Analyst: Excel/SQL tasks            │
│ Designer: Design brief completion   │
│ Manager: Strategic planning         │
└─────────────────────────────────────┘
```

**Example Assessments by Role**:

| Role | Knowledge Test | Situational | Practical |
|------|---------------|-------------|-----------|
| **Frontend Dev** | React, CSS, JS fundamentals | Component architecture decision | Build responsive form |
| **Data Analyst** | SQL, Statistics, Excel | Data quality issue resolution | Clean messy dataset |
| **Product Manager** | Agile, Metrics, Strategy | Feature prioritization | Write PRD for feature |
| **HR Recruiter** | Hiring best practices | Candidate conflict handling | Screen resume set |

---

### **3. Integrity & Anti-Fraud Layer**

```
┌─────────────────────────────────────┐
│       FRAUD DETECTION SYSTEM        │
├─────────────────────────────────────┤
│                                     │
│  [Plagiarism Detection]             │
│  • Code similarity (>80% match)     │
│  • Text comparison with internet    │
│  • Answer pattern matching          │
│                                     │
│  [Behavioral Tracking]              │
│  • Time anomaly detection           │
│  • Copy-paste frequency             │
│  • Tab switching count              │
│  • Keyboard vs mouse ratio          │
│                                     │
│  [Consistency Scoring]              │
│  • Answer speed vs difficulty       │
│  • Knowledge correlation            │
│  • Progressive performance drops    │
│                                     │
│  [Identity Verification]            │
│  • Webcam snapshots (optional)      │
│  • Browser fingerprinting           │
│  • IP geolocation checks            │
└─────────────────────────────────────┘
         ↓
    RISK SCORE (0-100)
    • 0-30: Low risk
    • 31-60: Medium risk
    • 61-100: High risk (flag for review)
```

**Fraud Indicators**:
- Answering all questions in final 5 minutes (copy-paste from elsewhere)
- 100% accuracy on hard questions but failures on easy ones
- Identical code structure to GitHub repositories
- Sudden performance jump mid-assessment

---

### **4. Predictive Fit Report**

```
┌─────────────────────────────────────────────────────┐
│           CANDIDATE FIT REPORT                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Overall Score]  ████████░░ 82/100                 │
│                                                     │
│  [Skill Breakdown]                                  │
│  ┌─────────────────────────────────────┐            │
│  │ React.js        ████████░░ 85%      │            │
│  │ Node.js         ██████░░░░ 70%      │            │
│  │ MongoDB         ███████░░░ 78%      │            │
│  │ System Design   ████░░░░░░ 60%      │            │
│  │ Communication   █████████░ 90%      │            │
│  └─────────────────────────────────────┘            │
│                                                     │
│  [Strengths]                                        │
│  ✓ Strong frontend fundamentals                    │
│  ✓ Excellent problem-solving approach              │
│  ✓ Clean, readable code                            │
│                                                     │
│  [Skill Gaps]                                       │
│  ⚠ Limited backend scalability knowledge           │
│  ⚠ Needs improvement in testing practices          │
│                                                     │
│  [Integrity Score]  ████████░░ 85/100               │
│  • Low plagiarism risk                             │
│  • Consistent performance pattern                  │
│  • 2 tab switches (acceptable)                     │
│                                                     │
│  [Recommendation]                                   │
│  ★★★★☆ STRONG HIRE                                 │
│  Proceed to technical interview                    │
│  Focus areas: System design, testing               │
│                                                     │
│  [Comparative Ranking]                              │
│  Top 15% of 47 candidates for this role            │
└─────────────────────────────────────────────────────┘
```

**Report Components**:
1. **Executive Summary**: One-paragraph candidate overview
2. **Competency Radar Chart**: Visual skill mapping
3. **Question-by-Question Breakdown**: Detailed performance
4. **Comparative Analytics**: Percentile ranking
5. **Actionable Next Steps**: Interview focus areas

---

## 🚨 POTENTIAL CHALLENGES & SOLUTIONS

### **Challenge 1: JD Parsing Accuracy**
**Problem**: Unstructured JDs, ambiguous requirements  
**Solution**: 
- Use GPT-4 with few-shot learning examples
- Maintain fallback templates for common roles
- Allow manual competency editing by recruiters

### **Challenge 2: Assessment Quality**
**Problem**: Generic, irrelevant questions  
**Solution**:
- Domain-specific question banks
- Human-reviewed question templates
- Recruiter feedback loop for improvement

### **Challenge 3: Cheating Detection False Positives**
**Problem**: Flagging legitimate candidates  
**Solution**:
- Multi-factor risk scoring (not single metric)
- Manual review for high-risk cases
- Transparent scoring methodology

### **Challenge 4: Time Constraints (Hackathon)**
**Problem**: 72 hours insufficient for all features  
**Solution**:
- **MVP Feature Set** (Must-Have):
  - JD parsing
  - Basic MCQ generation
  - Simple scoring
  - Basic report
- **Demo Enhancements** (Nice-to-Have):
  - Code simulation
  - Advanced fraud detection
  - Beautiful dashboards

### **Challenge 5: AI API Costs**
**Problem**: OpenAI/Claude API usage limits  
**Solution**:
- Cache common JD parsing results
- Use cheaper models for simple tasks
- Implement request throttling
- Pre-generate sample assessments

---

## 🎬 DEMO FLOW (5-Minute Pitch)

### **Act 1: The Problem (30 seconds)**
```
"Meet Sarah, an HR manager at TechCorp.
She posted a Senior React Developer role.
Within 48 hours: 300 applications.
150 are spam. 80 are underqualified.
She spends 40 hours screening.
Only 5 are interview-worthy.

Traditional hiring is broken."
```

### **Act 2: The Solution (2 minutes)**
```
[SCREEN SHARE]

1. Upload JD → Metis parses in 10 seconds
   Show: Skills extracted, competencies mapped

2. Assessment auto-generated
   Show: 20 MCQs + 1 situational + 1 code challenge

3. Candidate takes assessment
   Show: Clean UI, timer, code editor

4. Results appear instantly
   Show: Predictive Fit Report with 85/100 score
```

### **Act 3: The Magic (1.5 minutes)**
```
[DEMO ADVANCED FEATURES]

1. Fraud Detection
   Show: Candidate flagged for suspicious behavior
   
2. Comparative Ranking
   Show: "Top 8% of 47 candidates"

3. Skill Gap Analysis
   Show: "Strong in React, needs System Design practice"

4. Bulk Processing
   Show: All 47 candidates ranked in dashboard
```

### **Act 4: The Impact (1 minute)**
```
[SHOW METRICS]

Traditional Process:
⏱ 40 hours screening
🎯 60% interview no-show rate
💰 $12,000 cost-per-hire

With Metis:
⏱ 2 hours total
🎯 95% interview relevance
💰 $3,000 cost-per-hire

ROI: 60% time saved, 4x better quality
```

---

## 📋 MVP FEATURE CHECKLIST

### **Must-Have (Core Demo)**
- [x] JD text input
- [x] Skill extraction display
- [x] MCQ generation (15 questions)
- [x] Assessment taking interface
- [x] Basic scoring algorithm
- [x] Simple PDF report generation
- [x] Candidate dashboard (list view)

### **Should-Have (Enhanced Demo)**
- [ ] Code editor integration
- [ ] Situational scenario generation
- [ ] Fraud detection metrics
- [ ] Comparative ranking
- [ ] Skill gap visualization
- [ ] Email notifications

### **Nice-to-Have (Wow Factor)**
- [ ] Real-time assessment monitoring
- [ ] Video proctoring
- [ ] ATS integration mockup
- [ ] Mobile-responsive design
- [ ] Multi-language support

---

## 🎯 SUCCESS METRICS FOR HACKATHON

### **Technical Achievements**
- [ ] End-to-end flow working (JD → Report)
- [ ] At least 3 role types supported
- [ ] Sub-30 second JD parsing
- [ ] 90%+ assessment generation success rate
- [ ] Zero critical bugs in demo

### **Presentation Impact**
- [ ] Clear problem-solution narrative
- [ ] Live demo without failures
- [ ] Impressive visual reports
- [ ] Judges understand value proposition
- [ ] Memorable "wow" moment

### **Innovation Score**
- [ ] Novel fraud detection approach
- [ ] AI-powered assessment generation
- [ ] Predictive analytics component
- [ ] Scalability architecture
- [ ] Real-world applicability

---

## 🛠️ DEVELOPMENT WORKFLOW

### **Team Roles (Recommended 4-person team)**
```
┌─────────────────────────────────────┐
│  TEAM STRUCTURE                     │
├─────────────────────────────────────┤
│                                     │
│  [AI/ML Engineer]                   │
│  • JD parsing logic                 │
│  • Assessment generation            │
│  • Scoring algorithms               │
│                                     │
│  [Full-Stack Developer]             │
│  • Backend APIs                     │
│  • Database design                  │
│  • Integration layer                │
│                                     │
│  [Frontend Developer]               │
│  • Assessment UI                    │
│  • Dashboard                        │
│  • Report visualizations            │
│                                     │
│  [Product/Design Lead]              │
│  • UX flow                          │
│  • Demo preparation                 │
│  • Presentation deck                │
└─────────────────────────────────────┘
```

### **Git Workflow**
```
main (production demo)
  ├── feature/jd-parser
  ├── feature/assessment-gen
  ├── feature/candidate-ui
  ├── feature/scoring-engine
  └── feature/dashboard
```

### **Daily Standup (15 min)**
- What did you complete?
- What are you working on?
- Any blockers?
- Integration checkpoints?

---

## 🎨 UI/UX MOCKUP IDEAS

### **Recruiter Dashboard**
```
┌─────────────────────────────────────────────────────┐
│  METIS │ Assessments │ Candidates │ Analytics      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📊 Overview                                        │
│  ┌─────────────┬─────────────┬─────────────┐       │
│  │   Active    │  Completed  │   Avg Time  │       │
│  │     12      │     47      │   38 min    │       │
│  └─────────────┴─────────────┴─────────────┘       │
│                                                     │
│  🎯 Senior React Developer (47 candidates)          │
│  ┌───────────────────────────────────────────┐     │
│  │ Name          Score  Skills   Status      │     │
│  ├───────────────────────────────────────────┤     │
│  │ Sarah Chen    92/100  ████░  ✅ Recommend │     │
│  │ Mike Johnson  85/100  ███░░  ✅ Recommend │     │
│  │ Lisa Park     78/100  ███░░  ⚠️  Review   │     │
│  │ John Doe      45/100  ██░░░  ❌ Reject    │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  [Create New Assessment]  [Export Reports]         │
└─────────────────────────────────────────────────────┘
```

### **Candidate Assessment View**
```
┌─────────────────────────────────────────────────────┐
│  Senior React Developer Assessment                  │
│  ⏱ 28:45 remaining │ Progress: ████░░░░░ 45%       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Question 9 of 20                                   │
│                                                     │
│  What is the purpose of React's useEffect hook?    │
│                                                     │
│  ○ To manage component state                       │
│  ○ To perform side effects in function components  │
│  ○ To optimize rendering performance               │
│  ○ To handle user events                           │
│                                                     │
│  [Previous]  [Flag for Review]  [Next]             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 POST-HACKATHON ROADMAP

### **Phase 1: MVP Enhancements (Weeks 1-4)**
- Advanced fraud detection (eye-tracking, keystroke analysis)
- Video interview scheduling integration
- ATS connectors (Greenhouse, Lever)
- White-label customization

### **Phase 2: Intelligence Upgrades (Months 2-3)**
- ML model for predictive hiring success
- Historical candidate performance correlation
- Industry benchmarking data
- Automated interview question generation

### **Phase 3: Enterprise Features (Months 4-6)**
- Multi-tenant architecture
- Custom competency frameworks
- API for third-party integrations
- Advanced analytics & reporting
- Mobile apps (iOS/Android)

### **Phase 4: Scale & Monetization (Month 6+)**
- Freemium pricing model
- Enterprise sales team
- Customer success program
- Partner ecosystem (job boards, HRMs)

---

## 💡 CREATIVE DIFFERENTIATORS

### **1. AI-Powered Scenario Generation**
Unlike static question banks, Metis generates role-specific scenarios:
- "You're leading a sprint and a critical bug is discovered 2 days before launch..."
- Each scenario is unique per candidate (prevents answer sharing)

### **2. Skill Transfer Analysis**
Identifies candidates with adjacent skills:
- "No React experience, but strong Vue.js → 80% transferability"
- Expands talent pool intelligently

### **3. Diversity & Bias Mitigation**
- Anonymized assessment results (no names until scored)
- Skill-based evaluation only
- Highlights underrepresented talent performing well

### **4. Candidate Experience Focus**
- Clear instructions and expectations
- Practice questions before real test
- Immediate feedback (non-critical roles)
- Mobile-friendly interface

### **5. Predictive Analytics**
- "Candidates with this profile succeed 85% of the time at your company"
- Based on historical hiring data (future feature)

---

## 📊 MONGODB SCHEMAS & FLASK API ROUTES

### **MongoDB Collections**

#### **1. Users Collection**
```python
# models/user.py
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

user_schema = {
    "_id": ObjectId,
    "email": str,  # unique, required
    "password": str,  # hashed with bcrypt
    "role": str,  # enum: ['recruiter', 'candidate']
    "firstName": str,
    "lastName": str,
    "company": str,  # optional, for recruiters
    
    # Candidate-specific fields
    "resume": {
        "fileUrl": str,
        "parsedData": dict,  # extracted skills, experience
        "uploadedAt": datetime
    },
    
    # Credibility Score (tracks resume vs performance consistency)
    "credibilityScore": {
        "score": float,  # 0-100, default: 100
        "incidents": [{
            "assessmentId": ObjectId,
            "skill": str,
            "resumeClaim": str,  # e.g., "Expert"
            "actualPerformance": float,
            "discrepancy": float,
            "timestamp": datetime
        }]
    },
    
    "createdAt": datetime,
    "updatedAt": datetime
}
```

#### **2. Job Descriptions Collection**
```python
# models/job_description.py

job_description_schema = {
    "_id": ObjectId,
    "recruiterId": ObjectId,  # ref: User
    "title": str,
    "company": str,
    "rawText": str,  # original JD text
    
    # Parsed JD data (from AI)
    "parsedData": {
        "requiredSkills": [{
            "skill": str,
            "category": str,  # enum: ['technical', 'soft', 'domain']
            "importance": int,  # 1-10
            "keywords": [str]
        }],
        "experienceLevel": str,  # enum: ['entry', 'mid', 'senior', 'lead']
        "responsibilities": [str],
        "qualifications": [str]
    },
    
    # Skill weights (calculated after parsing)
    "skillWeights": [{
        "skill": str,
        "weight": float,  # 0-1, sum = 1
        "reasoning": str
    }],
    
    "status": str,  # enum: ['draft', 'active', 'closed']
    "createdAt": datetime,
    "updatedAt": datetime
}
```

#### **3. Assessments Collection**
```python
# models/assessment.py

assessment_schema = {
    "_id": ObjectId,
    "jobId": ObjectId,  # ref: JobDescription
    "candidateId": ObjectId,  # ref: User
    
    # Assessment configuration
    "difficulty": str,  # enum: ['adaptive', 'fixed']
    "totalQuestions": int,
    
    # Generated questions
    "questions": [{
        "questionId": str,
        "skill": str,
        "difficulty": int,  # 1-10
        "type": str,  # enum: ['mcq', 'coding', 'short_answer']
        "question": str,
        "options": [str],  # for MCQ
        "correctAnswer": str,
        "explanation": str,
        "timeLimit": int  # seconds
    }],
    
    # Candidate responses
    "responses": [{
        "questionId": str,
        "answer": str,
        "isCorrect": bool,
        "timeTaken": int,  # seconds
        "timestamp": datetime
    }],
    
    # Skill-wise scoring
    "skillScores": [{
        "skill": str,
        "questionsAttempted": int,
        "correctAnswers": int,
        "accuracy": float,  # 0-1
        "avgDifficulty": float,
        "score": float  # 0-100
    }],
    
    # Overall results
    "overallScore": float,  # 0-100
    "weightedScore": float,  # based on JD skill weights
    
    # Resume consistency flags
    "consistencyFlags": [{
        "skill": str,
        "resumeClaim": str,
        "assessmentScore": float,
        "discrepancy": float,
        "severity": str  # enum: ['low', 'medium', 'high']
    }],
    
    "status": str,  # enum: ['not_started', 'in_progress', 'completed']
    "startedAt": datetime,
    "completedAt": datetime,
    "createdAt": datetime
}
```

#### **4. Rankings Collection**
```python
# models/ranking.py

ranking_schema = {
    "_id": ObjectId,
    "jobId": ObjectId,  # ref: JobDescription
    
    "rankings": [{
        "candidateId": ObjectId,
        "assessmentId": ObjectId,
        
        # Scores
        "rawScore": float,  # 0-100
        "weightedScore": float,  # based on JD weights
        "credibilityAdjustedScore": float,  # final score
        
        # Breakdown
        "skillBreakdown": [{
            "skill": str,
            "score": float,
            "weight": float,
            "contribution": float
        }],
        
        # Flags
        "hasConsistencyIssues": bool,
        "credibilityPenalty": float,
        
        "rank": int
    }],
    
    "generatedAt": datetime,
    "updatedAt": datetime
}
```

#### **5. Interview Questions Collection**
```python
# models/interview_questions.py

interview_questions_schema = {
    "_id": ObjectId,
    "assessmentId": ObjectId,
    "candidateId": ObjectId,
    "jobId": ObjectId,
    
    # Generated questions
    "questions": [{
        "skill": str,
        "category": str,  # enum: ['strength', 'weakness', 'clarification']
        "question": str,
        "reasoning": str,
        "suggestedFollowUps": [str]
    }],
    
    # Strengths to probe
    "strengths": [{
        "skill": str,
        "score": float,
        "questions": [str]
    }],
    
    # Weaknesses to explore
    "weaknesses": [{
        "skill": str,
        "score": float,
        "questions": [str]
    }],
    
    # Consistency issues to clarify
    "clarifications": [{
        "skill": str,
        "issue": str,
        "questions": [str]
    }],
    
    "generatedAt": datetime
}
```

---

### **FLASK API ROUTES**

#### **Authentication Routes** (`/api/auth`)

```python
# routes/auth.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register new user (recruiter or candidate)
    
    Request Body:
    {
        "email": "user@example.com",
        "password": "securepass123",
        "role": "candidate",  # or "recruiter"
        "firstName": "John",
        "lastName": "Doe",
        "company": "TechCorp"  # optional, for recruiters
    }
    
    Response:
    {
        "user": {...},
        "token": "jwt_token_here"
    }
    """
    pass

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    User login
    
    Request Body:
    {
        "email": "user@example.com",
        "password": "securepass123"
    }
    
    Response:
    {
        "user": {...},
        "token": "jwt_token_here"
    }
    """
    pass

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """User logout (invalidate token)"""
    pass

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user"""
    pass
```

#### **Job Description Routes** (`/api/jobs`)

```python
# routes/jobs.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

jobs_bp = Blueprint('jobs', __name__, url_prefix='/api/jobs')

@jobs_bp.route('/', methods=['POST'])
@jwt_required()
def create_job():
    """
    Create new job description
    
    Request Body:
    {
        "title": "Senior React Developer",
        "company": "TechCorp",
        "rawText": "We are looking for..."
    }
    
    Response:
    {
        "job": {...}
    }
    """
    pass

@jobs_bp.route('/', methods=['GET'])
@jwt_required()
def get_all_jobs():
    """Get all jobs for current recruiter"""
    pass

@jobs_bp.route('/<job_id>', methods=['GET'])
@jwt_required()
def get_job(job_id):
    """Get specific job by ID"""
    pass

@jobs_bp.route('/<job_id>', methods=['PUT'])
@jwt_required()
def update_job(job_id):
    """Update job description"""
    pass

@jobs_bp.route('/<job_id>', methods=['DELETE'])
@jwt_required()
def delete_job(job_id):
    """Delete job description"""
    pass

@jobs_bp.route('/<job_id>/parse', methods=['POST'])
@jwt_required()
def parse_job_description(job_id):
    """
    Parse JD and extract skills using AI
    
    Response:
    {
        "parsedData": {
            "requiredSkills": [...],
            "experienceLevel": "senior",
            ...
        },
        "skillWeights": [...]
    }
    """
    # Call OpenAI/Gemini API to parse JD
    # Extract skills, categorize, assign weights
    pass
```

#### **Assessment Routes** (`/api/assessments`)

```python
# routes/assessments.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

assessments_bp = Blueprint('assessments', __name__, url_prefix='/api/assessments')

@assessments_bp.route('/', methods=['POST'])
@jwt_required()
def create_assessment():
    """
    Create assessment for candidate
    
    Request Body:
    {
        "jobId": "job_id_here",
        "candidateId": "candidate_id_here"
    }
    
    Response:
    {
        "assessment": {...}
    }
    """
    pass

@assessments_bp.route('/job/<job_id>', methods=['GET'])
@jwt_required()
def get_assessments_by_job(job_id):
    """Get all assessments for a specific job"""
    pass

@assessments_bp.route('/<assessment_id>', methods=['GET'])
@jwt_required()
def get_assessment(assessment_id):
    """Get specific assessment"""
    pass

@assessments_bp.route('/<assessment_id>/start', methods=['POST'])
@jwt_required()
def start_assessment(assessment_id):
    """
    Start assessment (generate questions)
    
    Response:
    {
        "assessment": {...},
        "questions": [...]  # Initial questions
    }
    """
    # Generate questions based on JD skills
    # Use AI to create adaptive questions
    pass

@assessments_bp.route('/<assessment_id>/submit', methods=['POST'])
@jwt_required()
def submit_answer(assessment_id):
    """
    Submit answer to a question
    
    Request Body:
    {
        "questionId": "q1",
        "answer": "option_b",
        "timeTaken": 45  # seconds
    }
    
    Response:
    {
        "isCorrect": true,
        "explanation": "...",
        "nextQuestion": {...}  # Adaptive next question
    }
    """
    # Check answer correctness
    # Generate next question based on performance
    pass

@assessments_bp.route('/<assessment_id>/complete', methods=['POST'])
@jwt_required()
def complete_assessment(assessment_id):
    """
    Complete assessment and calculate scores
    
    Response:
    {
        "results": {...},
        "skillScores": [...],
        "overallScore": 85.5,
        "consistencyFlags": [...]
    }
    """
    # Calculate skill-wise scores
    # Check resume consistency
    # Update user credibility score
    pass
```

#### **Candidate Routes** (`/api/candidates`)

```python
# routes/candidates.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from werkzeug.utils import secure_filename

candidates_bp = Blueprint('candidates', __name__, url_prefix='/api/candidates')

@candidates_bp.route('/resume', methods=['POST'])
@jwt_required()
def upload_resume():
    """
    Upload and parse resume
    
    Request: multipart/form-data with 'file' field
    
    Response:
    {
        "resumeUrl": "https://...",
        "parsedData": {
            "skills": [...],
            "experience": [...],
            ...
        }
    }
    """
    # Upload file to storage (S3/local)
    # Parse resume using AI (extract skills, experience)
    pass

@candidates_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_candidate_profile():
    """
    Get candidate profile with credibility score
    
    Response:
    {
        "user": {...},
        "credibilityScore": {
            "score": 95.5,
            "incidents": [...]
        }
    }
    """
    pass

@candidates_bp.route('/assessments', methods=['GET'])
@jwt_required()
def get_candidate_assessments():
    """Get all assessments for current candidate"""
    pass
```

#### **Ranking Routes** (`/api/rankings`)

```python
# routes/rankings.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

rankings_bp = Blueprint('rankings', __name__, url_prefix='/api/rankings')

@rankings_bp.route('/job/<job_id>', methods=['GET'])
@jwt_required()
def get_rankings(job_id):
    """
    Get rankings for a job
    
    Response:
    {
        "rankings": [{
            "candidateId": "...",
            "rank": 1,
            "credibilityAdjustedScore": 92.5,
            "skillBreakdown": [...],
            ...
        }]
    }
    """
    pass

@rankings_bp.route('/job/<job_id>/generate', methods=['POST'])
@jwt_required()
def generate_rankings(job_id):
    """
    Generate/update rankings for a job
    
    Algorithm:
    1. Get all completed assessments for job
    2. Calculate weighted scores using JD skill weights
    3. Apply credibility penalties
    4. Sort and assign ranks
    
    Response:
    {
        "rankings": [...]
    }
    """
    # Calculate weighted scores
    # Apply credibility adjustments
    # Sort and rank candidates
    pass
```

#### **Interview Questions Routes** (`/api/interview`)

```python
# routes/interview.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

interview_bp = Blueprint('interview', __name__, url_prefix='/api/interview')

@interview_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_interview_questions():
    """
    Generate interview questions based on assessment
    
    Request Body:
    {
        "assessmentId": "assessment_id_here"
    }
    
    Response:
    {
        "questions": {
            "strengths": [...],
            "weaknesses": [...],
            "clarifications": [...]
        }
    }
    """
    # Analyze assessment results
    # Generate targeted questions using AI
    # - Probe strengths (top 3 skills)
    # - Explore weaknesses (bottom 3 skills)
    # - Clarify consistency issues
    pass

@interview_bp.route('/assessment/<assessment_id>', methods=['GET'])
@jwt_required()
def get_interview_questions(assessment_id):
    """Get generated interview questions for assessment"""
    pass
```

---

### **Flask App Structure**

```
metis-backend/
├── app.py                 # Main Flask app
├── config.py              # Configuration
├── requirements.txt       # Dependencies
├── models/
│   ├── __init__.py
│   ├── user.py
│   ├── job_description.py
│   ├── assessment.py
│   ├── ranking.py
│   └── interview_questions.py
├── routes/
│   ├── __init__.py
│   ├── auth.py
│   ├── jobs.py
│   ├── assessments.py
│   ├── candidates.py
│   ├── rankings.py
│   └── interview.py
├── services/
│   ├── __init__.py
│   ├── ai_service.py      # OpenAI/Gemini integration
│   ├── parser_service.py  # JD & Resume parsing
│   ├── scoring_service.py # Scoring algorithms
│   └── pdf_service.py     # Report generation
└── utils/
    ├── __init__.py
    ├── db.py              # MongoDB connection
    └── validators.py      # Input validation
```

---

### **Main Flask App** (`app.py`)

```python
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from utils.db import init_db

# Import blueprints
from routes.auth import auth_bp
from routes.jobs import jobs_bp
from routes.assessments import assessments_bp
from routes.candidates import candidates_bp
from routes.rankings import rankings_bp
from routes.interview import interview_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize extensions
    CORS(app)
    JWTManager(app)
    init_db(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(jobs_bp)
    app.register_blueprint(assessments_bp)
    app.register_blueprint(candidates_bp)
    app.register_blueprint(rankings_bp)
    app.register_blueprint(interview_bp)
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
```

---

### **Requirements** (`requirements.txt`)

```
Flask==3.0.0
flask-cors==4.0.0
flask-jwt-extended==4.5.3
pymongo==4.6.0
python-dotenv==1.0.0
openai==1.3.0
google-generativeai==0.3.0
reportlab==4.0.7
PyPDF2==3.0.1
Pillow==10.1.0
```

---

---

## 🎯 FINAL HACKATHON CHECKLIST

### **Day 0 (Pre-Hackathon)**
- [ ] Team formation & role assignment
- [ ] Tech stack finalized
- [ ] Development environment setup
- [ ] Sample JDs collected (10+ different roles)
- [ ] Design mockups sketched
- [ ] API keys obtained (OpenAI, etc.)

### **Day 1 Evening**
- [ ] JD parser working with 3 sample JDs
- [ ] Assessment blueprint generated
- [ ] Database populated with test data
- [ ] GitHub repository structured

### **Day 2 Evening**
- [ ] Candidate can take full assessment
- [ ] Answers stored in database
- [ ] Basic scoring implemented
- [ ] One complete end-to-end test passed

### **Day 3 Morning**
- [ ] Reports generating correctly
- [ ] Dashboard showing candidate list
- [ ] All UI polished
- [ ] Demo script written

### **Day 3 Pre-Submission**
- [ ] 5-minute video demo recorded
- [ ] Presentation deck completed
- [ ] Code commented & README updated
- [ ] Deployment successful (live link)
- [ ] Backup demo video (in case of live demo failure)

---

## 🏆 WINNING STRATEGY

### **What Judges Look For**
1. **Problem-Solution Fit**: Does it solve a real pain point?
2. **Technical Execution**: Does it actually work?
3. **Innovation**: Is the approach novel?
4. **Scalability**: Can this become a real product?
5. **Presentation**: Can they articulate the value?

### **Metis Advantages**
✅ **Clear Problem**: Everyone hates traditional hiring  
✅ **Measurable Impact**: 60% time saved, quantifiable  
✅ **AI Integration**: Showcases modern tech  
✅ **Visual Appeal**: Reports and dashboards look impressive  
✅ **Real-World Ready**: Companies would actually use this

### **Pitch Optimization**
- **Hook**: Start with Sarah's pain (relatable)
- **Demo**: Show working product (credibility)
- **Data**: Use specific metrics (60% time saved)
- **Vision**: Explain post-hackathon roadmap
- **Call-to-Action**: "Try our demo at metis-ai.com"

---

## 📚 RESOURCES & REFERENCES

### **APIs & Libraries**
- OpenAI GPT-4 API (JD parsing, question generation)
- spaCy (NLP entity extraction)
- Monaco Editor (code editor component)
- Recharts (data visualization)
- jsPDF (PDF generation)

### **Sample Question Banks**
- LeetCode API (coding questions)
- HackerRank public datasets
- Glassdoor interview questions
- Custom-built domain-specific banks

### **Design Inspiration**
- HackerRank assessment UI
- Codility candidate experience
- Greenhouse ATS dashboards
- TestGorilla assessment platform

### **Learning Resources**
- Anthropic Prompt Engineering Guide
- FastAPI documentation
- Next.js deployment guides
- PostgreSQL schema design best practices

---

## 🎉 CONCLUSION

Metis transforms recruitment from a manual, biased, time-intensive process into an intelligent, data-driven, equitable system. The 3-day hackathon MVP will demonstrate:

1. **AI-powered JD understanding** → No more manual skill extraction
2. **Automated assessment generation** → Role-specific, intelligent tests
3. **Fraud-resistant evaluation** → Trustworthy results
4. **Predictive fit reports** → Data-driven hiring decisions

**Success Metrics**:
- ✅ Working end-to-end demo
- ✅ Impressive visual reports
- ✅ Clear ROI story (60% time saved)
- ✅ Scalable architecture
- ✅ Memorable presentation

**Final Advice**:
- Focus on ONE complete flow rather than many incomplete features
- Prioritize demo polish over backend perfection
- Have backup plans (pre-recorded video, seed data)
- Practice your pitch 10+ times
- Show, don't just tell

**Let's build the future of hiring!** 🚀

---

*Generated for Metis Hackathon Team - Good Luck!* 🍀
