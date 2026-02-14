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
import { Award, TrendingUp, Users, Download, ClipboardList, BarChart3, PieChart } from 'lucide-react';
import { handleError } from '@/lib/utils/error-handler';
import type { Assessment, CandidateRanking } from '@/lib/api/types';
import { PageHeader } from '@/components/ui/page-header';
import { StatsCard } from '@/components/ui/stats-card';
import { showFeatureNotImplemented } from '@/lib/toast-utils';

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
    if (score >= 80) return <Badge className="bg-green-600 text-white hover:bg-green-700">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-600 text-white hover:bg-yellow-700">Good</Badge>;
    return <Badge variant="destructive">Needs Improvement</Badge>;
  };

  // Calculate score distribution
  const scoreDistribution = {
    excellent: rankings.filter(r => r.overallScore >= 80).length,
    good: rankings.filter(r => r.overallScore >= 60 && r.overallScore < 80).length,
    needsImprovement: rankings.filter(r => r.overallScore < 60).length,
  };

  // Calculate average scores by category
  const avgSkillScore = rankings.length > 0
    ? rankings.reduce((acc, r) => acc + r.skillScore, 0) / rankings.length
    : 0;
  const avgExperienceScore = rankings.length > 0
    ? rankings.reduce((acc, r) => acc + r.experienceScore, 0) / rankings.length
    : 0;
  const avgCultureScore = rankings.length > 0
    ? rankings.reduce((acc, r) => acc + r.cultureFitScore, 0) / rankings.length
    : 0;

  return (
    <ProtectedRoute requiredRole="hr">
      <DashboardLayout>
        <div className="space-y-6">
        <PageHeader
          title="Analytics"
          description="View candidate performance and scores"
          action={
            <Button onClick={showFeatureNotImplemented} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          }
        />

        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard
            title="Total Assessments"
            value={assessments.length}
            icon={ClipboardList}
            description={`${completedAssessments.length} completed`}
          />
          <StatsCard
            title="Average Score"
            value={`${averageScore.toFixed(1)}%`}
            icon={TrendingUp}
            description="Across all candidates"
          />
          <StatsCard
            title="Total Candidates"
            value={rankings.length}
            icon={Users}
            description="Unique candidates"
          />
          <StatsCard
            title="Top Performers"
            value={rankings.filter(r => r.overallScore >= 80).length}
            icon={Award}
            description="Score ≥ 80%"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="rankings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="rankings">Candidate Rankings</TabsTrigger>
            <TabsTrigger value="assessments">All Assessments</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
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

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Score Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Score Distribution
                  </CardTitle>
                  <CardDescription>
                    Breakdown of candidate performance levels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span className="text-sm font-medium">Excellent (≥80%)</span>
                        </div>
                        <span className="text-sm font-bold">{scoreDistribution.excellent}</span>
                      </div>
                      <Progress 
                        value={rankings.length > 0 ? (scoreDistribution.excellent / rankings.length) * 100 : 0} 
                        className="h-2 bg-green-100"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <span className="text-sm font-medium">Good (60-79%)</span>
                        </div>
                        <span className="text-sm font-bold">{scoreDistribution.good}</span>
                      </div>
                      <Progress 
                        value={rankings.length > 0 ? (scoreDistribution.good / rankings.length) * 100 : 0} 
                        className="h-2 bg-yellow-100"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span className="text-sm font-medium">Needs Improvement (&lt;60%)</span>
                        </div>
                        <span className="text-sm font-bold">{scoreDistribution.needsImprovement}</span>
                      </div>
                      <Progress 
                        value={rankings.length > 0 ? (scoreDistribution.needsImprovement / rankings.length) * 100 : 0} 
                        className="h-2 bg-red-100"
                      />
                    </div>
                  </div>
                  
                  {rankings.length > 0 && (
                    <div className="pt-4 border-t space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Pass Rate (≥60%)</span>
                        <span className="font-bold text-green-600">
                          {(((scoreDistribution.excellent + scoreDistribution.good) / rankings.length) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Category Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Average Scores by Category
                  </CardTitle>
                  <CardDescription>
                    Performance breakdown across evaluation criteria
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Skills Match</span>
                        <span className={`text-sm font-bold ${getScoreColor(avgSkillScore)}`}>
                          {avgSkillScore.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={avgSkillScore} className="h-3" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Experience</span>
                        <span className={`text-sm font-bold ${getScoreColor(avgExperienceScore)}`}>
                          {avgExperienceScore.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={avgExperienceScore} className="h-3" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Culture Fit</span>
                        <span className={`text-sm font-bold ${getScoreColor(avgCultureScore)}`}>
                          {avgCultureScore.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={avgCultureScore} className="h-3" />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Overall Average</span>
                      <span className={`text-lg font-bold ${getScoreColor(averageScore)}`}>
                        {averageScore.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Key Insights */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Key Insights</CardTitle>
                  <CardDescription>
                    Summary of hiring performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {rankings.length > 0 
                          ? Math.max(...rankings.map(r => r.overallScore)).toFixed(1) 
                          : '0'}%
                      </div>
                      <p className="text-sm text-muted-foreground">Highest Score</p>
                      {rankings.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {rankings.sort((a, b) => b.overallScore - a.overallScore)[0]?.candidateName}
                        </p>
                      )}
                    </div>
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {rankings.length > 0 
                          ? rankings.reduce((acc, r) => acc + r.overallScore, 0) / rankings.length 
                          : 0}%
                      </div>
                      <p className="text-sm text-muted-foreground">Median Score</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Across {rankings.length} candidates
                      </p>
                    </div>
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="text-2xl font-bold text-purple-600 mb-1">
                        {completedAssessments.length}
                      </div>
                      <p className="text-sm text-muted-foreground">Completed Assessments</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {assessments.length - completedAssessments.length} pending
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
