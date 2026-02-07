/**
 * METIS Evaluation Service
 * Handles resume parsing and candidate evaluation
 */

import { api } from '../client';

export interface ParsedResumeData {
  name: string;
  email: string;
  phone: string;
  location?: string;
  summary?: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
    gpa?: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
}

export interface MetisEvaluation {
  model: string;
  overall_score: number;
  section_scores: {
    skill_evidence: number;
    project_authenticity: number;
    professional_signals: number;
    impact_outcomes: number;
    resume_integrity: number;
  };
  strength_signals: string[];
  risk_signals: string[];
  ats_flags: string[];
  confidence_level: 'low' | 'medium' | 'high';
  final_reasoning: string;
}

export interface ParseResumeResponse {
  parsed: ParsedResumeData;
  evaluation: MetisEvaluation;
}

export const evaluationService = {
  /**
   * Parse resume and get METIS evaluation
   */
  parseResume: async (
    resumeText: string,
    githubUrl?: string,
    portfolioUrl?: string
  ): Promise<ParseResumeResponse> => {
    return api.post<ParseResumeResponse>('/api/evaluation/parse-resume', {
      resumeText,
      githubUrl,
      portfolioUrl,
    });
  },

  /**
   * Evaluate an existing application
   */
  evaluateApplication: async (applicationId: string): Promise<any> => {
    return api.post(`/api/evaluation/evaluate/${applicationId}`);
  },

  /**
   * Batch evaluate all applications for a job
   */
  batchEvaluate: async (jobId: string): Promise<any> => {
    return api.post(`/api/evaluation/batch-evaluate/${jobId}`);
  },
};
