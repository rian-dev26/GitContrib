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
  FolderGit2,
  GitBranch,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  Inbox,
} from 'lucide-react';
import { AnalysisHistoryItem } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';

type SortKey =
  | 'repositoryName'
  | 'startedAt'
  | 'totalCommits'
  | 'totalContributors'
  | 'status';

type SortDir = 'asc' | 'desc' | null;

interface HistoryTableProps {
  items: AnalysisHistoryItem[];
}

export function HistoryTable({ items }: HistoryTableProps) {
  // ─── Filter & Search State ─────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'IN_PROGRESS' | 'FAILED'>('ALL');
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: 'startedAt',
    dir: 'desc',
  });
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // ─── Filter Logic ──────────────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Status Filter
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }

      // 2. Search Query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchName = item.repositoryName.toLowerCase().includes(q);
        const matchUrl = item.repositoryUrl?.toLowerCase().includes(q) || false;
        const matchBranch = item.branch.toLowerCase().includes(q);
        if (!matchName && !matchUrl && !matchBranch) {
          return false;
        }
      }

      return true;
    });
  }, [items, search, statusFilter]);

  const isFiltered = Boolean(search) || statusFilter !== 'ALL';

  // ─── Sorting Logic ─────────────────────────────────────────────────────────
  const sortedItems = useMemo(() => {
    if (!sort.key || !sort.dir) return filteredItems;

    return [...filteredItems].sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sort.key) {
        case 'repositoryName':
          valA = a.repositoryName.toLowerCase();
          valB = b.repositoryName.toLowerCase();
          break;
        case 'startedAt':
          valA = new Date(a.startedAt).getTime();
          valB = new Date(b.startedAt).getTime();
          break;
        case 'totalCommits':
          valA = a.totalCommits;
          valB = b.totalCommits;
          break;
        case 'totalContributors':
          valA = a.totalContributors;
          valB = b.totalContributors;
          break;
        case 'status':
          valA = a.status;
          valB = b.status;
          break;
      }

      if (valA < valB) return sort.dir === 'asc' ? -1 : 1;
      if (valA > valB) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredItems, sort]);

  // ─── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sortedItems.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedItems = sortedItems.slice(startIndex, startIndex + pageSize);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleSort = useCallback((key: SortKey) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return { key: null as unknown as SortKey, dir: null };
    });
    setPage(1);
  }, []);

  const handleReset = useCallback(() => {
    setSearch('');
    setStatusFilter('ALL');
    setSort({ key: 'startedAt', dir: 'desc' });
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
        'py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-app-text-secondary cursor-pointer select-none whitespace-nowrap hover:text-app-text-primary transition-colors',
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

  return (
    <div className="bg-app-card border border-app-border rounded-xl shadow-sm overflow-hidden space-y-0">
      {/* ─── Control Bar ──────────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 border-b border-app-border space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-app-text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama repositori atau URL..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-app-border bg-app-secondary/40 text-app-text-primary placeholder:text-app-text-secondary/70 focus:outline-none focus:ring-1 focus:ring-app-accent-primary"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-app-text-secondary hover:text-app-text-primary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action button */}
          <div className="flex items-center gap-2">
            <Link to="/analysis">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
              >
                Mulai Analisis Baru
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Pills & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-app-text-secondary mr-1">
              Filter Status:
            </span>
            <div className="inline-flex rounded-lg border border-app-border bg-app-secondary/40 p-0.5">
              {(
                [
                  { key: 'ALL', label: 'Semua Status' },
                  { key: 'COMPLETED', label: 'Selesai' },
                  { key: 'IN_PROGRESS', label: 'Sedang Diproses' },
                  { key: 'FAILED', label: 'Gagal' },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => {
                    setStatusFilter(preset.key);
                    setPage(1);
                  }}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium rounded-md transition-all',
                    statusFilter === preset.key
                      ? 'bg-app-card text-app-text-primary shadow-sm font-semibold'
                      : 'text-app-text-secondary hover:text-app-text-primary'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

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

        {/* Info stats bar */}
        <div className="flex flex-wrap items-center justify-between text-xs text-app-text-secondary pt-1 border-t border-app-border/40">
          <div>
            Menampilkan <strong className="text-app-text-primary">{filteredItems.length}</strong> dari{' '}
            <strong className="text-app-text-primary">{items.length}</strong> sesi analisis tersimpan
          </div>
          <div className="text-[11px] text-app-text-secondary">
            Klik judul kolom untuk mengurutkan (Asc/Desc)
          </div>
        </div>
      </div>

      {/* ─── Table Container ──────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-app-secondary/50 border-b border-app-border">
              <Th label="Nama Repository" sortKey="repositoryName" />
              <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-app-text-secondary">
                URL GitHub
              </th>
              <Th label="Tanggal Analisis" sortKey="startedAt" />
              <Th label="Jumlah Commit" sortKey="totalCommits" align="right" />
              <Th label="Jumlah Contributor" sortKey="totalContributors" align="right" />
              <Th label="Status Analisis" sortKey="status" align="center" />
              <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-app-text-secondary text-right">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border/70 font-sans">
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-14 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-app-secondary border border-app-border flex items-center justify-center text-app-text-secondary">
                      <Inbox className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-app-text-primary">
                      {items.length === 0
                        ? 'Belum ada riwayat analisis repository yang tersimpan.'
                        : 'Tidak ada sesi analisis yang cocok dengan filter aktif.'}
                    </p>
                    {isFiltered ? (
                      <button
                        type="button"
                        onClick={handleReset}
                        className="text-xs text-app-accent-primary hover:underline mt-1 font-medium"
                      >
                        Reset pencarian dan filter status
                      </button>
                    ) : (
                      <Link to="/analysis" className="mt-2">
                        <Button variant="primary" size="sm">
                          Mulai Analisis Repositori Pertama
                        </Button>
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedItems.map((item, idx) => {
                const dateObj = new Date(item.completedAt || item.startedAt);
                const dateFormatted = dateObj.toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                const timeFormatted = dateObj.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                const isCompleted = item.status === 'COMPLETED';
                const isInProgress = item.status === 'IN_PROGRESS';
                const isFailed = item.status === 'FAILED';
                const repoUrl = item.repositoryUrl || `https://github.com/${item.repositoryName}`;

                return (
                  <tr
                    key={item.id}
                    className={cn(
                      'hover:bg-app-accent-primary/[0.04] transition-colors',
                      idx % 2 === 1 ? 'bg-app-secondary/20' : 'bg-transparent'
                    )}
                  >
                    {/* Repository Name & Branch */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-app-accent-primary/10 border border-app-accent-primary/20 flex items-center justify-center text-app-accent-primary shrink-0">
                          <FolderGit2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-app-text-primary text-xs truncate max-w-[220px]" title={item.repositoryName}>
                              {item.repositoryName}
                            </span>
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-app-secondary border border-app-border text-app-text-secondary">
                              <GitBranch className="w-2.5 h-2.5 text-app-accent-primary" />
                              {item.branch}
                            </span>
                          </div>
                          <span className="text-[11px] text-app-text-secondary">
                            Oleh {item.triggeredBy}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* GitHub URL */}
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <a
                        href={repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-app-accent-primary hover:underline truncate max-w-[220px]"
                        title={repoUrl}
                      >
                        <span className="truncate">{repoUrl.replace(/^https?:\/\//i, '')}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>

                    {/* Tanggal & Waktu Analisis */}
                    <td className="py-3 px-4 text-app-text-secondary whitespace-nowrap text-[11px]">
                      <div className="font-medium text-app-text-primary">{dateFormatted}</div>
                      <div className="text-[10px] text-app-text-secondary/80">pukul {timeFormatted} WIB</div>
                    </td>

                    {/* Jumlah Commit */}
                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-xs">
                      {isCompleted ? (
                        <span className="font-semibold text-app-text-primary">
                          {item.totalCommits}
                        </span>
                      ) : isInProgress ? (
                        <span className="text-blue-500 font-medium">~{item.totalCommits}</span>
                      ) : (
                        <span className="text-app-text-secondary">-</span>
                      )}
                    </td>

                    {/* Jumlah Contributor */}
                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-xs">
                      {isCompleted ? (
                        <span className="font-semibold text-app-text-primary">
                          {item.totalContributors} mhs
                        </span>
                      ) : isInProgress ? (
                        <span className="text-blue-500 font-medium">~{item.totalContributors} mhs</span>
                      ) : (
                        <span className="text-app-text-secondary">-</span>
                      )}
                    </td>

                    {/* Status Analisis */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                          Selesai
                        </span>
                      )}
                      {isInProgress && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/30">
                          <Clock className="w-3 h-3 animate-spin" />
                          Diproses
                        </span>
                      )}
                      {isFailed && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/30">
                          <AlertCircle className="w-3 h-3 stroke-[2.5]" />
                          Gagal
                        </span>
                      )}
                    </td>

                    {/* Tombol Lihat Hasil */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {isCompleted ? (
                        <Link to={`/repositories/${item.repositoryId}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                            className="text-xs h-7 px-2.5"
                          >
                            Lihat Hasil
                          </Button>
                        </Link>
                      ) : isInProgress ? (
                        <Link to="/analysis">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 text-blue-500 hover:text-blue-600"
                          >
                            Pantau
                          </Button>
                        </Link>
                      ) : (
                        <span className="text-[11px] text-app-text-secondary/60">
                          Tidak tersedia
                        </span>
                      )}
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
        {/* Page size */}
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
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>

        {/* Page navigations */}
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
