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
    const formData = new FormData();
    formData.append('resume', file);
    
    // For MVP, we'll send the file as base64 text
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const response = await api.post('/api/users/upload-resume', {
            rawText: base64
          });
          resolve(response);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
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
