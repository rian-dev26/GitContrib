import React from 'react';
import { cn } from '../../utils/cn';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'outline'
  | 'secondary';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-medium rounded-full select-none';

  const variants: Record<BadgeVariant, { bg: string; dotColor: string }> = {
    default: {
      bg: 'bg-app-secondary text-app-text-primary border border-app-border',
      dotColor: 'bg-app-text-secondary',
    },
    secondary: {
      bg: 'bg-app-secondary/70 text-app-text-secondary border border-app-border',
      dotColor: 'bg-app-text-secondary',
    },
    primary: {
      bg: 'bg-app-accent-primary/15 text-app-accent-primary border border-app-accent-primary/30',
      dotColor: 'bg-app-accent-primary',
    },
    success: {
      bg: 'bg-app-accent-positive/15 text-app-accent-positive border border-app-accent-positive/30',
      dotColor: 'bg-app-accent-positive',
    },
    danger: {
      bg: 'bg-app-accent-negative/15 text-app-accent-negative border border-app-accent-negative/30',
      dotColor: 'bg-app-accent-negative',
    },
    warning: {
      bg: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30',
      dotColor: 'bg-amber-500',
    },
    outline: {
      bg: 'bg-transparent text-app-text-secondary border border-app-border',
      dotColor: 'bg-app-text-secondary',
    },
  };

  const sizes: Record<BadgeSize, string> = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-0.5 gap-1.5',
  };

  const currentVariant = variants[variant];

  return (
    <span
      className={cn(baseStyles, currentVariant.bg, sizes[size], className)}
      {...props}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', currentVariant.dotColor)}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
