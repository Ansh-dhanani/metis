/**
 * PageHeader Component
 * 
 * A reusable header component for dashboard pages with title, description, and optional action button.
 * Provides consistent page header structure across all dashboard pages.
 * 
 * @example
 * ```tsx
 * <PageHeader
 *   title="Welcome back, John!"
 *   description="Here's what's happening with your recruitment"
 *   action={
 *     <Button asChild>
 *       <Link href="/dashboard/jobs/new">
 *         <Plus className="mr-2 h-4 w-4" />
 *         Create Job
 *       </Link>
 *     </Button>
 *   }
 * />
 * ```
 */

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export interface PageHeaderProps {
  /** The main heading text */
  title: string | ReactNode;
  /** Optional description or subtitle */
  description?: string | ReactNode;
  /** Optional action button or element (e.g., Button, Link) */
  action?: ReactNode;
  /** Additional CSS classes for the container */
  className?: string;
}

export function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-2">
          {action}
        </div>
      )}
    </div>
  );
}
