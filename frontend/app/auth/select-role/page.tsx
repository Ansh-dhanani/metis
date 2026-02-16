// File removed as select-role page is no longer used.
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function OAuthRoleSelectionContent() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [selectedRole, setSelectedRole] = useState<"hr" | "candidate" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if not OAuth user or already has role
  useEffect(() => {
    if (!session) {
      router.push("/login");
      return;
    }

    // If user doesn't need role selection, redirect to dashboard
    if (!session.user?.needsRoleSelection) {
      router.push("/dashboard");
    }
  }, [session, router]);

  const handleRoleSelection = async (role: "hr" | "candidate") => {
    if (!session?.user?.email) {
      setError("Session expired. Please login again.");
      return;
    }

    setSelectedRole(role);
    setIsLoading(true);
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      
      const res = await fetch(`${apiUrl}/api/users/oauth-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          name: session.user.name,
          provider: session.user.provider,
          providerId: session.user.providerId,
          image: session.user.image,
          role
        })
      });

      const data = await res.json();

      if (res.ok && data.user) {
        // Update NextAuth session
        await update({
          ...session,
          user: {
            ...session.user,
            id: data.user.id || data.user._id,
            role: data.user.role,
            needsRoleSelection: false
          }
        });
        
        // Store in localStorage for consistency with email/password auth
        const userId = data.user.id || data.user._id;
        localStorage.setItem("authToken", userId);
        localStorage.setItem("userId", userId);
        localStorage.setItem("userRole", data.user.role);
        
        // Redirect to dashboard
        router.push("/dashboard");
      } else {
        setError(data.error || "Failed to complete registration");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Role selection error:", err);
      setError("Failed to complete registration. Please try again.");
      setIsLoading(false);
    }
  };

  if (!session) {
    return null; // Will redirect in useEffect
  }

  const providerName = session.user?.provider === "google" ? "Google" : "LinkedIn";
  const providerColor = session.user?.provider === "google" ? "blue" : "blue";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Registration</CardTitle>
          <CardDescription>
            Your {providerName} account is connected. Choose your role to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connected Account Display */}
          <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {session.user?.image ? (
                  <img 
                    src={session.user.image} 
                    alt="Profile" 
                    className="h-12 w-12 rounded-full border-2 border-green-300"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-green-200 flex items-center justify-center">
                    <span className="text-green-700 font-semibold text-lg">
                      {session.user?.name?.charAt(0) || "U"}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-green-900">
                    {providerName} Connected
                  </p>
                  <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {session.user?.name}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {session.user?.email}
                </p>
              </div>
              {session.user?.provider === "google" ? (
                <svg viewBox="0 0 24 24" className="h-8 w-8 flex-shrink-0">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-8 w-8 flex-shrink-0" fill="#0A66C2">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Role Selection */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Select Your Role</h3>
            <div className="grid grid-cols-1 gap-3">
              {/* HR Role */}
              <button
                onClick={() => handleRoleSelection("hr")}
                disabled={isLoading}
                className="group relative overflow-hidden rounded-lg border-2 border-gray-200 bg-white p-4 text-left transition hover:border-indigo-500 hover:shadow-md disabled:opacity-50"
              >
                <div className="flex items-start space-x-3">
                  <div className="rounded-full bg-indigo-100 p-2">
                    <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">HR / Recruiter</h4>
                    <p className="mt-1 text-xs text-gray-600">
                      Post jobs, review candidates, and manage recruitment
                    </p>
                  </div>
                </div>
              </button>

              {/* Candidate Role */}
              <button
                onClick={() => handleRoleSelection("candidate")}
                disabled={isLoading}
                className="group relative overflow-hidden rounded-lg border-2 border-gray-200 bg-white p-4 text-left transition hover:border-green-500 hover:shadow-md disabled:opacity-50"
              >
                <div className="flex items-start space-x-3">
                  <div className="rounded-full bg-green-100 p-2">
                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">Job Seeker</h4>
                    <p className="mt-1 text-xs text-gray-600">
                      Apply for jobs, take AI interviews, and track applications
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {isLoading && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="text-sm text-blue-900 font-medium">
                  Setting up your account as {selectedRole === "hr" ? "HR / Recruiter" : "Job Seeker"}...
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function OAuthRoleSelectionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <OAuthRoleSelectionContent />
    </Suspense>
  );
}
