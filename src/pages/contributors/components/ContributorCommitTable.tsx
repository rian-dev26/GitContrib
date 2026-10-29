import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  X,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
  RotateCcw,
  CheckCircle2,
  XCircle,
  FolderGit2,
  Inbox,
} from 'lucide-react';
import { Commit } from '../../../types';
import { cn } from '../../../utils/cn';
import { StatusBadge } from '../../../components/common/StatusBadge';

// ─── Types ───────────────────────────────────────────────────────────────────

type SortKey =
  | 'timestamp'
  | 'shortSha'
  | 'message'
  | 'filesChanged'
  | 'additions'
  | 'deletions'
  | 'totalChanges'
  | 'prediction';

type SortDir = 'asc' | 'desc' | null;

export interface ContributorCommitFilter {
  search: string;
  datePreset: 'all' | '7d' | '30d' | 'custom';
  dateFrom: string;
  dateTo: string;
}

interface ContributorCommitTableProps {
  commits: Commit[];
  repositoryId: string;
  repositoryName?: string;
  onFilterStateChange?: (filtered: Commit[], isFiltered: boolean) => void;
}

export function ContributorCommitTable({
  commits,
  repositoryId,
  repositoryName = 'smart-inventory-pbl',
  onFilterStateChange,
}: ContributorCommitTableProps) {
  // ─── State ─────────────────────────────────────────────────────────────────
  const [filter, setFilter] = useState<ContributorCommitFilter>({
    search: '',
    datePreset: 'all',
    dateFrom: '',
    dateTo: '',
  });

  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: 'timestamp',
    dir: 'desc',
  });

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // ─── Reference Date ────────────────────────────────────────────────────────
  // Menggunakan tanggal commit terbaru di repositori sebagai anchor untuk preset filter
  const refDate = useMemo(() => {
    if (commits.length === 0) return new Date();
    const timestamps = commits.map((c) => new Date(c.timestamp).getTime());
    return new Date(Math.max(...timestamps));
  }, [commits]);

  // ─── Filter Logic ──────────────────────────────────────────────────────────
  const filteredCommits = useMemo(() => {
    return commits.filter((commit) => {
      // 1. Search Query
      if (filter.search.trim()) {
        const q = filter.search.toLowerCase().trim();
        const matchSha = commit.shortSha.toLowerCase().includes(q) || commit.id.toLowerCase().includes(q);
        const matchMsg = commit.message.toLowerCase().includes(q);
        if (!matchSha && !matchMsg) return false;
      }

      // 2. Date Filter
      const commitTime = new Date(commit.timestamp).getTime();

      if (filter.datePreset === '7d') {
        const threshold = refDate.getTime() - 7 * 24 * 60 * 60 * 1000;
        if (commitTime < threshold) return false;
      } else if (filter.datePreset === '30d') {
        const threshold = refDate.getTime() - 30 * 24 * 60 * 60 * 1000;
        if (commitTime < threshold) return false;
      } else if (filter.datePreset === 'custom') {
        if (filter.dateFrom) {
          const fromTime = new Date(filter.dateFrom).getTime();
          if (commitTime < fromTime) return false;
        }
        if (filter.dateTo) {
          const toTime = new Date(filter.dateTo).setHours(23, 59, 59, 999);
          if (commitTime > toTime) return false;
        }
      }

      return true;
    });
  }, [commits, filter, refDate]);

  // Is active filter indicator
  const isFiltered =
    Boolean(filter.search) ||
    filter.datePreset !== 'all' ||
    Boolean(filter.dateFrom || filter.dateTo);

  // Inform parent component for synchronized charts & stat cards
  useEffect(() => {
    if (onFilterStateChange) {
      onFilterStateChange(filteredCommits, isFiltered);
    }
  }, [filteredCommits, isFiltered, onFilterStateChange]);

  // ─── Sorting Logic ─────────────────────────────────────────────────────────
  const sortedCommits = useMemo(() => {
    if (!sort.key || !sort.dir) return filteredCommits;

    return [...filteredCommits].sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sort.key) {
        case 'timestamp':
          valA = new Date(a.timestamp).getTime();
          valB = new Date(b.timestamp).getTime();
          break;
        case 'shortSha':
          valA = a.shortSha;
          valB = b.shortSha;
          break;
        case 'message':
          valA = a.message.toLowerCase();
          valB = b.message.toLowerCase();
          break;
        case 'filesChanged':
          valA = a.stats.filesChanged;
          valB = b.stats.filesChanged;
          break;
        case 'additions':
          valA = a.stats.additions;
          valB = b.stats.additions;
          break;
        case 'deletions':
          valA = a.stats.deletions;
          valB = b.stats.deletions;
          break;
        case 'totalChanges':
          valA = a.stats.totalChanges;
          valB = b.stats.totalChanges;
          break;
        case 'prediction':
          valA = a.classification?.label || '';
          valB = b.classification?.label || '';
          break;
      }

      if (valA < valB) return sort.dir === 'asc' ? -1 : 1;
      if (valA > valB) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredCommits, sort]);

  // ─── Pagination Logic ──────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sortedCommits.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCommits = sortedCommits.slice(startIndex, startIndex + pageSize);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleSort = useCallback((key: SortKey) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return { key: null as unknown as SortKey, dir: null };
    });
    setPage(1);
  }, []);

  const handleFilterChange = useCallback(<K extends keyof ContributorCommitFilter>(key: K, value: ContributorCommitFilter[K]) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const handleReset = useCallback(() => {
    setFilter({ search: '', datePreset: 'all', dateFrom: '', dateTo: '' });
    setSort({ key: 'timestamp', dir: 'desc' });
    setPage(1);
  }, []);

  // ─── Column header helper ──────────────────────────────────────────────────
  const Th = ({
    label,
    sortKey,
    align = 'left',
  }: {
    label: string;
    sortKey: SortKey;
    align?: 'left' | 'right' | 'center';
  }) => (
    <th
      className={cn(
        'py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-app-text-secondary cursor-pointer select-none whitespace-nowrap hover:text-app-text-primary transition-colors',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center'
      )}
      onClick={() => handleSort(sortKey)}
    >
      <div className={cn('inline-flex items-center gap-1', align === 'right' && 'justify-end')}>
        <span>{label}</span>
        <SortIcon activeKey={sort.key} currentKey={sortKey} dir={sort.dir} />
      </div>
    </th>
  );

  // Filtered counts
  const yesCount = filteredCommits.filter((c) => c.classification?.label === 'YES').length;
  const noCount = filteredCommits.filter((c) => c.classification?.label === 'NO').length;

  return (
    <div className="bg-app-card border border-app-border rounded-xl shadow-sm overflow-hidden">
      {/* ─── Control Bar ──────────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 border-b border-app-border space-y-4">
        {/* Top bar: Title + Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-app-text-primary">
              Seluruh Commit Kontributor
            </h2>
            <p className="text-xs text-app-text-secondary mt-0.5">
              Daftar histori commit dengan rincian per baris kode dan hasil klasifikasi YES/NO
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-app-text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filter.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Cari pesan commit atau hash..."
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-app-border bg-app-secondary/40 text-app-text-primary placeholder:text-app-text-secondary/70 focus:outline-none focus:ring-1 focus:ring-app-accent-primary"
            />
            {filter.search && (
              <button
                type="button"
                onClick={() => handleFilterChange('search', '')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-app-text-secondary hover:text-app-text-primary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Date Filters + Preset Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-app-text-secondary inline-flex items-center gap-1.5 mr-1">
              <Calendar className="w-3.5 h-3.5 text-app-accent-primary" />
              Rentang Waktu:
            </span>

            {/* Presets */}
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
                  onClick={() => handleFilterChange('datePreset', preset.key)}
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

            {/* Custom Inputs */}
            {filter.datePreset === 'custom' && (
              <div className="flex items-center gap-1.5 text-xs animate-fadeIn">
                <input
                  type="date"
                  value={filter.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="px-2 py-1 text-xs rounded-md border border-app-border bg-app-secondary/40 text-app-text-primary focus:outline-none focus:ring-1 focus:ring-app-accent-primary"
                />
                <span className="text-app-text-secondary">s/d</span>
                <input
                  type="date"
                  value={filter.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="px-2 py-1 text-xs rounded-md border border-app-border bg-app-secondary/40 text-app-text-primary focus:outline-none focus:ring-1 focus:ring-app-accent-primary"
                />
              </div>
            )}
          </div>

          {/* Reset Filter Button */}
          {isFiltered && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 font-medium px-2 py-1 rounded hover:bg-rose-500/10 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filter
            </button>
          )}
        </div>

        {/* Counter Info Bar */}
        <div className="flex flex-wrap items-center justify-between text-xs text-app-text-secondary pt-1 border-t border-app-border/40">
          <div>
            Menampilkan <strong className="text-app-text-primary font-semibold">{filteredCommits.length}</strong> dari{' '}
            <strong className="text-app-text-primary font-semibold">{commits.length}</strong> commit kontributor
            {filteredCommits.length > 0 && (
              <>
                <span className="mx-2">•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {yesCount} YES
                </span>
                <span className="mx-2">•</span>
                <span className="text-rose-600 dark:text-rose-400 font-medium inline-flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  {noCount} NO
                </span>
              </>
            )}
          </div>

          <div className="text-[11px] text-app-text-secondary">
            Klik header tabel untuk mengurutkan data (Asc/Desc)
          </div>
        </div>
      </div>

      {/* ─── Spreadsheet Table Container ──────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[850px]">
          <thead>
            <tr className="bg-app-secondary/50 border-b border-app-border">
              <Th label="Hash" sortKey="shortSha" />
              <Th label="Pesan Commit" sortKey="message" />
              <Th label="Tanggal & Waktu" sortKey="timestamp" />
              <Th label="File Berubah" sortKey="filesChanged" align="right" />
              <Th label="Lines+" sortKey="additions" align="right" />
              <Th label="Lines-" sortKey="deletions" align="right" />
              <Th label="Total Δ" sortKey="totalChanges" align="right" />
              <Th label="Prediksi" sortKey="prediction" align="center" />
              <th className="py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-app-text-secondary text-right">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border/70 font-sans">
            {paginatedCommits.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-14 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-app-secondary border border-app-border flex items-center justify-center text-app-text-secondary">
                      <Inbox className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-app-text-primary">
                      {commits.length === 0
                        ? 'Kontributor ini belum memiliki riwayat commit.'
                        : 'Tidak ada commit yang cocok dengan filter saat ini.'}
                    </p>
                    {isFiltered && (
                      <button
                        type="button"
                        onClick={handleReset}
                        className="text-xs text-app-accent-primary hover:underline mt-1 font-medium"
                      >
                        Kembalikan ke semua waktu dan reset filter
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedCommits.map((c, idx) => {
                const dateObj = new Date(c.timestamp);
                const dateFormatted = dateObj.toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                const timeFormatted = dateObj.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const isYes = c.classification?.label === 'YES';

                return (
                  <tr
                    key={c.id}
                    className={cn(
                      'hover:bg-app-accent-primary/[0.04] transition-colors',
                      idx % 2 === 1 ? 'bg-app-secondary/20' : 'bg-transparent'
                    )}
                  >
                    {/* Hash Monospace */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <Link
                        to={`/commits/${c.id}`}
                        className="font-mono text-[11px] font-semibold text-app-accent-primary bg-app-accent-primary/10 hover:bg-app-accent-primary/20 px-2 py-1 rounded border border-app-accent-primary/20 transition-colors inline-block"
                        title={c.id}
                      >
                        {c.shortSha}
                      </Link>
                    </td>

                    {/* Commit Message */}
                    <td className="py-2.5 px-3 max-w-[320px]">
                      <div className="truncate font-medium text-app-text-primary text-xs" title={c.message}>
                        {c.message}
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-app-text-secondary text-[11px]">
                      <span>{dateFormatted}</span>
                      <span className="text-app-text-secondary/60 ml-1.5">{timeFormatted}</span>
                    </td>

                    {/* Files Changed */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-right font-mono text-xs text-app-text-secondary">
                      {c.stats.filesChanged}
                    </td>

                    {/* Additions */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-right font-mono text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      +{c.stats.additions}
                    </td>

                    {/* Deletions */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-right font-mono text-xs text-rose-600 dark:text-rose-400 font-medium">
                      -{c.stats.deletions}
                    </td>

                    {/* Total Lines */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-right font-mono text-xs text-app-text-primary font-semibold">
                      {c.stats.totalChanges}
                    </td>

                    {/* Prediksi YES/NO */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-center">
                      <StatusBadge status={c.classification?.label || (isYes ? 'YES' : 'NO')} />
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-right">
                      <Link
                        to={`/commits/${c.id}`}
                        className="text-[11px] font-medium text-app-accent-primary hover:underline hover:text-app-accent-primary/80"
                      >
                        Inspeksi
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Pagination Footer ────────────────────────────────────────────────── */}
      <div className="p-4 border-t border-app-border bg-app-secondary/30 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Page Size Selector */}
        <div className="flex items-center gap-2 text-app-text-secondary">
          <span>Baris per halaman:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="px-2 py-1 rounded border border-app-border bg-app-card text-app-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-app-accent-primary cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        {/* Page Nav Buttons */}
        <div className="flex items-center gap-1.5">
          <span className="text-app-text-secondary mr-2">
            Halaman <strong className="text-app-text-primary">{currentPage}</strong> dari{' '}
            <strong className="text-app-text-primary">{totalPages}</strong>
          </span>

          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage(1)}
            className="p-1 rounded border border-app-border bg-app-card text-app-text-secondary hover:text-app-text-primary disabled:opacity-40 disabled:cursor-not-allowed"
            title="Halaman Pertama"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-1 rounded border border-app-border bg-app-card text-app-text-secondary hover:text-app-text-primary disabled:opacity-40 disabled:cursor-not-allowed"
            title="Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setPage(num)}
              className={cn(
                'w-7 h-7 rounded text-xs font-medium border transition-colors',
                currentPage === num
                  ? 'bg-app-accent-primary border-app-accent-primary text-white font-bold'
                  : 'bg-app-card border-app-border text-app-text-secondary hover:text-app-text-primary hover:bg-app-secondary'
              )}
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="p-1 rounded border border-app-border bg-app-card text-app-text-secondary hover:text-app-text-primary disabled:opacity-40 disabled:cursor-not-allowed"
            title="Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage(totalPages)}
            className="p-1 rounded border border-app-border bg-app-card text-app-text-secondary hover:text-app-text-primary disabled:opacity-40 disabled:cursor-not-allowed"
            title="Halaman Terakhir"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>

        {/* Back to Repository Button */}
        <Link
          to={`/repositories/${repositoryId}`}
          className="inline-flex items-center gap-1.5 text-xs text-app-accent-primary hover:underline font-medium"
        >
          <FolderGit2 className="w-3.5 h-3.5" />
          Kembali ke Hasil Analisis Repository ({repositoryName})
        </Link>
      </div>
    </div>
  );
}

// ─── Sort Icon Helper ────────────────────────────────────────────────────────
function SortIcon({
  activeKey,
  currentKey,
  dir,
}: {
  activeKey: SortKey | null;
  currentKey: SortKey;
  dir: SortDir;
}) {
  if (activeKey !== currentKey) {
    return <ChevronsUpDown className="w-3 h-3 text-app-text-secondary/40 shrink-0" />;
  }
  if (dir === 'asc') {
    return <ChevronUp className="w-3 h-3 text-app-accent-primary shrink-0" />;
  }
  return <ChevronDown className="w-3 h-3 text-app-accent-primary shrink-0" />;
}
