'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

const errorMessages: Record<string, string> = {
  server_error: 'Server error occurred. Please try again later.',
  oauth_login_failed: 'OAuth login failed. Please try again or use email/password.',
  network_error: 'Network error. Please check your connection and try again.',
  CredentialsSignin: 'Invalid email or password.',
  OAuthSignin: 'Error signing in with OAuth provider.',
  OAuthCallback: 'Error processing OAuth callback.',
  OAuthCreateAccount: 'Could not create account. Email may already be in use.',
  EmailCreateAccount: 'Could not create account. Please try again.',
  Callback: 'Error during authentication callback.',
  OAuthAccountNotLinked: 'This email is already associated with another account.',
  EmailSignin: 'Error sending sign-in email.',
  SessionRequired: 'Please sign in to access this page.',
  default: 'An authentication error occurred. Please try again.'
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'default';
  const message = errorMessages[error] || errorMessages.default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">
            Authentication Error
          </h1>
          <p className="text-muted-foreground text-lg">
            {message}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            Go back home
          </Link>
        </div>

        {error !== 'default' && (
          <p className="text-xs text-muted-foreground mt-4">
            Error code: {error}
          </p>
        )}
      </div>
    </div>
  );
}
