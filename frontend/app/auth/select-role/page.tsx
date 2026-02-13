"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OAuthRoleSelectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, update } = useSession();
  const [selectedRole, setSelectedRole] = useState<"hr" | "candidate" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const email = searchParams.get("email") || session?.user?.email;
  const name = searchParams.get("name") || session?.user?.name;
  const provider = searchParams.get("provider") || session?.user?.provider;
  const providerId = searchParams.get("providerId") || session?.user?.providerId;
  const image = searchParams.get("image") || session?.user?.image;

  useEffect(() => {
    if (!email || !provider) {
      router.push("/login");
    }
  }, [email, provider, router]);

  const handleRoleSelection = async (role: "hr" | "candidate") => {
    setSelectedRole(role);
    setIsLoading(true);
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      
      const res = await fetch(`${apiUrl}/api/users/oauth-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          provider,
          providerId,
          image,
          role
        })
      });

      const data = await res.json();

      if (res.ok) {
        // User registered successfully - update NextAuth session
        // Trigger session update with new user data
        await update({
          ...session,
          user: {
            ...session?.user,
            id: data.user.id,
            role: data.user.role,
            needsRoleSelection: false
          }
        });
        
        // Also store in localStorage for the existing auth context
        localStorage.setItem("token", data.user.id);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // Redirect to dashboard
        router.push("/dashboard");
      } else {
        setError(data.error || "Failed to complete registration");
      }
    } catch (err) {
      console.error("Role selection error:", err);
      setError("Failed to complete registration. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Choose Your Role</CardTitle>
          <CardDescription>
            How would you like to use Metis?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {/* HR Role */}
            <button
              onClick={() => handleRoleSelection("hr")}
              disabled={isLoading}
              className="group relative overflow-hidden rounded-lg border-2 border-gray-200 bg-white p-6 text-left transition hover:border-indigo-500 hover:shadow-lg disabled:opacity-50"
            >
              <div className="flex items-start space-x-4">
                <div className="rounded-full bg-indigo-100 p-3">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">HR / Recruiter</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Post jobs, review candidates, conduct AI interviews, and manage recruitment
                  </p>
                </div>
              </div>
            </button>

            {/* Candidate Role */}
            <button
              onClick={() => handleRoleSelection("candidate")}
              disabled={isLoading}
              className="group relative overflow-hidden rounded-lg border-2 border-gray-200 bg-white p-6 text-left transition hover:border-green-500 hover:shadow-lg disabled:opacity-50"
            >
              <div className="flex items-start space-x-4">
                <div className="rounded-full bg-green-100 p-3">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Job Seeker</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Apply for jobs, take AI interviews, upload resume, and track applications
                  </p>
                </div>
              </div>
            </button>
          </div>

          {isLoading && (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Setting up your account as {selectedRole === "hr" ? "HR" : "Job Seeker"}...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
