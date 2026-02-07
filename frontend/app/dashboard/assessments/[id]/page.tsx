/**
 * Assessment Taking Page (Candidate)
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Clock, CheckCircle, ChevronRight } from 'lucide-react';
import type { Assessment } from '@/lib/api/types';
import Link from 'next/link';

export default function AssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = params?.id as string;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, { selectedAnswer: string; isCorrect: boolean }>>({});
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const data = await assessmentsService.getAssessment(assessmentId);
        setAssessment(data);
      } catch (error) {
        console.error('Failed to fetch assessment:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (assessmentId) {
      fetchAssessment();
    }
  }, [assessmentId]);

  const currentQuestion = assessment?.questions[currentQuestionIndex];

  const handleNextQuestion = () => {
    if (!currentQuestion || !selectedAnswer) return;

    // Store the response
    setResponses({
      ...responses,
      [currentQuestion._id]: {
        selectedAnswer,
        isCorrect: selectedAnswer === currentQuestion.correctAnswer,
      },
    });

    // Move to next question
    if (currentQuestionIndex < (assessment?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer('');
    }
  };

  const handleSubmitAssessment = async () => {
    if (!currentQuestion || !selectedAnswer || !assessment) return;

    // Add last answer
    const finalResponses = {
      ...responses,
      [currentQuestion._id]: {
        selectedAnswer,
        isCorrect: selectedAnswer === currentQuestion.correctAnswer,
      },
    };

    setIsSubmitting(true);
    try {
      // Format responses for backend
      const formattedResponses = assessment.questions.map(q => ({
        questionId: q._id,
        skill: q.skill,
        selectedAnswer: finalResponses[q._id]?.selectedAnswer || '',
        isCorrect: finalResponses[q._id]?.isCorrect || false,
      }));

      const result = await assessmentsService.completeAssessment(assessmentId, {
        responses: formattedResponses,
      });

      // Redirect to results page
      router.push(`/dashboard/assessments/${assessmentId}/results`);
    } catch (error) {
      console.error('Failed to submit assessment:', error);
      alert('Failed to submit assessment. Please try again.');
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
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="mt-4 text-sm text-gray-500">Loading assessment...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!assessment || assessment.status === 'completed') {
    return (
      <ProtectedRoute requiredRole="candidate">
        <DashboardLayout>
          <Card className="max-w-2xl mx-auto">
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Assessment Completed!</h2>
              <p className="text-gray-600 mb-6">
                Thank you for completing this assessment. Your results have been recorded.
              </p>
              <Link href="/dashboard">
                <Button>Back to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100;

  return (
    <ProtectedRoute requiredRole="candidate">
      <DashboardLayout>
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Assessment</h1>
                <p className="text-gray-500">
                  Question {currentQuestionIndex + 1} of {assessment.questions.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-5 w-5" />
              <span className="text-sm">Timer: Active</span>
            </div>
          </div>

          {/* Progress Bar */}
          <Progress value={progress} className="w-full" />

          {/* Question Card */}
          {currentQuestion && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Question {currentQuestionIndex + 1}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge>
                      Difficulty: {currentQuestion.difficulty}/10
                    </Badge>
                    <Badge variant="outline">
                      {currentQuestion.skill}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Question Text */}
                <div>
                  <p className="text-lg font-medium">{currentQuestion.text}</p>
                </div>

                {/* Answer Options */}
                <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                          selectedAnswer === option
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <RadioGroupItem value={option} id={`option-${idx}`} />
                        <Label htmlFor={`option-${idx}`} className="cursor-pointer flex-1">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>

                {/* Navigation */}
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (currentQuestionIndex > 0) {
                        setCurrentQuestionIndex(currentQuestionIndex - 1);
                        // Restore previous answer if exists
                        const prevQuestion = assessment.questions[currentQuestionIndex - 1];
                        setSelectedAnswer(responses[prevQuestion._id]?.selectedAnswer || '');
                      }
                    }}
                    disabled={currentQuestionIndex === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={
                      currentQuestionIndex === assessment.questions.length - 1
                        ? handleSubmitAssessment
                        : handleNextQuestion
                    }
                    disabled={!selectedAnswer || isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 
                     currentQuestionIndex === assessment.questions.length - 1
                      ? 'Complete Assessment'
                      : <>Next Question <ChevronRight className="ml-2 h-4 w-4" /></>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>Read each question carefully before answering</li>
                <li>You cannot go back once you submit an answer</li>
                <li>Questions adapt to your performance level</li>
                <li>Take your time - accuracy matters more than speed</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
