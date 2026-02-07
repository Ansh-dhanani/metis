/**
 * Interview Service
 * Handles interview question generation
 */

import { api } from '../client';
import type {
  GenerateInterviewRequest,
  GenerateInterviewResponse,
  GetInterviewQuestionsResponse,
} from '../types';

export const interviewService = {
  /**
   * Generate interview questions based on assessment
   */
  generateQuestions: async (
    data: GenerateInterviewRequest
  ): Promise<GenerateInterviewResponse> => {
    return api.post<GenerateInterviewResponse>(
      '/api/interview/generate',
      data
    );
  },

  /**
   * Get generated interview questions
   */
  getQuestions: async (
    assessmentId: string
  ): Promise<GetInterviewQuestionsResponse> => {
    return api.get<GetInterviewQuestionsResponse>(
      `/api/interview/assessment/${assessmentId}`
    );
  },
};
