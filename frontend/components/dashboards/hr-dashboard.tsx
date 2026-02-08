/**
 * HR Dashboard Component
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { jobsService, assessmentsService } from '@/lib/api/services';
import { handleError } from '@/lib/utils/error-handler';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Briefcase, ClipboardList, Users, TrendingUp, Plus } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import type { Job, Assessment } from '@/lib/api/types';

export default function HRDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const [jobsData] = await Promise.all([
          jobsService.getJobs(user.userId),
        ]);
        setJobs(jobsData.jobs || []);
        
        // Fetch assessments for all jobs
        const allAssessments: Assessment[] = [];
        for (const job of jobsData.jobs) {
          try {
            const jobAssessments = await assessmentsService.getJobAssessments(job._id);
            allAssessments.push(...jobAssessments);
          } catch (error) {
            // Silently skip individual job assessment fetch errors
            console.error(`Failed to fetch assessments for job ${job._id}:`, error);
          }
        }
        setAssessments(allAssessments);
      } catch (error) {
        handleError(error, 'Failed to load dashboard data. Please try again.');
        setJobs([]);
        setAssessments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const stats = {
    totalJobs: jobs.length,
    activeAssessments: assessments.filter(a => a.status === 'in_progress').length,
    completedAssessments: assessments.filter(a => a.status === 'completed').length,
    totalCandidates: new Set(assessments.map(a => a.candidateId)).size,
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner className="h-8 w-8 mx-auto" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.firstName}!</h1>
          <p className="text-gray-500">Here&apos;s what&apos;s happening with your recruitment</p>
        </div>
        <Link href="/dashboard/jobs/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Job
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Jobs
            </CardTitle>
            <Briefcase className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalJobs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Active Assessments
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAssessments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Candidates
            </CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCandidates}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Completed
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedAssessments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Jobs</CardTitle>
            <Link href="/dashboard/jobs">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="py-8 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">No jobs created yet</p>
              <Link href="/dashboard/jobs/new">
                <Button className="mt-4" variant="outline">
                  Create Your First Job
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 5).map((job) => (
                <Link
                  key={job._id}
                  href={`/dashboard/jobs/${job._id}`}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
                >
                  <div>
                    <h3 className="font-medium">{job.title}</h3>
                    <p className="text-sm text-gray-500">
                      {job.skillWeights && job.skillWeights.length > 0 ? (
                        `${job.skillWeights.length} skills required`
                      ) : (
                        job.location
                      )}
                    </p>
                  </div>
                  <Badge>{job.type}</Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Assessments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          {assessments.length === 0 ? (
            <div className="py-8 text-center">
              <ClipboardList className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">No assessments yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assessments.slice(0, 5).map((assessment) => (
                <div
                  key={assessment._id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <h3 className="font-medium">Assessment #{assessment._id.slice(-6)}</h3>
                    <p className="text-sm text-gray-500">
                      Candidate: {assessment.candidateId}
                    </p>
                  </div>
                  <Badge variant={
                    assessment.status === 'completed' ? 'default' :
                    assessment.status === 'in_progress' ? 'secondary' : 'outline'
                  }>
                    {assessment.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
