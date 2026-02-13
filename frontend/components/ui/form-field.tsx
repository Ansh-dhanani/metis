/**
 * FormField Component
 * 
 * A reusable form field wrapper that combines label, input, and error message.
 * Provides consistent form field structure across all forms.
 * 
 * @example
 * ```tsx
 * <FormField label="Email" error={errors.email} required>
 *   <Input
 *     type="email"
 *     value={formData.email}
 *     onChange={(e) => setFormData({...formData, email: e.target.value})}
 *   />
 * </FormField>
 * ```
 */

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export interface FormFieldProps {
  /** The label text for the field */
  label: string;
  /** Optional error message to display */
  error?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Optional helper text to display below the input */
  helperText?: string;
  /** The input element (Input, Textarea, Select, etc.) */
  children: ReactNode;
  /** Additional CSS classes for the container */
  className?: string;
  /** Optional custom id for the input (defaults to label-based id) */
  htmlFor?: string;
}

export function FormField({
  label,
  error,
  required = false,
  helperText,
  children,
  className,
  htmlFor,
}: FormFieldProps) {
  // Generate a simple id from label if not provided
  const fieldId = htmlFor || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={fieldId}>
        {label}
        {required && (
          <span className="ml-1 text-destructive" aria-label="required">
            *
          </span>
        )}
      </Label>
      {children}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p className="text-sm text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  );
}
