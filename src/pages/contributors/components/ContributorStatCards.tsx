import {
  GitCommit,
  Calendar,
  CheckCircle2,
  XCircle,
  Code2,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { MetricCard } from '../../../components/common/MetricCard';
import { Button } from '../../../components/ui/Button';

export interface ContributorMetricsSummary {
  totalCommits: number;
  yesCount: number;
  noCount: number;
  yesRatio: number;
  activeDays: number;
  totalAdditions: number;
  totalDeletions: number;
  totalChanges: number;
}

interface ContributorStatCardsProps {
  allTimeStats: ContributorMetricsSummary;
  filteredStats: ContributorMetricsSummary;
  isFiltered: boolean;
  onResetFilter: () => void;
}

export function ContributorStatCards({
  allTimeStats,
  filteredStats,
  isFiltered,
  onResetFilter,
}: ContributorStatCardsProps) {
  // Nilai yang ditampilkan merujuk ke filteredStats jika isFiltered, atau allTimeStats
  const current = isFiltered ? filteredStats : allTimeStats;
  const yesPercent = current.totalCommits > 0 ? Math.round((current.yesCount / current.totalCommits) * 100) : 0;
  const noPercent = current.totalCommits > 0 ? Math.round((current.noCount / current.totalCommits) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Banner informasi jika filter waktu / query aktif */}
      {isFiltered && (
        <div className="p-3.5 bg-app-accent-primary/10 border border-app-accent-primary/20 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs animate-fadeIn">
          <div className="flex items-center gap-2 text-app-text-primary">
            <Filter className="w-4 h-4 text-app-accent-primary shrink-0" />
            <div>
              <span className="font-semibold">Filter Waktu / Pencarian Aktif:</span>
              <span className="ml-1 text-app-text-secondary">
                Menampilkan statistik untuk <strong>{current.totalCommits}</strong> dari{' '}
                <strong>{allTimeStats.totalCommits}</strong> commit keseluruhan.
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilter}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            className="text-xs h-7 hover:bg-app-accent-primary/15"
          >
            Reset Filter ke Semua Waktu
          </Button>
        </div>
      )}

      {/* Grid Kartu Metrik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Commit */}
        <MetricCard
          label={isFiltered ? 'Commit Terfilter' : 'Total Commit'}
          value={current.totalCommits}
          subValue={
            isFiltered
              ? `dari ${allTimeStats.totalCommits} commit total`
              : 'Seluruh histori kontribusi'
          }
          icon={<GitCommit className="w-4 h-4 text-app-accent-primary" />}
        />

        {/* Active Days */}
        <MetricCard
          label="Hari Aktif Commit"
          value={`${current.activeDays} Hari`}
          subValue={
            isFiltered
              ? `All-time: ${allTimeStats.activeDays} hari unik`
              : 'Frekuensi hari dengan commit'
          }
          icon={<Calendar className="w-4 h-4 text-app-accent-secondary" />}
        />

        {/* Lines Changed */}
        <MetricCard
          label="Total Code Churn"
          value={current.totalChanges.toLocaleString('id-ID')}
          subValue={`+${current.totalAdditions.toLocaleString('id-ID')} / -${current.totalDeletions.toLocaleString('id-ID')} baris`}
          icon={<Code2 className="w-4 h-4 text-blue-500" />}
        />

        {/* YES / NO Prediction Summary */}
        <div className="bg-app-card border border-app-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-app-text-secondary uppercase tracking-wider">
              Prediksi Commit
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-app-secondary border border-app-border text-app-text-secondary">
              ML Model
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-app-border/60">
            {/* YES pill */}
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-lg leading-none">
                <CheckCircle2 className="w-4 h-4" />
                {current.yesCount}
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium mt-1">
                YES ({yesPercent}%)
              </p>
            </div>

            {/* NO pill */}
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-center">
              <div className="flex items-center justify-center gap-1 text-rose-600 dark:text-rose-400 font-bold text-lg leading-none">
                <XCircle className="w-4 h-4" />
                {current.noCount}
              </div>
              <p className="text-[11px] text-rose-700 dark:text-rose-300 font-medium mt-1">
                NO ({noPercent}%)
              </p>
            </div>
          </div>

          <p className="text-[10px] text-app-text-secondary mt-2.5 text-center leading-tight">
            Jumlah YES + NO = {current.yesCount + current.noCount} commit
          </p>
        </div>
      </div>
    </div>
  );
}
