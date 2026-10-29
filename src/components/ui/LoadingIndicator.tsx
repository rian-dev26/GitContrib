import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface LoadingIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export function LoadingIndicator({
  className,
  size = 'md',
  text,
  fullScreen = false,
  ...props
}: LoadingIndicatorProps) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-app-text-secondary',
        className
      )}
      role="status"
      aria-live="polite"
      {...props}
    >
      <Loader2
        className={cn('animate-spin text-app-accent-primary', sizeMap[size])}
        aria-hidden="true"
      />
      {text && <p className="text-xs font-normal tracking-wide">{text}</p>}
      <span className="sr-only">Memuat data...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-app-bg/80 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
}
