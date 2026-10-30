import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  X,
  FolderGit2,
  GitCommit,
  CheckCircle2,
  XCircle,
  ArrowRight,
  LayoutGrid,
  Table as TableIcon,
  RotateCcw,
  Calendar,
  Mail,
  Github,
  Printer,
  FileSpreadsheet,
  AlertTriangle,
  ChevronDown,
  TrendingUp,
} from 'lucide-react';
import { analysisService } from '../../services/analysisService';
import { repositoryService } from '../../services/repositoryService';
import { Contributor, Repository } from '../../types';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EthicalNoticeCard } from '../../components/common/EthicalNoticeCard';
import { triggerPrintReport } from '../../utils/exportUtils';
import { cn } from '../../utils/cn';

type SortOption = 'commits' | 'ratio' | 'additions' | 'name';
type ViewMode = 'grid' | 'table';

export function ContributorsListPage() {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('commits');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Export notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);

  // Load repositories & contributors
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setIsLoading(true);
        const [repos, contribs] = await Promise.all([
          repositoryService.getRepositories(),
          analysisService.getContributors('all'),
        ]);

        if (!isMounted) return;
        setRepositories(repos);
        setContributors(contribs);
      } catch (err) {
        console.error('Gagal memuat data kontributor:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter contributors by repo and search query
  const filteredContributors = useMemo(() => {
    return contributors.filter((c) => {
      // Filter repository
      if (selectedRepoId !== 'all' && c.repositoryId !== selectedRepoId) {
        return false;
      }
      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const cleanName = c.name.toLowerCase();
        const username = c.username.toLowerCase();
        const email = c.email.toLowerCase();
        return cleanName.includes(q) || username.includes(q) || email.includes(q);
      }
      return true;
    });
  }, [contributors, selectedRepoId, search]);

  // Sort contributors
  const sortedContributors = useMemo(() => {
    const list = [...filteredContributors];
    switch (sortBy) {
      case 'commits':
        return list.sort((a, b) => b.metrics.totalCommits - a.metrics.totalCommits);
      case 'ratio':
        return list.sort((a, b) => b.metrics.yesRatio - a.metrics.yesRatio);
      case 'additions':
        return list.sort((a, b) => b.metrics.totalAdditions - a.metrics.totalAdditions);
      case 'name':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return list;
    }
  }, [filteredContributors, sortBy]);

  // Overall statistics for active selection
  const stats = useMemo(() => {
    const totalCount = sortedContributors.length;
    let totalCommits = 0;
    let totalYes = 0;
    let totalNo = 0;
    let totalAdditions = 0;
    let totalDeletions = 0;

    sortedContributors.forEach((c) => {
      totalCommits += c.metrics.totalCommits;
      totalYes += c.metrics.classifiedYesCount;
      totalNo += c.metrics.classifiedNoCount;
      totalAdditions += c.metrics.totalAdditions;
      totalDeletions += c.metrics.totalDeletions;
    });

    const avgYesRatio = totalCommits > 0 ? (totalYes / totalCommits) * 100 : 0;
    const topContributor =
      sortedContributors.length > 0
        ? [...sortedContributors].sort((a, b) => b.metrics.totalCommits - a.metrics.totalCommits)[0]
        : null;

    return {
      totalCount,
      totalCommits,
      totalYes,
      totalNo,
      avgYesRatio: Math.round(avgYesRatio),
      totalAdditions,
      totalDeletions,
      topContributor,
    };
  }, [sortedContributors]);

  // Map repo helper
  const repoNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    repositories.forEach((r) => {
      map[r.id] = r.name;
    });
    return map;
  }, [repositories]);

  // Handle Export Contributors to CSV
  const handleExportCSV = useCallback(() => {
    try {
      if (sortedContributors.length === 0) {
        throw new Error('Tidak ada data kontributor untuk diekspor.');
      }

      const headers = [
        'Nama Kontributor',
        'Username GitHub',
        'Email',
        'Repository ID',
        'Total Commits',
        'Commit Valid (YES)',
        'Commit Non-Signifikan (NO)',
        'Rasio Validitas YES (%)',
        'Lines Added (+)',
        'Lines Deleted (-)',
        'Total Perubahan',
        'Commit Pertama',
        'Commit Terakhir',
      ];

      const rows = sortedContributors.map((c) => {
        const cleanName = c.name.replace(/\s*\(Contoh\)\s*/i, '');
        const yesPercent = Math.round(c.metrics.yesRatio * 100);
        const totalChanges = c.metrics.totalAdditions + c.metrics.totalDeletions;
        return [
          `"${cleanName.replace(/"/g, '""')}"`,
          `"${c.username}"`,
          `"${c.email}"`,
          `"${c.repositoryId}"`,
          c.metrics.totalCommits,
          c.metrics.classifiedYesCount,
          c.metrics.classifiedNoCount,
          yesPercent,
          c.metrics.totalAdditions,
          c.metrics.totalDeletions,
          totalChanges,
          `"${c.metrics.firstCommitDate ? c.metrics.firstCommitDate.split('T')[0] : '-'}"`,
          `"${c.metrics.lastCommitDate ? c.metrics.lastCommitDate.split('T')[0] : '-'}"`,
        ].join(',');
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateSlug = new Date().toISOString().split('T')[0];
      link.href = url;
      link.setAttribute('download', `gitcontrib-contributors-${dateSlug}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setNotification({
        type: 'success',
        title: 'CSV Berhasil Diunduh',
        message: `${sortedContributors.length} data kontributor berhasil diekspor.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengekspor data kontributor.';
      setNotification({
        type: 'error',
        title: 'Gagal Ekspor CSV',
        message: msg,
      });
    }
  }, [sortedContributors]);

  // Handle Export Contributors to PDF
  const handleExportPDF = useCallback(() => {
    const ok = triggerPrintReport();
    setNotification(
      ok
        ? {
            type: 'success',
            title: 'Dialog Cetak PDF Dibuka',
            message: 'Pilih "Simpan sebagai PDF" di dialog cetak browser Anda.',
          }
        : {
            type: 'error',
            title: 'Gagal Membuka Dialog Cetak',
            message: 'Pastikan fitur cetak tidak diblokir oleh browser Anda.',
          }
    );
  }, []);

  const printedDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const selectedRepo = repositories.find((r) => r.id === selectedRepoId);
  const repoLabel = selectedRepoId === 'all' ? 'Semua Repository PBL' : selectedRepo?.name || selectedRepoId;

  if (isLoading) {
    return (
      <div className="py-24">
        <LoadingIndicator text="Memuat daftar kontributor dan metrik proyek..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ─── SCREEN VIEW (Hidden when printing) ─────────────────────────────── */}
      <div className="space-y-6 print:hidden">
        {/* Page Header */}
        <PageHeader
          title="Daftar Kontributor"
          description="Pantau dan evaluasi performa seluruh kontributor/mahasiswa tim PBL secara komparatif melalui metrik commit, rasio validitas Machine Learning (YES/NO), dan komparasi produktivitas kode."
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                leftIcon={<Printer className="w-3.5 h-3.5 text-rose-400" />}
                className="text-xs font-medium h-9"
              >
                Ekspor PDF
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleExportCSV}
                leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
                className="text-xs font-medium h-9 bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
              >
                Ekspor CSV
              </Button>
            </div>
          }
        />

        {/* Notification Toast */}
        {notification && (
          <div
            className={cn(
              'p-4 rounded-xl border shadow-lg flex items-start justify-between gap-3 text-xs animate-fadeIn',
              notification.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            )}
          >
            <div className="flex items-start gap-2.5">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <p className="font-semibold text-sm">{notification.title}</p>
                <p className="opacity-90">{notification.message}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-app-text-secondary hover:text-app-text-primary p-1 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ─── Metric Overview Cards ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 sm:p-5 flex items-center justify-between border-app-border">
            <div className="space-y-1">
              <p className="text-xs font-medium text-app-text-secondary">Kontributor Aktif</p>
              <p className="text-2xl font-bold text-app-text-primary">{stats.totalCount}</p>
              <p className="text-[11px] text-app-text-secondary">Anggota terdaftar</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-app-accent-primary/10 border border-app-accent-primary/20 flex items-center justify-center text-app-accent-primary">
              <Users className="w-5 h-5" />
            </div>
          </Card>

          <Card className="p-4 sm:p-5 flex items-center justify-between border-app-border">
            <div className="space-y-1">
              <p className="text-xs font-medium text-app-text-secondary">Total Commit Tim</p>
              <p className="text-2xl font-bold text-app-text-primary">{stats.totalCommits}</p>
              <p className="text-[11px] text-app-text-secondary">
                <span className="text-emerald-500 font-semibold">{stats.totalYes} YES</span> •{' '}
                <span className="text-rose-400 font-semibold">{stats.totalNo} NO</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <GitCommit className="w-5 h-5" />
            </div>
          </Card>

          <Card className="p-4 sm:p-5 flex items-center justify-between border-app-border">
            <div className="space-y-1">
              <p className="text-xs font-medium text-app-text-secondary">Rata-rata Validitas</p>
              <p className="text-2xl font-bold text-emerald-400">{stats.avgYesRatio}%</p>
              <p className="text-[11px] text-app-text-secondary">Proporsi commit YES tim</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </Card>

          <Card className="p-4 sm:p-5 flex items-center justify-between border-app-border">
            <div className="space-y-1">
              <p className="text-xs font-medium text-app-text-secondary">Total Baris Kode</p>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-emerald-400">
                  +{stats.totalAdditions.toLocaleString('id-ID')}
                </span>
                <span className="text-xs font-mono font-semibold text-rose-400">
                  -{stats.totalDeletions.toLocaleString('id-ID')}
                </span>
              </div>
              <p className="text-[11px] text-app-text-secondary">
                Total churn:{' '}
                <span className="font-medium text-app-text-primary">
                  {(stats.totalAdditions + stats.totalDeletions).toLocaleString('id-ID')}
                </span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FolderGit2 className="w-5 h-5" />
            </div>
          </Card>
        </div>

        {/* ─── Control Bar (Repository Filter + Search + Sort + View Toggle) ──── */}
        <div className="bg-app-card border border-app-border rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Repository Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <label className="text-xs font-semibold text-app-text-secondary whitespace-nowrap flex items-center gap-1.5">
                <FolderGit2 className="w-4 h-4 text-app-accent-primary" />
                Repository:
              </label>
              <div className="relative">
                <select
                  value={selectedRepoId}
                  onChange={(e) => setSelectedRepoId(e.target.value)}
                  className="appearance-none w-full sm:w-72 pl-3 pr-8 py-2 text-xs font-medium rounded-lg border border-app-border bg-app-secondary/60 text-app-text-primary focus:outline-none focus:ring-1 focus:ring-app-accent-primary cursor-pointer transition-colors"
                >
                  <option value="all">Semua Repository ({contributors.length} Kontributor)</option>
                  {repositories.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-app-text-secondary absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* View Mode Toggle & Sort */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <div className="flex items-center gap-1.5 text-xs text-app-text-secondary mr-1">
                <span>Urutkan:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="text-xs bg-app-secondary border border-app-border rounded-lg px-2.5 py-1.5 text-app-text-primary focus:outline-none focus:ring-1 focus:ring-app-accent-primary cursor-pointer"
                >
                  <option value="commits">Commit Terbanyak</option>
                  <option value="ratio">Rasio YES Tertinggi</option>
                  <option value="additions">Penambahan Baris (+)</option>
                  <option value="name">Nama (A - Z)</option>
                </select>
              </div>

              {/* View Mode Toggle Button */}
              <div className="flex items-center border border-app-border rounded-lg p-0.5 bg-app-secondary/40">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  title="Tampilan Kartu"
                  className={cn(
                    'p-1.5 rounded-md text-xs transition-colors',
                    viewMode === 'grid'
                      ? 'bg-app-accent-primary text-white shadow-sm'
                      : 'text-app-text-secondary hover:text-app-text-primary'
                  )}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  title="Tampilan Tabel"
                  className={cn(
                    'p-1.5 rounded-md text-xs transition-colors',
                    viewMode === 'table'
                      ? 'bg-app-accent-primary text-white shadow-sm'
                      : 'text-app-text-secondary hover:text-app-text-primary'
                  )}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Search Box */}
          <div className="pt-3 border-t border-app-border/60 flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-app-text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama kontributor, GitHub handle, atau email..."
                className="w-full text-xs pl-8 pr-8 py-2 rounded-lg border border-app-border bg-app-secondary/40 text-app-text-primary placeholder:text-app-text-secondary/60 focus:outline-none focus:ring-1 focus:ring-app-accent-primary transition-colors"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-app-text-secondary hover:text-app-text-primary"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <span className="text-xs text-app-text-secondary whitespace-nowrap">
              Menampilkan <strong className="text-app-text-primary">{sortedContributors.length}</strong> kontributor
            </span>
          </div>
        </div>

        {/* ─── Content: Grid vs Table ────────────────────────────────────────── */}
        {sortedContributors.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-app-border space-y-3">
            <div className="w-12 h-12 rounded-full bg-app-secondary border border-app-border text-app-text-secondary flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-app-text-primary">Tidak Ada Kontributor Ditemukan</p>
              <p className="text-xs text-app-text-secondary mt-1">
                Tidak ada kontributor yang cocok dengan filter atau kata kunci pencarian Anda.
              </p>
            </div>
            {(search || selectedRepoId !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setSelectedRepoId('all');
                }}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                className="text-xs mx-auto"
              >
                Reset Filter & Pencarian
              </Button>
            )}
          </Card>
        ) : viewMode === 'grid' ? (
          /* ─── Grid View ─────────────────────────────────────────────────── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
            {sortedContributors.map((c) => {
              const cleanName = c.name.replace(/\s*\(Contoh\)\s*/i, '');
              const initials = cleanName
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((w) => w[0]?.toUpperCase())
                .join('');
              const yesPercent = Math.round(c.metrics.yesRatio * 100);
              const repoName = repoNameMap[c.repositoryId] || c.repositoryId;

              return (
                <Card
                  key={c.id}
                  className="p-5 sm:p-6 border-app-border hover:border-app-accent-primary/50 transition-all duration-200 flex flex-col justify-between group shadow-sm hover:shadow-md"
                >
                  <div className="space-y-4">
                    {/* Top Row: Avatar & Identity */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-app-accent-primary/20 via-app-accent-secondary/15 to-app-accent-primary/5 border border-app-accent-primary/30 flex items-center justify-center text-app-accent-primary text-base font-bold shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                          {initials || 'U'}
                        </div>

                        {/* Name & Handle */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-app-text-primary truncate">
                              {cleanName}
                            </h3>
                            <Badge variant="primary" className="text-[10px] font-medium py-0 px-1.5">
                              PBL
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-app-text-secondary mt-0.5 truncate">
                            <a
                              href={`https://github.com/${c.username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-app-text-primary/90 hover:underline inline-flex items-center gap-1"
                            >
                              <Github className="w-3 h-3 opacity-70" />
                              @{c.username}
                            </a>
                            <span className="text-app-border">•</span>
                            <span className="truncate inline-flex items-center gap-1">
                              <Mail className="w-3 h-3 opacity-70" />
                              {c.email}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Repo Badge */}
                      <span className="shrink-0 text-[11px] font-mono px-2 py-0.5 rounded-md bg-app-secondary border border-app-border text-app-text-secondary">
                        {repoName}
                      </span>
                    </div>

                    {/* Metrics Row */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-app-secondary/40 rounded-lg border border-app-border/70 text-center">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-app-text-secondary font-semibold">
                          Total Commits
                        </p>
                        <p className="text-lg font-bold text-app-text-primary mt-0.5">
                          {c.metrics.totalCommits}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-app-text-secondary font-semibold">
                          Validitas (YES)
                        </p>
                        <p className="text-lg font-bold text-emerald-400 mt-0.5">
                          {yesPercent}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-app-text-secondary font-semibold">
                          Lines (+ / −)
                        </p>
                        <p className="text-xs font-mono font-semibold mt-1">
                          <span className="text-emerald-400">+{c.metrics.totalAdditions}</span>{' '}
                          <span className="text-rose-400">-{c.metrics.totalDeletions}</span>
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar of YES vs NO distribution */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-app-text-secondary flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          {c.metrics.classifiedYesCount} Valid
                        </span>
                        <span className="text-app-text-secondary flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-400" />
                          {c.metrics.classifiedNoCount} Non-signifikan
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-rose-500/20 overflow-hidden flex">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${yesPercent}%` }}
                          title={`YES: ${yesPercent}%`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Action Link */}
                  <div className="mt-5 pt-4 border-t border-app-border/80 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] text-app-text-secondary">
                      <Calendar className="w-3.5 h-3.5 text-app-text-secondary/70" />
                      <span>
                        Aktif:{' '}
                        {c.metrics.firstCommitDate ? c.metrics.firstCommitDate.split('T')[0] : '-'}{' '}
                        s/d{' '}
                        {c.metrics.lastCommitDate ? c.metrics.lastCommitDate.split('T')[0] : '-'}
                      </span>
                    </div>

                    <Link to={`/contributors/${c.id}`}>
                      <Button
                        variant="primary"
                        size="sm"
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        className="text-xs h-8 px-3"
                      >
                        Lihat Profil & Commit
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          /* ─── Table View ─────────────────────────────────────────────────── */
          <div className="bg-app-card border border-app-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-app-secondary/70 border-b border-app-border font-semibold text-[11px] uppercase tracking-wider text-app-text-secondary">
                    <th className="py-3 px-3 pl-4 w-12 text-center">No</th>
                    <th className="py-3 px-3 min-w-[200px]">Kontributor</th>
                    <th className="py-3 px-3 min-w-[140px]">Repository</th>
                    <th className="py-3 px-3 text-right w-24">Commits</th>
                    <th className="py-3 px-3 text-right w-20">YES</th>
                    <th className="py-3 px-3 text-right w-20">NO</th>
                    <th className="py-3 px-3 text-center w-28">Rasio YES</th>
                    <th className="py-3 px-3 text-right w-24">+Lines</th>
                    <th className="py-3 px-3 text-right w-24">-Lines</th>
                    <th className="py-3 px-3 pr-4 text-center w-36">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border/70">
                  {sortedContributors.map((c, idx) => {
                    const cleanName = c.name.replace(/\s*\(Contoh\)\s*/i, '');
                    const initials = cleanName
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((w) => w[0]?.toUpperCase())
                      .join('');
                    const yesPercent = Math.round(c.metrics.yesRatio * 100);
                    const repoName = repoNameMap[c.repositoryId] || c.repositoryId;

                    return (
                      <tr
                        key={c.id}
                        className={cn(
                          'hover:bg-app-accent-primary/[0.04] transition-colors',
                          idx % 2 === 0 ? 'bg-app-card' : 'bg-app-secondary/20'
                        )}
                      >
                        <td className="py-3 px-3 pl-4 text-center text-app-text-secondary font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-app-accent-primary/20 text-app-accent-primary font-bold text-xs flex items-center justify-center shrink-0">
                              {initials || 'U'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-app-text-primary leading-tight truncate">
                                {cleanName}
                              </p>
                              <p className="text-[11px] text-app-text-secondary font-mono truncate">
                                @{c.username}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-app-text-secondary font-medium">
                          <span className="px-2 py-0.5 rounded bg-app-secondary border border-app-border text-[11px]">
                            {repoName}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-app-text-primary">
                          {c.metrics.totalCommits}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-400">
                          {c.metrics.classifiedYesCount}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-rose-400">
                          {c.metrics.classifiedNoCount}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                            {yesPercent}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-400 font-semibold">
                          +{c.metrics.totalAdditions.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-rose-400 font-semibold">
                          -{c.metrics.totalDeletions.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 pr-4 text-center whitespace-nowrap">
                          <Link to={`/contributors/${c.id}`}>
                            <Button variant="outline" size="sm" className="text-xs h-7 px-2.5">
                              Lihat Detail
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Ethical Notice */}
        <EthicalNoticeCard />
      </div>

      {/* ─── PRINTABLE REPORT (Shown only when printing to PDF) ─────────────── */}
      <div id="printable-report" className="hidden print:block p-8 bg-white text-slate-900 space-y-6">
        {/* Kop Dokumen Laporan Resmi */}
        <div className="border-b-2 border-slate-900 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="inline-block px-2.5 py-0.5 mb-1.5 text-[9px] font-bold uppercase tracking-wider bg-slate-900 text-white rounded">
                GitContrib • Rekap Laporan
              </div>
              <h1 className="text-xl font-bold text-slate-900">
                Laporan Evaluasi & Rekap Kontributor Tim PBL
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Sistem Analisis Pola Kontribusi Repository GitHub Berbasis Machine Learning
              </p>
            </div>
            <div className="text-right text-[10px] text-slate-500 space-y-0.5">
              <p>Dokumen: <strong>LAP-GITCONTRIB-CONTRIB</strong></p>
              <p>Tanggal Cetak: <strong>{printedDate}</strong></p>
              <p>Total: <strong>{sortedContributors.length} Mahasiswa/Kontributor</strong></p>
            </div>
          </div>

          {/* Sub Metadata Box */}
          <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-3 gap-3 text-[10px]">
            <div>
              <span className="text-slate-500 block">Cakupan Repository:</span>
              <span className="font-semibold text-slate-800">{repoLabel}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Total Commit Tim:</span>
              <span className="font-semibold text-slate-800">{stats.totalCommits} Commit</span>
            </div>
            <div>
              <span className="text-slate-500 block">Rata-rata Validitas (YES):</span>
              <span className="font-semibold text-emerald-700">{stats.avgYesRatio}%</span>
            </div>
          </div>
        </div>

        {/* Tabel Data Rekap Kontributor */}
        <table className="w-full text-[9.5px] border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100 text-slate-900 border-b border-slate-400 font-bold uppercase tracking-wider text-[9px]">
              <th className="p-2 border border-slate-300 text-center w-8">No</th>
              <th className="p-2 border border-slate-300 text-left">Nama Kontributor</th>
              <th className="p-2 border border-slate-300 text-left w-24">Username</th>
              <th className="p-2 border border-slate-300 text-left w-36">Email</th>
              <th className="p-2 border border-slate-300 text-left w-32">Repository</th>
              <th className="p-2 border border-slate-300 text-right w-16">Commits</th>
              <th className="p-2 border border-slate-300 text-right w-14">YES</th>
              <th className="p-2 border border-slate-300 text-right w-14">NO</th>
              <th className="p-2 border border-slate-300 text-center w-16">Rasio YES</th>
              <th className="p-2 border border-slate-300 text-right w-16">+Lines</th>
              <th className="p-2 border border-slate-300 text-right w-16">-Lines</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sortedContributors.map((c, idx) => {
              const cleanName = c.name.replace(/\s*\(Contoh\)\s*/i, '');
              const yesPercent = Math.round(c.metrics.yesRatio * 100);
              const repoName = repoNameMap[c.repositoryId] || c.repositoryId;
              return (
                <tr key={c.id} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                  <td className="p-1.5 border border-slate-300 text-center text-slate-500 font-mono">
                    {idx + 1}
                  </td>
                  <td className="p-1.5 border border-slate-300 font-semibold text-slate-900">
                    {cleanName}
                  </td>
                  <td className="p-1.5 border border-slate-300 font-mono text-[9px] text-slate-700">
                    @{c.username}
                  </td>
                  <td className="p-1.5 border border-slate-300 text-slate-600 text-[9px]">
                    {c.email}
                  </td>
                  <td className="p-1.5 border border-slate-300 text-slate-800">
                    {repoName}
                  </td>
                  <td className="p-1.5 border border-slate-300 text-right font-mono font-bold text-slate-900">
                    {c.metrics.totalCommits}
                  </td>
                  <td className="p-1.5 border border-slate-300 text-right font-mono font-semibold text-emerald-700">
                    {c.metrics.classifiedYesCount}
                  </td>
                  <td className="p-1.5 border border-slate-300 text-right font-mono font-semibold text-rose-700">
                    {c.metrics.classifiedNoCount}
                  </td>
                  <td className="p-1.5 border border-slate-300 text-center">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {yesPercent}%
                    </span>
                  </td>
                  <td className="p-1.5 border border-slate-300 text-right font-mono text-emerald-700 font-semibold">
                    +{c.metrics.totalAdditions.toLocaleString('id-ID')}
                  </td>
                  <td className="p-1.5 border border-slate-300 text-right font-mono text-rose-700 font-semibold">
                    -{c.metrics.totalDeletions.toLocaleString('id-ID')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer Dokumen Cetak */}
        <div className="pt-4 border-t border-slate-300 flex justify-between items-start text-[9px] text-slate-500">
          <div className="max-w-xl">
            <p className="font-semibold text-slate-700">Catatan Etika Analisis Kontribusi PBL:</p>
            <p className="mt-0.5 leading-relaxed">
              Hasil klasifikasi Machine Learning (YES/NO) merupakan indikator histori aktivitas repositori Git untuk pendampingan PBL, bukan nilai akademik final mahasiswa.
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-slate-700">GitContrib PBL Analytics System</p>
            <p className="mt-0.5">Dokumen Laporan Resmi Rekap Kontributor</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContributorsListPage;
