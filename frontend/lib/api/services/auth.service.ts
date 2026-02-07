/**
 * Authentication Service
 * Handles user registration, login, and profile management
 */

import { api } from '../client';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  User,
  UpdateProfileRequest,
} from '../types';

export const authService = {
  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    return api.post<RegisterResponse>('/api/users/register', data);
  },

  /**
   * Login user
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/api/users/login', data);
    
    // Store auth token if provided
    if (response.token && typeof window !== 'undefined') {
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('userId', response.userId);
      localStorage.setItem('userRole', response.role);
    }
    
    return response;
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
    }
  },

  /**
   * Get user profile
   */
  getProfile: async (): Promise<any> => {
    return api.get<any>('/api/users/profile');
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: any): Promise<void> => {
    return api.put<void>('/api/users/profile', data);
  },

  /**
   * Upload resume for parsing
   */
  uploadResume: async (file: File): Promise<any> => {
    // Send file as FormData to backend for parsing
    const formData = new FormData();
    formData.append('file', file);
    
    // Use fetch directly for FormData (api.post might not handle it correctly)
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    console.log('Uploading resume:', file.name, 'Token:', token ? 'present' : 'missing');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://metis-im23.vercel.app'}/api/users/upload-resume`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    console.log('Upload response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      console.error('Upload error:', errorData);
      throw new Error(errorData.error || 'Failed to upload resume');
    }

    const data = await response.json();
    console.log('Parsed data received:', data);
    return data;
  },

  /**
   * Get current user from localStorage
   */
  getCurrentUser: (): { userId: string; role: string } | null => {
    if (typeof window === 'undefined') return null;
    
    const userId = localStorage.getItem('userId');
    const role = localStorage.getItem('userRole');
    
    if (!userId || !role) return null;
    
    return { userId, role };
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('authToken');
  },
};
