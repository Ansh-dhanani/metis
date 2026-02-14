/**
 * Candidate Dashboard Component
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useDashboardData, useCandidateStats } from '@/hooks/use-dashboard-data';
import { jobsService } from '@/lib/api/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/ui/stats-card';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
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
  const { applications, isLoading } = useDashboardData();
  const { stats } = useCandidateStats();
  const [jobs, setJobs] = useState<Record<string, Job>>({});

  useEffect(() => {
    const fetchJobDetails = async () => {
      const jobsMap: Record<string, Job> = {};
      await Promise.all(
        applications.map(async (app) => {
          try {
            const jobData = await jobsService.getJob(app.jobId);
            jobsMap[app.jobId] = jobData;
          } catch (error) {
            console.error(`Failed to fetch job ${app.jobId}:`, error);
          }
        })
      );
      setJobs(jobsMap);
    };

    if (applications.length > 0) {
      fetchJobDetails();
    }
  }, [applications]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <PageHeader
        title={`Welcome, ${user?.firstName}!`}
        description="Track your job applications and progress"
      />

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Applications"
          value={stats.total}
          icon={Briefcase}
        />

        <StatsCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
        />

        <StatsCard
          title="Under Review"
          value={stats.underReview}
          icon={TrendingUp}
        />

        <StatsCard
          title="Accepted"
          value={stats.accepted}
          icon={CheckCircle}
        />
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
            <EmptyState
              icon={Briefcase}
              title="You haven't applied to any jobs yet"
              description="Start browsing available jobs and submit your applications to track them here"
              action={{
                label: "Browse Jobs",
                href: "/dashboard/browse-jobs"
              }}
            />
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
                          <p className="text-sm text-muted-foreground">
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
                      <div className="text-right text-sm text-muted-foreground">
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
