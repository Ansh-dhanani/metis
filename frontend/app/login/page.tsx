'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Check if OAuth user needs to complete registration
  useEffect(() => {
    // Wait for both session and auth context to finish loading
    if (status === 'loading' || authLoading) return;
    
    if (status === 'authenticated' && session?.user) {
      if (session.user.needsRoleSelection) {
        // New OAuth user - redirect to register page for role selection
        router.push('/register');
      } else if (isAuthenticated && session.user.role) {
        // Existing user - go to dashboard
        router.push('/dashboard');
      }
    }
  }, [session, status, isAuthenticated, authLoading, router]);

  const handleOAuthSignIn = async (provider: 'google') => {
    try {
      setError('');
      setIsLoading(true);
      
      const result = await signIn(provider, { 
        redirect: false
      });
      
      if (result?.error) {
        setError(`Failed to sign in with ${provider}: ${result.error}`);
        setIsLoading(false);
      }
      // Let the useEffect handle redirection based on session state
    } catch (error) {
      console.error('OAuth error:', error);
      setError('Failed to sign in. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // First, call the backend directly to get the token
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      console.debug('Login API URL:', apiUrl);

      const res = await fetch(`${apiUrl}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch (jsonErr) {
        const text = await res.text().catch(() => '<non-text response>');
        console.error('Non-JSON response from login:', res.status, text);
        throw new Error(`Login failed: ${res.status} ${text}`);
      }

      if (res.ok && data.token) {
        // Store tokens in localStorage FIRST
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('userRole', data.role);

        // Then sign in with NextAuth (for session management)
        await signIn('credentials', {
          redirect: false,
          email: formData.email,
          password: formData.password,
        });

        router.push('/dashboard');
      } else {
        setError(data.error || 'Invalid email or password');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      // Show better error message when possible
      const message = err?.message || String(err) || 'An error occurred. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const autoFill = (email: string, password: string) => {
    setFormData({ email, password });
  };

  return (
    <div className="flex justify-center items-center w-full min-h-screen bg-black p-5 font-sans text-white">
      <div className="flex flex-wrap w-full max-w-[1000px] bg-black rounded-3xl overflow-hidden border border-[#1a1a1a] shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        {/* Left Panel - Form */}
        <div className="flex-[1_1_340px] bg-black p-10 flex flex-col justify-center">
          <div className="w-full max-w-[400px] mx-auto">
            <div className="mb-8">
              <div className="text-white text-[26px] font-semibold mb-2">Sign In</div>
              <div className="text-[#888] text-sm">Welcome back! Please sign in to your account.</div>
            </div>

            <div className="flex gap-3 mb-5">
              <button
                type="button"
                onClick={() => handleOAuthSignIn('google')}
                disabled={isLoading}
                className="flex-1 bg-transparent border border-[#333] text-white p-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover:bg-[#111] hover:border-[#555] disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" width={20}>
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>
              
              {/* LinkedIn button removed */}
            </div>

            <div className="flex items-center text-[#666] text-[13px] mb-5">
              <div className="flex-1 h-px bg-[#333]" />
              <span className="mx-4">Or</span>
              <div className="flex-1 h-px bg-[#333]" />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label className="block text-[#ccc] text-[13px] font-medium mb-2">Email</label>
                <input
                  type="email"
                  placeholder="eg. john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#121212] border border-[#1a1a1a] p-3.5 rounded-lg text-white outline-none text-sm transition-all focus:bg-[#1a1a1a] focus:border-[#444]"
                />
              </div>

              <div className="mb-5">
                <label className="block text-[#ccc] text-[13px] font-medium mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-[#121212] border border-[#1a1a1a] p-3.5 rounded-lg text-white outline-none text-sm transition-all focus:bg-[#1a1a1a] focus:border-[#444] pr-12"
                  />
                  <svg
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer"
                    viewBox="0 0 24 24"
                    width={20}
                    fill="none"
                    stroke="#666"
                    strokeWidth={2}
                  >
                    {showPassword ? (
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
                    ) : (
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />
                    )}
                  </svg>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-white text-black border-none p-4 rounded-lg font-semibold cursor-pointer transition-all hover:bg-[#e5e5e5] disabled:opacity-50 text-[15px] mb-5"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mb-5">
              <div className="text-[#666] text-xs mb-2">Quick test accounts:</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => autoFill('hr@example.com', 'hr@123456')}
                  className="flex-1 bg-transparent border border-[#333] text-white p-2 rounded-lg text-xs cursor-pointer transition-all hover:bg-[#111] hover:border-[#555]"
                >
                  HR Account
                </button>
                <button
                  type="button"
                  onClick={() => autoFill('candidate@example.com', 'can@123456')}
                  className="flex-1 bg-transparent border border-[#333] text-white p-2 rounded-lg text-xs cursor-pointer transition-all hover:bg-[#111] hover:border-[#555]"
                >
                  Candidate
                </button>
              </div>
            </div>

            <div className="text-center text-[#888] text-[13px]">
              Don&apos;t have an account? <Link href="/register" className="text-white no-underline hover:underline">Sign up</Link>
            </div>
          </div>
        </div>

        {/* Right Panel - Gradient */}
        <div className="flex-[1_1_340px] relative bg-gradient-to-br from-[#d8b4fe] via-[#7e22ce] to-black p-10 flex flex-col justify-between min-h-[450px]">
          <div className="absolute inset-0 opacity-60 mix-blend-overlay pointer-events-none"
               style={{
                 backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E\")"
               }}
          />
          
          <div className="relative z-[2] flex items-center gap-3 font-semibold text-lg">
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <circle cx={12} cy={12} r={9} stroke="white" strokeWidth={2} />
              <circle cx={12} cy={12} r={4} fill="white" />
            </svg>
            <span>Metis</span>
          </div>

          <div className="relative z-[2] my-auto">
            <div className="text-4xl font-bold leading-tight mb-4">Welcome Back!</div>
            <div className="text-white/70 mb-8 text-[15px]">
              Sign in to continue your journey with us.
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white text-black shadow-lg">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-black text-white">✓</div>
                <span className="text-sm">Secure authentication</span>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 border border-white/5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-white/20">✓</div>
                <span className="text-sm">Access your dashboard</span>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 border border-white/5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-white/20">✓</div>
                <span className="text-sm">Manage your profile</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
