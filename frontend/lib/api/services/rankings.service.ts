/**
 * Rankings Service
 * Handles candidate ranking generation and retrieval
 */

import { api } from '../client';
import type {
  GenerateRankingsResponse,
  GetRankingsResponse,
} from '../types';

export const rankingsService = {
  /**
   * Generate/update rankings for a job
   */
  generateRankings: async (
    jobId: string
  ): Promise<GenerateRankingsResponse> => {
    return api.post<GenerateRankingsResponse>(
      `/api/rankings/job/${jobId}/generate`
    );
  },

  /**
   * Get rankings for a job
   */
  getRankings: async (jobId: string): Promise<GetRankingsResponse> => {
    return api.get<GetRankingsResponse>(`/api/rankings/job/${jobId}`);
  },

  /**
   * Get all rankings across all jobs
   */
  getAll: async (): Promise<any[]> => {
    try {
      const response = await api.get<any>(`/api/rankings`);
      return response.rankings || [];
    } catch (error) {
      console.error('Failed to fetch all rankings:', error);
      return [];
    }
  },
};
