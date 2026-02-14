/**
 * TypeScript type definitions for API requests and responses
 */

// ==================== User Types ====================
export type UserRole = 'hr' | 'candidate';

export interface User {
  userId: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  image?: string;
  skills?: string[];
  experience?: any[];
  education?: any[];
  projects?: any[];
  certifications?: any[];
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  resume?: {
    rawText?: string;
    parsedData?: any;
    uploadedAt?: string;
  };
  createdAt: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

export interface RegisterResponse {
  userId: string;
  token: string;
  role: UserRole;
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  userId: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  token: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

export interface ResumeUploadRequest {
  rawText: string;
}

export interface ResumeUploadResponse {
  message: string;
  parsedData: {
    skills: Array<{ skill: string; proficiency: number }>;
    experience: string;
    education: string[];
  };
}

// ==================== Job Types ====================
export interface SkillWeight {
  skill: string;
  weight: number;
}

export interface CreateJobRequest {
  title: string;
  description: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  hrId: string;
  skillWeights: SkillWeight[];
  autoSelectTopCandidate?: boolean;
  autoCloseEnabled?: boolean;
  autoCloseDate?: string;
}

export interface CreateJobResponse {
  jobId: string;
  message: string;
}

export interface Job {
  _id: string;
  hrId: string;
  title: string;
  description: string;
  location: string;
  type: string;
  skillWeights: SkillWeight[];
  createdAt: string;
  status?: 'open' | 'closed' | 'filled';
  autoSelectTopCandidate?: boolean;
  autoCloseEnabled?: boolean;
  autoCloseDate?: string;
  selectedCandidateId?: string;
  closedAt?: string;
}

// ==================== Assessment Types ====================
export interface Question {
  _id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  skill: string;
  difficulty: number;
}

export interface CreateAssessmentRequest {
  jobId: string;
  candidateId: string;
}

export interface CreateAssessmentResponse {
  assessmentId: string;
  message: string;
  questions: Question[];
}

export interface Assessment {
  _id: string;
  jobId: string;
  candidateId: string;
  status: 'pending' | 'in_progress' | 'completed';
  questions: Question[];
  responses?: Array<{
    questionId: string;
    skill: string;
    selectedAnswer: string;
    isCorrect: boolean;
  }>;
  score?: number;
  overallScore?: number;
  totalQuestions?: number;
  correctAnswers?: number;
  skillBreakdown?: Record<string, number>;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

// ==================== Ranking Types ====================
export interface CandidateRanking {
  candidateId: string;
  candidateName: string;
  rank: number;
  weightedScore: number;
  overallScore: number;
  skillScore: number;
  experienceScore: number;
  cultureFitScore: number;
  skillBreakdown: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  recommendation: 'strong_hire' | 'hire' | 'maybe' | 'no_hire';
  credibilityScore: number;
  jobTitle?: string;
  jobId?: string;
}

export interface GenerateRankingsResponse {
  rankings: CandidateRanking[];
}

export interface GetRankingsResponse {
  jobId: string;
  rankings: CandidateRanking[];
  generatedAt: string;
}

// ==================== Interview Types ====================
export interface InterviewQuestion {
  skill: string;
  question: string;
  type: 'strength' | 'weakness' | 'consistency';
  context: string;
}

export interface GenerateInterviewRequest {
  assessmentId: string;
}

export interface GenerateInterviewResponse {
  questions: {
    strengths: InterviewQuestion[];
    weaknesses: InterviewQuestion[];
    consistencyChecks?: InterviewQuestion[];
  };
}

export interface GetInterviewQuestionsResponse {
  assessmentId: string;
  questions: {
    strengths: InterviewQuestion[];
    weaknesses: InterviewQuestion[];
    consistencyChecks?: InterviewQuestion[];
  };
  generatedAt: string;
}
