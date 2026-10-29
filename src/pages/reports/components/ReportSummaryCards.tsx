import { GitCommit, Users, CheckCircle2, XCircle, Calendar, Code2 } from 'lucide-react';
import { MetricCard } from '../../../components/common/MetricCard';

interface ReportSummaryCardsProps {
  totalCommits: number;
  totalContributors: number;
  yesCount: number;
  noCount: number;
  timeframeLabel: string;
  totalChanges: number;
  isFiltered: boolean;
  totalRepoCommits: number;
}

export function ReportSummaryCards({
  totalCommits,
  totalContributors,
  yesCount,
  noCount,
  timeframeLabel,
  totalChanges,
  isFiltered,
  totalRepoCommits,
}: ReportSummaryCardsProps) {
  const yesPercent = totalCommits > 0 ? Math.round((yesCount / totalCommits) * 100) : 0;
  const noPercent = totalCommits > 0 ? Math.round((noCount / totalCommits) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Commits */}
      <MetricCard
        label={isFiltered ? 'Commit Terfilter' : 'Total Commit'}
        value={totalCommits}
        subValue={
          isFiltered
            ? `dari ${totalRepoCommits} commit repositori`
            : 'Histori Git teranalisis'
        }
        icon={<GitCommit className="w-4 h-4 text-app-accent-primary" />}
      />

      {/* Contributors */}
      <MetricCard
        label="Mahasiswa Terlibat"
        value={`${totalContributors} Orang`}
        subValue="Kontributor aktif dalam tim"
        icon={<Users className="w-4 h-4 text-app-accent-secondary" />}
      />

      {/* YES / NO Prediction Summary */}
      <div className="bg-app-card border border-app-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-app-text-secondary uppercase tracking-wider">
            Prediksi Model
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-app-secondary border border-app-border text-app-text-secondary">
            YES/NO
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-app-border/60">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-base leading-none block">
              {yesCount}
            </span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium mt-0.5 block">
              YES ({yesPercent}%)
            </span>
          </div>

          <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-center">
            <span className="text-rose-600 dark:text-rose-400 font-bold text-base leading-none block">
              {noCount}
            </span>
            <span className="text-[10px] text-rose-700 dark:text-rose-300 font-medium mt-0.5 block">
              NO ({noPercent}%)
            </span>
          </div>
        </div>

        <p className="text-[10px] text-app-text-secondary mt-1.5 text-center">
          Total churn: {totalChanges.toLocaleString('id-ID')} baris
        </p>
      </div>

      {/* Periode Analisis */}
      <MetricCard
        label="Rentang Waktu Laporan"
        value={timeframeLabel}
        subValue={isFiltered ? 'Sesuai filter tanggal aktif' : 'Seluruh siklus pengerjaan'}
        icon={<Calendar className="w-4 h-4 text-app-accent-primary" />}
      />
    </div>
  );
}
