/**
 * Assessments Service
 * Handles assessment creation, execution, and submission
 */

import { api } from '../client';
import type {
  Assessment,
  CreateAssessmentRequest,
  CreateAssessmentResponse,
} from '../types';

export const assessmentsService = {
  /**
   * Create a new assessment (generates questions automatically)
   */
  createAssessment: async (
    data: CreateAssessmentRequest
  ): Promise<CreateAssessmentResponse> => {
    return api.post<CreateAssessmentResponse>('/api/assessments', data);
  },

  /**
   * Get assessment by ID
   */
  getAssessment: async (assessmentId: string): Promise<Assessment> => {
    return api.get<Assessment>(`/api/assessments/${assessmentId}`);
  },

  /**
   * Get assessments for a job
   */
  getJobAssessments: async (jobId: string): Promise<Assessment[]> => {
    const response = await api.get<any>(`/api/assessments/job/${jobId}`);
    return response.assessments || [];
  },

  /**
   * Get assessments for a candidate
   */
  getCandidateAssessments: async (
    candidateId: string
  ): Promise<Assessment[]> => {
    const response = await api.get<any>(`/api/assessments/candidate/${candidateId}`);
    return response.assessments || [];
  },

  /**
   * Complete an assessment with responses
   */
  completeAssessment: async (
    assessmentId: string,
    data: { responses: any[] }
  ): Promise<{ score: number; status: string; totalQuestions: number; correctAnswers: number; skillBreakdown: Record<string, number> }> => {
    return api.post(
      `/api/assessments/${assessmentId}/complete`,
      data
    );
  },

  /**
   * Get all assessments
   */
  getAll: async (): Promise<Assessment[]> => {
    try {
      const response = await api.get<any>('/api/assessments');
      return response.assessments || [];
    } catch (error) {
      console.error('Failed to fetch all assessments:', error);
      return [];
    }
  },
};
