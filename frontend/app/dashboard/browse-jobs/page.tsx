/**
 * Browse Jobs Page - For Candidates to view and apply for jobs
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { jobsService, applicationsService } from '@/lib/api/services';
import { useAuth } from '@/contexts/auth-context';
import { handleError } from '@/lib/utils/error-handler';
import { Search, Briefcase, MapPin, Clock, Filter, CheckCircle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import type { Job } from '@/lib/api/types';

export default function BrowseJobsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchApplications = useCallback(async () => {
    if (!user) return;
    try {
      const applications = await applicationsService.getCandidateApplications(user.userId);
      const jobIds = new Set(applications.map((app: any) => app.jobId));
      setAppliedJobIds(jobIds);
    } catch (error) {
      handleError(error, 'Failed to load your applications.');
    }
  }, [user]);

  useEffect(() => {
    fetchJobs();
    if (user) {
      fetchApplications();
    }
  }, [user, fetchApplications]);

  const fetchJobs = async () => {
    try {
      const data = await jobsService.getJobs();
      setJobs(data.jobs || []);
    } catch (error) {
      handleError(error, 'Failed to load jobs. Please try again.');
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract unique values for filters
  const jobTypes = ['all', ...Array.from(new Set(jobs.map(j => j.type).filter(Boolean)))];
  const locations = ['all', ...Array.from(new Set(jobs.map(j => j.location).filter(Boolean)))];

  const filteredJobs = jobs.filter(job => {
    // Only show open jobs (not closed or filled)
    if (job.status === 'closed' || job.status === 'filled') {
      return false;
    }

    // Search filter
    const matchesSearch = searchTerm === '' || 
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchTerm.toLowerCase());

    // Type filter - case insensitive comparison
    const matchesType = filterType === 'all' || 
      (job.type && filterType && job.type.toLowerCase() === filterType.toLowerCase());

    // Location filter - case insensitive comparison
    const matchesLocation = filterLocation === 'all' || 
      (job.location && filterLocation && job.location.toLowerCase() === filterLocation.toLowerCase());

    return matchesSearch && matchesType && matchesLocation;
  });

  const handleApply = (jobId: string) => {
    router.push(`/dashboard/apply/${jobId}`);
  };

  return (
    <ProtectedRoute requiredRole="candidate">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Browse Jobs</h1>
            <p className="text-muted-foreground">
              Find and apply for your dream job
            </p>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search jobs by title or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filters:</span>
                  </div>

                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Job Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type === 'all' ? 'All Types' : type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterLocation} onValueChange={setFilterLocation}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc === 'all' ? 'All Locations' : loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {(filterType !== 'all' || filterLocation !== 'all' || searchTerm) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setFilterType('all');
                        setFilterLocation('all');
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}

                  <div className="ml-auto text-sm text-muted-foreground">
                    {filteredJobs.length} of {jobs.length} jobs
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Jobs Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="text-center space-y-4">
                <Spinner className="h-12 w-12 mx-auto" />
                <p className="text-sm text-muted-foreground">Loading jobs...</p>
              </div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm || filterType !== 'all' || filterLocation !== 'all'
                    ? 'No jobs found matching your filters'
                    : 'No jobs available at the moment'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredJobs.map((job) => (
                <Card key={job._id} className="hover:shadow-lg transition-shadow flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{job.title}</CardTitle>
                        <CardDescription className="mt-1">
                          Department
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {job.type || 'Full-time'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1 flex flex-col">
                    {/* Job Details */}
                    <div className="space-y-2 flex-1">
                      {job.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{job.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                    

                    {/* Description Preview */}
                    {job.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {job.description}
                      </p>
                    )}

                    {/* Skills */}
                    {job.skillWeights && job.skillWeights.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {job.skillWeights.slice(0, 5).map((sw, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {sw.skill}
                          </Badge>
                        ))}
                        {job.skillWeights.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{job.skillWeights.length - 5} more
                          </Badge>
                        )}
                      </div>
                    )}
                    </div>

                    {/* Apply Button - Always at bottom */}
                    <div className="pt-2">
                    {appliedJobIds.has(job._id) ? (
                      <Button 
                        className="w-full" 
                        variant="outline"
                        disabled
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Already Applied
                      </Button>
                    ) : (
                      <Button 
                        className="w-full" 
                        onClick={() => handleApply(job._id)}
                      >
                        Apply Now
                      </Button>
                    )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
