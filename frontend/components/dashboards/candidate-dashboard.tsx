/**
 * Candidate Dashboard Component
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { applicationsService, jobsService } from '@/lib/api/services';
import { handleError } from '@/lib/utils/error-handler';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Briefcase, CheckCircle, Clock, Award, TrendingUp } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

interface Application {
  _id: string;
  jobId: string;
  status: string;
  stage: string;
  assessmentScore?: number;
  appliedAt: string;
  createdAt: string;
}

interface Job {
  _id: string;
  title: string;
  location: string;
  type: string;
  company?: string;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Record<string, Job>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const appsData: any = await applicationsService.getCandidateApplications(user.userId);
        setApplications(appsData || []);

        // Fetch job details for each application
        const jobsMap: Record<string, Job> = {};
        for (const app of appsData || []) {
          try {
            const jobData = await jobsService.getJob(app.jobId);
            jobsMap[app.jobId] = jobData;
          } catch (error) {
            // Silently skip individual job fetch errors
            console.error(`Failed to fetch job ${app.jobId}:`, error);
          }
        }
        setJobs(jobsMap);
      } catch (error) {
        handleError(error, 'Failed to load your applications. Please try again.');
        setApplications([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    underReview: applications.filter(a => a.status === 'under_review').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    avgScore: applications
      .filter(a => a.assessmentScore !== undefined)
      .reduce((acc, a) => acc + (a.assessmentScore || 0), 0) / 
      (applications.filter(a => a.assessmentScore !== undefined).length || 1),
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold">Welcome, {user?.firstName}!</h1>
        <p className="text-gray-500">Track your job applications and progress</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Applications
            </CardTitle>
            <Briefcase className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Under Review
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.underReview}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Accepted
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.accepted}</div>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-6 w-6" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>You haven&apos;t applied to any jobs yet.</p>
              <Link href="/dashboard/browse-jobs">
                <Button className="mt-4">Browse Jobs</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => {
                const job = jobs[app.jobId];
                return (
                  <div
                    key={app._id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {job?.title || 'Loading...'}
                        </h3>
                        {job && (
                          <p className="text-sm text-gray-500">
                            {job.company && `${job.company} • `}
                            {job.location} • {job.type}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant={
                              app.status === 'accepted'
                                ? 'default'
                                : app.status === 'rejected'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {app.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline">{app.stage}</Badge>
                          {app.assessmentScore !== undefined && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Award className="h-3 w-3" />
                              Score: {Math.round(app.assessmentScore)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p>Applied {formatDate(app.appliedAt || app.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
