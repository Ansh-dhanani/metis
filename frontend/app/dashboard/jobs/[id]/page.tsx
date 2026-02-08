/**
 * Job Details Page (HR Only)
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { jobsService, assessmentsService, rankingsService, applicationsService, evaluationService, advancedRankingService } from '@/lib/api/services';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { ArrowLeft, Users, BarChart3, RefreshCw, FileText, Award, UserCheck, Sparkles, Zap } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import type { Job, Assessment, CandidateRanking } from '@/lib/api/types';
import { formatDate, getScoreColor } from '@/lib/utils';
import { DataTable } from '@/components/data-table/data-table';
import { createApplicationColumns, type Application as AppColumnType } from './applications-columns';
import { toast } from 'sonner';
import { handleError } from '@/lib/utils/error-handler';

interface Application {
  _id: string;
  jobId: string;
  candidateId: string;
  status: string;
  stage: string;
  assessmentScore?: number;
  finalScore?: number;
  round1Score?: number;
  round2Score?: number;
  metisScore?: number;
  metisEvaluation?: any;
  interviewScore?: number;
  interviewEvaluation?: any;
  advancedRanking?: any;
  profileSnapshot: {
    firstName: string;
    lastName: string;
    email: string;
    skills: string[];
    phone?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
    experience?: any;
    education?: any[];
    projects?: any[];
    certifications?: any[];
    resumeText?: string;
  };
  createdAt?: string;
  appliedAt?: string;
}

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;
  
  const [job, setJob] = useState<Job | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [rankings, setRankings] = useState<CandidateRanking[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingRankings, setIsGeneratingRankings] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isGeneratingAdvancedRankings, setIsGeneratingAdvancedRankings] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<AppColumnType | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const fetchJobData = async () => {
      try {
        const [jobData, assessmentsData, applicationsData] = await Promise.all([
          jobsService.getJob(jobId),
          assessmentsService.getJobAssessments(jobId),
          applicationsService.getJobApplications(jobId),
        ]);

        setJob(jobData);
        setAssessments(assessmentsData || []);
        setApplications(applicationsData as any || []);

        // Try to fetch existing rankings
        try {
          const { rankings: rankingsData } = await rankingsService.getRankings(jobId);
          setRankings(rankingsData || []);
        } catch {
          // Rankings might not exist yet
          setRankings([]);
        }
      } catch (error) {
        handleError(error, 'Failed to load job details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (jobId) {
      fetchJobData();
    }
  }, [jobId]);

  const handleGenerateRankings = async () => {
    setIsGeneratingRankings(true);
    try {
      const { rankings: newRankings } = await rankingsService.generateRankings(jobId);
      setRankings(newRankings);
      toast.success('Rankings generated successfully');
    } catch (error) {
      handleError(error, 'Failed to generate rankings. Please try again.');
    } finally {
      setIsGeneratingRankings(false);
    }
  };

  const handleBatchEvaluate = async () => {
    if (!confirm(`Evaluate all ${applications.length} applications with METIS AI?`)) {
      return;
    }

    setIsEvaluating(true);
    try {
      const result = await evaluationService.batchEvaluate(jobId);
      toast.success(result.message || 'Applications evaluated successfully');
      
      // Also evaluate interviews if any exist
      try {
        const interviewResult = await evaluationService.batchEvaluateInterviews(jobId);
        if (interviewResult.evaluated > 0) {
          toast.success(`Evaluated ${interviewResult.evaluated} interviews`);
        }
      } catch (_err) {
        console.log('No interviews to evaluate');
      }
      
      // Refresh applications to show METIS scores
      const applicationsData = await applicationsService.getJobApplications(jobId);
      setApplications(applicationsData as any || []);
    } catch (error) {
      handleError(error, 'Failed to evaluate applications. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleGenerateAdvancedRankings = async () => {
    setIsGeneratingAdvancedRankings(true);
    try {
      const { leaderboard } = await advancedRankingService.generateRankings(jobId);
      toast.success(
        <div>
          <div className="font-semibold">Advanced Rankings Generated!</div>
          <div className="text-sm mt-1">
            Round 1: {leaderboard.round_1_count} • Round 2: {leaderboard.round_2_count}
          </div>
        </div>,
        { duration: 5000 }
      );
      
      // Refresh to show rankings
      const applicationsData = await applicationsService.getJobApplications(jobId);
      setApplications(applicationsData as any || []);
    } catch (error) {
      handleError(error, 'Failed to generate advanced rankings. Please try again.');
    } finally {
      setIsGeneratingAdvancedRankings(false);
    }
  };

  const handleSelectCandidate = async (applicationId: string) => {
    if (!confirm('Are you sure you want to select this candidate? This will close the job and reject all other applications.')) {
      return;
    }

    try {
      await applicationsService.selectCandidate(applicationId);
      toast.success('Candidate selected successfully. Job moved to Closed Jobs.');
      
      // Redirect to jobs page to see the job in closed jobs tab
      setTimeout(() => {
        router.push('/dashboard/jobs');
      }, 1000);
    } catch (error) {
      handleError(error, 'Failed to select candidate. Please try again.');
    }
  };

  const handleAcceptCandidate = async (applicationId: string) => {
    try {
      await applicationsService.acceptCandidate(applicationId);
      toast.success('Candidate accepted and job closed successfully.');
      
      // Redirect to jobs page to see the job in closed jobs tab
      setTimeout(() => {
        router.push('/dashboard/jobs');
      }, 1000);
    } catch (error) {
      handleError(error, 'Failed to accept candidate. Please try again.');
    }
  };

  const handleRejectCandidate = async (applicationId: string) => {
    if (!confirm('Are you sure you want to reject this candidate?')) {
      return;
    }

    try {
      await applicationsService.rejectCandidate(applicationId);
      toast.success('Candidate rejected successfully');
      
      // Refresh applications
      const applicationsData = await applicationsService.getJobApplications(jobId);
      setApplications(applicationsData as any || []);
    } catch (error) {
      handleError(error, 'Failed to reject candidate. Please try again.');
    }
  };

  const handleRemoveStatus = async (applicationId: string) => {
    if (!confirm('Are you sure you want to remove the status from this application?')) {
      return;
    }

    try {
      const response = await applicationsService.removeStatus(applicationId) as { message: string, jobStatus?: string };
      toast.success(response.message);
      
      // Refresh data (job might have been reopened)
      const [jobData, applicationsData] = await Promise.all([
        jobsService.getJob(jobId),
        applicationsService.getJobApplications(jobId),
      ]);
      setJob(jobData);
      setApplications(applicationsData as any || []);
    } catch (error) {
      handleError(error, 'Failed to remove status. Please try again.');
    }
  };

  const handleViewProfile = (application: AppColumnType) => {
    setSelectedProfile(application);
    setIsProfileOpen(true);
  };

  if (isLoading) {
    return (
      <ProtectedRoute requiredRole="hr">
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <Spinner className="h-12 w-12 mx-auto" />
              <p className="text-sm text-muted-foreground">Loading job details...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!job) {
    return (
      <ProtectedRoute requiredRole="hr">
        <DashboardLayout>
          <div className="text-center py-12">
            <p className="text-red-600">Job not found</p>
            <Link href="/dashboard/jobs">
              <Button className="mt-4" variant="outline">
                Back to Jobs
              </Button>
            </Link>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const completedAssessments = assessments.filter(a => a.status === 'completed');
  
  // Calculate analytics for applications
  const applicationStats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    underReview: applications.filter(a => a.status === 'under_review').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    avgScore: applications.filter(a => a.assessmentScore).length > 0
      ? applications.reduce((sum, a) => sum + (a.assessmentScore || 0), 0) / applications.filter(a => a.assessmentScore).length
      : 0,
    withScores: applications.filter(a => a.assessmentScore).length,
    topSkills: {} as Record<string, number>,
  };

  // Extract top skills from all applicants
  applications.forEach(app => {
    app.profileSnapshot?.skills?.forEach((skill: string) => {
      applicationStats.topSkills[skill] = (applicationStats.topSkills[skill] || 0) + 1;
    });
  });

  const topSkillsArray = Object.entries(applicationStats.topSkills)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <ProtectedRoute requiredRole="hr">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/jobs">
                <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">{job.title}</h1>
                <p className="text-gray-500">
                  Created {formatDate(job.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {applications.length > 0 && (
                <Button 
                  onClick={handleBatchEvaluate} 
                  disabled={isEvaluating}
                  variant="outline"
                  className="border-purple-200 hover:bg-purple-50"
                >
                  <Sparkles className={`mr-2 h-4 w-4 ${isEvaluating ? 'animate-spin' : ''}`} />
                  {isEvaluating ? 'Evaluating...' : 'METIS Evaluate All'}
                </Button>
              )}
              {applications.length > 0 && (
                <Button 
                  onClick={handleGenerateAdvancedRankings} 
                  disabled={isGeneratingAdvancedRankings}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Zap className={`mr-2 h-4 w-4 ${isGeneratingAdvancedRankings ? 'animate-spin' : ''}`} />
                  {isGeneratingAdvancedRankings ? 'Generating...' : 'Advanced Rankings'}
                </Button>
              )}
              {completedAssessments.length > 0 && (
                <Button onClick={handleGenerateRankings} disabled={isGeneratingRankings} variant="outline">
                  <RefreshCw className={`mr-2 h-4 w-4 ${isGeneratingRankings ? 'animate-spin' : ''}`} />
                  {isGeneratingRankings ? 'Generating...' : 'Basic Rankings'}
                </Button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Applications
                </CardTitle>
                <FileText className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{applicationStats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {applicationStats.withScores} with scores
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Pending
                </CardTitle>
                <Users className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{applicationStats.pending}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Under Review
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{applicationStats.underReview}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Accepted
                </CardTitle>
                <Award className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{applicationStats.accepted}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Avg Score
                </CardTitle>
                <Award className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {applicationStats.avgScore > 0 ? Math.round(applicationStats.avgScore) : 'N/A'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Skills Analytics */}
          {topSkillsArray.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Skills Among Applicants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topSkillsArray.map(([skill, count]) => (
                    <div key={skill} className="flex items-center justify-between">
                      <span className="font-medium">{skill}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${(count / applicationStats.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-16 text-right">
                          {count} / {applicationStats.total}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Job Details */}
          <Card>
            <CardHeader>
              <CardTitle>Job Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{job.description}</p>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-medium mb-2">Location</h3>
                  <p className="text-gray-600">{job.location}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Job Type</h3>
                  <Badge>{job.type}</Badge>
                </div>
              </div>

              {job.skillWeights && job.skillWeights.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-2">Required Skills & Weights</h3>
                    <div className="space-y-2">
                      {job.skillWeights.map((sw, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="font-medium">{sw.skill}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{ width: `${sw.weight * 100}%` }}
                              />
                            </div>
                            <span className="text-gray-600 w-12 text-right">
                              {(sw.weight * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Applications Table */}
          {applications.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Candidates Who Applied ({applications.length})</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {job?.status === 'filled' 
                        ? 'Position has been filled' 
                        : 'Sorted by AI assessment score (highest first)'}
                    </p>
                  </div>
                  {job?.status === 'filled' && (
                    <Badge variant="default" className="text-sm">
                      <UserCheck className="mr-1 h-4 w-4" />
                      Position Filled
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <DataTable
                columns={createApplicationColumns(handleSelectCandidate, handleViewProfile, handleAcceptCandidate, handleRejectCandidate, handleRemoveStatus)}
                  data={applications
                    .map(app => ({
                      _id: app._id,
                      candidateId: app.candidateId,
                      candidateName: `${app.profileSnapshot?.firstName || ''} ${app.profileSnapshot?.lastName || ''}`.trim() || 'Unknown',
                      candidateEmail: app.profileSnapshot?.email || 'N/A',
                      status: app.status,
                      stage: app.stage,
                      appliedAt: app.appliedAt || app.createdAt || '',
                      assessmentScore: app.assessmentScore,
                      // Pipeline scores
                      finalScore: app.finalScore,
                      round1Score: app.round1Score || app.metisScore,
                      round2Score: app.round2Score,
                      metisScore: app.metisScore,
                      metisEvaluation: app.metisEvaluation,
                      interviewScore: app.interviewScore,
                      interviewEvaluation: app.interviewEvaluation,
                      advancedRanking: app.advancedRanking,
                      profileSnapshot: {
                        skills: app.profileSnapshot?.skills || [],
                        phone: app.profileSnapshot?.phone,
                        linkedinUrl: app.profileSnapshot?.linkedinUrl,
                        githubUrl: app.profileSnapshot?.githubUrl,
                        portfolioUrl: app.profileSnapshot?.portfolioUrl,
                        experience: app.profileSnapshot?.experience,
                        education: app.profileSnapshot?.education || [],
                        projects: app.profileSnapshot?.projects || [],
                        certifications: app.profileSnapshot?.certifications || [],
                        resumeText: app.profileSnapshot?.resumeText,
                      }
                    }))
                    // Sort by final score (highest first)
                    .sort((a, b) => {
                      const scoreA = a.finalScore || a.metisScore || 0;
                      const scoreB = b.finalScore || b.metisScore || 0;
                      return scoreB - scoreA;
                    })
                  }
                  searchKey="candidateName"
                  searchPlaceholder="Search candidates..."
                />
              </CardContent>
            </Card>
          )}

          <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
            <DialogContent className="!max-w-[90vw] max-h-[90vh] w-[90vw]">
              <DialogHeader>
                <DialogTitle>Candidate Profile</DialogTitle>
              </DialogHeader>
              {selectedProfile && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
                  {/* Left side - Profile details */}
                  <ScrollArea className="max-h-[70vh] pr-4">
                    <div className="space-y-6">
                    
                    {/* Evaluation Summary */}
                    {(selectedProfile.finalScore || selectedProfile.metisScore) && (
                      <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                        <h4 className="font-semibold text-lg mb-3">Evaluation Summary</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {selectedProfile.finalScore && (
                            <div className="text-center">
                              <div className="text-3xl font-bold text-blue-600">
                                {selectedProfile.finalScore}
                                <span className="text-lg">/100</span>
                              </div>
                              <div className="text-sm text-muted-foreground">Final Score</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                30% Resume + 70% Interview
                              </div>
                            </div>
                          )}
                          {selectedProfile.round1Score !== undefined && (
                            <div className="text-center">
                              <div className="text-2xl font-semibold text-green-600">
                                {selectedProfile.round1Score}
                                <span className="text-sm">/100</span>
                              </div>
                              <div className="text-sm text-muted-foreground">Resume Score</div>
                            </div>
                          )}
                          {selectedProfile.round2Score !== undefined && (
                            <div className="text-center">
                              <div className="text-2xl font-semibold text-purple-600">
                                {selectedProfile.round2Score}
                                <span className="text-sm">/100</span>
                              </div>
                              <div className="text-sm text-muted-foreground">Interview Score</div>
                            </div>
                          )}
                          {selectedProfile.metisScore && !selectedProfile.finalScore && (
                            <div className="text-center">
                              <div className="text-3xl font-bold text-green-600">
                                {selectedProfile.metisScore}
                                <span className="text-lg">/100</span>
                              </div>
                              <div className="text-sm text-muted-foreground">METIS Score</div>
                            </div>
                          )}
                        </div>
                        
                        {/* Interview Evaluation Summary */}
                        {selectedProfile.interviewEvaluation && (
                          <div className="mt-4 pt-4 border-t space-y-2">
                            <p className="text-sm"><span className="font-medium">Recommendation:</span> {selectedProfile.interviewEvaluation.hire_recommendation?.replace('_', ' ').toUpperCase()}</p>
                            <p className="text-sm text-muted-foreground italic">{selectedProfile.interviewEvaluation.overall_assessment}</p>
                            {selectedProfile.interviewEvaluation.strengths && selectedProfile.interviewEvaluation.strengths.length > 0 && (
                              <div className="text-xs">
                                <span className="font-medium">Strengths:</span> {selectedProfile.interviewEvaluation.strengths.join(', ')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-lg font-semibold">{selectedProfile.candidateName}</h3>
                      <p className="text-sm text-muted-foreground">{selectedProfile.candidateEmail}</p>
                      {selectedProfile.profileSnapshot?.phone && (
                        <p className="text-sm text-muted-foreground">{selectedProfile.profileSnapshot.phone}</p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Social Links</h4>
                      <div className="space-y-1 text-sm">
                        <p>LinkedIn: {selectedProfile.profileSnapshot?.linkedinUrl || 'N/A'}</p>
                        <p>GitHub: {selectedProfile.profileSnapshot?.githubUrl || 'N/A'}</p>
                        <p>Portfolio: {selectedProfile.profileSnapshot?.portfolioUrl || 'N/A'}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {(selectedProfile.profileSnapshot?.skills || []).length > 0 ? (
                          selectedProfile.profileSnapshot.skills?.map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No skills listed</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Experience</h4>
                      <pre className="text-sm whitespace-pre-wrap rounded-md border p-3 bg-muted/30">
                        {selectedProfile.profileSnapshot?.experience
                          ? JSON.stringify(selectedProfile.profileSnapshot.experience, null, 2)
                          : 'No experience listed'}
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Education</h4>
                      <pre className="text-sm whitespace-pre-wrap rounded-md border p-3 bg-muted/30">
                        {(selectedProfile.profileSnapshot?.education || []).length > 0
                          ? JSON.stringify(selectedProfile.profileSnapshot.education, null, 2)
                          : 'No education listed'}
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Projects</h4>
                      <pre className="text-sm whitespace-pre-wrap rounded-md border p-3 bg-muted/30">
                        {(selectedProfile.profileSnapshot?.projects || []).length > 0
                          ? JSON.stringify(selectedProfile.profileSnapshot.projects, null, 2)
                          : 'No projects listed'}
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Certifications</h4>
                      <pre className="text-sm whitespace-pre-wrap rounded-md border p-3 bg-muted/30">
                        {(selectedProfile.profileSnapshot?.certifications || []).length > 0
                          ? JSON.stringify(selectedProfile.profileSnapshot.certifications, null, 2)
                          : 'No certifications listed'}
                      </pre>
                    </div>
                  </div>
                </ScrollArea>

                {/* Right side - Resume viewer */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 p-3 border-b">
                    <h4 className="font-medium">Resume</h4>
                  </div>
                  <div className="h-[calc(70vh-48px)] overflow-auto">
                    {selectedProfile.profileSnapshot?.resumeText ? (
                      <ScrollArea className="h-full">
                        <div className="p-4">
                          <pre className="text-xs whitespace-pre-wrap">
                            {selectedProfile.profileSnapshot.resumeText}
                          </pre>
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No resume available</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Rankings */}
          {rankings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Candidate Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rankings.map((ranking) => (
                    <div
                      key={ranking.candidateId}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-bold">
                          #{ranking.rank}
                        </div>
                        <div>
                          <h3 className="font-medium">{ranking.candidateName}</h3>
                          <p className="text-sm text-gray-500">
                            {ranking.strengths.slice(0, 2).join(', ')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(ranking.weightedScore)}`}>
                          {Math.round(ranking.weightedScore)}
                        </div>
                        <Badge variant={
                          ranking.recommendation === 'strong_hire' ? 'default' :
                          ranking.recommendation === 'hire' ? 'secondary' : 'outline'
                        }>
                          {ranking.recommendation.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assessments */}
          <Card>
            <CardHeader>
              <CardTitle>Assessments</CardTitle>
            </CardHeader>
            <CardContent>
              {assessments.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  No assessments created yet
                </div>
              ) : (
                <div className="space-y-3">
                  {assessments.map((assessment) => (
                    <div
                      key={assessment._id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <h3 className="font-medium">
                          Candidate: {assessment.candidateId}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {assessment.status === 'completed' && (assessment.overallScore !== undefined || assessment.score !== undefined)
                            ? `Score: ${Math.round(assessment.overallScore || assessment.score || 0)}/100`
                            : `Status: ${assessment.status.replace('_', ' ')}`}
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
      </DashboardLayout>
    </ProtectedRoute>
  );
}
