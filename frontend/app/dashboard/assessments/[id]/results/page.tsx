/**
 * Assessment Results Page
 * Shows assessment completion results with scores
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { assessmentsService } from '@/lib/api/services';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, TrendingUp, Award } from 'lucide-react';
import Link from 'next/link';
import type { Assessment } from '@/lib/api/types';

export default function AssessmentResultsPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params?.id as string;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await assessmentsService.getAssessment(assessmentId);
        if (data.status !== 'completed') {
          router.push(`/dashboard/assessments/${assessmentId}`);
          return;
        }
        setAssessment(data);
      } catch (error) {
        console.error('Failed to fetch results:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (assessmentId) {
      fetchResults();
    }
  }, [assessmentId, router]);

  if (isLoading) {
    return (
      <ProtectedRoute requiredRole="candidate">
        <DashboardLayout>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="mt-4 text-sm text-gray-500">Loading results...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!assessment) {
    return null;
  }

  const overallScore = assessment.score || 0;
  const scorePercentage = (overallScore / 100) * 100;

  return (
    <ProtectedRoute requiredRole="candidate">
      <DashboardLayout>
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Success Header */}
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2">Assessment Completed!</h1>
              <p className="text-gray-600">
                Your responses have been recorded and scored.
              </p>
            </CardContent>
          </Card>

          {/* Overall Score */}
          <Card>
            <CardHeader>
              <CardTitle>Your Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-6xl font-bold text-primary mb-2">
                  {overallScore.toFixed(1)}%
                </div>
                <p className="text-gray-600">
                  You answered {assessment.correctAnswers} out of {assessment.totalQuestions} questions correctly
                </p>
              </div>
              <Progress value={scorePercentage} className="h-4" />
              <div className="flex items-center justify-center gap-2">
                {scorePercentage >= 80 ? (
                  <>
                    <Award className="h-5 w-5 text-yellow-500" />
                    <Badge className="bg-green-500">Excellent Performance!</Badge>
                  </>
                ) : scorePercentage >= 65 ? (
                  <>
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    <Badge className="bg-blue-500">Good Performance</Badge>
                  </>
                ) : scorePercentage >= 50 ? (
                  <Badge variant="secondary">Average Performance</Badge>
                ) : (
                  <Badge variant="outline">Needs Improvement</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Skill Breakdown */}
          {assessment.skillBreakdown && Object.keys(assessment.skillBreakdown).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Skill-wise Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(assessment.skillBreakdown).map(([skill, score]) => (
                    <div key={skill} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{skill}</span>
                        <span className="text-gray-600">{score.toFixed(0)}%</span>
                      </div>
                      <Progress value={score} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                The HR team will review your assessment results along with your profile.
                You may be contacted for the next round of interviews.
              </p>
              <div className="flex gap-3">
                <Link href="/dashboard">
                  <Button>Back to Dashboard</Button>
                </Link>
                <Link href="/dashboard/jobs">
                  <Button variant="outline">Browse More Jobs</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
