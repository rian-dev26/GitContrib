import React from 'react';
import { FolderGit2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  className,
  icon,
  title,
  description,
  action,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-lg border border-dashed border-app-border bg-app-card/40',
        className
      )}
      {...props}
    >
      <div className="w-12 h-12 rounded-full bg-app-secondary/80 border border-app-border flex items-center justify-center text-app-text-secondary mb-3">
        {icon || <FolderGit2 className="w-6 h-6 stroke-[1.5]" aria-hidden="true" />}
      </div>
      <h4 className="text-sm font-semibold text-app-text-primary tracking-tight">
        {title}
      </h4>
      {description && (
        <p className="text-xs text-app-text-secondary max-w-sm mt-1.5 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
