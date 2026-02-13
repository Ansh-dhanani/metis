/**
 * EmptyState Component
 * 
 * A reusable component for displaying empty states when no data is available.
 * Provides consistent "no data" UI patterns across all pages.
 * 
 * @example
 * ```tsx
 * {jobs.length === 0 && (
 *   <EmptyState
 *     icon={Briefcase}
 *     title="No jobs yet"
 *     description="Create your first job posting to start receiving applications"
 *     action={{
 *       label: "Create Job",
 *       href: "/dashboard/jobs/new"
 *     }}
 *   />
 * )}
 * ```
 */

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

export interface EmptyStateProps {
  /** Lucide icon component to display */
  icon: LucideIcon;
  /** The main heading text */
  title: string;
  /** Description or helpful message */
  description: string;
  /** Optional action button */
  action?: {
    /** Button label */
    label: string;
    /** Link href (for navigation) */
    href?: string;
    /** Click handler (for actions) */
    onClick?: () => void;
    /** Button variant */
    variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  };
  /** Additional CSS classes for the container */
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/50 py-12 text-center',
        className
      )}
    >
      <Icon
        className="mb-4 h-12 w-12 text-muted-foreground"
        aria-hidden="true"
        strokeWidth={1.5}
      />
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {action && (
        <>
          {action.href ? (
            <Button asChild variant={action.variant || 'default'}>
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button
              onClick={action.onClick}
              variant={action.variant || 'default'}
            >
              {action.label}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
