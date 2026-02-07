/**
 * API Configuration Utility
 * Provides centralized API URL configuration for all environments
 */

const getApiUrl = (): string => {
  // In production build, use environment variable or fallback to production URL
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_API_URL || 'https://metis-im23.vercel.app';
  }
  
  // In development, use localhost or environment variable
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
};

const getWebSocketUrl = (): string => {
  // In production build, use environment variable or fallback to production URL
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_WS_URL || 'https://metis-im23.vercel.app';
  }
  
  // In development, use localhost or environment variable
  return process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';
};

export const config = {
  apiUrl: getApiUrl(),
  wsUrl: getWebSocketUrl(),
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

export default config;
