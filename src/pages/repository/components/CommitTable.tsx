import { useState, useMemo, useCallback } from 'react';
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
  Filter,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Commit } from '../../../types';
import { cn } from '../../../utils/cn';

// ─── Types ───────────────────────────────────────────────────────────────────

type SortKey = 'timestamp' | 'shortSha' | 'message' | 'contributorName' | 'filesChanged' | 'additions' | 'deletions' | 'totalChanges' | 'prediction';
type SortDir = 'asc' | 'desc' | null;
type DatePreset = 'all' | '7d' | '30d' | 'custom';

export interface CommitFilter {
  search: string;
  datePreset: DatePreset;
  dateFrom: string;
  dateTo: string;
}

interface SortState {
  key: SortKey | null;
  dir: SortDir;
}

interface CommitTableProps {
  commits: Commit[];
  repositoryId: string;
}

// ─── Helper functions ─────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getPresetRange(preset: DatePreset): { from: Date | null; to: Date | null } {
  const now = new Date();
  if (preset === '7d') {
    const from = new Date(now);
    from.setDate(from.getDate() - 7);
    return { from, to: now };
  }
  if (preset === '30d') {
    const from = new Date(now);
    from.setDate(from.getDate() - 30);
    return { from, to: now };
  }
  return { from: null, to: null };
}

// ─── Sort icon helper ─────────────────────────────────────────────────────────

function SortIcon({ sortKey, sort }: { sortKey: SortKey; sort: SortState }) {
  if (sort.key !== sortKey) return <ChevronsUpDown className="w-3 h-3 ml-1 opacity-40 shrink-0" />;
  if (sort.dir === 'asc') return <ChevronUp className="w-3 h-3 ml-1 text-app-accent-primary shrink-0" />;
  return <ChevronDown className="w-3 h-3 ml-1 text-app-accent-primary shrink-0" />;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// ─── Main Component ───────────────────────────────────────────────────────────

export function CommitTable({ commits, repositoryId }: CommitTableProps) {
  void repositoryId;

  const [filter, setFilter] = useState<CommitFilter>({
    search: '',
    datePreset: 'all',
    dateFrom: '',
    dateTo: '',
  });
  const [sort, setSort] = useState<SortState>({ key: 'timestamp', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ─── Apply search + date filter ──────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = commits;

    // Search
    if (filter.search.trim()) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.message.toLowerCase().includes(q) ||
          c.shortSha.toLowerCase().includes(q) ||
          c.contributorName.toLowerCase().includes(q)
      );
    }

    // Date filter
    let fromDate: Date | null = null;
    let toDate: Date | null = null;

    if (filter.datePreset !== 'all' && filter.datePreset !== 'custom') {
      const range = getPresetRange(filter.datePreset);
      fromDate = range.from;
      toDate = range.to;
    } else if (filter.datePreset === 'custom') {
      if (filter.dateFrom) fromDate = new Date(filter.dateFrom);
      if (filter.dateTo) {
        toDate = new Date(filter.dateTo);
        toDate.setHours(23, 59, 59, 999);
      }
    }

    if (fromDate || toDate) {
      result = result.filter((c) => {
        const ts = new Date(c.timestamp);
        if (fromDate && ts < fromDate) return false;
        if (toDate && ts > toDate) return false;
        return true;
      });
    }

    return result;
  }, [commits, filter]);

  // ─── Sort ─────────────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    if (!sort.key || !sort.dir) return filtered;
    return [...filtered].sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      switch (sort.key) {
        case 'timestamp': av = a.timestamp; bv = b.timestamp; break;
        case 'shortSha': av = a.shortSha; bv = b.shortSha; break;
        case 'message': av = a.message; bv = b.message; break;
        case 'contributorName': av = a.contributorName; bv = b.contributorName; break;
        case 'filesChanged': av = a.stats.filesChanged; bv = b.stats.filesChanged; break;
        case 'additions': av = a.stats.additions; bv = b.stats.additions; break;
        case 'deletions': av = a.stats.deletions; bv = b.stats.deletions; break;
        case 'totalChanges': av = a.stats.totalChanges; bv = b.stats.totalChanges; break;
        case 'prediction':
          av = a.classification?.label ?? '';
          bv = b.classification?.label ?? '';
          break;
      }
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sort]);

  // ─── Pagination ───────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  // ─── Stats for current filter ─────────────────────────────────────────────
  const yesCount = filtered.filter((c) => c.classification?.label === 'YES').length;
  const noCount = filtered.filter((c) => c.classification?.label === 'NO').length;

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleSort = useCallback((key: SortKey) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: 'desc' };
      if (prev.dir === 'desc') return { key, dir: 'asc' };
      return { key: null, dir: null };
    });
    setPage(1);
  }, []);

  const handleFilterChange = useCallback(<K extends keyof CommitFilter>(key: K, value: CommitFilter[K]) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const handleReset = useCallback(() => {
    setFilter({ search: '', datePreset: 'all', dateFrom: '', dateTo: '' });
    setSort({ key: 'timestamp', dir: 'desc' });
    setPage(1);
  }, []);

  const isFiltered =
    Boolean(filter.search) ||
    filter.datePreset !== 'all' ||
    Boolean(filter.dateFrom || filter.dateTo);

  // ─── Column header helper ──────────────────────────────────────────────────
  const Th = ({
    label,
    sortKey,
    align = 'left',
    minW,
  }: {
    label: string;
    sortKey: SortKey;
    align?: 'left' | 'right' | 'center';
    minW?: string;
  }) => (
    <th
      className={cn(
        'py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-app-text-secondary cursor-pointer select-none whitespace-nowrap hover:text-app-text-primary transition-colors',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        minW && `min-w-[${minW}]`
      )}
      onClick={() => handleSort(sortKey)}
    >
      <span className={cn('inline-flex items-center gap-0.5', align === 'right' && 'justify-end', align === 'center' && 'justify-center')}>
        {label}
        <SortIcon sortKey={sortKey} sort={sort} />
      </span>
    </th>
  );

  return (
    <div className="space-y-4">
      {/* ─── Filter Bar ─────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {/* Row 1: Search + Reset */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-app-text-secondary pointer-events-none" />
            <input
              type="text"
              placeholder="Cari pesan commit, hash, atau kontributor..."
              value={filter.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-8 pr-8 py-2 text-xs bg-app-card border border-app-border rounded-md text-app-text-primary placeholder-app-text-secondary focus:outline-none focus:ring-1 focus:ring-app-accent-primary focus:border-app-accent-primary"
            />
            {filter.search && (
              <button onClick={() => handleFilterChange('search', '')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-app-text-secondary hover:text-app-text-primary">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {isFiltered && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-2.5 py-2 text-xs rounded-md border border-app-border bg-app-secondary text-app-text-secondary hover:text-app-text-primary hover:border-app-accent-primary transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filter
            </button>
          )}
        </div>

        {/* Row 2: Date Presets + Custom Range */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-app-text-secondary" />
            <span className="text-xs text-app-text-secondary font-medium">Rentang Waktu:</span>
          </div>

          {(['all', '7d', '30d', 'custom'] as DatePreset[]).map((preset) => (
            <button
              key={preset}
              onClick={() => handleFilterChange('datePreset', preset)}
              className={cn(
                'px-2.5 py-1 text-[11px] rounded-md border transition-colors',
                filter.datePreset === preset
                  ? 'bg-app-accent-primary/15 border-app-accent-primary text-app-accent-primary font-semibold'
                  : 'bg-app-card border-app-border text-app-text-secondary hover:border-app-accent-primary hover:text-app-text-primary'
              )}
            >
              {preset === 'all' ? 'Semua Waktu' : preset === '7d' ? '7 Hari Terakhir' : preset === '30d' ? '30 Hari Terakhir' : 'Rentang Kustom'}
            </button>
          ))}

          {filter.datePreset === 'custom' && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-app-text-secondary" />
                <input
                  type="date"
                  value={filter.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="text-xs px-2 py-1 bg-app-card border border-app-border rounded text-app-text-primary focus:outline-none focus:ring-1 focus:ring-app-accent-primary"
                />
              </div>
              <span className="text-xs text-app-text-secondary">s/d</span>
              <input
                type="date"
                value={filter.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="text-xs px-2 py-1 bg-app-card border border-app-border rounded text-app-text-primary focus:outline-none focus:ring-1 focus:ring-app-accent-primary"
              />
            </div>
          )}
        </div>

        {/* Row 3: Result Stats */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-app-text-secondary">
          <span>
            Menampilkan <strong className="text-app-text-primary">{filtered.length}</strong> dari {commits.length} commit
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-app-accent-positive" />
            <strong className="text-app-accent-positive">{yesCount} YES</strong>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-app-accent-negative" />
            <strong className="text-app-accent-negative">{noCount} NO</strong>
          </span>
          {isFiltered && (
            <>
              <span>•</span>
              <span className="text-app-accent-primary italic">Filter aktif</span>
            </>
          )}
        </div>
      </div>

      {/* ─── Table ──────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-lg border border-app-border">
        <table className="w-full text-xs min-w-[900px]">
          <thead>
            <tr className="bg-app-secondary/70 border-b border-app-border">
              <Th label="Hash" sortKey="shortSha" minW="80px" />
              <Th label="Pesan Commit" sortKey="message" minW="220px" />
              <Th label="Kontributor" sortKey="contributorName" minW="140px" />
              <Th label="Tanggal & Waktu" sortKey="timestamp" minW="140px" />
              <Th label="File Berubah" sortKey="filesChanged" align="right" minW="80px" />
              <Th label="Lines+" sortKey="additions" align="right" minW="70px" />
              <Th label="Lines−" sortKey="deletions" align="right" minW="70px" />
              <Th label="Total Δ" sortKey="totalChanges" align="right" minW="70px" />
              <Th label="Prediksi" sortKey="prediction" align="center" minW="80px" />
              <th className="py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-app-text-secondary text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-app-text-secondary text-xs">
                  Tidak ada commit yang cocok dengan filter yang diterapkan.
                </td>
              </tr>
            ) : (
              paginated.map((commit, idx) => (
                <tr
                  key={commit.id}
                  className={cn(
                    'hover:bg-app-secondary/30 transition-colors',
                    idx % 2 === 0 ? 'bg-app-card' : 'bg-app-card/60'
                  )}
                >
                  {/* Hash */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="font-mono text-[11px] text-app-accent-primary bg-app-accent-primary/10 px-1.5 py-0.5 rounded border border-app-accent-primary/20">
                      {commit.shortSha}
                    </span>
                  </td>

                  {/* Pesan */}
                  <td className="py-2.5 px-3 max-w-[240px]">
                    <span className="text-app-text-primary truncate block leading-relaxed" title={commit.message}>
                      {commit.message}
                    </span>
                  </td>

                  {/* Kontributor */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="text-app-text-primary">{commit.contributorName.replace(' (Contoh)', '')}</span>
                  </td>

                  {/* Tanggal */}
                  <td className="py-2.5 px-3 whitespace-nowrap text-app-text-secondary font-mono text-[11px]">
                    {formatDate(commit.timestamp)}
                  </td>

                  {/* File Berubah */}
                  <td className="py-2.5 px-3 text-right font-mono text-app-text-primary">
                    {commit.stats.filesChanged}
                  </td>

                  {/* Lines Added */}
                  <td className="py-2.5 px-3 text-right font-mono text-app-accent-positive font-semibold">
                    +{commit.stats.additions}
                  </td>

                  {/* Lines Deleted */}
                  <td className="py-2.5 px-3 text-right font-mono text-app-accent-negative font-semibold">
                    -{commit.stats.deletions}
                  </td>

                  {/* Total Changes */}
                  <td className="py-2.5 px-3 text-right font-mono text-app-text-primary">
                    {commit.stats.totalChanges}
                  </td>

                  {/* Prediction Badge */}
                  <td className="py-2.5 px-3 text-center">
                    {commit.classification ? (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold',
                          commit.classification.label === 'YES'
                            ? 'bg-app-accent-positive/15 text-app-accent-positive border-app-accent-positive/30'
                            : 'bg-app-accent-negative/15 text-app-accent-negative border-app-accent-negative/30'
                        )}
                      >
                        {commit.classification.label === 'YES'
                          ? <CheckCircle2 className="w-3 h-3" />
                          : <XCircle className="w-3 h-3" />}
                        {commit.classification.label}
                      </span>
                    ) : (
                      <span className="text-app-text-secondary italic text-[10px]">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <Link
                      to={`/commits/${commit.id}`}
                      className="text-[11px] text-app-accent-primary hover:underline font-medium"
                    >
                      Inspeksi
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Pagination Controls ─────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Rows per page */}
        <div className="flex items-center gap-2 text-app-text-secondary">
          <span>Baris per halaman:</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="bg-app-card border border-app-border rounded px-2 py-1 text-xs text-app-text-primary focus:outline-none focus:ring-1 focus:ring-app-accent-primary"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {/* Page info + nav */}
        <div className="flex items-center gap-1">
          <span className="text-app-text-secondary mr-2">
            Halaman <strong className="text-app-text-primary">{safePage}</strong> dari{' '}
            <strong className="text-app-text-primary">{totalPages}</strong>
          </span>

          <button
            onClick={() => setPage(1)}
            disabled={safePage === 1}
            className="p-1.5 rounded border border-app-border bg-app-card text-app-text-secondary hover:text-app-text-primary hover:border-app-accent-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Halaman pertama"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="p-1.5 rounded border border-app-border bg-app-card text-app-text-secondary hover:text-app-text-primary hover:border-app-accent-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Halaman sebelumnya"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Page number buttons (max 5 shown) */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let p: number;
            if (totalPages <= 5) p = i + 1;
            else if (safePage <= 3) p = i + 1;
            else if (safePage >= totalPages - 2) p = totalPages - 4 + i;
            else p = safePage - 2 + i;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  'w-7 h-7 text-[11px] rounded border transition-colors',
                  p === safePage
                    ? 'bg-app-accent-primary text-white border-app-accent-primary font-bold'
                    : 'bg-app-card border-app-border text-app-text-secondary hover:border-app-accent-primary hover:text-app-text-primary'
                )}
              >
                {p}
              </button>
            );
          })}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="p-1.5 rounded border border-app-border bg-app-card text-app-text-secondary hover:text-app-text-primary hover:border-app-accent-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Halaman berikutnya"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={safePage === totalPages}
            className="p-1.5 rounded border border-app-border bg-app-card text-app-text-secondary hover:text-app-text-primary hover:border-app-accent-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Halaman terakhir"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
