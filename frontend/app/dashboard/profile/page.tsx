"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authService } from "@/lib/api/services";
import { toast } from "sonner";
import { handleError } from '@/lib/utils/error-handler';
import { Loader2, Edit, Save, X, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
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

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
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
      
      setProfileData({
        firstName: response.firstName || "",
        lastName: response.lastName || "",
        email: response.email || "",
        phone: response.phone || "",
        role: response.role || "",
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
      handleError(error, 'Failed to load profile. Please try again.');
      if (error.message?.includes("Unauthorized")) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await authService.updateProfile(profileData);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Profile</h1>
            <p className="text-muted-foreground">Manage your personal information and credentials</p>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel} disabled={saving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
        </div>

        {/* Basic Information */}
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
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  disabled={!isEditing}
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
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" value={profileData.role} disabled />
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
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
                disabled={!isEditing}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="githubUrl">GitHub URL</Label>
              <Input
                id="githubUrl"
                value={profileData.githubUrl}
                onChange={(e) => setProfileData({ ...profileData, githubUrl: e.target.value })}
                disabled={!isEditing}
                placeholder="https://github.com/yourusername"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portfolioUrl">Portfolio URL</Label>
              <Input
                id="portfolioUrl"
                value={profileData.portfolioUrl}
                onChange={(e) => setProfileData({ ...profileData, portfolioUrl: e.target.value })}
                disabled={!isEditing}
                placeholder="https://yourportfolio.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
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
                  {isEditing && (
                    <button
                      onClick={() => removeSkill(index)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            {isEditing && (
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
            )}
          </CardContent>
        </Card>

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
            {profileData.experience.map((exp, index) => (
              <div key={index} className="border p-4 rounded-lg space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold">Experience {index + 1}</h4>
                  {isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExperience(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Input
                      value={exp.company}
                      onChange={(e) => updateExperience(index, "company", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Input
                      value={exp.position}
                      onChange={(e) => updateExperience(index, "position", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Input
                    value={exp.duration}
                    onChange={(e) => updateExperience(index, "duration", e.target.value)}
                    disabled={!isEditing}
                    placeholder="e.g., Jan 2020 - Dec 2022"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={exp.description}
                    onChange={(e) => updateExperience(index, "description", e.target.value)}
                    disabled={!isEditing}
                    rows={3}
                  />
                </div>
              </div>
            ))}
            {profileData.experience.length === 0 && (
              <p className="text-muted-foreground text-center py-8">No experience added yet</p>
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
            {profileData.education.map((edu, index) => (
              <div key={index} className="border p-4 rounded-lg space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold">Education {index + 1}</h4>
                  {isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEducation(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Institution</Label>
                    <Input
                      value={edu.institution}
                      onChange={(e) => updateEducation(index, "institution", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Degree</Label>
                    <Input
                      value={edu.degree}
                      onChange={(e) => updateEducation(index, "degree", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Field of Study</Label>
                    <Input
                      value={edu.field}
                      onChange={(e) => updateEducation(index, "field", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Input
                      value={edu.year}
                      onChange={(e) => updateEducation(index, "year", e.target.value)}
                      disabled={!isEditing}
                      placeholder="e.g., 2020"
                    />
                  </div>
                </div>
              </div>
            ))}
            {profileData.education.length === 0 && (
              <p className="text-muted-foreground text-center py-8">No education added yet</p>
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
            {profileData.projects.map((project, index) => (
              <div key={index} className="border p-4 rounded-lg space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold">Project {index + 1}</h4>
                  {isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProject(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Project Name</Label>
                  <Input
                    value={project.name}
                    onChange={(e) => updateProject(index, "name", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={project.description}
                    onChange={(e) => updateProject(index, "description", e.target.value)}
                    disabled={!isEditing}
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
                    disabled={!isEditing}
                    placeholder="React, Node.js, MongoDB"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Project Link</Label>
                  <Input
                    value={project.link || ""}
                    onChange={(e) => updateProject(index, "link", e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://project-url.com"
                  />
                </div>
              </div>
            ))}
            {profileData.projects.length === 0 && (
              <p className="text-muted-foreground text-center py-8">No projects added yet</p>
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
            {profileData.certifications.map((cert, index) => (
              <div key={index} className="border p-4 rounded-lg space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold">Certification {index + 1}</h4>
                  {isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCertification(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Certification Name</Label>
                    <Input
                      value={cert.name}
                      onChange={(e) => updateCertification(index, "name", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Issuer</Label>
                    <Input
                      value={cert.issuer}
                      onChange={(e) => updateCertification(index, "issuer", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    value={cert.date}
                    onChange={(e) => updateCertification(index, "date", e.target.value)}
                    disabled={!isEditing}
                    placeholder="e.g., Jan 2023"
                  />
                </div>
              </div>
            ))}
            {profileData.certifications.length === 0 && (
              <p className="text-muted-foreground text-center py-8">No certifications added yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
