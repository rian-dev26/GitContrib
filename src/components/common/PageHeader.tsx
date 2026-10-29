import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

export interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-app-border mb-6',
        className
      )}
    >
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-app-text-secondary mb-2">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.label}>
                {idx > 0 && <span className="text-app-text-secondary/50">/</span>}
                {crumb.href ? (
                  <Link
                    to={crumb.href}
                    className="hover:text-app-text-primary transition-colors duration-150"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-app-text-primary font-medium">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-semibold text-app-text-primary tracking-tight font-sans">
            {title}
          </h1>
          {badge}
        </div>

        {description && (
          <p className="text-xs sm:text-sm text-app-text-secondary mt-1 max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">{actions}</div>}
    </div>
  );
}
