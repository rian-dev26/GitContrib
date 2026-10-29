import React, { useEffect, useState } from 'react';
import { GitCommit, Terminal, CheckCircle2 } from 'lucide-react';

interface SimulatedCommit {
  hash: string;
  author: string;
  message: string;
  churn: string;
  decision?: 'YES' | 'NO';
}

const MOCK_STREAM_COMMITS: SimulatedCommit[] = [
  { hash: 'e8b192a', author: 'ahmad-rizki', message: 'feat(api): endpoint autentikasi jwt token', churn: '+142 -12', decision: 'YES' },
  { hash: '7c3d4e1', author: 'siti-nurhaliza', message: 'feat(ui): implementasi responsive navbar & sidebar', churn: '+88 -4', decision: 'YES' },
  { hash: 'a12f99b', author: 'budi-santoso', message: 'fix(database): perbaikan query foreign key index', churn: '+34 -18', decision: 'YES' },
  { hash: '09cc81d', author: 'dewi-lestari', message: 'docs: perbarui panduan instalasi & env sample', churn: '+16 -2', decision: 'YES' },
  { hash: '4f88e2c', author: 'ahmad-rizki', message: 'test: tambahkan unit test login validator', churn: '+62 -8', decision: 'YES' },
  { hash: 'bb120aa', author: 'budi-santoso', message: 'refactor(service): optimasi caching session redis', churn: '+95 -44', decision: 'YES' },
  { hash: '3e44910', author: 'unknown', message: 'update file (batch dump code)', churn: '+1240 -3', decision: 'NO' },
  { hash: '99af13c', author: 'siti-nurhaliza', message: 'style: sesuaikan warna dark mode token', churn: '+24 -11', decision: 'YES' },
];

interface CommitStreamAnimationProps {
  activeStep: number;
}

export const CommitStreamAnimation: React.FC<CommitStreamAnimationProps> = ({ activeStep }) => {
  const [visibleCommits, setVisibleCommits] = useState<SimulatedCommit[]>([]);

  useEffect(() => {
    // Tambahkan commit bertahap saat ekstraksi / ML aktif
    if (activeStep < 2) {
      setVisibleCommits([]);
      return;
    }

    const interval = setInterval(() => {
      setVisibleCommits((prev) => {
        if (prev.length >= MOCK_STREAM_COMMITS.length) return prev;
        const nextCommit = MOCK_STREAM_COMMITS[prev.length];
        return [nextCommit, ...prev];
      });
    }, 450);

    return () => clearInterval(interval);
  }, [activeStep]);

  return (
    <div className="rounded-lg border border-app-border bg-app-bg/90 overflow-hidden font-mono text-xs">
      {/* Header Terminal Stream */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-app-secondary/60 border-b border-app-border text-app-text-secondary">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-app-accent-primary" />
          <span className="font-semibold text-[11px] uppercase tracking-wider text-app-text-primary">
            Git Commit Stream Monitor
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-app-accent-positive opacity-75 motion-reduce:animate-none"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-app-accent-positive"></span>
          </span>
          <span className="text-[10px] text-app-accent-positive font-semibold uppercase">
            {activeStep >= 4 ? 'ML Inference' : 'Live Extraction'}
          </span>
        </div>
      </div>

      {/* Body List Commit */}
      <div className="p-3 max-h-44 overflow-y-auto space-y-1.5 scrollbar-thin">
        {visibleCommits.length === 0 ? (
          <div className="py-4 text-center text-app-text-secondary text-[11px] italic">
            Menunggu inisialisasi shallow clone repository...
          </div>
        ) : (
          visibleCommits.map((c) => (
            <div
              key={c.hash}
              className="flex items-center justify-between gap-2 p-1.5 rounded bg-app-card/60 border border-app-border/40 animate-commit-row hover:border-app-accent-primary/50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <GitCommit className="w-3.5 h-3.5 text-app-accent-primary shrink-0" />
                <span className="text-app-accent-secondary font-semibold shrink-0">
                  {c.hash}
                </span>
                <span className="text-app-text-primary truncate">
                  {c.message}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0 text-[10px]">
                <span className="text-app-text-secondary hidden sm:inline">
                  @{c.author}
                </span>
                <span className="text-app-accent-positive font-mono font-medium">
                  {c.churn}
                </span>
                {activeStep >= 4 && (
                  <span
                    className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                      c.decision === 'YES'
                        ? 'bg-app-accent-positive/15 text-app-accent-positive border border-app-accent-positive/30'
                        : 'bg-app-accent-negative/15 text-app-accent-negative border border-app-accent-negative/30'
                    }`}
                  >
                    {c.decision}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="px-3.5 py-1.5 bg-app-secondary/30 border-t border-app-border flex items-center justify-between text-[10px] text-app-text-secondary">
        <span>Simulasi streaming commit: {visibleCommits.length} diproses</span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-app-accent-positive" /> Log sinkron
        </span>
      </div>
    </div>
  );
};
