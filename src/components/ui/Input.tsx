import React, { forwardRef, useId } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      id,
      leftIcon,
      rightIcon,
      disabled,
      containerClassName,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className={cn('w-full flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-app-text-secondary select-none"
          >
            {label}
            {props.required && <span className="text-app-accent-negative ml-0.5">*</span>}
          </label>
        )}

        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3 text-app-text-secondary pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={cn(
              'w-full h-9 rounded-md bg-app-card border px-3 text-sm text-app-text-primary placeholder:text-app-text-secondary/50',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-app-accent-primary focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-app-bg',
              leftIcon ? 'pl-9' : 'pl-3',
              rightIcon ? 'pr-9' : 'pr-3',
              error
                ? 'border-app-accent-negative focus:ring-app-accent-negative'
                : 'border-app-border hover:border-[#464850]',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 text-app-text-secondary pointer-events-none flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <p id={errorId} className="text-xs text-app-accent-negative mt-0.5 font-normal">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-app-text-secondary mt-0.5 font-normal">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
