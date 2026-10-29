import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryText?: string;
}

export function ErrorState({
  className,
  icon,
  title = 'Terjadi Kesalahan',
  description = 'Tidak dapat memuat data. Silakan coba lagi beberapa saat lagi.',
  onRetry,
  retryText = 'Coba Lagi',
  ...props
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-lg border border-app-accent-negative/30 bg-app-accent-negative/5',
        className
      )}
      {...props}
    >
      <div className="w-12 h-12 rounded-full bg-app-accent-negative/10 border border-app-accent-negative/20 flex items-center justify-center text-app-accent-negative mb-3">
        {icon || <AlertCircle className="w-6 h-6 stroke-[1.5]" aria-hidden="true" />}
      </div>
      <h4 className="text-sm font-semibold text-app-text-primary tracking-tight">
        {title}
      </h4>
      <p className="text-xs text-app-text-secondary max-w-sm mt-1.5 leading-relaxed">
        {description}
      </p>
      {onRetry && (
        <div className="mt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            {retryText}
          </Button>
        </div>
      )}
    </div>
  );
}
