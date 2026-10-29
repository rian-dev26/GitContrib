import { GitCommit, Users, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '../../../components/ui/Card';

interface DashboardStatCardsProps {
  totalCommits: number;
  totalContributors: number;
  yesCount: number;
  noCount: number;
  unclassifiedCount?: number;
}

export function DashboardStatCards({
  totalCommits,
  totalContributors,
  yesCount,
  noCount,
  unclassifiedCount = 0,
}: DashboardStatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1 — Total Commit */}
      <Card className="p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-app-text-secondary mb-3">
          <span className="text-xs font-medium uppercase tracking-wider text-app-text-secondary">
            Total Commit
          </span>
          <div className="w-8 h-8 rounded-md bg-app-accent-primary/10 border border-app-accent-primary/20 flex items-center justify-center text-app-accent-primary">
            <GitCommit className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl md:text-3xl font-semibold text-app-text-primary tracking-tight font-sans">
            {totalCommits.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-app-text-secondary mt-1.5 leading-relaxed">
            Commit masuk dalam analisis histori Git
          </p>
        </div>
      </Card>

      {/* Card 2 — Total Contributor */}
      <Card className="p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-app-text-secondary mb-3">
          <span className="text-xs font-medium uppercase tracking-wider text-app-text-secondary">
            Total Contributor
          </span>
          <div className="w-8 h-8 rounded-md bg-app-accent-secondary/15 border border-app-accent-secondary/30 flex items-center justify-center text-app-accent-secondary">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl md:text-3xl font-semibold text-app-text-primary tracking-tight font-sans">
            {totalContributors}
          </div>
          <p className="text-xs text-app-text-secondary mt-1.5 leading-relaxed">
            Mahasiswa kontributor teridentifikasi
          </p>
        </div>
      </Card>

      {/* Card 3 — Prediksi YES */}
      <Card className="p-5 flex flex-col justify-between border-app-accent-positive/30">
        <div className="flex items-center justify-between text-app-text-secondary mb-3">
          <span className="text-xs font-medium uppercase tracking-wider text-app-text-secondary">
            Prediksi YES
          </span>
          <div className="w-8 h-8 rounded-md bg-app-accent-positive/15 border border-app-accent-positive/30 flex items-center justify-center text-app-accent-positive">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl md:text-3xl font-semibold text-app-accent-positive tracking-tight font-sans">
            {yesCount.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-app-text-secondary mt-1.5 leading-relaxed">
            Commit terklasifikasi pola kontribusi YES
          </p>
        </div>
      </Card>

      {/* Card 4 — Prediksi NO */}
      <Card className="p-5 flex flex-col justify-between border-app-accent-negative/30">
        <div className="flex items-center justify-between text-app-text-secondary mb-3">
          <span className="text-xs font-medium uppercase tracking-wider text-app-text-secondary">
            Prediksi NO
          </span>
          <div className="w-8 h-8 rounded-md bg-app-accent-negative/15 border border-app-accent-negative/30 flex items-center justify-center text-app-accent-negative">
            <XCircle className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl md:text-3xl font-semibold text-app-accent-negative tracking-tight font-sans">
            {noCount.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-app-text-secondary mt-1.5 leading-relaxed">
            {unclassifiedCount > 0
              ? `NO (${noCount}), Belum terklasifikasi: ${unclassifiedCount}`
              : 'Commit terklasifikasi pola kontribusi NO'}
          </p>
        </div>
      </Card>
    </div>
  );
}
