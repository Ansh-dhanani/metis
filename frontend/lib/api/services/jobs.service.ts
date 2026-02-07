/**
 * Jobs Service
 * Handles job creation, parsing, and management
 */

import { api } from '../client';
import type {
  CreateJobRequest,
  CreateJobResponse,
  Job,
} from '../types';

export const jobsService = {
  /**
   * Create a new job description
   */
  createJob: async (data: CreateJobRequest): Promise<CreateJobResponse> => {
    return api.post<CreateJobResponse>('/api/jobs', data);
  },

  /**
   * Get job by ID
   */
  getJob: async (jobId: string): Promise<Job> => {
    return api.get<Job>(`/api/jobs/${jobId}`);
  },

  /**
   * Get all jobs (optionally filtered by HR user)
   */
  getJobs: async (hrId?: string): Promise<{ jobs: Job[] }> => {
    const params = hrId ? { hrId } : undefined;
    return api.get<{ jobs: Job[] }>('/api/jobs', { params });
  },

  /**
   * Delete a job
   */
  deleteJob: async (jobId: string): Promise<{ message: string }> => {
    return api.delete<{ message: string }>(`/api/jobs/${jobId}`);
  },
};
