'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  Briefcase, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight, 
  Target, 
  BarChart3, 
  Sparkles, 
  Shield, 
  Zap 
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b px-5 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            <span className="text-xl font-bold">Metis</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container flex flex-col items-center gap-8 py-24 md:py-32">
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" />
          AI-Powered Recruitment
        </Badge>
        
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Smart Hiring Made Simple
          </h1>
          <p className="max-w-[42rem] text-lg text-muted-foreground sm:text-xl">
            Streamline your recruitment process with AI-powered candidate ranking, 
            automated assessments, and intelligent matching.
          </p>
        </div>
        
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/employer/dashboard">
              Start Hiring
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/jobs">I'm Looking for Jobs</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/50">
        <div className="container py-24">
          <div className="mb-16 flex flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Powerful Features for Modern Recruitment
            </h2>
            <p className="max-w-[42rem] text-lg text-muted-foreground">
              Everything you need to find the perfect candidates
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 px-5">
            <Card>
              <CardHeader>
                <Target className="mb-2 h-10 w-10" />
                <CardTitle>AI Candidate Ranking</CardTitle>
                <CardDescription>
                  Automatically rank candidates based on skills, experience, and job requirements
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="mb-2 h-10 w-10" />
                <CardTitle>Analytics Dashboard</CardTitle>
                <CardDescription>
                  Track applications, view candidate analytics, and make data-driven decisions
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="mb-2 h-10 w-10" />
                <CardTitle>Smart Matching</CardTitle>
                <CardDescription>
                  Match candidates with jobs using intelligent skill-based algorithms
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CheckCircle className="mb-2 h-10 w-10" />
                <CardTitle>Automated Assessments</CardTitle>
                <CardDescription>
                  Create and manage technical assessments to evaluate candidate skills
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="mb-2 h-10 w-10" />
                <CardTitle>Quick Applications</CardTitle>
                <CardDescription>
                  Candidates can apply with resume upload and auto-parsed profile data
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="mb-2 h-10 w-10" />
                <CardTitle>Secure & Reliable</CardTitle>
                <CardDescription>
                  Enterprise-grade security to protect your sensitive recruitment data
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container py-24">
        <div className="mb-16 flex flex-col items-center gap-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            How It Works
          </h2>
          <p className="max-w-[42rem] text-lg text-muted-foreground">
            Get started in three simple steps
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 px-5">
          <Card>
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                1
              </div>
              <CardTitle>Post Your Job</CardTitle>
              <CardDescription>
                Create a job posting with required skills and let AI help match candidates
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                2
              </div>
              <CardTitle>Review Applications</CardTitle>
              <CardDescription>
                Get AI-powered rankings and insights about each candidate
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                3
              </div>
              <CardTitle>Hire the Best</CardTitle>
              <CardDescription>
                Select top candidates and manage the entire hiring process in one place
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t">
        <div className="container py-24 px-5">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="flex flex-col items-center gap-6 p-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Ready to Transform Your Hiring?
              </h2>
              <p className="max-w-[42rem] text-lg opacity-90">
                Join companies using Metis to find exceptional talent faster
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/signup">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
                  <Link href="/signin">Sign In</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container flex flex-col items-center justify-between gap-4 py-8 md:flex-row">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <span className="font-semibold">Metis</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Metis. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}