import { FileCode2, PlusCircle, MinusCircle, GitCommit } from 'lucide-react';
import { MetricCard } from '../../../components/common/MetricCard';

interface CommitMetricsRowProps {
  filesChanged: number;
  additions: number;
  deletions: number;
  totalChanges: number;
}

export function CommitMetricsRow({
  filesChanged,
  additions,
  deletions,
  totalChanges,
}: CommitMetricsRowProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* File Berubah */}
      <MetricCard
        label="File Berubah"
        value={`${filesChanged} File`}
        subValue="Terdampak dalam commit"
        icon={<FileCode2 className="w-4 h-4 text-app-accent-secondary" />}
      />

      {/* Lines Added */}
      <MetricCard
        label="Lines Added"
        value={`+${additions.toLocaleString('id-ID')}`}
        subValue="Baris kode ditambahkan"
        icon={<PlusCircle className="w-4 h-4 text-emerald-500" />}
      />

      {/* Lines Deleted */}
      <MetricCard
        label="Lines Deleted"
        value={`-${deletions.toLocaleString('id-ID')}`}
        subValue="Baris kode dihapus / direfactor"
        icon={<MinusCircle className="w-4 h-4 text-rose-500" />}
      />

      {/* Total Changes */}
      <MetricCard
        label="Total Lines Changed"
        value={totalChanges.toLocaleString('id-ID')}
        subValue="Total code churn commit"
        icon={<GitCommit className="w-4 h-4 text-app-accent-primary" />}
      />
    </div>
  );
}
