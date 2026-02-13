/**
 * Create New Job Page (HR Only)
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import { DashboardLayout } from '@/components/dashboard-layout';
import { jobsService } from '@/lib/api/services';
import { useAuth } from '@/contexts/auth-context';
import { getErrorMessage } from '@/lib/utils/error-handler';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { ArrowLeft, Plus, Trash2, Calendar } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { FormField } from '@/components/ui/form-field';
import { Alert } from '@/components/ui/alert';

export default function NewJobPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    type: 'full-time' as 'full-time' | 'part-time' | 'contract' | 'internship',
    autoSelectTopCandidate: false,
    autoCloseEnabled: false,
    autoCloseDate: '',
  });
  const [skills, setSkills] = useState<Array<{ skill: string; weight: number }>>([
    { skill: '', weight: 0.33 },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const addSkill = () => {
    setSkills([...skills, { skill: '', weight: 0.33 }]);
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const updateSkill = (index: number, field: 'skill' | 'weight', value: string | number) => {
    const updated = [...skills];
    updated[index] = { ...updated[index], [field]: value };
    setSkills(updated);
  };

  const normalizeWeights = () => {
    const total = skills.reduce((sum, s) => sum + s.weight, 0);
    if (total > 0) {
      return skills.map(s => ({ skill: s.skill, weight: s.weight / total }));
    }
    return skills;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.userId) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const normalizedSkills = normalizeWeights();
      const { jobId } = await jobsService.createJob({
        ...formData,
        hrId: user.userId,
        skillWeights: normalizedSkills,
      });
      
      router.push(`/dashboard/jobs/${jobId}`);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage || 'Failed to create job. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="hr">
      <DashboardLayout>
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/jobs">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <PageHeader
              title="Create New Job"
              description="Add a job description to start the AI-powered assessment"
            />
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
              <CardDescription>
                Provide the job information and required skills with their importance weights.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    {error}
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Senior React Developer"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Job Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the role, responsibilities, and requirements..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                    disabled={isLoading}
                    rows={6}
                    className="resize-y"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      placeholder="e.g., San Francisco, CA / Remote"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Job Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, type: value })
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Auto-Selection and Auto-Close Options */}
                <div className="space-y-4 rounded-lg border p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-lg">Automation Settings</h3>
                  </div>
                  <p className="text-sm text-gray-600">Configure automatic actions for this job posting</p>
                  
                  <div className="space-y-4 bg-white rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="autoSelect"
                          checked={formData.autoSelectTopCandidate}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, autoSelectTopCandidate: checked as boolean })
                          }
                          disabled={isLoading}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <label
                            htmlFor="autoSelect"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            Auto-select top candidate
                          </label>
                          <p className="text-xs text-gray-500 mt-1">
                            Automatically accept the highest-scoring candidate once all assessments are complete.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="autoClose"
                            checked={formData.autoCloseEnabled}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, autoCloseEnabled: checked as boolean })
                            }
                            disabled={isLoading}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <label
                              htmlFor="autoClose"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              Auto-close on deadline
                            </label>
                            <p className="text-xs text-gray-500 mt-1">
                              Automatically close job and stop accepting applications at specified date/time.
                            </p>
                          </div>
                        </div>
                        
                        {formData.autoCloseEnabled && (
                          <div className="ml-7 space-y-2 bg-gray-50 p-3 rounded-md border border-gray-200">
                            <Label htmlFor="autoCloseDate" className="text-sm font-medium">Application Deadline</Label>
                            <Input
                              id="autoCloseDate"
                              type="datetime-local"
                              value={formData.autoCloseDate}
                              onChange={(e) =>
                                setFormData({ ...formData, autoCloseDate: e.target.value })
                              }
                              disabled={isLoading}
                              required={formData.autoCloseEnabled}
                              className="bg-white"
                            />
                            <p className="text-xs text-amber-600 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Applications will be closed automatically after this date
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Required Skills & Weights *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addSkill}
                      disabled={isLoading}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Skill
                    </Button>
                  </div>

                  {skills.map((skill, index) => (
                    <div key={index} className="flex gap-3">
                      <Input
                        placeholder="Skill name (e.g., React, Python)"
                        value={skill.skill}
                        onChange={(e) => updateSkill(index, 'skill', e.target.value)}
                        required
                        disabled={isLoading}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="Weight"
                        value={skill.weight}
                        onChange={(e) =>
                          updateSkill(index, 'weight', parseFloat(e.target.value) || 0)
                        }
                        required
                        disabled={isLoading}
                        min="0"
                        max="1"
                        step="0.1"
                        className="w-32"
                      />
                      {skills.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeSkill(index)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <p className="text-sm text-gray-500">
                    Weights will be normalized automatically. Higher values = more important.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={isLoading} className="min-w-[140px]">
                    {isLoading ? (
                      <>
                        <Spinner className="h-4 w-4 mr-2" />
                        Creating...
                      </>
                    ) : (
                      'Create Job'
                    )}
                  </Button>
                  <Link href="/dashboard/jobs">
                    <Button type="button" variant="outline" disabled={isLoading}>
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Tips for Better Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-2 pl-5 text-sm text-gray-600">
                <li>Be specific about required technical skills and tools</li>
                <li>Include experience level expectations (Junior, Mid, Senior)</li>
                <li>List both mandatory and nice-to-have qualifications</li>
                <li>Mention relevant soft skills and team dynamics</li>
                <li>Provide context about your company and the role</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
