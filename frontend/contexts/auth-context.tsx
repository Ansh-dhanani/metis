/**
 * Authentication Context Provider
 * Manages global authentication state
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
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
    const initAuth = async () => {
      // Wait for NextAuth session to load
      if (status === 'loading') {
        return;
      }

      // Check NextAuth session first (OAuth users)
      if (session?.user) {
        // Skip incomplete OAuth registrations
        if (session.user.needsRoleSelection) {
          setIsLoading(false);
          return;
        }
        
        // Map NextAuth session to auth context user
        setUser({
          userId: session.user.id || '',
          email: session.user.email || '',
          firstName: session.user.name?.split(' ')[0] || '',
          lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
          role: (session.user.role as 'hr' | 'candidate') || 'candidate',
          image: session.user.image || undefined,
          createdAt: new Date().toISOString(),
        });
        setIsLoading(false);
        return;
      }

      // Fall back to localStorage (email/password users)
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        try {
          const userData = await authService.getProfile();
          setUser(userData);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          // Only clear auth on 401 errors
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
    const response = await authService.login({ email, password });
    
    // Fetch full user profile after login
    try {
      const userData = await authService.getProfile();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch profile after login:', error);
      // Even if profile fetch fails, user is logged in with tokens
      setUser({
        userId: response.userId,
        email: email,
        firstName: response.firstName || '',
        lastName: response.lastName || '',
        role: response.role,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    
    // Also sign out of NextAuth session if it exists
    if (session) {
      await signOut({ redirect: false });
    }
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
