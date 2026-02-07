/**
 * Environment configuration
 */

export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  appName: 'Metis',
  appDescription: 'AI-Powered Recruitment Assessment Platform',
} as const;
