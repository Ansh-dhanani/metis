/**
 * Jobs List Page (HR Only)
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { useAuth } from '@/contexts/auth-context';
import { jobsService } from '@/lib/api/services';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { Plus, Briefcase, ExternalLink, Trash2 } from 'lucide-react';
import type { Job } from '@/lib/api/types';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { handleError } from '@/lib/utils/error-handler';

export default function JobsPage() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('open');

  const fetchJobs = useCallback(async () => {
    if (!user) return;

    try {
      const { jobs: data } = await jobsService.getJobs(user.userId);
      setJobs(data || []);
    } catch (error) {
      handleError(error, 'Failed to load jobs. Please try again.');
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs, pathname]);

  const handleDeleteJob = async (jobId: string, jobTitle: string) => {
    if (isDeleting) return; // Prevent multiple deletions at once
    
    if (!confirm(`Are you sure you want to delete "${jobTitle}"? This will also delete all applications, assessments, and rankings associated with this job. This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(jobId);
    try {
      await jobsService.deleteJob(jobId);
      await fetchJobs();
      toast.success('Job deleted successfully');
    } catch (error) {
      handleError(error, 'Failed to delete job. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  const openJobs = jobs.filter(job => job.status !== 'filled' && job.status !== 'closed');
  const closedJobs = jobs.filter(job => job.status === 'filled' || job.status === 'closed');

  if (isLoading) {
    return (
      <ProtectedRoute requiredRole="hr">
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="h-12 w-12 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-sm text-muted-foreground">Loading jobs...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="hr">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Jobs</h1>
              <p className="text-gray-500">Manage your job postings and assessments</p>
            </div>
            <Link href="/dashboard/jobs/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Job
              </Button>
            </Link>
          </div>

          {/* Jobs Tabs */}
          {jobs.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Briefcase className="mx-auto h-12 w-12 text-gray-300" />
                  <h3 className="mt-4 text-lg font-medium">No jobs yet</h3>
                  <p className="mt-2 text-gray-500">
                    Create your first job to start assessing candidates
                  </p>
                  <Link href="/dashboard/jobs/new">
                    <Button className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Job
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList>
                <TabsTrigger value="open">
                  Open Jobs ({openJobs.length})
                </TabsTrigger>
                <TabsTrigger value="closed">
                  Closed Jobs ({closedJobs.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="open" className="mt-6">
                {openJobs.length === 0 ? (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center text-gray-500">
                        <p>No open jobs</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {openJobs.map((job) => (
                      <Card key={job._id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{job.title}</CardTitle>
                            <Badge>{job.type}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="text-sm text-gray-500">
                            {job.location} • Created {formatDate(job.createdAt)}
                          </div>

                          {job.skillWeights && job.skillWeights.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-sm font-medium">Required Skills:</div>
                              <div className="flex flex-wrap gap-1">
                                {job.skillWeights.slice(0, 4).map((sw, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {sw.skill}
                                  </Badge>
                                ))}
                                {job.skillWeights.length > 4 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{job.skillWeights.length - 4} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Link href={`/dashboard/jobs/${job._id}`} className="flex-1">
                              <Button variant="outline" className="w-full">
                                View Details
                                <ExternalLink className="ml-2 h-4 w-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="destructive" 
                              size="icon"
                              onClick={() => handleDeleteJob(job._id, job.title)}
                              disabled={isDeleting === job._id}
                            >
                              {isDeleting === job._id ? (
                                <Spinner className="h-4 w-4" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="closed" className="mt-6">
                {closedJobs.length === 0 ? (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center text-gray-500">
                        <p>No closed jobs</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {closedJobs.map((job) => (
                      <Card key={job._id} className="hover:shadow-lg transition-shadow opacity-75">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{job.title}</CardTitle>
                            <Badge variant="secondary">{job.status}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="text-sm text-gray-500">
                            {job.location} • Created {formatDate(job.createdAt)}
                          </div>

                          {job.skillWeights && job.skillWeights.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-sm font-medium">Required Skills:</div>
                              <div className="flex flex-wrap gap-1">
                                {job.skillWeights.slice(0, 4).map((sw, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {sw.skill}
                                  </Badge>
                                ))}
                                {job.skillWeights.length > 4 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{job.skillWeights.length - 4} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Link href={`/dashboard/jobs/${job._id}`} className="flex-1">
                              <Button variant="outline" className="w-full">
                                View Details
                                <ExternalLink className="ml-2 h-4 w-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="destructive" 
                              size="icon"
                              onClick={() => handleDeleteJob(job._id, job.title)}
                              disabled={isDeleting === job._id}
                            >
                              {isDeleting === job._id ? (
                                <Spinner className="h-4 w-4" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
