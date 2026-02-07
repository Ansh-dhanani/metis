/**
 * Advanced Ranking Service
 * Handles LangGraph-powered intelligent candidate ranking
 */

import { api } from '../client';

export interface AdvancedCandidateRanking {
  rank: number;
  candidate_id: string;
  candidate_name: string;
  weighted_score: number;
  final_score: number;
  integrity_score: number;
  status: 'round_1' | 'round_2' | 'rejected';
  shortlist_reason: string;
}

export interface Leaderboard {
  job_id: string;
  job_title: string;
  total_applicants: number;
  round_1_count: number;
  round_2_count: number;
  rejected_count: number;
  entries: AdvancedCandidateRanking[];
  generated_at: string;
}

export interface RankingStatistics {
  total_candidates: number;
  average_score: number;
  median_score: number;
  min_score: number;
  max_score: number;
  round_1_count: number;
  round_2_count: number;
  rejected_count: number;
  score_distribution: {
    'excellent (80-100)': number;
    'good (60-79)': number;
    'average (40-59)': number;
    'poor (0-39)': number;
  };
}

export const advancedRankingService = {
  /**
   * Generate advanced rankings for a job
   */
  generateRankings: async (jobId: string): Promise<{ leaderboard: Leaderboard }> => {
    return api.post(`/api/advanced-ranking/generate/${jobId}`);
  },

  /**
   * Get rankings for a job
   */
  getRankings: async (
    jobId: string,
    params?: {
      limit?: number;
      offset?: number;
      status?: string;
    }
  ): Promise<Leaderboard> => {
    const queryParams = params ? {
      ...(params.limit !== undefined && { limit: String(params.limit) }),
      ...(params.offset !== undefined && { offset: String(params.offset) }),
      ...(params.status && { status: params.status }),
    } : undefined;
    return api.get(`/api/advanced-ranking/${jobId}`, { params: queryParams });
  },

  /**
   * Get ranking statistics
   */
  getStatistics: async (jobId: string): Promise<RankingStatistics> => {
    return api.get(`/api/advanced-ranking/statistics/${jobId}`);
  },

  /**
   * Get candidate rankings across all jobs
   */
  getCandidateRankings: async (candidateId: string): Promise<any> => {
    return api.get(`/api/advanced-ranking/candidate/${candidateId}`);
  },
};
