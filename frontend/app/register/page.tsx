'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { authService } from '@/lib/api/services';
import { getErrorMessage } from '@/lib/utils/error-handler';
import { toast } from 'sonner';
import Link from 'next/link';
import type { UserRole } from '@/lib/api/types';
import { signOut } from 'next-auth/react';

function RegisterPageContent() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    role: '' as UserRole | '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
  });

  // Detect OAuth user and skip to step 2
  useEffect(() => {
    if (session?.user?.needsRoleSelection) {
      queueMicrotask(() => {
        setIsOAuthUser(true);
        setStep(2);
        // Pre-fill data from OAuth
        setFormData(prev => ({
          ...prev,
          email: session.user.email || '',
          firstName: session.user.name?.split(' ')[0] || '',
          lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
        }));
      });
    }
  }, [session]);

  const handleOAuthSignUp = async (provider: 'google') => {
    try {
      setError('');
      setIsLoading(true);
      
      const result = await signIn(provider, { 
        redirect: false
      });
      
      if (result?.error) {
        setError(`Failed to sign up with ${provider}: ${result.error}`);
        setIsLoading(false);
      }
      // OAuth user will be redirected by useEffect when session updates
    } catch (error) {
      console.error('OAuth error:', error);
      setError('Failed to sign up. Please try again.');
      setIsLoading(false);
    }
  };

  const handleDisconnectProvider = async () => {
    await signOut({ callbackUrl: '/register' });
  };

  const handleNext = () => {
    if (step === 1) {
      // Skip validation for OAuth users
      if (isOAuthUser) {
        setError('');
        setStep(step + 1);
        return;
      }
      
      if (!formData.email || !formData.password || !formData.firstName) {
        setError('Please fill in all required fields');
        return;
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
    }
    if (step === 2) {
      if (!formData.role) {
        setError('Please select a role');
        return;
      }
      if (!formData.phone) {
        setError('Phone number is required');
        return;
      }
    }
    setError('');
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      if (isOAuthUser && session?.user) {
        // OAuth user registration
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
            role: formData.role,
            phone: formData.phone,
            linkedinUrl: formData.linkedinUrl,
            githubUrl: formData.githubUrl,
            portfolioUrl: formData.portfolioUrl,
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
          
          // Store in localStorage
          const userId = data.user.id || data.user._id;
          localStorage.setItem("authToken", userId);
          localStorage.setItem("userId", userId);
          localStorage.setItem("userRole", data.user.role);
          
          toast.success('Registration successful! Welcome to METIS.');
          router.push('/dashboard');
        } else {
          setError(data.error || 'Registration failed');
          setIsLoading(false);
        }
      } else {
        // Regular email/password registration
        const registerResponse = await authService.register({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role as UserRole,
          phone: formData.phone,
          linkedinUrl: formData.linkedinUrl,
          githubUrl: formData.githubUrl,
          portfolioUrl: formData.portfolioUrl,
        });
        
        // Store auth tokens from response
        if (registerResponse.token) {
          localStorage.setItem('authToken', registerResponse.token);
          localStorage.setItem('userId', registerResponse.userId);
          localStorage.setItem('userRole', registerResponse.role);
        }
        
        toast.success('Registration successful! Welcome to METIS.');
        router.push('/dashboard');
      }
    } catch (err) {
      setError(getErrorMessage(err) || 'Registration failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center w-full min-h-screen bg-black p-5 font-sans text-white">
      <div className="flex flex-wrap w-full max-w-[1000px] bg-black rounded-3xl overflow-hidden border border-[#1a1a1a] shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        {/* Left Panel */}
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
            <div className="text-4xl font-bold leading-tight mb-4">Get Started with Us</div>
            <div className="text-white/70 mb-8 text-[15px]">
              Complete these easy steps to register your account.
            </div>
            
            <div className="flex flex-col gap-3">
              <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${step === 1 ? 'bg-white text-black shadow-lg' : 'bg-white/10 border border-white/5'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? 'bg-black text-white' : 'bg-white/20'}`}>1</div>
                <span className="text-sm">Create your account</span>
              </div>
              
              <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${step === 2 ? 'bg-white text-black shadow-lg' : 'bg-white/10 border border-white/5'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-black text-white' : 'bg-white/20'}`}>2</div>
                <span className="text-sm">Select role & add details</span>
              </div>
              
              <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${step === 3 ? 'bg-white text-black shadow-lg' : 'bg-white/10 border border-white/5'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 3 ? 'bg-black text-white' : 'bg-white/20'}`}>3</div>
                <span className="text-sm">Start using Metis</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-[1_1_340px] bg-black p-10 flex flex-col justify-center">
          <div className="w-full max-w-[400px] mx-auto">
            {/* Step 1: Sign Up */}
            {step === 1 && (
              <>
                <div className="mb-8">
                  <div className="text-white text-[26px] font-semibold mb-2">Sign Up Account</div>
                  <div className="text-[#888] text-sm">Enter your personal data to create your account.</div>
                </div>

                <div className="flex gap-3 mb-6">
                  <button
                    type="button"
                    onClick={() => handleOAuthSignUp('google')}
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

                <div className="flex items-center text-[#666] text-[13px] mb-6">
                  <div className="flex-1 h-px bg-[#333]" />
                  <span className="mx-4">Or</span>
                  <div className="flex-1 h-px bg-[#333]" />
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 mb-5">
                  <div className="flex-1">
                    <label className="block text-[#ccc] text-[13px] font-medium mb-2">First Name</label>
                    <input
                      type="text"
                      placeholder="eg. John"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full bg-[#121212] border border-[#1a1a1a] p-3.5 rounded-lg text-white outline-none text-sm transition-all focus:bg-[#1a1a1a] focus:border-[#444]"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[#ccc] text-[13px] font-medium mb-2">Last Name <span className="text-[#666]">(optional)</span></label>
                    <input
                      type="text"
                      placeholder="eg. Doe"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full bg-[#121212] border border-[#1a1a1a] p-3.5 rounded-lg text-white outline-none text-sm transition-all focus:bg-[#1a1a1a] focus:border-[#444]"
                    />
                  </div>
                </div>

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

                <div className="mb-2">
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

                <div className="text-[#666] text-xs mb-6">Must be at least 8 characters.</div>

                <button
                  onClick={handleNext}
                  disabled={isLoading}
                  className="w-full bg-white text-black border-none p-4 rounded-lg font-semibold cursor-pointer transition-all hover:bg-[#e5e5e5] disabled:opacity-50 text-[15px]"
                >
                  Continue
                </button>

                <div className="text-center mt-6 text-[#888] text-[13px]">
                  Already have an account? <Link href="/login" className="text-white no-underline hover:underline">Log in</Link>
                </div>
              </>
            )}

            {/* Step 2: Role Selection & Details */}
            {step === 2 && (
              <>
                <div className="mb-8">
                  <div className="text-white text-[26px] font-semibold mb-2">
                    {isOAuthUser ? 'Complete Your Registration' : 'Select Your Role'}
                  </div>
                  <div className="text-[#888] text-sm">
                    {isOAuthUser ? 'Your account is connected. Choose your role to continue.' : 'Tell us about yourself and add optional details.'}
                  </div>
                </div>

                {/* OAuth Account Display */}
                {isOAuthUser && session?.user && (
                  <div className="mb-6 rounded-lg border-2 border-green-500/30 bg-green-500/10 p-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {session.user.image ? (
                          <img 
                            src={session.user.image} 
                            alt="Profile" 
                            className="h-12 w-12 rounded-full border-2 border-green-500/50"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                            <span className="text-green-400 font-semibold text-lg">
                              {session.user.name?.charAt(0) || "U"}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-green-400 flex items-center gap-1">
                            {session.user.provider === "google" ? "Google" : "LinkedIn"} Connected
                            <button
                              type="button"
                              onClick={handleDisconnectProvider}
                              title="Disconnect"
                              className="ml-1 p-1 rounded-full bg-white hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400 border border-red-200"
                              style={{ lineHeight: 0 }}
                            >
                              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                                <circle cx="10" cy="10" r="9" fill="#fff" fillOpacity="0.7"/>
                                <path d="M7 7l6 6M13 7l-6 6" stroke="#e11d48" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            </button>
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-white truncate">
                          {session.user.name}
                        </p>
                        <p className="text-xs text-[#888] truncate">
                          {session.user.email}
                        </p>
                      </div>
                      {session.user.provider === "google" ? (
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
                )}

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                    {error}
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-[#ccc] text-[13px] font-medium mb-2">I am a *</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'candidate' })}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                        formData.role === 'candidate'
                          ? 'bg-white text-black border-white'
                          : 'bg-transparent text-white border-[#333] hover:border-[#555]'
                      }`}
                    >
                      <div className="font-semibold">Candidate</div>
                      <div className="text-xs opacity-70 mt-1">Looking for opportunities</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'hr' })}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                        formData.role === 'hr'
                          ? 'bg-white text-black border-white'
                          : 'bg-transparent text-white border-[#333] hover:border-[#555]'
                      }`}
                    >
                      <div className="font-semibold">Recruiter</div>
                      <div className="text-xs opacity-70 mt-1">Hiring talent</div>
                    </button>
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-[#ccc] text-[13px] font-medium mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#121212] border border-[#1a1a1a] p-3.5 rounded-lg text-white outline-none text-sm transition-all focus:bg-[#1a1a1a] focus:border-[#444]"
                    required
                  />
                </div>

                <div className="mb-5">
                  <label className="block text-[#ccc] text-[13px] font-medium mb-2">LinkedIn URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/your-profile"
                    value={formData.linkedinUrl}
                    onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                    className="w-full bg-[#121212] border border-[#1a1a1a] p-3.5 rounded-lg text-white outline-none text-sm transition-all focus:bg-[#1a1a1a] focus:border-[#444]"
                  />
                </div>

                <div className="mb-5">
                  <label className="block text-[#ccc] text-[13px] font-medium mb-2">GitHub URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://github.com/your-username"
                    value={formData.githubUrl}
                    onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                    className="w-full bg-[#121212] border border-[#1a1a1a] p-3.5 rounded-lg text-white outline-none text-sm transition-all focus:bg-[#1a1a1a] focus:border-[#444]"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-[#ccc] text-[13px] font-medium mb-2">Portfolio URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://your-portfolio.com"
                    value={formData.portfolioUrl}
                    onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                    className="w-full bg-[#121212] border border-[#1a1a1a] p-3.5 rounded-lg text-white outline-none text-sm transition-all focus:bg-[#1a1a1a] focus:border-[#444]"
                  />
                </div>

                <div className="flex gap-3">
                  {!isOAuthUser && (
                    <button
                      onClick={() => setStep(1)}
                      disabled={isLoading}
                      className="flex-1 bg-transparent text-white border border-[#333] p-4 rounded-lg font-semibold cursor-pointer transition-all hover:bg-[#111] hover:border-[#555] disabled:opacity-50 text-[15px]"
                    >
                      Back
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    disabled={isLoading}
                    className={`${isOAuthUser ? 'w-full' : 'flex-1'} bg-white text-black border-none p-4 rounded-lg font-semibold cursor-pointer transition-all hover:bg-[#e5e5e5] disabled:opacity-50 text-[15px]`}
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Final Confirmation */}
            {step === 3 && (
              <>
                <div className="mb-8">
                  <div className="text-white text-[26px] font-semibold mb-2">You're All Set!</div>
                  <div className="text-[#888] text-sm">Review your details and complete registration.</div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                    {error}
                  </div>
                )}

                <div className="mb-6 p-4 bg-[#121212] rounded-lg border border-[#1a1a1a]">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-[#888] mb-1">Name</div>
                      <div className="text-white">{formData.firstName} {formData.lastName}</div>
                    </div>
                    <div>
                      <div className="text-[#888] mb-1">Email</div>
                      <div className="text-white truncate">{formData.email}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-[#888] mb-1">Role</div>
                      <div className="text-white capitalize">{formData.role}</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    disabled={isLoading}
                    className="flex-1 bg-transparent text-white border border-[#333] p-4 rounded-lg font-semibold cursor-pointer transition-all hover:bg-[#111] hover:border-[#555] disabled:opacity-50 text-[15px]"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex-1 bg-white text-black border-none p-4 rounded-lg font-semibold cursor-pointer transition-all hover:bg-[#e5e5e5] disabled:opacity-50 text-[15px]"
                  >
                    {isLoading ? 'Creating Account...' : 'Complete Registration'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <RegisterPageContent />
    </Suspense>
  );
}
