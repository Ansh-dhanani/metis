# Metis - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ or Bun installed
- Backend API running on `http://localhost:5000`

### Installation & Setup

```bash
# Navigate to frontend directory
cd metis/frontend

# Install dependencies
npm install
# or
bun install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local

# Start development server
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📖 User Flows

### 1. HR Recruiter Flow

**Register as HR:**
1. Go to `/register`
2. Fill in details and select "HR / Recruiter" role
3. Submit registration
4. Login at `/login`

**Create a Job:**
1. Navigate to Dashboard
2. Click "Create Job"
3. Enter job title and paste job description
4. Submit - AI will automatically parse skills
5. View parsed skills and weights on job details page

**View Rankings:**
1. Go to job details
2. Click "Generate Rankings" (after candidates complete assessments)
3. View ranked candidates with scores and recommendations

---

### 2. Candidate Flow

**Register as Candidate:**
1. Go to `/register`
2. Fill in details and select "Candidate" role
3. Submit registration
4. Login at `/login`

**Take Assessment:**
1. Navigate to Dashboard
2. Click "Start Assessment" on pending assessment
3. Answer questions one by one
4. Submit answers (adaptive difficulty)
5. Complete assessment to view results

---

## 🎯 Key Pages

### Landing Page (`/`)
- Welcome screen with features
- Call-to-action buttons
- Sign in / Register links

### Authentication
- `/login` - User login
- `/register` - New user registration

### HR Dashboard (`/dashboard`)
- Statistics overview
- Recent jobs list
- Recent assessments
- Quick actions

### HR Jobs (`/dashboard/jobs`)
- All jobs list
- Create new job button
- Job cards with parsed info

### Job Details (`/dashboard/jobs/[id]`)
- Job information
- Parsed skills with weights
- Assessments list
- Generate rankings button
- Ranked candidates view

### Candidate Dashboard (`/dashboard`)
- Assessment statistics
- Pending assessments (highlighted)
- Completed assessments with scores
- Average score display

### Assessment Taking (`/dashboard/assessments/[id]`)
- Question display
- MCQ options / Text input
- Progress bar
- Timer display
- Navigation between questions

---

## 🔧 Testing the Application

### Test as HR:
```
1. Register: hr@test.com / password123
2. Login
3. Create Job: "Senior React Developer" with JD
4. Wait for AI parsing (mock response)
5. View parsed skills
```

### Test as Candidate:
```
1. Register: candidate@test.com / password123
2. Login
3. Wait for HR to assign assessment
4. Start assessment
5. Answer questions
6. View completion status
```

---

## 🎨 UI Component Usage

### Button Variants
```tsx
<Button>Primary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>
```

### Card Structure
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
  <CardFooter>
    Footer actions
  </CardFooter>
</Card>
```

### Form Input
```tsx
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input 
    id="email" 
    type="email" 
    placeholder="you@example.com"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
</div>
```

---

## 🔐 Authentication Flow

### Login Process:
1. User enters credentials
2. Frontend calls `authService.login()`
3. Backend validates and returns token
4. Token stored in localStorage
5. User data fetched and stored in AuthContext
6. Redirect to dashboard

### Protected Routes:
```tsx
<ProtectedRoute requiredRole="hr">
  <HRContent />
</ProtectedRoute>
```

---

## 📡 API Integration Examples

### Create and Parse Job:
```typescript
// Create job
const { jobId } = await jobsService.createJob({
  title: "Senior React Developer",
  rawText: "Full job description..."
});

// Parse job description
const parsed = await jobsService.parseJob(jobId);
console.log(parsed.parsedData.requiredSkills);
```

### Start Assessment:
```typescript
// Start assessment
const { questions } = await assessmentsService.startAssessment(assessmentId);

// Submit answer
await assessmentsService.submitAnswer(assessmentId, {
  questionId: questions[0].questionId,
  answer: "Option A"
});
```

### Generate Rankings:
```typescript
const { rankings } = await rankingsService.generateRankings(jobId);
// rankings sorted by weighted score
```

---

## 🐛 Troubleshooting

### Backend Connection Error:
```
Error: Failed to fetch
Solution: Ensure backend is running on http://localhost:5000
```

### Authentication Error:
```
Error: Unauthorized
Solution: Clear localStorage and login again
```

### Build Errors:
```bash
# Clear cache
rm -rf .next
npm run dev
```

---

## 📚 File Import Patterns

### API Services:
```typescript
import { authService, jobsService, assessmentsService } from '@/lib/api/services';
```

### Components:
```typescript
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
```

### Utilities:
```typescript
import { cn, formatDate, getScoreColor } from '@/lib/utils';
```

### Context:
```typescript
import { useAuth } from '@/contexts/auth-context';
```

---

## 🎉 Features Checklist

- ✅ User authentication (login/register)
- ✅ Role-based routing (HR/Candidate)
- ✅ HR job creation
- ✅ AI job description parsing
- ✅ Candidate assessment taking
- ✅ Adaptive question difficulty
- ✅ Candidate ranking generation
- ✅ Dashboard statistics
- ✅ Responsive design
- ✅ Error handling
- ✅ Loading states
- ✅ Type-safe API layer

---

## 📞 Support

For issues or questions:
1. Check `PROJECT_STRUCTURE.md` for architecture details
2. Review `API_DOCUMENTATION.md` for backend endpoints
3. Check browser console for error messages
4. Verify backend is running and accessible

---

**Happy Coding! 🚀**
