/**
 * Typography Component
 * 
 * A set of reusable typography components for consistent text hierarchy across the application.
 * These components enforce design system typography scales and spacing.
 * 
 * @example
 * ```tsx
 * <Typography.H1>Main Page Title</Typography.H1>
 * <Typography.P>Body paragraph text with proper styling.</Typography.P>
 * <Typography.Muted>Secondary information text.</Typography.Muted>
 * ```
 */

import { cn } from '@/lib/utils';
import { HTMLAttributes, ReactNode } from 'react';

interface TypographyProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  className?: string;
}

/**
 * H1 - Main page headings
 * Used for the primary heading on a page (typically one per page)
 */
function H1({ children, className, ...props }: TypographyProps) {
  return (
    <h1
      className={cn(
        'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl',
        className
      )}
      {...props}
    >
      {children}
    </h1>
  );
}

/**
 * H2 - Section headings
 * Used for major sections within a page
 */
function H2({ children, className, ...props }: TypographyProps) {
  return (
    <h2
      className={cn(
        'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0',
        className
      )}
      {...props}
    >
      {children}
    </h2>
  );
}

/**
 * H3 - Subsection headings
 * Used for subsections within major sections
 */
function H3({ children, className, ...props }: TypographyProps) {
  return (
    <h3
      className={cn(
        'scroll-m-20 text-2xl font-semibold tracking-tight',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

/**
 * H4 - Card/component headings
 * Used for headings within cards or smaller components
 */
function H4({ children, className, ...props }: TypographyProps) {
  return (
    <h4
      className={cn(
        'scroll-m-20 text-xl font-semibold tracking-tight',
        className
      )}
      {...props}
    >
      {children}
    </h4>
  );
}

/**
 * H5 - Small headings
 * Used for minor headings or labels
 */
function H5({ children, className, ...props }: TypographyProps) {
  return (
    <h5
      className={cn(
        'scroll-m-20 text-lg font-medium tracking-tight',
        className
      )}
      {...props}
    >
      {children}
    </h5>
  );
}

/**
 * H6 - Smallest headings
 * Used for the smallest headings or emphasized labels
 */
function H6({ children, className, ...props }: TypographyProps) {
  return (
    <h6
      className={cn(
        'scroll-m-20 text-base font-medium tracking-tight',
        className
      )}
      {...props}
    >
      {children}
    </h6>
  );
}

/**
 * P - Body paragraph
 * Standard paragraph text
 */
function P({ children, className, ...props }: TypographyProps) {
  return (
    <p
      className={cn('leading-7 [&:not(:first-child)]:mt-6', className)}
      {...props}
    >
      {children}
    </p>
  );
}

/**
 * Lead - Large body text
 * Used for introductory or emphasized paragraphs
 */
function Lead({ children, className, ...props }: TypographyProps) {
  return (
    <p
      className={cn('text-xl text-muted-foreground', className)}
      {...props}
    >
      {children}
    </p>
  );
}

/**
 * Large - Large emphasized text
 * Used for emphasized text that's larger than body text
 */
function Large({ children, className, ...props }: TypographyProps) {
  return (
    <div
      className={cn('text-lg font-semibold', className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Small - Small text
 * Used for fine print or secondary information
 */
function Small({ children, className, ...props }: TypographyProps) {
  return (
    <small
      className={cn('text-sm leading-none font-medium', className)}
      {...props}
    >
      {children}
    </small>
  );
}

/**
 * Muted - Muted text
 * Used for secondary or less important information
 */
function Muted({ children, className, ...props }: TypographyProps) {
  return (
    <p
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    >
      {children}
    </p>
  );
}

/**
 * Blockquote - Quote block
 * Used for quotes or emphasized content blocks
 */
function Blockquote({ children, className, ...props }: TypographyProps) {
  return (
    <blockquote
      className={cn('mt-6 border-l-2 pl-6 italic', className)}
      {...props}
    >
      {children}
    </blockquote>
  );
}

/**
 * InlineCode - Inline code
 * Used for inline code snippets or technical terms
 */
function InlineCode({ children, className, ...props }: TypographyProps) {
  return (
    <code
      className={cn(
        'bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
        className
      )}
      {...props}
    >
      {children}
    </code>
  );
}

/**
 * List - Unordered list
 * Styled list component
 */
function List({ children, className, ...props }: TypographyProps) {
  return (
    <ul
      className={cn('my-6 ml-6 list-disc [&>li]:mt-2', className)}
      {...props}
    >
      {children}
    </ul>
  );
}

/**
 * Export all typography components under Typography namespace
 */
export const Typography = {
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  P,
  Lead,
  Large,
  Small,
  Muted,
  Blockquote,
  InlineCode,
  List,
};
