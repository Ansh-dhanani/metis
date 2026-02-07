/**
 * Job Application Page with Resume Upload and Parsing
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { jobsService, authService, applicationsService } from '@/lib/api/services';
import { useAuth } from '@/contexts/auth-context';
import { Upload, FileText, CheckCircle, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage, handleError } from '@/lib/utils/error-handler';
import type { Job } from '@/lib/api/types';

type Step = 'upload' | 'review' | 'confirm' | 'complete';

export default function JobApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const jobId = params?.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAlreadyApplied, setHasAlreadyApplied] = useState(false);

  // Resume upload state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  // Parsed profile data
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
    skills: [] as string[],
    experience: {} as any,
    education: [] as any[],
    projects: [] as any[],
    certifications: [] as any[],
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
  });

  useEffect(() => {
    fetchJobDetails();
    checkExistingApplication();
  }, [jobId, user]);

  const fetchJobDetails = async () => {
    try {
      const jobData = await jobsService.getJob(jobId);
      setJob(jobData);
    } catch (error) {
      console.error('Failed to fetch job:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkExistingApplication = async () => {
    if (!user) return;
    try {
      const applications = await applicationsService.getCandidateApplications(user.userId);
      const alreadyApplied = applications.some((app: any) => app.jobId === jobId);
      setHasAlreadyApplied(alreadyApplied);
      if (alreadyApplied) {
        setCurrentStep('complete');
      }
    } catch (error) {
      console.error('Failed to check applications:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleUploadAndParse = async () => {
    if (!resumeFile) return;

    setIsParsing(true);
    try {
      const parsedData = await authService.uploadResume(resumeFile);
      
      // Update profile data with parsed information
      setProfileData(prev => ({
        ...prev,
        skills: parsedData.skills || prev.skills || [],
        education: parsedData.education || prev.education || [],
        projects: parsedData.projects || prev.projects || [],
        certifications: parsedData.certifications || prev.certifications || [],
        phone: parsedData.phone || prev.phone || '',
        linkedinUrl: parsedData.linkedinUrl || prev.linkedinUrl || '',
        githubUrl: parsedData.githubUrl || prev.githubUrl || '',
        portfolioUrl: parsedData.portfolioUrl || prev.portfolioUrl || '',
        experience: parsedData.experience || prev.experience || {},
      }));

      setCurrentStep('review');
    } catch (error) {
      console.error('Failed to parse resume:', error);
      alert('Failed to parse resume. Please try again or enter details manually.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleProfileUpdate = (field: string, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitApplication = async () => {
    setIsSubmitting(true);
    try {
      // Update user profile first
      await authService.updateProfile(profileData);
      
      // Submit application
      await applicationsService.submitApplication({
        jobId,
        profileSnapshot: profileData,
      });

      toast.success('Application submitted successfully!');
      setCurrentStep('complete');
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      
      if (errorMessage.includes('already applied')) {
        toast.error('You have already applied for this job.');
        setHasAlreadyApplied(true);
        setCurrentStep('complete');
      } else if (errorMessage.includes('complete your profile') || 
                 errorMessage.includes('upload your resume') ||
                 errorMessage.includes('add your skills')) {
        toast.error(errorMessage);
        // Stay on current step so user can fix the issues
      } else if (errorMessage.includes('no longer accepting')) {
        toast.error('This job is no longer accepting applications.');
        setCurrentStep('complete');
      } else {
        handleError(error, 'Failed to submit application. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute requiredRole="candidate">
        <DashboardLayout>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="mt-4 text-sm text-muted-foreground">Loading job details...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!job) {
    return (
      <ProtectedRoute requiredRole="candidate">
        <DashboardLayout>
          <div className="text-center py-12">
            <p className="text-red-600">Job not found</p>
            <Button className="mt-4" onClick={() => router.push('/dashboard/browse-jobs')}>
              Back to Jobs
            </Button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="candidate">
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Apply for {job.title}</h1>
            <p className="text-muted-foreground">{job.location || 'Location TBD'}</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {['Upload Resume', 'Review Details', 'Confirm'].map((label, idx) => {
              const stepValues: Step[] = ['upload', 'review', 'confirm'];
              const stepIndex = stepValues.indexOf(currentStep);
              const isActive = idx === stepIndex;
              const isCompleted = idx < stepIndex;

              return (
                <div key={label} className="flex items-center flex-1">
                  <div className={`flex items-center gap-2 ${idx > 0 ? 'w-full' : ''}`}>
                    {idx > 0 && (
                      <div className={`h-1 flex-1 ${isCompleted ? 'bg-primary' : 'bg-gray-200'}`} />
                    )}
                    <div className={`flex items-center gap-2 ${isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isActive ? 'border-primary bg-primary text-white' : isCompleted ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300'}`}>
                        {isCompleted ? <CheckCircle className="h-4 w-4" /> : idx + 1}
                      </div>
                      <span className="text-sm font-medium hidden md:block">{label}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Step Content */}
          {currentStep === 'upload' && (
            <Card>
              <CardHeader>
                <CardTitle>Upload Your Resume</CardTitle>
                <CardDescription>
                  Upload your resume and we'll automatically extract your skills and experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <div className="space-y-2">
                    <Label htmlFor="resume" className="cursor-pointer text-primary hover:underline">
                      Click to upload resume
                    </Label>
                    <Input
                      id="resume"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {resumeFile && (
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>{resumeFile.name}</span>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      PDF, DOC, or DOCX (Max 5MB)
                    </p>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => router.push('/dashboard/browse-jobs')}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUploadAndParse} 
                    disabled={!resumeFile || isParsing}
                  >
                    {isParsing ? 'Parsing...' : 'Upload & Continue'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <Button
                    variant="link"
                    onClick={() => setCurrentStep('review')}
                    className="text-sm"
                  >
                    Skip and enter details manually
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 'review' && (
            <Card>
              <CardHeader>
                <CardTitle>Review Your Information</CardTitle>
                <CardDescription>
                  Please review and update your details before submitting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => handleProfileUpdate('firstName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => handleProfileUpdate('lastName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleProfileUpdate('email', e.target.value)}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => handleProfileUpdate('phone', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Experience Summary</Label>
                  <Textarea
                    id="experience"
                    rows={4}
                    value={profileData.experience}
                    onChange={(e) => handleProfileUpdate('experience', e.target.value)}
                    placeholder="Describe your work experience..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Skills</Label>
                  <div className="flex flex-wrap gap-2 p-3 border rounded-lg min-h-[60px]">
                    {profileData.skills.map((skill, idx) => (
                      <Badge key={idx} variant="secondary">
                        {skill}
                        <button
                          onClick={() => handleProfileUpdate('skills', profileData.skills.filter((_, i) => i !== idx))}
                          className="ml-1 hover:text-red-600"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a skill"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.currentTarget;
                          if (input.value.trim()) {
                            handleProfileUpdate('skills', [...profileData.skills, input.value.trim()]);
                            input.value = '';
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn URL</Label>
                    <Input
                      id="linkedin"
                      value={profileData.linkedinUrl}
                      onChange={(e) => handleProfileUpdate('linkedinUrl', e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="github">GitHub URL</Label>
                    <Input
                      id="github"
                      value={profileData.githubUrl}
                      onChange={(e) => handleProfileUpdate('githubUrl', e.target.value)}
                      placeholder="https://github.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="portfolio">Portfolio URL</Label>
                    <Input
                      id="portfolio"
                      value={profileData.portfolioUrl}
                      onChange={(e) => handleProfileUpdate('portfolioUrl', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep('upload')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={() => setCurrentStep('confirm')}>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 'confirm' && (
            <Card>
              <CardHeader>
                <CardTitle>Confirm Application</CardTitle>
                <CardDescription>
                  Please review your application before submitting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold mb-2">Personal Information</h3>
                    <p className="text-sm text-muted-foreground">
                      {profileData.firstName} {profileData.lastName} • {profileData.email}
                      {profileData.phone && ` • ${profileData.phone}`}
                    </p>
                  </div>

                  {profileData.skills.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Skills</h3>
                      <div className="flex flex-wrap gap-1">
                        {profileData.skills.map((skill, idx) => (
                          <Badge key={idx} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {profileData.experience && (
                    <div>
                      <h3 className="font-semibold mb-2">Experience</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {profileData.experience}
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold">Next Steps</p>
                      <p className="mt-1">
                        After submitting, you'll receive an assessment link via email. Complete the assessment to proceed with your application.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep('review')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleSubmitApplication} disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 'complete' && (
            <Card>
              <CardContent className="text-center py-12">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  {hasAlreadyApplied ? 'Already Applied!' : 'Application Submitted!'}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {hasAlreadyApplied 
                    ? `You have already applied for ${job?.title || 'this position'}. We'll notify you when there are updates.`
                    : `Your application for ${job?.title || 'this position'} has been successfully submitted.`
                  }
                </p>
                <div className="space-y-3">
                  <Button onClick={() => router.push('/dashboard')}>
                    Go to Dashboard
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/dashboard/browse-jobs')} className="ml-2">
                    Browse More Jobs
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
