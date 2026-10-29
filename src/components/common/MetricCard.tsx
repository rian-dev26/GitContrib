import React from 'react';
import { Card } from '../ui/Card';
import { cn } from '../../utils/cn';

export interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  className?: string;
}

export function MetricCard({
  label,
  value,
  subValue,
  icon,
  trend,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn('p-5 flex flex-col justify-between', className)}>
      <div className="flex items-center justify-between text-app-text-secondary mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-app-text-secondary/90">
          {label}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-md bg-app-secondary border border-app-border flex items-center justify-center text-app-text-secondary">
            {icon}
          </div>
        )}
      </div>

      <div>
        <div className="text-2xl md:text-3xl font-semibold text-app-text-primary tracking-tight font-sans">
          {value}
        </div>

        {(subValue || trend) && (
          <div className="flex items-center gap-2 mt-2 text-xs">
            {trend && (
              <span
                className={cn(
                  'font-medium',
                  trend.isPositive ? 'text-app-accent-positive' : 'text-app-accent-negative'
                )}
              >
                {trend.value}
              </span>
            )}
            {subValue && <span className="text-app-text-secondary">{subValue}</span>}
          </div>
        )}
      </div>
    </Card>
  );
}
