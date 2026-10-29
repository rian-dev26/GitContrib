import React from 'react';
import {
  ShieldCheck,
  FolderGit2,
  Users,
  BrainCircuit,
  FileCheck2,
  CheckCircle2,
  Loader2,
  Circle,
} from 'lucide-react';

export interface AnalysisStage {
  id: number;
  label: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const ANALYSIS_STAGES: AnalysisStage[] = [
  {
    id: 1,
    label: 'Memvalidasi repository',
    detail: 'Memeriksa keabsahan format URL, status repositori publik, dan konektivitas dasar GitHub.',
    icon: ShieldCheck,
  },
  {
    id: 2,
    label: 'Mengekstraksi histori Git',
    detail: 'Mengekstrak log commit, author identity, timestamp, churn baris kode (+/-), dan struktur file.',
    icon: FolderGit2,
  },
  {
    id: 3,
    label: 'Mengolah data contributor',
    detail: 'Mengidentifikasi kontributor mahasiswa, distribusi frekuensi commit mingguan, dan metrik churn.',
    icon: Users,
  },
  {
    id: 4,
    label: 'Menjalankan simulasi klasifikasi Machine Learning YES/NO pada tingkat commit',
    detail: 'Mengekstraksi fitur komputasi dan mengevaluasi konsistensi pola commit melalui simulasi model klasifikasi.',
    icon: BrainCircuit,
  },
  {
    id: 5,
    label: 'Menyiapkan hasil analisis',
    detail: 'Melakukan agregasi metrik, menghitung konsistensi kontributor, dan merangkum dashboard repository.',
    icon: FileCheck2,
  },
];

interface AnalysisStepIndicatorProps {
  activeStep: number;
}

export const AnalysisStepIndicator: React.FC<AnalysisStepIndicatorProps> = ({ activeStep }) => {
  return (
    <div className="space-y-2.5">
      {ANALYSIS_STAGES.map((stage) => {
        const isDone = activeStep > stage.id;
        const isCurrent = activeStep === stage.id;
        const IconComponent = stage.icon;

        return (
          <div
            key={stage.id}
            className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-300 ${
              isDone
                ? 'bg-app-accent-positive/10 border-app-accent-positive/30'
                : isCurrent
                ? 'bg-app-accent-primary/10 border-app-accent-primary/40 shadow-sm'
                : 'bg-app-card/40 border-app-border/60 opacity-60'
            }`}
          >
            {/* Step Icon / Status Icon */}
            <div className="mt-0.5 shrink-0">
              {isDone ? (
                <div className="w-6 h-6 rounded-full bg-app-accent-positive/20 flex items-center justify-center text-app-accent-positive">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              ) : isCurrent ? (
                <div className="w-6 h-6 rounded-full bg-app-accent-primary/20 flex items-center justify-center text-app-accent-primary">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-app-secondary flex items-center justify-center text-app-text-secondary border border-app-border">
                  <Circle className="w-3 h-3 text-app-text-secondary/50" />
                </div>
              )}
            </div>

            {/* Step Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <IconComponent
                    className={`w-3.5 h-3.5 ${
                      isDone
                        ? 'text-app-accent-positive'
                        : isCurrent
                        ? 'text-app-accent-primary'
                        : 'text-app-text-secondary'
                    }`}
                  />
                  <h4
                    className={`text-xs font-semibold ${
                      isDone
                        ? 'text-app-accent-positive'
                        : isCurrent
                        ? 'text-app-text-primary'
                        : 'text-app-text-secondary'
                    }`}
                  >
                    Tahap {stage.id}: {stage.label}
                  </h4>
                </div>

                {/* Status Badge */}
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    isDone
                      ? 'bg-app-accent-positive/15 text-app-accent-positive border-app-accent-positive/30'
                      : isCurrent
                      ? 'bg-app-accent-primary/15 text-app-accent-primary border-app-accent-primary/30 animate-pulse motion-reduce:animate-none'
                      : 'bg-app-secondary text-app-text-secondary border-app-border'
                  }`}
                >
                  {isDone ? 'Selesai' : isCurrent ? 'Sedang Diproses' : 'Menunggu'}
                </span>
              </div>

              <p className="text-[11px] text-app-text-secondary mt-1 leading-relaxed">
                {stage.detail}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
