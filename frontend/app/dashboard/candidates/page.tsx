/**
 * Candidates Page - View All Candidates and Their Details
 */

'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { rankingsService } from '@/lib/api/services';
import { Search, Mail, Award } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import type { CandidateRanking } from '@/lib/api/types';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';

export default function CandidatesPage() {
  const [rankings, setRankings] = useState<CandidateRanking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const data = await rankingsService.getAll();
      setRankings(data || []);
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter candidates based on search
  const filteredCandidates = rankings.filter(candidate =>
    candidate.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-success/10 text-success border-success/20';
    if (score >= 60) return 'bg-warning/10 text-warning border-warning/20';
    return 'bg-destructive/10 text-destructive border-destructive/20';
  };

  return (
    <ProtectedRoute requiredRole="hr">
      <DashboardLayout>
        <div className="space-y-6">
        <PageHeader
          title="Candidates"
          description="View and manage all candidates who applied"
        />

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or job title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredCandidates.length} of {rankings.length} candidates
          </div>
        </div>

        {/* Candidates Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center space-y-4">
              <Spinner className="h-12 w-12 mx-auto" />
              <p className="text-sm text-muted-foreground">Loading candidates...</p>
            </div>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <EmptyState
            icon={Search}
            title={searchTerm ? 'No candidates found' : 'No candidates yet'}
            description={searchTerm ? 'Try adjusting your search criteria' : 'Candidates will appear here once they apply'}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCandidates.map((candidate) => (
              <Card key={candidate.candidateId} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{candidate.candidateName}</CardTitle>
                      <CardDescription className="mt-1">
                        Applied for: {candidate.jobTitle}
                      </CardDescription>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getScoreColor(candidate.overallScore)}`}>
                      {candidate.overallScore.toFixed(0)}%
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Score Breakdown */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Skills Match</span>
                      <span className="font-semibold">{candidate.skillScore.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${candidate.skillScore}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Experience</span>
                      <span className="font-semibold">{candidate.experienceScore.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${candidate.experienceScore}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Culture Fit</span>
                      <span className="font-semibold">{candidate.cultureFitScore.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${candidate.cultureFitScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Rank */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Rank: #{rankings.findIndex(r => r.candidateId === candidate.candidateId) + 1}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      View Profile
                    </Button>
                    <Button size="sm" className="flex-1">
                      <Mail className="mr-2 h-4 w-4" />
                      Contact
                    </Button>
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
