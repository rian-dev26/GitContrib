import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  GitCommit,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Users,
  Calendar,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { analysisService } from '../../services/analysisService';
import { Commit } from '../../types';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';
import { Card } from '../../components/ui/Card';

type FilterLabel = 'ALL' | 'YES' | 'NO';
type SortKey = 'date' | 'additions' | 'deletions' | 'contributor';

const CONTRIBUTOR_COLORS: Record<string, string> = {
  'contrib-01': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'contrib-02': 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  'contrib-03': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'contrib-04': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

function getContribColor(id: string): string {
  return CONTRIBUTOR_COLORS[id] || 'bg-slate-500/20 text-slate-300 border-slate-500/30';
}

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function CommitsListPage() {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLabel, setFilterLabel] = useState<FilterLabel>('ALL');
  const [filterContributor, setFilterContributor] = useState<string>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('date');

  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await analysisService.getCommits();
      if (mounted) {
        setCommits(data);
        setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Unique contributors
  const contributors = useMemo(() => {
    const map = new Map<string, string>();
    commits.forEach((c) => map.set(c.contributorId, c.contributorName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [commits]);

  const filtered = useMemo(() => {
    let list = [...commits];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.message.toLowerCase().includes(q) ||
          c.shortSha.toLowerCase().includes(q) ||
          c.contributorName.toLowerCase().includes(q)
      );
    }

    // Label filter
    if (filterLabel !== 'ALL') {
      list = list.filter((c) => c.classification?.label === filterLabel);
    }

    // Contributor filter
    if (filterContributor !== 'ALL') {
      list = list.filter((c) => c.contributorId === filterContributor);
    }

    // Sort
    list.sort((a, b) => {
      switch (sortKey) {
        case 'date':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'additions':
          return b.stats.additions - a.stats.additions;
        case 'deletions':
          return b.stats.deletions - a.stats.deletions;
        case 'contributor':
          return a.contributorName.localeCompare(b.contributorName);
        default:
          return 0;
      }
    });

    return list;
  }, [commits, search, filterLabel, filterContributor, sortKey]);

  const totalYes = filtered.filter((c) => c.classification?.label === 'YES').length;
  const totalNo = filtered.filter((c) => c.classification?.label === 'NO').length;

  if (isLoading) {
    return (
      <div className="py-24">
        <LoadingIndicator text="Memuat daftar commit..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ─── Page Title ────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-app-text-primary flex items-center gap-2">
          <GitCommit className="w-5 h-5 text-app-accent-primary" />
          Daftar Commit
        </h1>
        <p className="text-xs text-app-text-secondary mt-1">
          Pilih commit yang ingin dilihat rincian analisisnya.
        </p>
      </div>

      {/* ─── Summary Chips ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-app-card border border-app-border text-xs text-app-text-secondary">
          <GitCommit className="w-3.5 h-3.5 text-app-accent-primary" />
          <span className="font-semibold text-app-text-primary">{filtered.length}</span> commit
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="font-semibold">{totalYes}</span> YES
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
          <XCircle className="w-3.5 h-3.5" />
          <span className="font-semibold">{totalNo}</span> NO
        </div>
      </div>

      {/* ─── Filters Bar ───────────────────────────────────────────────────── */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-app-text-secondary pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari pesan, SHA, atau nama kontributor..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-app-secondary border border-app-border rounded-lg text-app-text-primary placeholder:text-app-text-secondary/50 focus:outline-none focus:border-app-accent-primary/50 transition-colors"
            />
          </div>

          {/* Label filter */}
          <div className="flex items-center gap-1 bg-app-secondary border border-app-border rounded-lg p-0.5">
            {(['ALL', 'YES', 'NO'] as FilterLabel[]).map((lbl) => (
              <button
                key={lbl}
                type="button"
                onClick={() => setFilterLabel(lbl)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  filterLabel === lbl
                    ? lbl === 'YES'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : lbl === 'NO'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-app-accent-primary/15 text-app-accent-primary border border-app-accent-primary/30'
                    : 'text-app-text-secondary hover:text-app-text-primary border border-transparent'
                }`}
              >
                {lbl === 'ALL' ? 'Semua' : lbl}
              </button>
            ))}
          </div>

          {/* Contributor filter */}
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-app-text-secondary" />
            <select
              value={filterContributor}
              onChange={(e) => setFilterContributor(e.target.value)}
              className="text-xs bg-app-secondary border border-app-border rounded-lg px-2.5 py-2 text-app-text-primary focus:outline-none focus:border-app-accent-primary/50 cursor-pointer"
            >
              <option value="ALL">Semua Kontributor</option>
              {contributors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-app-text-secondary" />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="text-xs bg-app-secondary border border-app-border rounded-lg px-2.5 py-2 text-app-text-primary focus:outline-none focus:border-app-accent-primary/50 cursor-pointer"
            >
              <option value="date">Terbaru</option>
              <option value="additions">Lines Added ↓</option>
              <option value="deletions">Lines Deleted ↓</option>
              <option value="contributor">Kontributor A–Z</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ─── Commit List ───────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <Card className="p-10 text-center border-dashed">
          <GitCommit className="w-10 h-10 text-app-text-secondary mx-auto mb-3 opacity-40" />
          <p className="text-sm text-app-text-secondary">Tidak ada commit yang cocok dengan filter.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((commit) => {
            const isYes = commit.classification?.label === 'YES';
            const confidence = commit.classification?.confidence ?? 0;

            return (
              <Link
                key={commit.id}
                to={`/commits/${commit.shortSha}`}
                className="group block"
              >
                <Card className="p-4 hover:border-app-accent-primary/40 transition-all duration-200 hover:shadow-md hover:shadow-app-accent-primary/5 group-hover:bg-app-secondary/30">
                  <div className="flex items-start gap-4">
                    {/* Status Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {isYes ? (
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                          <XCircle className="w-4 h-4 text-rose-400" />
                        </div>
                      )}
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      {/* Message */}
                      <p className="text-sm font-semibold text-app-text-primary group-hover:text-app-accent-primary transition-colors leading-snug truncate">
                        {commit.message}
                      </p>

                      {/* Metadata Row */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-app-text-secondary">
                        {/* SHA */}
                        <span className="font-mono bg-app-secondary px-1.5 py-0.5 rounded border border-app-border text-app-accent-primary">
                          {commit.shortSha}
                        </span>
                        {/* Contributor */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border font-medium ${getContribColor(commit.contributorId)}`}
                        >
                          {commit.contributorName.split(' ')[0]}
                        </span>
                        {/* Date */}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(commit.timestamp)}
                        </span>
                        {/* Confidence */}
                        <span className="flex items-center gap-1">
                          <span className="text-app-text-secondary/60">Keyakinan:</span>
                          <span className={`font-semibold ${isYes ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {(confidence * 100).toFixed(0)}%
                          </span>
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px]">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <TrendingUp className="w-3 h-3" />
                          +{commit.stats.additions}
                        </span>
                        <span className="flex items-center gap-1 text-rose-400">
                          <TrendingDown className="w-3 h-3" />
                          -{commit.stats.deletions}
                        </span>
                        <span className="text-app-text-secondary">
                          {commit.stats.filesChanged} file
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0 self-center">
                      <ChevronRight className="w-4 h-4 text-app-text-secondary group-hover:text-app-accent-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
