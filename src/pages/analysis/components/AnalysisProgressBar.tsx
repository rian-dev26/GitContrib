import React from 'react';
import { Activity } from 'lucide-react';

interface AnalysisProgressBarProps {
  progress: number;
  stageLabel: string;
}

export const AnalysisProgressBar: React.FC<AnalysisProgressBarProps> = ({
  progress,
  stageLabel,
}) => {
  return (
    <div className="space-y-2 p-4 rounded-lg bg-app-card border border-app-border">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-app-accent-primary animate-pulse motion-reduce:animate-none" />
          <span className="font-semibold text-app-text-primary">
            Progress Analisis Repository
          </span>
          <span className="text-[11px] text-app-text-secondary hidden sm:inline">
            — {stageLabel}
          </span>
        </div>
        <span className="font-mono font-bold text-sm text-app-accent-primary">
          {progress}%
        </span>
      </div>

      {/* Progress Track */}
      <div className="w-full h-2.5 bg-app-secondary rounded-full overflow-hidden p-0.5 border border-app-border/60">
        <div
          className="h-full bg-gradient-to-r from-app-accent-primary via-app-accent-secondary to-app-accent-positive rounded-full transition-all duration-500 ease-out relative"
          style={{ width: `${progress}%` }}
        >
          {/* Subtle light shimmer */}
          <div className="absolute inset-0 bg-white/20 animate-pulse motion-reduce:animate-none rounded-full" />
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-app-text-secondary">
        <span>Mode: Simulasi Inferensi Frontend</span>
        <span>Estimasi waktu tersisa: {progress >= 100 ? 'Selesai' : progress >= 80 ? '~1 detik' : '~2 detik'}</span>
      </div>
    </div>
  );
};
