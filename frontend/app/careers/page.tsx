"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import PageNav from "@/components/marketing/PageNav";
import { Separator } from "@/components/ui/separator";
import { MapPin, Clock, Users, Briefcase, ArrowRight, Github, ExternalLink, GitBranch, Star } from "lucide-react";
import { showFeatureNotImplemented } from "@/lib/toast-utils";

export default function CareersPage() {
  const openIssues = [
    {
      title: "Implement Real-time Interview Analytics Dashboard",
      labels: ["enhancement", "frontend"],
      difficulty: "Medium",
      description: "Build a real-time analytics dashboard showing interview metrics and candidate insights.",
      githubUrl: "https://github.com/Ansh-dhanani/metis/issues"
    },
    {
      title: "Add Multi-language Support for AI Assessment",
      labels: ["enhancement", "AI", "i18n"],
      difficulty: "Hard",
      description: "Extend AI interview capabilities to support multiple languages beyond English.",
      githubUrl: "https://github.com/Ansh-dhanani/metis/issues"
    },
    {
      title: "Optimize Database Queries for Large-scale Data",
      labels: ["performance", "backend"],
      difficulty: "Medium",
      description: "Improve database query performance for handling 10K+ candidates per job posting.",
      githubUrl: "https://github.com/Ansh-dhanani/metis/issues"
    },
    {
      title: "Design System Documentation",
      labels: ["documentation", "design"],
      difficulty: "Easy",
      description: "Create comprehensive documentation for our component library and design system.",
      githubUrl: "https://github.com/Ansh-dhanani/metis/issues"
    },
    {
      title: "Implement Video Interview Recording Feature",
      labels: ["feature", "frontend", "backend"],
      difficulty: "Hard",
      description: "Add capability to record and store video interviews with playback controls.",
      githubUrl: "https://github.com/Ansh-dhanani/metis/issues"
    },
    {
      title: "Add Unit Tests for Authentication Module",
      labels: ["testing", "backend"],
      difficulty: "Easy",
      description: "Write comprehensive unit tests for user authentication and authorization logic.",
      githubUrl: "https://github.com/Ansh-dhanani/metis/issues"
    },
    {
      title: "Mobile Responsive UI Improvements",
      labels: ["bug", "frontend", "mobile"],
      difficulty: "Medium",
      description: "Fix responsive design issues on mobile devices for candidate dashboard.",
      githubUrl: "https://github.com/Ansh-dhanani/metis/issues"
    },
    {
      title: "Implement AI Bias Detection Algorithm",
      labels: ["AI", "research", "ethics"],
      difficulty: "Hard",
      description: "Develop algorithms to detect and mitigate bias in AI-generated interview assessments.",
      githubUrl: "https://github.com/Ansh-dhanani/metis/issues"
    }
  ];

  const contributionAreas = [
    {
      title: "Frontend Development",
      tech: "React, Next.js, TypeScript, Tailwind CSS",
      description: "Build beautiful and performant user interfaces"
    },
    {
      title: "Backend Engineering",
      tech: "Node.js, Python, Flask, MongoDB",
      description: "Design scalable APIs and data architectures"
    },
    {
      title: "AI/ML Development",
      tech: "LangChain, OpenAI, NLP, TensorFlow",
      description: "Develop and optimize AI interview models"
    },
    {
      title: "DevOps & Infrastructure",
      tech: "AWS, Docker, Kubernetes, CI/CD",
      description: "Build and maintain cloud infrastructure"
    }
  ];

  const benefits = [
    "Competitive salary and equity",
    "Comprehensive health insurance",
    "Unlimited PTO",
    "Remote-first culture",
    "Learning & development budget",
    "Home office setup allowance",
    "Team retreats twice a year",
    "Parental leave",
    "401(k) matching",
    "Mental health support",
    "Flexible working hours",
    "Latest tech equipment"
  ];

  const values = [
    {
      title: "Innovation",
      description: "We're building the future of hiring with cutting-edge AI"
    },
    {
      title: "Transparency",
      description: "Open communication and honest feedback at all levels"
    },
    {
      title: "Growth",
      description: "Continuous learning and career development opportunities"
    },
    {
      title: "Impact",
      description: "Your work directly improves how companies hire talent"
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-24">
      <PageNav />

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-medium tracking-wider uppercase border border-primary/50 rounded-full bg-primary/5">
            <Github className="h-3 w-3" />
            Open Source Project
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Contribute to the Future of AI Hiring
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Metis is an open-source project. Join our community of contributors and help build the next generation of AI-powered interview platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="https://github.com/Ansh-dhanani/metis" target="_blank" className="gap-2">
                <Github className="h-5 w-5" />
                View on GitHub
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="https://github.com/Ansh-dhanani/metis/blob/main/CONTRIBUTING.md" target="_blank" className="gap-2">
                Contributing Guide
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-t border-border/40">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid sm:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">8</div>
              <div className="text-sm text-muted-foreground">Core Contributors</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">42</div>
              <div className="text-sm text-muted-foreground">Open Issues</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">156</div>
              <div className="text-sm text-muted-foreground">Commits</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">MIT</div>
              <div className="text-sm text-muted-foreground">License</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contribution Areas */}
      <section className="py-20 border-t border-border/40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-row items-center mb-12">
            <h2 className="text-xs font-medium tracking-widest uppercase px-4 whitespace-nowrap text-muted-foreground">
              Contribution Areas
            </h2>
            <Separator className="flex-1" />
          </div>
          
          <div className="grid sm:grid-cols-2 gap-6">
            {contributionAreas.map((area, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl border border-border/60 bg-background/40 hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <h3 className="text-lg font-medium mb-2">{area.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{area.description}</p>
                <div className="flex items-center gap-2 text-xs">
                  <GitBranch className="h-3 w-3 text-primary" />
                  <span className="text-muted-foreground">{area.tech}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Issues */}
      <section className="py-20 border-t border-border/40 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-row items-center mb-12">
            <h2 className="text-xs font-medium tracking-widest uppercase px-4 whitespace-nowrap text-muted-foreground">
              Good First Issues
            </h2>
            <Separator className="flex-1" />
          </div>
          
          <div className="space-y-4">
            {openIssues.map((issue, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl border border-border/60 bg-background hover:border-primary/40 hover:bg-primary/5 transition-all group"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg font-medium group-hover:text-primary transition-colors">
                          {issue.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full border ${
                          issue.difficulty === 'Easy' 
                            ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                            : issue.difficulty === 'Medium'
                            ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                          {issue.difficulty}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {issue.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {issue.labels.map((label, labelIdx) => (
                          <span
                            key={labelIdx}
                            className="px-2 py-1 text-xs rounded-md bg-primary/10 text-primary border border-primary/20"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="group-hover:border-primary/40 shrink-0"
                    >
                      <Link href={issue.githubUrl} target="_blank" className="gap-2">
                        <Github className="h-4 w-4" />
                        View Issue
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Button asChild variant="outline" size="lg">
              <Link href="https://github.com/Ansh-dhanani/metis/issues" target="_blank" className="gap-2">
                View All Issues on GitHub
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-t border-border/40">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">50+</div>
              <div className="text-sm text-muted-foreground">Team Members</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">15+</div>
              <div className="text-sm text-muted-foreground">Countries</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">100%</div>
              <div className="text-sm text-muted-foreground">Remote Friendly</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-border/40">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-semibold mb-4">
            Ready to Contribute?
          </h2>
          <p className="text-muted-foreground mb-8">
            Fork the repository, pick an issue, and submit your first pull request. We welcome contributors of all skill levels!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="https://github.com/Ansh-dhanani/metis/fork" target="_blank" className="gap-2">
                <Github className="h-5 w-5" />
                Fork on GitHub
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="https://discord.gg/metis" target="_blank" className="gap-2">
                Join Discord Community
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
