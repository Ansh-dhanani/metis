/**
 * Error handling utilities
 */

import { APIError } from '../api/client';
import { toast } from 'sonner';

/**
 * Extract user-friendly error message from any error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    // Include details if available
    if (error.data && typeof error.data === 'object') {
      const data = error.data as Record<string, any>;
      
      // Return the error message from data if available
      if (data.error) {
        return data.error;
      }
      
      if (data.details) {
        return `${error.message}\n${data.details}`;
      }
    }
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  
  return 'An unexpected error occurred';
}

/**
 * Extract error data for additional processing
 */
export function getErrorData(error: unknown): Record<string, any> | null {
  if (error instanceof APIError && error.data && typeof error.data === 'object') {
    return error.data as Record<string, any>;
  }
  return null;
}

/**
 * Handle error and show toast notification
 */
export function handleError(error: unknown, fallbackMessage?: string): void {
  const message = getErrorMessage(error);
  console.error('Error:', error);
  toast.error(fallbackMessage || message);
}

/**
 * Handle success with toast notification
 */
export function handleSuccess(message: string): void {
  toast.success(message);
}

/**
 * Check if error is authentication related
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof APIError) {
    return error.status === 401 || error.status === 403;
  }
  return false;
}

/**
 * Check if error is validation related
 */
export function isValidationError(error: unknown): boolean {
  if (error instanceof APIError) {
    return error.status === 400 || error.status === 422;
  }
  return false;
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(error: unknown): string[] {
  if (error instanceof APIError && error.data && typeof error.data === 'object') {
    const data = error.data as Record<string, any>;
    if (data.errors && Array.isArray(data.errors)) {
      return data.errors;
    }
    if (data.fields && typeof data.fields === 'object') {
      return Object.entries(data.fields).map(([field, message]) => `${field}: ${message}`);
    }
  }
  return [getErrorMessage(error)];
}
