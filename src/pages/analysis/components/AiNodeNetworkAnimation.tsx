import React from 'react';
import { Cpu, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';

interface AiNodeNetworkAnimationProps {
  isAnalyzing: boolean;
  activeStep: number;
}

export const AiNodeNetworkAnimation: React.FC<AiNodeNetworkAnimationProps> = ({
  isAnalyzing,
  activeStep,
}) => {
  const isMlStageActive = activeStep >= 4;

  return (
    <div className="rounded-lg border border-app-border bg-app-card/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-app-accent-primary" />
          <h4 className="text-xs font-semibold text-app-text-primary">
            Simulasi Pipeline Inferensi Machine Learning (YES / NO)
          </h4>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-app-text-secondary">
          <Sparkles className="w-3.5 h-3.5 text-app-accent-primary" />
          <span className="font-mono">
            {isMlStageActive ? 'Model Active: Supervised RF/XGBoost' : 'Standby / Menunggu Ekstraksi'}
          </span>
        </div>
      </div>

      {/* SVG Neural Node Diagram */}
      <div className="relative w-full h-36 bg-app-bg/80 rounded-md border border-app-border/70 p-2 overflow-hidden flex items-center justify-between px-4 sm:px-8">
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Connector lines from Inputs to Hidden Layer */}
          <line
            x1="20%"
            y1="25%"
            x2="50%"
            y2="30%"
            stroke="rgb(var(--color-app-border))"
            strokeWidth="1.5"
            className={isMlStageActive ? 'stroke-app-accent-primary animate-flow-dash' : ''}
          />
          <line
            x1="20%"
            y1="50%"
            x2="50%"
            y2="50%"
            stroke="rgb(var(--color-app-border))"
            strokeWidth="1.5"
            className={isMlStageActive ? 'stroke-app-accent-primary animate-flow-dash' : ''}
          />
          <line
            x1="20%"
            y1="75%"
            x2="50%"
            y2="70%"
            stroke="rgb(var(--color-app-border))"
            strokeWidth="1.5"
            className={isMlStageActive ? 'stroke-app-accent-primary animate-flow-dash' : ''}
          />

          {/* Connector lines from Hidden to Output Layer */}
          <line
            x1="50%"
            y1="30%"
            x2="80%"
            y2="35%"
            stroke="rgb(var(--color-app-border))"
            strokeWidth="1.5"
            className={isMlStageActive ? 'stroke-app-accent-positive animate-flow-dash' : ''}
          />
          <line
            x1="50%"
            y1="50%"
            x2="80%"
            y2="35%"
            stroke="rgb(var(--color-app-border))"
            strokeWidth="1.5"
            className={isMlStageActive ? 'stroke-app-accent-positive animate-flow-dash' : ''}
          />
          <line
            x1="50%"
            y1="70%"
            x2="80%"
            y2="65%"
            stroke="rgb(var(--color-app-border))"
            strokeWidth="1.5"
            className={isMlStageActive ? 'stroke-app-accent-secondary animate-flow-dash' : ''}
          />
        </svg>

        {/* Column 1: Feature Extraction Inputs */}
        <div className="z-10 flex flex-col justify-around h-full py-1 text-[10px]">
          <div className="flex items-center gap-1.5 bg-app-card border border-app-border px-2 py-1 rounded shadow-sm">
            <span className={`w-1.5 h-1.5 rounded-full ${isAnalyzing ? 'bg-app-accent-primary' : 'bg-app-border'}`} />
            <span className="text-app-text-secondary">Line Churn (+/-)</span>
          </div>
          <div className="flex items-center gap-1.5 bg-app-card border border-app-border px-2 py-1 rounded shadow-sm">
            <span className={`w-1.5 h-1.5 rounded-full ${isAnalyzing ? 'bg-app-accent-primary' : 'bg-app-border'}`} />
            <span className="text-app-text-secondary">Entropy & Files</span>
          </div>
          <div className="flex items-center gap-1.5 bg-app-card border border-app-border px-2 py-1 rounded shadow-sm">
            <span className={`w-1.5 h-1.5 rounded-full ${isAnalyzing ? 'bg-app-accent-primary' : 'bg-app-border'}`} />
            <span className="text-app-text-secondary">Message Length</span>
          </div>
        </div>

        {/* Column 2: Minimalist Neural/ML Hidden Nodes */}
        <div className="z-10 flex flex-col justify-around h-full py-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center border text-[10px] font-mono transition-all duration-300 ${
              isMlStageActive
                ? 'bg-app-accent-primary/20 border-app-accent-primary text-app-accent-primary shadow-sm animate-ai-pulse'
                : 'bg-app-secondary border-app-border text-app-text-secondary'
            }`}
          >
            H1
          </div>
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center border text-[10px] font-mono transition-all duration-300 ${
              isMlStageActive
                ? 'bg-app-accent-primary/20 border-app-accent-primary text-app-accent-primary shadow-sm animate-ai-pulse'
                : 'bg-app-secondary border-app-border text-app-text-secondary'
            }`}
            style={{ animationDelay: '0.4s' }}
          >
            H2
          </div>
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center border text-[10px] font-mono transition-all duration-300 ${
              isMlStageActive
                ? 'bg-app-accent-primary/20 border-app-accent-primary text-app-accent-primary shadow-sm animate-ai-pulse'
                : 'bg-app-secondary border-app-border text-app-text-secondary'
            }`}
            style={{ animationDelay: '0.8s' }}
          >
            H3
          </div>
        </div>

        {/* Column 3: Output Classification Labels (YES / NO) */}
        <div className="z-10 flex flex-col justify-around h-full py-2 text-[10px]">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all duration-300 font-semibold ${
              isMlStageActive
                ? 'bg-app-accent-positive/15 border-app-accent-positive text-app-accent-positive shadow-sm'
                : 'bg-app-card border-app-border text-app-text-secondary'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>YES (Konsisten PBL)</span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all duration-300 font-semibold ${
              isMlStageActive
                ? 'bg-app-accent-secondary/15 border-app-accent-secondary text-app-accent-secondary shadow-sm'
                : 'bg-app-card border-app-border text-app-text-secondary'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>NO (Perlu Verifikasi Dosen)</span>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-app-text-secondary text-center italic">
        *Visualisasi node menunjukkan proses abstraksi simulasi inferensi ML berbasis fitur commit histori.
      </p>
    </div>
  );
};
