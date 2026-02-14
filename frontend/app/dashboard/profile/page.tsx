"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAuth } from "@/contexts/auth-context";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authService, evaluationService } from "@/lib/api/services";
import { toast } from "sonner";
import { handleError } from '@/lib/utils/error-handler';
import { Loader2, Edit, Save, X, Plus, Trash2, Sparkles, Upload, FileText } from "lucide-react";
import { Spinner } from '@/components/ui/spinner';
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";

interface Experience {
  company: string;
  position: string;
  duration: string;
  description: string;
}

interface Education {
  institution: string;
  degree: string;
  field: string;
  year: string;
}

interface Project {
  name: string;
  description: string;
  technologies: string[];
  link?: string;
}

interface Certification {
  name: string;
  issuer: string;
  date: string;
}

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  image?: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  projects: Project[];
  certifications: Certification[];
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    image: "",
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    linkedinUrl: "",
    githubUrl: "",
    portfolioUrl: "",
  });

  const [newSkill, setNewSkill] = useState("");

  const loadProfile = useCallback(async () => {
    // Wait for session to load
    if (status === 'loading') {
      return;
    }

    // Check if user is authenticated (either via localStorage token or NextAuth session)
    if (typeof window !== 'undefined') {
      const authToken = localStorage.getItem('authToken');
      const hasSession = status === 'authenticated' && session?.user;
      
      // Check if user is authenticated by either method
      if (!authToken && !hasSession) {
        toast.error('Please log in to view your profile');
        router.push('/login');
        return;
      }
      
      // If user has session but no token, use session user ID as token
      if (!authToken && hasSession && session?.user) {
        const userId = (session.user as any).id || (session.user as any).userId;
        if (userId) {
          localStorage.setItem('authToken', userId);
          localStorage.setItem('userId', userId);
          localStorage.setItem('userRole', (session.user as any).role || 'candidate');
        }
      }
    }

    try {
      setLoading(true);
      const response: any = await authService.getProfile();
      
      // Handle experience - could be array or object from backend
      let experienceArray = [];
      if (Array.isArray(response.experience)) {
        experienceArray = response.experience;
      } else if (response.experience && typeof response.experience === 'object') {
        // If it's an object, try to extract meaningful data or convert to array
        experienceArray = [];
      }
      
      // Get image from response or fallback to session image (for OAuth users)
      let userImage = response.image || "";
      if (!userImage && session?.user?.image) {
        userImage = session.user.image;
      }
      
      setProfileData({
        firstName: response.firstName || "",
        lastName: response.lastName || "",
        email: response.email || "",
        phone: response.phone || "",
        role: response.role || "",
        image: userImage,
        skills: Array.isArray(response.skills) ? response.skills : [],
        experience: experienceArray,
        education: Array.isArray(response.education) ? response.education : [],
        projects: Array.isArray(response.projects) ? response.projects : [],
        certifications: Array.isArray(response.certifications) ? response.certifications : [],
        linkedinUrl: response.linkedinUrl || "",
        githubUrl: response.githubUrl || "",
        portfolioUrl: response.portfolioUrl || "",
      });
    } catch (error: any) {
      console.error('Profile load error:', error);
      if (error.status === 401 || error.message?.includes("Unauthorized") || error.message?.includes("authorization")) {
        toast.error('Your session has expired. Please log in again.');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        router.push('/login');
      } else {
        handleError(error, 'Failed to load profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [router, session, status]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await authService.updateProfile(profileData);
      // Refresh user data in auth context to reflect profile changes
      await refreshUser();
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error: any) {
      handleError(error, 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    loadProfile();
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setProfileData({
        ...profileData,
        skills: [...profileData.skills, newSkill.trim()],
      });
      setNewSkill("");
    }
  };

  const removeSkill = (index: number) => {
    setProfileData({
      ...profileData,
      skills: profileData.skills.filter((_, i) => i !== index),
    });
  };

  const addExperience = () => {
    setProfileData({
      ...profileData,
      experience: [
        ...profileData.experience,
        { company: "", position: "", duration: "", description: "" },
      ],
    });
  };

  const updateExperience = (index: number, field: keyof Experience, value: string) => {
    const updated = [...profileData.experience];
    updated[index] = { ...updated[index], [field]: value };
    setProfileData({ ...profileData, experience: updated });
  };

  const removeExperience = (index: number) => {
    setProfileData({
      ...profileData,
      experience: profileData.experience.filter((_, i) => i !== index),
    });
  };

  const addEducation = () => {
    setProfileData({
      ...profileData,
      education: [
        ...profileData.education,
        { institution: "", degree: "", field: "", year: "" },
      ],
    });
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const updated = [...profileData.education];
    updated[index] = { ...updated[index], [field]: value };
    setProfileData({ ...profileData, education: updated });
  };

  const removeEducation = (index: number) => {
    setProfileData({
      ...profileData,
      education: profileData.education.filter((_, i) => i !== index),
    });
  };

  const addProject = () => {
    setProfileData({
      ...profileData,
      projects: [
        ...profileData.projects,
        { name: "", description: "", technologies: [], link: "" },
      ],
    });
  };

  const updateProject = (index: number, field: keyof Project, value: any) => {
    const updated = [...profileData.projects];
    updated[index] = { ...updated[index], [field]: value };
    setProfileData({ ...profileData, projects: updated });
  };

  const removeProject = (index: number) => {
    setProfileData({
      ...profileData,
      projects: profileData.projects.filter((_, i) => i !== index),
    });
  };

  const addCertification = () => {
    setProfileData({
      ...profileData,
      certifications: [
        ...profileData.certifications,
        { name: "", issuer: "", date: "" },
      ],
    });
  };

  const updateCertification = (index: number, field: keyof Certification, value: string) => {
    const updated = [...profileData.certifications];
    updated[index] = { ...updated[index], [field]: value };
    setProfileData({ ...profileData, certifications: updated });
  };

  const removeCertification = (index: number) => {
    setProfileData({
      ...profileData,
      certifications: profileData.certifications.filter((_, i) => i !== index),
    });
  };

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ['text/plain', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF or text file');
      return;
    }

    setIsParsing(true);
    toast.info('Parsing resume with AI...');

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Use the existing upload-resume endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/users/upload-resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || 'Failed to upload resume');
      }

      const data = await response.json();

      // The upload-resume endpoint returns parsed data directly
      const parsed = data.parsed || data;

      // Auto-fill profile from parsed data
      setProfileData(prev => ({
        ...prev,
        firstName: parsed.name?.split(' ')[0] || prev.firstName,
        lastName: parsed.name?.split(' ').slice(1).join(' ') || prev.lastName,
        email: parsed.email || prev.email,
        phone: parsed.phone || prev.phone,
        skills: parsed.skills?.length > 0 ? parsed.skills : prev.skills,
        experience: parsed.experience?.map((exp: any) => ({
          company: exp.company || '',
          position: exp.title || exp.position || '',
          duration: exp.duration || '',
          description: exp.description || ''
        })) || prev.experience,
        education: parsed.education?.map((edu: any) => ({
          institution: edu.institution || '',
          degree: edu.degree || '',
          field: '',
          year: edu.year || ''
        })) || prev.education,
        projects: parsed.projects?.map((proj: any) => ({
          name: proj.name || '',
          description: proj.description || '',
          technologies: proj.technologies || [],
          link: proj.url || ''
        })) || prev.projects,
        certifications: parsed.certifications || prev.certifications
      }));

      setIsEditing(true);

      toast.success(
        <div>
          <div className="font-semibold">Resume parsed successfully!</div>
          <div className="text-sm text-muted-foreground mt-1">
            Profile auto-filled with extracted data
          </div>
        </div>,
        { duration: 4000 }
      );

      // Auto-save the parsed data
      await authService.updateProfile({
        ...profileData,
        firstName: parsed.name?.split(' ')[0] || profileData.firstName,
        lastName: parsed.name?.split(' ').slice(1).join(' ') || profileData.lastName,
        email: parsed.email || profileData.email,
        phone: parsed.phone || profileData.phone,
        skills: parsed.skills?.length > 0 ? parsed.skills : profileData.skills,
        experience: parsed.experience?.map((exp: any) => ({
          company: exp.company || '',
          position: exp.title || exp.position || '',
          duration: exp.duration || '',
          description: exp.description || ''
        })) || profileData.experience,
        education: parsed.education?.map((edu: any) => ({
          institution: edu.institution || '',
          degree: edu.degree || '',
          field: '',
          year: edu.year || ''
        })) || profileData.education,
        projects: parsed.projects?.map((proj: any) => ({
          name: proj.name || '',
          description: proj.description || '',
          technologies: proj.technologies || [],
          link: proj.url || ''
        })) || profileData.projects,
        certifications: parsed.certifications || profileData.certifications
      });

      toast.success('Profile auto-saved with parsed data!');
      setIsEditing(false);
      loadProfile();

    } catch (error) {
      handleError(error, 'Failed to parse resume. Please try again.');
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Profile"
          description="Manage your personal information and credentials"
          action={
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancel} disabled={saving}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <Spinner className="h-4 w-4 mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </>
              ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
            </div>
          }
        />

        {/* Profile Header Card - Hero Section */}
        {!isEditing && (
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
            <CardContent className="relative pt-12 pb-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Avatar */}
                <div className="relative">
                  {profileData.image ? (
                    <img 
                      src={profileData.image} 
                      alt="Profile" 
                      className="h-32 w-32 rounded-full object-cover shadow-2xl ring-4 ring-primary/20"
                    />
                  ) : (
                    <div className="h-32 w-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-5xl font-bold text-white shadow-2xl">
                      {profileData.firstName?.[0]}{profileData.lastName?.[0]}
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold uppercase shadow-lg">
                    {profileData.role}
                  </div>
                </div>
                
                {/* Name and Contact Info */}
                <div className="flex-1 space-y-3">
                  <div>
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                      {profileData.firstName} {profileData.lastName}
                    </h2>
                    <p className="text-lg text-muted-foreground mt-1">{profileData.email}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 text-sm">
                    {profileData.phone && (
                      <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-full">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{profileData.phone}</span>
                      </div>
                    )}
                    {profileData.linkedinUrl && (
                      <a href={profileData.linkedinUrl} target="_blank" rel="noopener noreferrer" 
                         className="flex items-center gap-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-full hover:bg-blue-500/20 transition-colors">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        <span>LinkedIn</span>
                      </a>
                    )}
                    {profileData.githubUrl && (
                      <a href={profileData.githubUrl} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-2 bg-slate-500/10 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-full hover:bg-slate-500/20 transition-colors">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                        </svg>
                        <span>GitHub</span>
                      </a>
                    )}
                    {profileData.portfolioUrl && (
                      <a href={profileData.portfolioUrl} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-full hover:bg-purple-500/20 transition-colors">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        <span>Portfolio</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Skills Preview */}
              {profileData.skills.length > 0 && (
                <div className="mt-8 pt-6 border-t border-border/50">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {profileData.skills.slice(0, 10).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1 text-sm">
                        {skill}
                      </Badge>
                    ))}
                    {profileData.skills.length > 10 && (
                      <Badge variant="outline" className="px-3 py-1 text-sm">
                        +{profileData.skills.length - 10} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* AI Resume Parser Card */}
        {profileData.role === 'candidate' && (
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">AI-Powered Resume Parser</CardTitle>
                    <CardDescription>Upload your resume and let AI auto-fill your profile</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Our METIS AI will automatically extract your experience, education, skills, and projects from your resume.
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={triggerFileUpload}
                    disabled={isParsing}
                    className="flex-1"
                  >
                    {isParsing ? (
                      <>
                        <Spinner className="h-4 w-4 mr-2" />
                        Parsing Resume...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Resume (PDF/TXT)
                      </>
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt"
                    onChange={handleResumeUpload}
                    className="hidden"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  <span>Supported formats: PDF, TXT • Max size: 5MB</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Mode - Basic Information */}
        {isEditing && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profileData.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" value={profileData.role} disabled />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Social Links</CardTitle>
                <CardDescription>Your professional online presence</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                  <Input
                    id="linkedinUrl"
                    value={profileData.linkedinUrl}
                    onChange={(e) => setProfileData({ ...profileData, linkedinUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="githubUrl">GitHub URL</Label>
                  <Input
                    id="githubUrl"
                    value={profileData.githubUrl}
                    onChange={(e) => setProfileData({ ...profileData, githubUrl: e.target.value })}
                    placeholder="https://github.com/yourusername"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portfolioUrl">Portfolio URL</Label>
                  <Input
                    id="portfolioUrl"
                    value={profileData.portfolioUrl}
                    onChange={(e) => setProfileData({ ...profileData, portfolioUrl: e.target.value })}
                    placeholder="https://yourportfolio.com"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
                <CardDescription>Your technical and professional skills</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {profileData.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {skill}
                      <button
                        onClick={() => removeSkill(index)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill"
                    onKeyDown={(e) => e.key === "Enter" && addSkill()}
                  />
                  <Button onClick={addSkill}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Experience */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Experience</CardTitle>
                <CardDescription>Your work history</CardDescription>
              </div>
              {isEditing && (
                <Button onClick={addExperience} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Experience
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              // Edit mode - show form
              <>
                {profileData.experience.map((exp, index) => (
                  <div key={index} className="border p-4 rounded-lg space-y-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold">Experience {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExperience(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Company</Label>
                        <Input
                          value={exp.company}
                          onChange={(e) => updateExperience(index, "company", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Position</Label>
                        <Input
                          value={exp.position}
                          onChange={(e) => updateExperience(index, "position", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Input
                        value={exp.duration}
                        onChange={(e) => updateExperience(index, "duration", e.target.value)}
                        placeholder="e.g., Jan 2020 - Dec 2022"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={exp.description}
                        onChange={(e) => updateExperience(index, "description", e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                ))}
                {profileData.experience.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No experience added yet</p>
                )}
              </>
            ) : (
              // View mode - show timeline
              <>
                {profileData.experience.length > 0 ? (
                  <div className="space-y-6 relative">
                    <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />
                    {profileData.experience.map((exp, index) => (
                      <div key={index} className="relative pl-12 pb-6">
                        <div className="absolute left-2 top-1 h-5 w-5 rounded-full bg-primary border-4 border-background" />
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-semibold">{exp.position}</h3>
                              <p className="text-base text-primary">{exp.company}</p>
                            </div>
                            <Badge variant="outline" className="whitespace-nowrap">{exp.duration}</Badge>
                          </div>
                          {exp.description && (
                            <p className="text-muted-foreground mt-2">{exp.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No experience added yet</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Education */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Education</CardTitle>
                <CardDescription>Your educational background</CardDescription>
              </div>
              {isEditing && (
                <Button onClick={addEducation} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Education
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              // Edit mode
              <>
                {profileData.education.map((edu, index) => (
                  <div key={index} className="border p-4 rounded-lg space-y-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold">Education {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEducation(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Institution</Label>
                        <Input
                          value={edu.institution}
                          onChange={(e) => updateEducation(index, "institution", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Degree</Label>
                        <Input
                          value={edu.degree}
                          onChange={(e) => updateEducation(index, "degree", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Field of Study</Label>
                        <Input
                          value={edu.field}
                          onChange={(e) => updateEducation(index, "field", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Year</Label>
                        <Input
                          value={edu.year}
                          onChange={(e) => updateEducation(index, "year", e.target.value)}
                          placeholder="e.g., 2020"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {profileData.education.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No education added yet</p>
                )}
              </>
            ) : (
              // View mode
              <>
                {profileData.education.length > 0 ? (
                  <div className="grid gap-4">
                    {profileData.education.map((edu, index) => (
                      <div key={index} className="border rounded-lg p-5 hover:border-primary/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <h3 className="text-lg font-semibold">{edu.degree}</h3>
                            <p className="text-base text-primary">{edu.institution}</p>
                            {edu.field && <p className="text-sm text-muted-foreground">{edu.field}</p>}
                          </div>
                          <Badge variant="secondary">{edu.year}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No education added yet</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Projects</CardTitle>
                <CardDescription>Your notable projects and work</CardDescription>
              </div>
              {isEditing && (
                <Button onClick={addProject} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Project
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              // Edit mode
              <>
                {profileData.projects.map((project, index) => (
                  <div key={index} className="border p-4 rounded-lg space-y-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold">Project {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProject(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label>Project Name</Label>
                      <Input
                        value={project.name}
                        onChange={(e) => updateProject(index, "name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={project.description}
                        onChange={(e) => updateProject(index, "description", e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Technologies (comma-separated)</Label>
                      <Input
                        value={project.technologies?.join(", ") || ""}
                        onChange={(e) =>
                          updateProject(
                            index,
                            "technologies",
                            e.target.value.split(",").map((t) => t.trim())
                          )
                        }
                        placeholder="React, Node.js, MongoDB"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Project Link</Label>
                      <Input
                        value={project.link || ""}
                        onChange={(e) => updateProject(index, "link", e.target.value)}
                        placeholder="https://project-url.com"
                      />
                    </div>
                  </div>
                ))}
                {profileData.projects.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No projects added yet</p>
                )}
              </>
            ) : (
              // View mode
              <>
                {profileData.projects.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    {profileData.projects.map((project, index) => (
                      <div key={index} className="border rounded-lg p-5 hover:border-primary/50 transition-colors hover:shadow-md space-y-4 min-h-[200px] flex flex-col">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-lg font-semibold leading-tight overflow-hidden text-ellipsis whitespace-nowrap flex-1" title={project.name}>
                              {project.name}
                            </h3>
                            {project.link && (
                              <a
                                href={project.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 shrink-0 mt-1"
                                title="View project"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed overflow-hidden" 
                             style={{
                               display: '-webkit-box',
                               WebkitLineClamp: 3,
                               WebkitBoxOrient: 'vertical',
                               lineHeight: '1.4',
                               maxHeight: '4.2rem'
                             }}
                             title={project.description}>
                            {project.description}
                          </p>
                        </div>
                        {project.technologies && project.technologies.length > 0 && (
                          <div className="pt-2 border-t border-border/50">
                            <div className="flex flex-wrap gap-1.5">
                              {project.technologies.slice(0, 4).map((tech, techIndex) => (
                                <Badge key={techIndex} variant="outline" className="text-xs px-2 py-0.5">
                                  {tech}
                                </Badge>
                              ))}
                              {project.technologies.length > 4 && (
                                <Badge variant="outline" className="text-xs px-2 py-0.5 text-muted-foreground">
                                  +{project.technologies.length - 4} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No projects added yet</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Certifications</CardTitle>
                <CardDescription>Your professional certifications</CardDescription>
              </div>
              {isEditing && (
                <Button onClick={addCertification} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Certification
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              // Edit mode
              <>
                {profileData.certifications.map((cert, index) => (
                  <div key={index} className="border p-4 rounded-lg space-y-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold">Certification {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCertification(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Certification Name</Label>
                        <Input
                          value={cert.name}
                          onChange={(e) => updateCertification(index, "name", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Issuer</Label>
                        <Input
                          value={cert.issuer}
                          onChange={(e) => updateCertification(index, "issuer", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        value={cert.date}
                        onChange={(e) => updateCertification(index, "date", e.target.value)}
                        placeholder="e.g., Jan 2023"
                      />
                    </div>
                  </div>
                ))}
                {profileData.certifications.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No certifications added yet</p>
                )}
              </>
            ) : (
              // View mode
              <>
                {profileData.certifications.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {profileData.certifications.map((cert, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:border-primary/50 transition-colors flex items-center gap-4">
                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">{cert.name}</h4>
                          <p className="text-xs text-muted-foreground">{cert.issuer}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{cert.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No certifications added yet</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
