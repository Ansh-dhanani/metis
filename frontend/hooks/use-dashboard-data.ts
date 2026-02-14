/**
 * Custom hook for dashboard data management
 * Single source of truth for all dashboard data
 */

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { jobsService, assessmentsService, applicationsService } from '@/lib/api/services';
import { handleError } from '@/lib/utils/error-handler';
import type { Job, Assessment } from '@/lib/api/types';

interface Application {
  _id: string;
  jobId: string;
  status: string;
  stage: string;
  assessmentScore?: number;
  appliedAt: string;
  createdAt: string;
}

interface DashboardData {
  jobs: Job[];
  assessments: Assessment[];
  applications: Application[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboardData(): DashboardData {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user || !user.userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (user.role === 'hr') {
        // Fetch HR data
        const jobsData = await jobsService.getJobs(user.userId);
        const fetchedJobs = jobsData.jobs || [];
        setJobs(fetchedJobs);

        // Fetch assessments for all jobs
        const allAssessments: Assessment[] = [];
        await Promise.all(
          fetchedJobs.map(async (job) => {
            try {
              const jobAssessments = await assessmentsService.getJobAssessments(job._id);
              allAssessments.push(...jobAssessments);
            } catch (err) {
              console.error(`Failed to fetch assessments for job ${job._id}:`, err);
            }
          })
        );
        setAssessments(allAssessments);
      } else {
        // Fetch candidate data
        if (!user.userId) {
          console.error('User ID is missing for candidate');
          setError('User ID is missing. Please log in again.');
          setIsLoading(false);
          return;
        }
        
        const appsData: any = await applicationsService.getCandidateApplications(user.userId);
        setApplications(appsData || []);
      }
    } catch (err) {
      const errorMessage = 'Failed to load dashboard data. Please try again.';
      setError(errorMessage);
      handleError(err, errorMessage);
      setJobs([]);
      setAssessments([]);
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    jobs,
    assessments,
    applications,
    isLoading,
    error,
    refetch: fetchData,
  };
}

// Helper hooks for specific data
export function useHRStats() {
  const { jobs, assessments, isLoading } = useDashboardData();

  const stats = {
    totalJobs: jobs.length,
    activeJobs: jobs.filter(j => j.status === 'open').length,
    activeAssessments: assessments.filter(a => a.status === 'in_progress').length,
    completedAssessments: assessments.filter(a => a.status === 'completed').length,
    totalCandidates: new Set(assessments.map(a => a.candidateId)).size,
  };

  return { stats, isLoading };
}

export function useCandidateStats() {
  const { applications, isLoading } = useDashboardData();

  const stats = {
    total: applications.length,
    totalApplications: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    underReview: applications.filter(a => a.status === 'under_review').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    activeApplications: applications.filter(a => a.status === 'active').length,
    completedAssessments: applications.filter(a => a.status === 'completed').length,
    avgScore: applications
      .filter(a => a.assessmentScore !== undefined)
      .reduce((acc, a) => acc + (a.assessmentScore || 0), 0) / 
      (applications.filter(a => a.assessmentScore !== undefined).length || 1),
    averageScore: applications.length > 0
      ? applications
          .filter(a => a.assessmentScore)
          .reduce((sum, a) => sum + (a.assessmentScore || 0), 0) / applications.filter(a => a.assessmentScore).length
      : 0,
  };

  return { stats, isLoading };
}
