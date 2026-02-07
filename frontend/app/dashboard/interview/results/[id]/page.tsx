/**
 * Interview Results Page
 * Shows candidate their final evaluation after completing the pipeline
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, TrendingUp, Award, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';import config from '@/lib/config/api';
interface EvaluationData {
  finalScore: number;
  round1Score: number;
  round2Score: number;
  interviewEvaluation?: {
    personality_score?: number;
    technical_approach_score?: number;
    communication_score?: number;
    problem_solving_score?: number;
    strengths?: string[];
    areas_for_improvement?: string[];
    overall_assessment?: string;
    hire_recommendation?: string;
  };
  candidateName?: string;
  jobTitle?: string;
}

export default function InterviewResultsPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params?.id as string;
  
  const [data, setData] = useState<EvaluationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [applicationId]);

  const fetchResults = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://metis-im23.vercel.app'}/api/applications/${applicationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const application = await response.json();
      
      setData({
        finalScore: application.finalScore || 0,
        round1Score: application.round1Score || application.metisScore || 0,
        round2Score: application.round2Score || application.interviewScore || 0,
        interviewEvaluation: application.interviewEvaluation,
        candidateName: application.candidateName,
        jobTitle: application.jobTitle,
      });
    } catch (error) {
      toast.error('Failed to load results');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute requiredRole="candidate">
        <DashboardLayout>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="mt-4 text-sm text-muted-foreground">Loading results...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!data) {
    return (
      <ProtectedRoute requiredRole="candidate">
        <DashboardLayout>
          <div className="text-center py-12">
            <p className="text-red-600">Results not found</p>
            <Button className="mt-4" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (score: number) => {
    if (score >= 70) return <Badge className="bg-green-600">Round 2 - Strong Candidate</Badge>;
    if (score >= 50) return <Badge variant="secondary">Round 1 - Under Review</Badge>;
    return <Badge variant="destructive">Below Threshold</Badge>;
  };

  return (
    <ProtectedRoute requiredRole="candidate">
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold">Application Complete!</h1>
            <p className="text-muted-foreground mt-2">
              Your application has been evaluated and scored
            </p>
          </div>

          {/* Final Score */}
          <Card className="border-2">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-lg">Final Evaluation Score</CardTitle>
              {getStatusBadge(data.finalScore)}
            </CardHeader>
            <CardContent className="text-center">
              <div className={`text-6xl font-bold mb-4 ${getScoreColor(data.finalScore)}`}>
                {data.finalScore}
                <span className="text-2xl">/100</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Calculated from: <span className="font-medium">30% Resume + 70% Interview</span>
              </p>
              
              <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-2">Round 1: Resume</div>
                  <div className="text-3xl font-bold text-blue-600">{data.round1Score}</div>
                  <div className="text-xs text-muted-foreground mt-1">30% weight</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-2">Round 2: Interview</div>
                  <div className="text-3xl font-bold text-purple-600">{data.round2Score}</div>
                  <div className="text-xs text-muted-foreground mt-1">70% weight</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interview Breakdown */}
          {data.interviewEvaluation && (
            <Card>
              <CardHeader>
                <CardTitle>Interview Performance</CardTitle>
                <CardDescription>
                  Your performance across key evaluation criteria
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Scores */}
                <div className="grid grid-cols-2 gap-4">
                  {data.interviewEvaluation.personality_score !== undefined && (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Personality</span>
                        <span className="font-medium">{data.interviewEvaluation.personality_score}/100</span>
                      </div>
                      <Progress value={data.interviewEvaluation.personality_score} className="h-2" />
                    </div>
                  )}
                  {data.interviewEvaluation.technical_approach_score !== undefined && (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Technical Approach</span>
                        <span className="font-medium">{data.interviewEvaluation.technical_approach_score}/100</span>
                      </div>
                      <Progress value={data.interviewEvaluation.technical_approach_score} className="h-2" />
                    </div>
                  )}
                  {data.interviewEvaluation.communication_score !== undefined && (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Communication</span>
                        <span className="font-medium">{data.interviewEvaluation.communication_score}/100</span>
                      </div>
                      <Progress value={data.interviewEvaluation.communication_score} className="h-2" />
                    </div>
                  )}
                  {data.interviewEvaluation.problem_solving_score !== undefined && (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Problem Solving</span>
                        <span className="font-medium">{data.interviewEvaluation.problem_solving_score}/100</span>
                      </div>
                      <Progress value={data.interviewEvaluation.problem_solving_score} className="h-2" />
                    </div>
                  )}
                </div>

                {/* Assessment */}
                {data.interviewEvaluation.overall_assessment && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Overall Assessment</h4>
                    <p className="text-sm text-muted-foreground italic">
                      "{data.interviewEvaluation.overall_assessment}"
                    </p>
                  </div>
                )}

                {/* Strengths */}
                {data.interviewEvaluation.strengths && data.interviewEvaluation.strengths.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Strengths
                    </h4>
                    <ul className="space-y-1">
                      {data.interviewEvaluation.strengths.map((strength, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Areas for Improvement */}
                {data.interviewEvaluation.areas_for_improvement && data.interviewEvaluation.areas_for_improvement.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Award className="h-4 w-4 text-blue-600" />
                      Areas for Improvement
                    </h4>
                    <ul className="space-y-1">
                      {data.interviewEvaluation.areas_for_improvement.map((area, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-blue-600">•</span>
                          <span>{area}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendation */}
                {data.interviewEvaluation.hire_recommendation && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Hiring Recommendation</h4>
                    <Badge variant={
                      data.interviewEvaluation.hire_recommendation === 'strong_yes' ? 'default' :
                      data.interviewEvaluation.hire_recommendation === 'yes' ? 'secondary' : 'outline'
                    } className="text-sm">
                      {data.interviewEvaluation.hire_recommendation.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>What Happens Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">
                  1
                </div>
                <p className="text-sm">
                  Your application will be reviewed by the hiring team
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">
                  2
                </div>
                <p className="text-sm">
                  If selected, you'll be contacted for the next round
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">
                  3
                </div>
                <p className="text-sm">
                  Check your email and dashboard for updates
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
            <Button onClick={() => router.push('/dashboard/browse-jobs')}>
              Browse More Jobs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
