import { History, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { MetricCard } from '../../../components/common/MetricCard';
import { AnalysisHistoryItem } from '../../../types';

interface HistoryStatsSummaryProps {
  history: AnalysisHistoryItem[];
}

export function HistoryStatsSummary({ history }: HistoryStatsSummaryProps) {
  const total = history.length;
  const completed = history.filter((h) => h.status === 'COMPLETED').length;
  const inProgress = history.filter((h) => h.status === 'IN_PROGRESS').length;
  const failed = history.filter((h) => h.status === 'FAILED').length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Sesi */}
      <MetricCard
        label="Total Sesi Analisis"
        value={total}
        subValue="Riwayat tercatat di sistem"
        icon={<History className="w-4 h-4 text-app-accent-primary" />}
      />

      {/* Selesai */}
      <MetricCard
        label="Analisis Selesai"
        value={completed}
        subValue="Hasil klasifikasi siap ditinjau"
        icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
      />

      {/* Dalam Proses */}
      <MetricCard
        label="Sedang Diproses"
        value={inProgress}
        subValue="Ekstraksi Git / klasifikasi aktif"
        icon={<Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
      />

      {/* Gagal */}
      <MetricCard
        label="Gagal / Perlu Review"
        value={failed}
        subValue="Repositori privat / 404 / timeout"
        icon={<AlertTriangle className="w-4 h-4 text-rose-500" />}
      />
    </div>
  );
}
