/**
 * Authentication Context Provider
 * Manages global authentication state
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { authService } from '@/lib/api/services';
import type { User } from '@/lib/api/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();

  useEffect(() => {
    // Check if user is authenticated on mount
    const initAuth = async () => {
      // First check for NextAuth session (OAuth users)
      if (status === 'loading') {
        return; // Wait for session to load
      }

      if (session?.user) {
        // User is authenticated via OAuth
        setUser({
          userId: session.user.id || '',
          email: session.user.email || '',
          firstName: session.user.name?.split(' ')[0] || '',
          lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
          role: (session.user.role as 'hr' | 'candidate') || 'candidate',
          createdAt: new Date().toISOString(),
        });
        setIsLoading(false);
        return;
      }

      // Fall back to localStorage auth (email/password users)
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        try {
          const userData = await authService.getProfile();
          setUser(userData);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          // Don't logout on profile fetch errors - user might still be valid
          // Only clear if it's an authentication error (401)
          if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
            authService.logout();
            setUser(null);
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [session, status]);

  const login = async (email: string, password: string) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _response = await authService.login({ email, password });
    const userData = await authService.getProfile();
    setUser(userData);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      const userData = await authService.getProfile();
      setUser(userData);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
