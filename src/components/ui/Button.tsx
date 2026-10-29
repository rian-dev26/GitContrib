import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg disabled:opacity-50 disabled:cursor-not-allowed select-none';

    const variants: Record<ButtonVariant, string> = {
      primary:
        'bg-app-accent-primary text-white hover:bg-app-accent-primary-hover active:brightness-95 shadow-sm',
      secondary:
        'bg-app-secondary text-app-text-primary hover:bg-app-secondary/80 border border-app-border active:brightness-95',
      outline:
        'border border-app-border bg-transparent text-app-text-primary hover:bg-app-secondary hover:text-app-text-primary active:bg-app-card',
      ghost:
        'bg-transparent text-app-text-secondary hover:text-app-text-primary hover:bg-app-secondary/60 active:bg-app-secondary',
      danger:
        'bg-app-accent-negative text-white hover:opacity-90 active:brightness-95',
    };

    const sizes: Record<ButtonSize, string> = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-9 px-4 text-sm gap-2',
      lg: 'h-11 px-5 text-base gap-2.5',
    };

    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
