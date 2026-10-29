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
  RotateCcw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Commit } from '../../../types';
import { cn } from '../../../utils/cn';
import { StatusBadge } from '../../../components/common/StatusBadge';

// ─── Types ───────────────────────────────────────────────────────────────────

export type SortKey =
  | 'shortSha'
  | 'message'
  | 'contributorName'
  | 'timestamp'
  | 'filesChanged'
  | 'additions'
  | 'deletions'
  | 'totalChanges'
  | 'prediction';

export type SortDir = 'asc' | 'desc' | null;

interface SortState {
  key: SortKey | null;
  dir: SortDir;
}

interface ReportCommitTableProps {
  commits: Commit[];
  totalRepoCommits: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// ─── Component ────────────────────────────────────────────────────────────────

export function ReportCommitTable({ commits, totalRepoCommits }: ReportCommitTableProps) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState>({ key: 'timestamp', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // ─── 1. Filter Pencarian ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return commits;
    const q = search.toLowerCase().trim();
    return commits.filter(
      (c) =>
        c.message.toLowerCase().includes(q) ||
        c.shortSha.toLowerCase().includes(q) ||
        c.contributorName.toLowerCase().includes(q)
    );
  }, [commits, search]);

  // ─── 2. Sorting Data ───────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    if (!sort.key || !sort.dir) return filtered;

    return [...filtered].sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';

      switch (sort.key) {
        case 'shortSha':
          av = a.shortSha;
          bv = b.shortSha;
          break;
        case 'message':
          av = a.message;
          bv = b.message;
          break;
        case 'contributorName':
          av = a.contributorName;
          bv = b.contributorName;
          break;
        case 'timestamp':
          av = a.timestamp;
          bv = b.timestamp;
          break;
        case 'filesChanged':
          av = a.stats.filesChanged;
          bv = b.stats.filesChanged;
          break;
        case 'additions':
          av = a.stats.additions;
          bv = b.stats.additions;
          break;
        case 'deletions':
          av = a.stats.deletions;
          bv = b.stats.deletions;
          break;
        case 'totalChanges':
          av = a.stats.totalChanges;
          bv = b.stats.totalChanges;
          break;
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

  // ─── 3. Pagination ─────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(safePage * pageSize, sorted.length);
  const paginated = sorted.slice(startIndex, endIndex);

  // ─── Stats Ringkas ─────────────────────────────────────────────────────────
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

  const handleResetSearch = useCallback(() => {
    setSearch('');
    setPage(1);
  }, []);

  // ─── Table Header Component ────────────────────────────────────────────────
  const Th = ({
    label,
    sortKey,
    align = 'left',
    className,
  }: {
    label: string;
    sortKey: SortKey;
    align?: 'left' | 'right' | 'center';
    className?: string;
  }) => {
    const isActive = sort.key === sortKey;
    return (
      <th
        onClick={() => handleSort(sortKey)}
        className={cn(
          'py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-app-text-secondary select-none cursor-pointer border-b border-app-border transition-colors hover:text-app-text-primary hover:bg-app-secondary/40 whitespace-nowrap',
          align === 'right' && 'text-right',
          align === 'center' && 'text-center',
          isActive && 'text-app-accent-primary bg-app-accent-primary/5',
          className
        )}
      >
        <span
          className={cn(
            'inline-flex items-center gap-1',
            align === 'right' && 'justify-end',
            align === 'center' && 'justify-center'
          )}
        >
          {label}
          {isActive ? (
            sort.dir === 'asc' ? (
              <ChevronUp className="w-3.5 h-3.5 text-app-accent-primary shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-app-accent-primary shrink-0" />
            )
          ) : (
            <ChevronsUpDown className="w-3 h-3 text-app-text-secondary/40 shrink-0" />
          )}
        </span>
      </th>
    );
  };

  return (
    <div className="bg-app-card border border-app-border rounded-xl overflow-hidden shadow-sm space-y-0">
      {/* ─── Toolbar Atas: Ringkasan Data & Kontrol Pencarian ───────────────── */}
      <div className="p-4 border-b border-app-border flex flex-col md:flex-row md:items-center justify-between gap-3 bg-app-card">
        {/* Ringkasan Jumlah Data */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <span className="text-app-text-secondary font-medium">
            Menampilkan <strong className="text-app-text-primary font-semibold">{filtered.length}</strong>{' '}
            dari {totalRepoCommits} commit
          </span>

          <span className="text-app-border">•</span>

          {/* Badge YES Hijau Lembut */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
            <CheckCircle2 className="w-3 h-3" />
            {yesCount} YES
          </span>

          {/* Badge NO Merah Lembut */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/25">
            <XCircle className="w-3 h-3" />
            {noCount} NO
          </span>

          {search && (
            <>
              <span className="text-app-border">•</span>
              <span className="text-app-accent-primary text-[11px] italic">
                Pencarian aktif
              </span>
            </>
          )}
        </div>

        {/* Pencarian dan Pilihan Baris */}
        <div className="flex items-center gap-2">
          {/* Input Pencarian */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-app-text-secondary absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari hash, pesan, atau nama..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-app-border bg-app-secondary/50 text-app-text-primary placeholder:text-app-text-secondary focus:outline-none focus:ring-1 focus:ring-app-accent-primary"
            />
            {search && (
              <button
                type="button"
                onClick={handleResetSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-app-text-secondary hover:text-app-text-primary p-0.5"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dropdown Jumlah Baris Per Halaman */}
          <div className="flex items-center gap-1.5 whitespace-nowrap text-xs text-app-text-secondary shrink-0">
            <span className="hidden sm:inline">Baris:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1.5 text-xs rounded-lg border border-app-border bg-app-secondary/50 text-app-text-primary focus:outline-none focus:ring-1 focus:ring-app-accent-primary cursor-pointer"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ─── Tabel Data Commit (Spreadsheet Style) ───────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-app-secondary/70">
              <Th label="Commit Hash" sortKey="shortSha" className="pl-4 w-28" />
              <Th label="Pesan Commit" sortKey="message" className="min-w-[240px]" />
              <Th label="Contributor" sortKey="contributorName" className="min-w-[140px]" />
              <Th label="Tanggal & Waktu" sortKey="timestamp" className="min-w-[150px]" />
              <Th label="File Berubah" sortKey="filesChanged" align="right" className="w-28" />
              <Th label="Lines Added" sortKey="additions" align="right" className="w-28" />
              <Th label="Lines Deleted" sortKey="deletions" align="right" className="w-28" />
              <Th label="Total Perubahan" sortKey="totalChanges" align="right" className="w-32" />
              <Th label="Prediksi YES/NO" sortKey="prediction" align="center" className="pr-4 w-32" />
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border/70">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-14 text-center text-app-text-secondary text-xs">
                  <div className="space-y-2">
                    <p className="font-medium text-app-text-primary">
                      Tidak ada data commit yang sesuai
                    </p>
                    <p className="text-[11px] text-app-text-secondary">
                      Coba sesuaikan kata kunci pencarian atau ubah filter periode di atas.
                    </p>
                    {search && (
                      <button
                        type="button"
                        onClick={handleResetSearch}
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs text-app-accent-primary hover:underline font-medium mt-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset Pencarian
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((commit, idx) => (
                <tr
                    key={commit.id}
                    className={cn(
                      'hover:bg-app-accent-primary/[0.04] transition-colors',
                      idx % 2 === 0 ? 'bg-app-card' : 'bg-app-secondary/20'
                    )}
                  >
                    {/* 1. Commit Hash */}
                    <td className="py-2.5 px-3 pl-4 whitespace-nowrap font-mono">
                      <Link
                        to={`/commits/${commit.id}`}
                        className="text-app-accent-primary hover:underline font-semibold bg-app-accent-primary/10 px-1.5 py-0.5 rounded text-[11px] border border-app-accent-primary/20"
                        title={`Buka detail commit ${commit.shortSha}`}
                      >
                        {commit.shortSha}
                      </Link>
                    </td>

                    {/* 2. Pesan Commit */}
                    <td className="py-2.5 px-3 max-w-sm">
                      <span
                        className="text-app-text-primary block truncate font-normal leading-relaxed"
                        title={commit.message}
                      >
                        {commit.message}
                      </span>
                    </td>

                    {/* 3. Contributor */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-app-text-primary font-medium">
                      {commit.contributorName.replace(' (Contoh)', '')}
                    </td>

                    {/* 4. Tanggal & Waktu */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-app-text-secondary">
                      {formatDate(commit.timestamp)}
                    </td>

                    {/* 5. File Berubah */}
                    <td className="py-2.5 px-3 text-right font-mono text-app-text-primary">
                      {commit.stats.filesChanged}
                    </td>

                    {/* 6. Lines Added (Hijau Lembut) */}
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-500 dark:text-emerald-400 font-medium">
                      +{commit.stats.additions}
                    </td>

                    {/* 7. Lines Deleted (Merah Lembut) */}
                    <td className="py-2.5 px-3 text-right font-mono text-rose-500 dark:text-rose-400 font-medium">
                      -{commit.stats.deletions}
                    </td>

                    {/* 8. Total Perubahan */}
                    <td className="py-2.5 px-3 text-right font-mono text-app-text-primary font-medium">
                      {commit.stats.totalChanges}
                    </td>

                    {/* 9. Prediksi YES/NO */}
                    <td className="py-2.5 px-3 pr-4 text-center whitespace-nowrap">
                      {commit.classification ? (
                        <StatusBadge status={commit.classification.label} />
                      ) : (
                        <span className="text-app-text-secondary/60 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Footer Pagination ──────────────────────────────────────────────── */}
      <div className="p-3 border-t border-app-border bg-app-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="text-app-text-secondary">
          {sorted.length > 0 ? (
            <span>
              Menampilkan baris <strong className="text-app-text-primary font-medium">{startIndex + 1}</strong> s/d{' '}
              <strong className="text-app-text-primary font-medium">{endIndex}</strong> dari{' '}
              <strong className="text-app-text-primary font-medium">{sorted.length}</strong> commit
            </span>
          ) : (
            <span>0 baris</span>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1 self-center sm:self-auto">
            {/* Ke Halaman Pertama */}
            <button
              type="button"
              onClick={() => setPage(1)}
              disabled={safePage === 1}
              className="p-1 rounded border border-app-border text-app-text-secondary hover:text-app-text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Halaman pertama"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>

            {/* Halaman Sebelumnya */}
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-1 rounded border border-app-border text-app-text-secondary hover:text-app-text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Halaman sebelumnya"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Indikator Halaman */}
            <span className="px-2.5 py-1 text-xs text-app-text-primary font-medium">
              Halaman {safePage} dari {totalPages}
            </span>

            {/* Halaman Berikutnya */}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-1 rounded border border-app-border text-app-text-secondary hover:text-app-text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Halaman berikutnya"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Ke Halaman Terakhir */}
            <button
              type="button"
              onClick={() => setPage(totalPages)}
              disabled={safePage === totalPages}
              className="p-1 rounded border border-app-border text-app-text-secondary hover:text-app-text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Halaman terakhir"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
