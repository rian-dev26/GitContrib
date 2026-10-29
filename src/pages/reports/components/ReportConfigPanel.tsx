import {
  FolderGit2,
  Calendar,
  RotateCcw,
  FileDown,
  Download,
  FileSpreadsheet,
  Printer,
  Sparkles,
} from 'lucide-react';
import { Repository } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';

export interface ReportFilterState {
  repositoryId: string;
  datePreset: 'all' | '7d' | '30d' | 'custom';
  dateFrom: string;
  dateTo: string;
}

interface ReportConfigPanelProps {
  repositories: Repository[];
  filter: ReportFilterState;
  onFilterChange: (newFilter: Partial<ReportFilterState>) => void;
  onResetFilter: () => void;
  onExportPDF: () => void;
  onExportCSV: () => void;
  isExportingPDF: boolean;
  isExportingCSV: boolean;
  totalCommitsCount: number;
}

export function ReportConfigPanel({
  repositories,
  filter,
  onFilterChange,
  onResetFilter,
  onExportPDF,
  onExportCSV,
  isExportingPDF,
  isExportingCSV,
  totalCommitsCount,
}: ReportConfigPanelProps) {
  const isFiltered =
    filter.datePreset !== 'all' || Boolean(filter.dateFrom || filter.dateTo);

  return (
    <div className="bg-app-card border border-app-border rounded-xl p-5 shadow-sm space-y-4">
      {/* ─── Top Line: Repository Selector & Export Actions ─────────────────── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Repository Dropdown */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label className="text-xs font-semibold text-app-text-primary whitespace-nowrap flex items-center gap-1.5">
            <FolderGit2 className="w-4 h-4 text-app-accent-primary" />
            Pilih Repository:
          </label>
          <select
            value={filter.repositoryId}
            onChange={(e) => onFilterChange({ repositoryId: e.target.value })}
            className="w-full sm:w-72 px-3 py-2 text-xs rounded-lg border border-app-border bg-app-secondary/50 text-app-text-primary font-medium focus:outline-none focus:ring-1 focus:ring-app-accent-primary cursor-pointer"
          >
            {repositories.map((repo) => (
              <option key={repo.id} value={repo.id}>
                {repo.fullName} ({repo.defaultBranch})
              </option>
            ))}
          </select>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onExportPDF}
            disabled={isExportingPDF || totalCommitsCount === 0}
            leftIcon={<Printer className="w-3.5 h-3.5 text-rose-500" />}
            className="text-xs font-medium"
          >
            {isExportingPDF ? 'Menyiapkan PDF...' : 'Cetak / Simpan PDF'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onExportCSV}
            disabled={isExportingCSV || totalCommitsCount === 0}
            leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
            className="text-xs font-medium"
          >
            {isExportingCSV ? 'Mengunduh CSV...' : 'Ekspor Data CSV'}
          </Button>
        </div>
      </div>

      {/* ─── Bottom Line: Period Filters & Reset ────────────────────────────── */}
      <div className="pt-3 border-t border-app-border/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-app-text-secondary inline-flex items-center gap-1.5 mr-1">
            <Calendar className="w-3.5 h-3.5 text-app-accent-secondary" />
            Periode Analisis:
          </span>

          {/* Preset Buttons */}
          <div className="inline-flex rounded-lg border border-app-border bg-app-secondary/40 p-0.5">
            {(
              [
                { key: 'all', label: 'Semua Waktu' },
                { key: '7d', label: '7 Hari Terakhir' },
                { key: '30d', label: '30 Hari Terakhir' },
                { key: 'custom', label: 'Rentang Kustom' },
              ] as const
            ).map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => onFilterChange({ datePreset: preset.key })}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-md transition-all',
                  filter.datePreset === preset.key
                    ? 'bg-app-card text-app-text-primary shadow-sm font-semibold'
                    : 'text-app-text-secondary hover:text-app-text-primary'
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs */}
          {filter.datePreset === 'custom' && (
            <div className="flex items-center gap-1.5 text-xs animate-fadeIn">
              <input
                type="date"
                value={filter.dateFrom}
                onChange={(e) => onFilterChange({ dateFrom: e.target.value })}
                className="px-2 py-1 text-xs rounded-md border border-app-border bg-app-secondary/40 text-app-text-primary focus:outline-none focus:ring-1 focus:ring-app-accent-primary"
              />
              <span className="text-app-text-secondary">s/d</span>
              <input
                type="date"
                value={filter.dateTo}
                onChange={(e) => onFilterChange({ dateTo: e.target.value })}
                className="px-2 py-1 text-xs rounded-md border border-app-border bg-app-secondary/40 text-app-text-primary focus:outline-none focus:ring-1 focus:ring-app-accent-primary"
              />
            </div>
          )}
        </div>

        {/* Reset Filter Button */}
        {isFiltered && (
          <button
            type="button"
            onClick={onResetFilter}
            className="inline-flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 font-medium px-2 py-1 rounded hover:bg-rose-500/10 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Kembalikan ke Semua Waktu
          </button>
        )}
      </div>
    </div>
  );
}
