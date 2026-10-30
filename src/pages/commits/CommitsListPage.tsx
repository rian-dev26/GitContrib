import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  GitCommit,
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
  Users,
  FolderGit2,
  Calendar,
  ChevronDown as ChevronDownIcon,
  FileSpreadsheet,
  Printer,
  AlertTriangle,
} from 'lucide-react';
import { analysisService } from '../../services/analysisService';
import { repositoryService } from '../../services/repositoryService';
import { Commit, Repository } from '../../types';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/cn';
import { exportCommitsToCSV, triggerPrintReport } from '../../utils/exportUtils';

// ─── Types ───────────────────────────────────────────────────────────────────

type SortKey =
  | 'shortSha'
  | 'message'
  | 'contributorName'
  | 'timestamp'
  | 'filesChanged'
  | 'additions'
  | 'deletions'
  | 'totalChanges'
  | 'prediction';

type SortDir = 'asc' | 'desc' | null;
type DatePreset = 'all' | '7d' | '30d' | 'custom';

interface SortState {
  key: SortKey | null;
  dir: SortDir;
}

interface NotificationState {
  type: 'success' | 'error';
  title: string;
  message: string;
  actionType?: 'csv' | 'pdf';
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

function buildTimeframeLabel(preset: DatePreset, dateFrom: string, dateTo: string): string {
  if (preset === 'all') return 'Semua Waktu';
  if (preset === '7d') return '7 Hari Terakhir';
  if (preset === '30d') return '30 Hari Terakhir';
  if (preset === 'custom') return `${dateFrom || '—'} s/d ${dateTo || '—'}`;
  return 'Semua Waktu';
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];

// ─── Component ────────────────────────────────────────────────────────────────

export function CommitsListPage() {
  // Data
  const [allCommits, setAllCommits] = useState<Commit[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Repo + date filters
  const [selectedRepoId, setSelectedRepoId] = useState('');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Table filters
  const [search, setSearch] = useState('');
  const [filterContributor, setFilterContributor] = useState('ALL');
  const [filterLabel, setFilterLabel] = useState<'ALL' | 'YES' | 'NO'>('ALL');

  // Sort + pagination
  const [sort, setSort] = useState<SortState>({ key: 'timestamp', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Export state
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [notification, setNotification] = useState<NotificationState | null>(null);

  // Auto-dismiss notification
  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(t);
  }, [notification]);

  // Load data
  useEffect(() => {
    let mounted = true;
    (async () => {
      const [commits, repos] = await Promise.all([
        analysisService.getCommits(),
        repositoryService.getRepositories(),
      ]);
      if (mounted) {
        setAllCommits(commits);
        setRepositories(repos);
        if (repos.length > 0) setSelectedRepoId(repos[0].id);
        setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const selectedRepo = useMemo(
    () => repositories.find((r) => r.id === selectedRepoId) ?? repositories[0] ?? null,
    [repositories, selectedRepoId]
  );

  // Unique contributors for dropdown (from selected repo's commits)
  const contributors = useMemo(() => {
    const map = new Map<string, string>();
    allCommits
      .filter((c) => !selectedRepoId || c.repositoryId === selectedRepoId)
      .forEach((c) => map.set(c.contributorId, c.contributorName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [allCommits, selectedRepoId]);

  // ─── 1. Filter chain ───────────────────────────────────────────────────────
  const afterRepo = useMemo(() =>
    selectedRepoId ? allCommits.filter((c) => c.repositoryId === selectedRepoId) : allCommits,
    [allCommits, selectedRepoId]
  );

  const afterDate = useMemo(() => {
    if (datePreset === 'all') return afterRepo;
    let rangeFrom: Date | null = null;
    let rangeTo: Date | null = null;
    if (datePreset === 'custom') {
      rangeFrom = dateFrom ? new Date(dateFrom) : null;
      rangeTo = dateTo ? new Date(dateTo + 'T23:59:59') : null;
    } else {
      const r = getPresetRange(datePreset);
      rangeFrom = r.from;
      rangeTo = r.to;
    }
    return afterRepo.filter((c) => {
      const d = new Date(c.timestamp);
      if (rangeFrom && d < rangeFrom) return false;
      if (rangeTo && d > rangeTo) return false;
      return true;
    });
  }, [afterRepo, datePreset, dateFrom, dateTo]);

  const filtered = useMemo(() => {
    let list = [...afterDate];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.message.toLowerCase().includes(q) ||
          c.shortSha.toLowerCase().includes(q) ||
          c.contributorName.toLowerCase().includes(q)
      );
    }
    if (filterContributor !== 'ALL') list = list.filter((c) => c.contributorId === filterContributor);
    if (filterLabel !== 'ALL') list = list.filter((c) => c.classification?.label === filterLabel);
    return list;
  }, [afterDate, search, filterContributor, filterLabel]);

  // ─── 2. Sort ───────────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    if (!sort.key || !sort.dir) return filtered;
    return [...filtered].sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      switch (sort.key) {
        case 'shortSha':        av = a.shortSha;           bv = b.shortSha;           break;
        case 'message':         av = a.message;            bv = b.message;            break;
        case 'contributorName': av = a.contributorName;    bv = b.contributorName;    break;
        case 'timestamp':       av = a.timestamp;          bv = b.timestamp;          break;
        case 'filesChanged':    av = a.stats.filesChanged; bv = b.stats.filesChanged; break;
        case 'additions':       av = a.stats.additions;    bv = b.stats.additions;    break;
        case 'deletions':       av = a.stats.deletions;    bv = b.stats.deletions;    break;
        case 'totalChanges':    av = a.stats.totalChanges; bv = b.stats.totalChanges; break;
        case 'prediction':      av = a.classification?.label ?? ''; bv = b.classification?.label ?? ''; break;
      }
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sort]);

  // ─── 3. Pagination ─────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex   = Math.min(safePage * pageSize, sorted.length);
  const paginated  = sorted.slice(startIndex, endIndex);

  const yesCount = filtered.filter((c) => c.classification?.label === 'YES').length;
  const noCount  = filtered.filter((c) => c.classification?.label === 'NO').length;
  const isDateFiltered = datePreset !== 'all';
  const timeframeLabel = buildTimeframeLabel(datePreset, dateFrom, dateTo);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleSort = useCallback((key: SortKey) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: 'desc' };
      if (prev.dir === 'desc') return { key, dir: 'asc' };
      return { key: null, dir: null };
    });
    setPage(1);
  }, []);

  const handleResetSearch = useCallback(() => { setSearch(''); setPage(1); }, []);

  const handleRepoChange = useCallback((id: string) => {
    setSelectedRepoId(id);
    setFilterContributor('ALL');
    setPage(1);
  }, []);

  const handleResetDate = useCallback(() => {
    setDatePreset('all');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  }, []);

  const handleExportCSV = useCallback(async () => {
    setIsExportingCSV(true);
    try {
      await new Promise((res) => setTimeout(res, 200));
      const ok = exportCommitsToCSV(sorted, selectedRepo, timeframeLabel);
      setNotification(
        ok
          ? { type: 'success', title: 'CSV Berhasil Diunduh', message: `${sorted.length} commit dari ${selectedRepo?.name ?? 'repo'} berhasil diekspor.`, actionType: 'csv' }
          : { type: 'error', title: 'Gagal Ekspor CSV', message: 'Tidak ada data commit untuk diekspor.', actionType: 'csv' }
      );
    } finally {
      setIsExportingCSV(false);
    }
  }, [sorted, selectedRepo, timeframeLabel]);

  const handleExportPDF = useCallback(async () => {
    setIsExportingPDF(true);
    try {
      await new Promise((res) => setTimeout(res, 200));
      const ok = triggerPrintReport();
      setNotification(
        ok
          ? { type: 'success', title: 'Dialog Cetak PDF Dibuka', message: 'Pilih "Simpan sebagai PDF" di dialog cetak browser Anda.', actionType: 'pdf' }
          : { type: 'error', title: 'Gagal Membuka Dialog Cetak', message: 'Pastikan popup/print tidak diblokir oleh browser.', actionType: 'pdf' }
      );
    } finally {
      setIsExportingPDF(false);
    }
  }, []);

  // ─── Sortable Header ───────────────────────────────────────────────────────
  const Th = ({
    label, sortKey, align = 'left', className,
  }: {
    label: string; sortKey: SortKey; align?: 'left' | 'right' | 'center'; className?: string;
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
        <span className={cn('inline-flex items-center gap-1', align === 'right' && 'justify-end', align === 'center' && 'justify-center')}>
          {label}
          {isActive
            ? sort.dir === 'asc'
              ? <ChevronUp className="w-3.5 h-3.5 text-app-accent-primary shrink-0" />
              : <ChevronDown className="w-3.5 h-3.5 text-app-accent-primary shrink-0" />
            : <ChevronsUpDown className="w-3 h-3 text-app-text-secondary/40 shrink-0" />}
        </span>
      </th>
    );
  };

  if (isLoading) {
    return <div className="py-24"><LoadingIndicator text="Memuat data commit..." /></div>;
  }

  const printedDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-5 animate-fadeIn pb-12">

      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <div className="print:hidden">
        <h1 className="text-xl font-bold text-app-text-primary flex items-center gap-2">
          <GitCommit className="w-5 h-5 text-app-accent-primary" />
          Data Kontribusi Commit
        </h1>
        <p className="text-xs text-app-text-secondary mt-1">
          Tabel seluruh data commit untuk keperluan analisis dan evaluasi kontribusi tim PBL.
        </p>
      </div>

      {/* ─── Toast Notification ──────────────────────────────────────────────── */}
      {notification && (
        <div
          className={cn(
            'print:hidden p-4 rounded-xl border shadow-lg flex items-start justify-between gap-3 text-xs animate-fadeIn',
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
          )}
        >
          <div className="flex items-start gap-2.5">
            {notification.type === 'success'
              ? notification.actionType === 'csv'
                ? <FileSpreadsheet className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                : <Printer className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              : <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
            <div className="space-y-0.5">
              <p className="font-semibold text-sm">{notification.title}</p>
              <p className="opacity-90">{notification.message}</p>
            </div>
          </div>
          <button type="button" onClick={() => setNotification(null)} className="text-app-text-secondary hover:text-app-text-primary p-1 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Filter & Export Bar ─────────────────────────────────────────────── */}
      <div className="print:hidden bg-app-card border border-app-border rounded-xl p-4 shadow-sm space-y-3">
        {/* Row 1: Repository + Export buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <label className="text-xs font-semibold text-app-text-secondary whitespace-nowrap flex items-center gap-1.5">
              <FolderGit2 className="w-4 h-4 text-app-accent-primary" />
              Repository:
            </label>
            <div className="relative">
              <select
                value={selectedRepoId}
                onChange={(e) => handleRepoChange(e.target.value)}
                className="appearance-none w-full sm:w-80 pl-3 pr-8 py-2 text-xs font-medium rounded-lg border border-app-border bg-app-secondary/60 text-app-text-primary focus:outline-none focus:ring-1 focus:ring-app-accent-primary cursor-pointer transition-colors"
              >
                {repositories.map((r) => (
                  <option key={r.id} value={r.id}>{r.fullName} ({r.defaultBranch})</option>
                ))}
              </select>
              <ChevronDownIcon className="w-3.5 h-3.5 text-app-text-secondary absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={isExportingPDF || sorted.length === 0}
              leftIcon={<Printer className="w-3.5 h-3.5 text-rose-400" />}
              className="text-xs font-medium h-9"
            >
              {isExportingPDF ? 'Menyiapkan...' : 'Ekspor PDF'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportCSV}
              disabled={isExportingCSV || sorted.length === 0}
              leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
              className="text-xs font-medium h-9 bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
            >
              {isExportingCSV ? 'Mengunduh...' : 'Ekspor CSV'}
            </Button>
          </div>
        </div>

        {/* Row 2: Date period filter */}
        <div className="pt-3 border-t border-app-border/60 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-app-text-secondary inline-flex items-center gap-1.5 mr-1">
              <Calendar className="w-3.5 h-3.5 text-app-accent-secondary" />
              Periode:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {([
                { id: 'all',    label: 'Semua Waktu' },
                { id: '7d',    label: '7 Hari Terakhir' },
                { id: '30d',   label: '30 Hari Terakhir' },
                { id: 'custom', label: 'Kustom' },
              ] as const).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => { setDatePreset(preset.id); setPage(1); }}
                  className={cn(
                    'px-2.5 py-1 text-xs rounded-md border font-medium transition-colors',
                    datePreset === preset.id
                      ? 'bg-app-accent-primary/15 border-app-accent-primary text-app-accent-primary'
                      : 'bg-app-secondary/40 border-app-border text-app-text-secondary hover:text-app-text-primary'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {datePreset === 'custom' && (
              <div className="flex items-center gap-1.5 pl-2 ml-1 border-l border-app-border">
                <input
                  type="date" value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                  className="px-2 py-1 text-xs rounded border border-app-border bg-app-card text-app-text-primary focus:outline-none focus:ring-1 focus:ring-app-accent-primary"
                />
                <span className="text-xs text-app-text-secondary">s/d</span>
                <input
                  type="date" value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                  className="px-2 py-1 text-xs rounded border border-app-border bg-app-card text-app-text-primary focus:outline-none focus:ring-1 focus:ring-app-accent-primary"
                />
              </div>
            )}
          </div>

          {isDateFiltered && (
            <button type="button" onClick={handleResetDate}
              className="inline-flex items-center gap-1 text-xs text-app-accent-primary hover:underline font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Periode
            </button>
          )}
        </div>
      </div>

      {/* ─── Table Card ──────────────────────────────────────────────────────── */}
      <div className="bg-app-card border border-app-border rounded-xl overflow-hidden shadow-sm">

        {/* Toolbar: contributor + label filter + search + pageSize */}
        <div className="p-4 border-b border-app-border flex flex-col gap-3 bg-app-card print:hidden">
          {/* Row A: stats */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <GitCommit className="w-3.5 h-3.5 text-app-accent-primary" />
            <span className="text-app-text-secondary font-medium">
              Menampilkan{' '}
              <strong className="text-app-text-primary">{filtered.length}</strong> dari{' '}
              {afterDate.length} commit
            </span>
            <span className="text-app-border">•</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              <CheckCircle2 className="w-3 h-3" />{yesCount} YES
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/25">
              <XCircle className="w-3 h-3" />{noCount} NO
            </span>
            {isDateFiltered && (
              <>
                <span className="text-app-border">•</span>
                <span className="text-app-accent-secondary text-[11px] italic">{timeframeLabel}</span>
              </>
            )}
          </div>

          {/* Row B: contributor filter + label toggle + search + rows */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Contributor */}
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-app-text-secondary shrink-0" />
              <select
                value={filterContributor}
                onChange={(e) => { setFilterContributor(e.target.value); setPage(1); }}
                className="text-xs bg-app-secondary border border-app-border rounded-lg px-2.5 py-2 text-app-text-primary focus:outline-none focus:ring-1 focus:ring-app-accent-primary cursor-pointer"
              >
                <option value="ALL">Semua Kontributor</option>
                {contributors.map((c) => (
                  <option key={c.id} value={c.id}>{c.name.replace(' (Contoh)', '')}</option>
                ))}
              </select>
            </div>

            {/* Label toggle */}
            <div className="flex items-center gap-1 bg-app-secondary border border-app-border rounded-lg p-0.5">
              {(['ALL', 'YES', 'NO'] as const).map((lbl) => (
                <button key={lbl} type="button"
                  onClick={() => { setFilterLabel(lbl); setPage(1); }}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer border',
                    filterLabel === lbl
                      ? lbl === 'YES' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : lbl === 'NO' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : 'bg-app-accent-primary/15 text-app-accent-primary border-app-accent-primary/30'
                      : 'text-app-text-secondary hover:text-app-text-primary border-transparent'
                  )}
                >
                  {lbl === 'ALL' ? 'Semua' : lbl}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-app-text-secondary absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari hash, pesan, atau nama..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-app-border bg-app-secondary/50 text-app-text-primary placeholder:text-app-text-secondary focus:outline-none focus:ring-1 focus:ring-app-accent-primary"
              />
              {search && (
                <button type="button" onClick={handleResetSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-app-text-secondary hover:text-app-text-primary p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Rows per page */}
            <div className="flex items-center gap-1.5 whitespace-nowrap text-xs text-app-text-secondary shrink-0">
              <span className="hidden sm:inline">Baris:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="px-2 py-1.5 text-xs rounded-lg border border-app-border bg-app-secondary/50 text-app-text-primary focus:outline-none focus:ring-1 focus:ring-app-accent-primary cursor-pointer"
              >
                {PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-app-secondary/70 print:hidden">
                <Th label="Commit Hash"     sortKey="shortSha"        className="pl-4 w-28" />
                <Th label="Pesan Commit"    sortKey="message"         className="min-w-[240px]" />
                <Th label="Contributor"     sortKey="contributorName" className="min-w-[140px]" />
                <Th label="Tanggal & Waktu" sortKey="timestamp"       className="min-w-[150px]" />
                <Th label="File"            sortKey="filesChanged"    align="right" className="w-20" />
                <Th label="Lines +"         sortKey="additions"       align="right" className="w-24" />
                <Th label="Lines −"         sortKey="deletions"       align="right" className="w-24" />
                <Th label="Total Churn"     sortKey="totalChanges"    align="right" className="w-28" />
                <Th label="Prediksi"        sortKey="prediction"      align="center" className="pr-4 w-28" />
              </tr>
              {/* Print-only header */}
              <tr className="hidden print:table-row bg-gray-100 text-gray-800">
                {['Hash','Pesan Commit','Kontributor','Tanggal','File','+Lines','-Lines','Total','Prediksi'].map((h) => (
                  <th key={h} className="py-1.5 px-2 border border-gray-300 text-[10px] font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border/70">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-app-text-secondary text-xs">
                    <div className="space-y-2">
                      <p className="font-medium text-app-text-primary">Tidak ada commit yang sesuai</p>
                      <p className="text-[11px]">Coba sesuaikan kata kunci atau filter di atas.</p>
                      {search && (
                        <button type="button" onClick={handleResetSearch}
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs text-app-accent-primary hover:underline font-medium mt-1"
                        >
                          <RotateCcw className="w-3 h-3" />Reset Pencarian
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
                      'hover:bg-app-accent-primary/[0.04] transition-colors print:hover:bg-transparent',
                      idx % 2 === 0 ? 'bg-app-card print:bg-white' : 'bg-app-secondary/20 print:bg-gray-50'
                    )}
                  >
                    <td className="py-2.5 px-3 pl-4 whitespace-nowrap font-mono print:px-2 print:py-1">
                      <Link
                        to={`/commits/${commit.shortSha}`}
                        className="text-app-accent-primary hover:underline font-semibold bg-app-accent-primary/10 px-1.5 py-0.5 rounded text-[11px] border border-app-accent-primary/20 print:hidden"
                      >
                        {commit.shortSha}
                      </Link>
                      <span className="hidden print:inline text-[10px] font-mono text-gray-700">{commit.shortSha}</span>
                    </td>
                    <td className="py-2.5 px-3 max-w-sm print:px-2 print:py-1">
                      <span className="text-app-text-primary block truncate leading-relaxed print:text-gray-800 print:text-[10px]" title={commit.message}>
                        {commit.message}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-app-text-primary font-medium print:px-2 print:py-1 print:text-[10px] print:text-gray-800">
                      {commit.contributorName.replace(' (Contoh)', '')}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-app-text-secondary print:px-2 print:py-1 print:text-[10px] print:text-gray-700">
                      {formatDate(commit.timestamp)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-app-text-primary print:px-2 print:py-1 print:text-[10px]">{commit.stats.filesChanged}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-medium print:text-emerald-700 print:px-2 print:py-1 print:text-[10px]">+{commit.stats.additions}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-400 font-medium print:text-rose-700 print:px-2 print:py-1 print:text-[10px]">-{commit.stats.deletions}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-app-text-primary font-medium print:px-2 print:py-1 print:text-[10px]">{commit.stats.totalChanges}</td>
                    <td className="py-2.5 px-3 pr-4 text-center whitespace-nowrap print:px-2 print:py-1">
                      <span className="print:hidden">
                        {commit.classification ? <StatusBadge status={commit.classification.label} /> : <span className="text-app-text-secondary/60">—</span>}
                      </span>
                      <span className={cn('hidden print:inline text-[10px] font-bold', commit.classification?.label === 'YES' ? 'text-emerald-700' : 'text-rose-700')}>
                        {commit.classification?.label ?? '—'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3 border-t border-app-border bg-app-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs print:hidden">
          <div className="text-app-text-secondary">
            {sorted.length > 0
              ? <span>Baris <strong className="text-app-text-primary">{startIndex + 1}</strong> – <strong className="text-app-text-primary">{endIndex}</strong> dari <strong className="text-app-text-primary">{sorted.length}</strong></span>
              : <span>0 baris</span>}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1 self-center sm:self-auto">
              {[
                { icon: ChevronsLeft,  onClick: () => setPage(1),                                     disabled: safePage === 1,          title: 'Pertama' },
                { icon: ChevronLeft,   onClick: () => setPage((p) => Math.max(1, p - 1)),             disabled: safePage === 1,          title: 'Sebelumnya' },
                { icon: ChevronRight,  onClick: () => setPage((p) => Math.min(totalPages, p + 1)),    disabled: safePage === totalPages,  title: 'Berikutnya' },
                { icon: ChevronsRight, onClick: () => setPage(totalPages),                             disabled: safePage === totalPages,  title: 'Terakhir' },
              ].map(({ icon: Icon, onClick, disabled, title }, i) =>
                i === 2 ? (
                  <>
                    <span key="label" className="px-2.5 py-1 text-xs text-app-text-primary font-medium">
                      {safePage} / {totalPages}
                    </span>
                    <button key={i} type="button" onClick={onClick} disabled={disabled} title={title}
                      className="p-1 rounded border border-app-border text-app-text-secondary hover:text-app-text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors">
                      <Icon className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <button key={i} type="button" onClick={onClick} disabled={disabled} title={title}
                    className="p-1 rounded border border-app-border text-app-text-secondary hover:text-app-text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors">
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Print-only header ───────────────────────────────────────────────── */}
      <div className="hidden print:block fixed top-0 left-0 right-0 p-4 bg-white border-b border-gray-300 text-black">
        <h1 className="text-base font-bold">Data Kontribusi Repository — GitContrib</h1>
        <p className="text-[10px] text-gray-600 mt-0.5">
          {selectedRepo?.fullName} ({selectedRepo?.defaultBranch}) • Periode: {timeframeLabel} • Dicetak: {printedDate} • {sorted.length} commit
        </p>
      </div>
    </div>
  );
}
