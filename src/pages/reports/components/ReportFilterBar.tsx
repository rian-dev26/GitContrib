import {
  FolderGit2,
  Calendar,
  RotateCcw,
  FileSpreadsheet,
  Printer,
  ChevronDown,
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

interface ReportFilterBarProps {
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

export function ReportFilterBar({
  repositories,
  filter,
  onFilterChange,
  onResetFilter,
  onExportPDF,
  onExportCSV,
  isExportingPDF,
  isExportingCSV,
  totalCommitsCount,
}: ReportFilterBarProps) {
  const isFiltered =
    filter.datePreset !== 'all' || Boolean(filter.dateFrom || filter.dateTo);

  return (
    <div className="bg-app-card border border-app-border rounded-xl p-4 shadow-sm space-y-3 print:hidden">
      {/* Baris 1: Pilihan Repository & Tombol Ekspor */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Dropdown Repository */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          <label className="text-xs font-semibold text-app-text-secondary whitespace-nowrap flex items-center gap-1.5">
            <FolderGit2 className="w-4 h-4 text-app-accent-primary" />
            Repository:
          </label>
          <div className="relative">
            <select
              value={filter.repositoryId}
              onChange={(e) => onFilterChange({ repositoryId: e.target.value })}
              className="appearance-none w-full sm:w-80 pl-3 pr-8 py-2 text-xs font-medium rounded-lg border border-app-border bg-app-secondary/60 text-app-text-primary focus:outline-none focus:ring-1 focus:ring-app-accent-primary cursor-pointer transition-colors"
            >
              {repositories.map((repo) => (
                <option key={repo.id} value={repo.id}>
                  {repo.fullName} ({repo.defaultBranch})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-app-text-secondary absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Tombol Ekspor CSV & PDF */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExportPDF}
            disabled={isExportingPDF || totalCommitsCount === 0}
            leftIcon={<Printer className="w-3.5 h-3.5 text-rose-500" />}
            className="text-xs font-medium h-9"
            title="Cetak atau simpan tabel sebagai file PDF"
          >
            {isExportingPDF ? 'Menyiapkan PDF...' : 'Ekspor PDF'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onExportCSV}
            disabled={isExportingCSV || totalCommitsCount === 0}
            leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
            className="text-xs font-medium h-9 bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
            title="Unduh seluruh data commit dalam format CSV"
          >
            {isExportingCSV ? 'Mengunduh CSV...' : 'Ekspor CSV'}
          </Button>
        </div>
      </div>

      {/* Baris 2: Filter Periode & Reset */}
      <div className="pt-3 border-t border-app-border/60 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-app-text-secondary inline-flex items-center gap-1.5 mr-1">
            <Calendar className="w-3.5 h-3.5 text-app-accent-secondary" />
            Periode:
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: 'Semua Waktu' },
                { id: '7d', label: '7 Hari Terakhir' },
                { id: '30d', label: '30 Hari Terakhir' },
                { id: 'custom', label: 'Rentang Kustom' },
              ] as const
            ).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onFilterChange({ datePreset: preset.id })}
                className={cn(
                  'px-2.5 py-1 text-xs rounded-md border font-medium transition-colors',
                  filter.datePreset === preset.id
                    ? 'bg-app-accent-primary/15 border-app-accent-primary text-app-accent-primary'
                    : 'bg-app-secondary/40 border-app-border text-app-text-secondary hover:text-app-text-primary hover:border-app-border/80'
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {filter.datePreset === 'custom' && (
            <div className="flex items-center gap-1.5 pl-2 ml-1 border-l border-app-border">
              <input
                type="date"
                value={filter.dateFrom}
                onChange={(e) => onFilterChange({ dateFrom: e.target.value })}
                className="px-2 py-1 text-xs rounded border border-app-border bg-app-card text-app-text-primary focus:outline-none focus:ring-1 focus:ring-app-accent-primary"
              />
              <span className="text-xs text-app-text-secondary">s/d</span>
              <input
                type="date"
                value={filter.dateTo}
                onChange={(e) => onFilterChange({ dateTo: e.target.value })}
                className="px-2 py-1 text-xs rounded border border-app-border bg-app-card text-app-text-primary focus:outline-none focus:ring-1 focus:ring-app-accent-primary"
              />
            </div>
          )}
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={onResetFilter}
            className="inline-flex items-center gap-1 text-xs text-app-accent-primary hover:underline font-medium"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Periode
          </button>
        )}
      </div>
    </div>
  );
}
