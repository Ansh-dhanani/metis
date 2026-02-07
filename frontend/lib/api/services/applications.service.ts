/**
 * Applications Service
 * Handles job applications
 */

import { api } from '../client';

export interface ApplicationData {
  jobId: string;
  profileSnapshot?: any;
}

export interface Application {
  _id: string;
  jobId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  status: string;
  stage: string;
  appliedAt: string;
  profileSnapshot: {
    skills: string[];
    experience: any;
    education: any[];
    projects: any[];
    certifications: any[];
    phone: string;
    linkedinUrl: string;
    githubUrl: string;
    portfolioUrl: string;
  };
  assessmentScore?: number;
  jobTitle?: string;
  jobCompany?: string;
}

export const applicationsService = {
  /**
   * Submit a job application
   */
  submitApplication: async (data: ApplicationData) => {
    return api.post<any>('/api/applications', data);
  },

  /**
   * Get applications for a job
   */
  getJobApplications: async (jobId: string): Promise<Application[]> => {
    const response = await api.get<any>(`/api/applications/job/${jobId}`);
    return response.applications || [];
  },

  /**
   * Get applications by a candidate
   */
  getCandidateApplications: async (candidateId: string): Promise<Application[]> => {
    const response = await api.get<any>(`/api/applications/candidate/${candidateId}`);
    return response.applications || [];
  },

  /**
   * Get a specific application
   */
  getApplication: async (applicationId: string): Promise<Application> => {
    return api.get<Application>(`/api/applications/${applicationId}`);
  },

  /**
   * Update application status/stage
   */
  updateApplication: async (applicationId: string, data: any) => {
    return api.put(`/api/applications/${applicationId}`, data);
  },

  /**
   * Select a candidate and close the job
   */
  selectCandidate: async (applicationId: string) => {
    return api.post(`/api/applications/${applicationId}/select`, {});
  },

  /**
   * Accept a candidate without closing the job
   */
  acceptCandidate: async (applicationId: string) => {
    return api.post(`/api/applications/${applicationId}/accept`, {});
  },

  /**
   * Reject a candidate
   */
  rejectCandidate: async (applicationId: string) => {
    return api.post(`/api/applications/${applicationId}/reject`, {});
  },

  /**
   * Remove accepted/rejected status from application
   */
  removeStatus: async (applicationId: string) => {
    return api.post(`/api/applications/${applicationId}/remove-status`, {});
  },
};
