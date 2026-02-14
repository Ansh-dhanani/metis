/**
 * HR Dashboard Component
 */

'use client';

import { useAuth } from '@/contexts/auth-context';
import { useDashboardData, useHRStats } from '@/hooks/use-dashboard-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/ui/stats-card';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import Link from 'next/link';
import { Briefcase, ClipboardList, Users, TrendingUp, Plus } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

export default function HRDashboard() {
  const { user } = useAuth();
  const { jobs, assessments, isLoading } = useDashboardData();
  const { stats } = useHRStats();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner  className="h-8 w-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <PageHeader
        title={`Welcome back, ${user?.firstName}!`}
        description="Here's what's happening with your recruitment"
        action={
          <Link href="/dashboard/jobs/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Job
            </Button>
          </Link>
        }
      />

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Jobs"
          value={stats.totalJobs}
          icon={Briefcase}
        />

        <StatsCard
          title="Active Assessments"
          value={stats.activeAssessments}
          icon={ClipboardList}
        />

        <StatsCard
          title="Total Candidates"
          value={stats.totalCandidates}
          icon={Users}
        />

        <StatsCard
          title="Completed"
          value={stats.completedAssessments}
          icon={TrendingUp}
        />
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
            <EmptyState
              icon={Briefcase}
              title="No jobs created yet"
              description="Create your first job posting to start receiving applications"
              action={{
                label: "Create Your First Job",
                href: "/dashboard/jobs/new"
              }}
            />
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 5).map((job) => (
                <Link
                  key={job._id}
                  href={`/dashboard/jobs/${job._id}`}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <h3 className="font-medium">{job.title}</h3>
                    <p className="text-sm text-muted-foreground">
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
            <EmptyState
              icon={ClipboardList}
              title="No assessments yet"
              description="Assessments will appear here once candidates start applying to your jobs"
            />
          ) : (
            <div className="space-y-3">
              {assessments.slice(0, 5).map((assessment) => (
                <div
                  key={assessment._id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <h3 className="font-medium">Assessment #{assessment._id.slice(-6)}</h3>
                    <p className="text-sm text-muted-foreground">
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
