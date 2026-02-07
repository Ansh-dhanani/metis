/**
 * Analytics Page - View Candidate Scores and Performance
 */

'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { assessmentsService, rankingsService } from '@/lib/api/services';
import { Award, TrendingUp, Users, Download, ClipboardList } from 'lucide-react';
import { handleError } from '@/lib/utils/error-handler';
import type { Assessment, CandidateRanking } from '@/lib/api/types';

export default function AnalyticsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [rankings, setRankings] = useState<CandidateRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assessmentsData, rankingsData] = await Promise.all([
        assessmentsService.getAll().catch(() => []),
        rankingsService.getAll().catch(() => []),
      ]);
      
      setAssessments(assessmentsData);
      setRankings(rankingsData);
    } catch (error) {
      handleError(error, 'Failed to load analytics data. Please try again.');
      setAssessments([]);
      setRankings([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics
  const completedAssessments = assessments.filter(a => a.status === 'completed');
  const averageScore = completedAssessments.length > 0
    ? completedAssessments.reduce((acc, a) => acc + (a.overallScore || a.score || 0), 0) / completedAssessments.length
    : 0;

  const topCandidates = rankings
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, 10);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>;
  };

  return (
    <ProtectedRoute requiredRole="hr">
      <DashboardLayout>
        <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">
              View candidate performance and scores
            </p>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assessments.length}</div>
              <p className="text-xs text-muted-foreground">
                {completedAssessments.length} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageScore.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Across all candidates
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rankings.length}</div>
              <p className="text-xs text-muted-foreground">
                Unique candidates
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {rankings.filter(r => r.overallScore >= 80).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Score ≥ 80%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="rankings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="rankings">Candidate Rankings</TabsTrigger>
            <TabsTrigger value="assessments">All Assessments</TabsTrigger>
          </TabsList>

          {/* Rankings Tab */}
          <TabsContent value="rankings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Candidates by Overall Score</CardTitle>
                <CardDescription>
                  Ranked by overall performance across all criteria
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading rankings...
                  </div>
                ) : topCandidates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No candidate rankings available yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topCandidates.map((ranking, index) => (
                      <div
                        key={ranking.candidateId}
                        className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                      >
                        {/* Rank */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          #{index + 1}
                        </div>

                        {/* Candidate Info */}
                        <div className="flex-1">
                          <h3 className="font-semibold">{ranking.candidateName}</h3>
                          <p className="text-sm text-muted-foreground">
                            Job: {ranking.jobTitle}
                          </p>
                        </div>

                        {/* Scores */}
                        <div className="flex flex-col gap-2 w-48">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Overall Score</span>
                            <span className={`font-bold ${getScoreColor(ranking.overallScore)}`}>
                              {ranking.overallScore.toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={ranking.overallScore} className="h-2" />
                        </div>

                        {/* Breakdown Scores */}
                        <div className="flex gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Skills</div>
                            <div className={`font-semibold ${getScoreColor(ranking.skillScore)}`}>
                              {ranking.skillScore.toFixed(0)}%
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Experience</div>
                            <div className={`font-semibold ${getScoreColor(ranking.experienceScore)}`}>
                              {ranking.experienceScore.toFixed(0)}%
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Culture</div>
                            <div className={`font-semibold ${getScoreColor(ranking.cultureFitScore)}`}>
                              {ranking.cultureFitScore.toFixed(0)}%
                            </div>
                          </div>
                        </div>

                        {/* Badge */}
                        <div className="flex-shrink-0">
                          {getScoreBadge(ranking.overallScore)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assessments Tab */}
          <TabsContent value="assessments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Assessments</CardTitle>
                <CardDescription>
                  Complete list of candidate assessments with scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading assessments...
                  </div>
                ) : completedAssessments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No completed assessments yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {completedAssessments.map((assessment) => {
                      const score = assessment.overallScore || assessment.score || 0;
                      return (
                        <div
                          key={assessment._id}
                          className="flex items-center gap-4 p-3 rounded-lg border"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">
                                Candidate: {assessment.candidateId}
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                {assessment.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Job: {assessment.jobId}
                            </p>
                            {assessment.completedAt && (
                              <p className="text-xs text-muted-foreground">
                                Completed: {new Date(assessment.completedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Score:</span>
                              <span className={`text-xl font-bold ${getScoreColor(score)}`}>
                                {score.toFixed(1)}%
                              </span>
                            </div>
                            {getScoreBadge(score)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
