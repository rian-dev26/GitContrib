import { ContributionClassification } from '../../types';
import { cn } from '../../utils/cn';
import { CheckCircle2, XCircle } from 'lucide-react';

export interface StatusBadgeProps {
  status: ContributionClassification | string;
  confidence?: number;
  showConfidence?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * StatusBadge menampilkan hasil klasifikasi YES / NO dari model Machine Learning.
 * Menggunakan aksen hijau lembut untuk YES dan merah lembut untuk NO.
 */
export function StatusBadge({
  status,
  confidence,
  showConfidence = false,
  size = 'sm',
  className,
}: StatusBadgeProps) {
  const isYes = status === 'YES';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold border select-none transition-colors',
        size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
        isYes
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
          : 'bg-rose-500/10 text-rose-400 border-rose-500/25',
        className
      )}
    >
      {isYes ? (
        <CheckCircle2
          className={cn('shrink-0 text-emerald-400', size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5')}
        />
      ) : (
        <XCircle
          className={cn('shrink-0 text-rose-400', size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5')}
        />
      )}
      <span>{status}</span>
      {showConfidence && confidence !== undefined && (
        <span className="text-[10px] opacity-80 font-mono ml-0.5">
          ({Math.round(confidence * 100)}%)
        </span>
      )}
    </span>
  );
}
