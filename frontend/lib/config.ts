/**
 * Environment configuration
 */

export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://metis-im23.vercel.app',
  appName: 'Metis',
  appDescription: 'AI-Powered Recruitment Assessment Platform',
} as const;
