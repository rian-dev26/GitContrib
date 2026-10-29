import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  ArrowLeft,
  FolderGit2,
  AlertTriangle,
} from 'lucide-react';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EthicalNoticeCard } from '../../components/common/EthicalNoticeCard';
import { analysisService } from '../../services/analysisService';
import { repositoryService } from '../../services/repositoryService';
import { Contributor, Commit, Repository } from '../../types';
import { ContributorHeader } from './components/ContributorHeader';
import {
  ContributorStatCards,
  ContributorMetricsSummary,
} from './components/ContributorStatCards';
import { ContributorActivityChart } from './components/ContributorActivityChart';
import { ContributorCommitTable } from './components/ContributorCommitTable';

export function ContributorDetailPage() {
  const { contributorId = 'contrib-01' } = useParams<{ contributorId: string }>();

  const [contributor, setContributor] = useState<Contributor | null>(null);
  const [repository, setRepository] = useState<Repository | null>(null);
  const [allCommits, setAllCommits] = useState<Commit[]>([]);
  const [filteredCommits, setFilteredCommits] = useState<Commit[]>([]);
  const [isFiltered, setIsFiltered] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);

  // ─── Fetch Data ────────────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function loadContributorData() {
      try {
        setIsLoading(true);
        setNotFound(false);

        // Jika rute demo dipanggil langsung, alihkan target ke contrib-01 default
        const effectiveId = contributorId === 'demo' ? 'contrib-01' : contributorId;

        const [contribData, commitsData] = await Promise.all([
          analysisService.getContributorById(effectiveId),
          analysisService.getCommits(undefined, effectiveId),
        ]);

        if (!isMounted) return;

        if (!contribData) {
          setNotFound(true);
          setIsLoading(false);
          return;
        }

        setContributor(contribData);
        setAllCommits(commitsData);
        setFilteredCommits(commitsData);

        // Ambil info repository terkait
        const repoId = contribData.repositoryId || 'repo-pbl-01';
        const repoData = await repositoryService.getRepositoryById(repoId);
        if (isMounted) {
          setRepository(repoData);
        }
      } catch (err) {
        console.error('Gagal memuat data kontributor:', err);
        if (isMounted) setNotFound(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadContributorData();

    return () => {
      isMounted = false;
    };
  }, [contributorId]);

  // ─── Metrics Calculation Helper ────────────────────────────────────────────
  const computeMetrics = useCallback((commitsList: Commit[]): ContributorMetricsSummary => {
    const totalCommits = commitsList.length;
    let yesCount = 0;
    let noCount = 0;
    let totalAdditions = 0;
    let totalDeletions = 0;
    const uniqueDays = new Set<string>();

    commitsList.forEach((c) => {
      if (c.classification?.label === 'YES') {
        yesCount += 1;
      } else {
        noCount += 1;
      }
      totalAdditions += c.stats.additions;
      totalDeletions += c.stats.deletions;

      // Kumpulkan hari unik (YYYY-MM-DD)
      const dayStr = c.timestamp.split('T')[0];
      if (dayStr) uniqueDays.add(dayStr);
    });

    const totalChanges = totalAdditions + totalDeletions;
    const yesRatio = totalCommits > 0 ? yesCount / totalCommits : 0;

    return {
      totalCommits,
      yesCount,
      noCount,
      yesRatio,
      activeDays: uniqueDays.size,
      totalAdditions,
      totalDeletions,
      totalChanges,
    };
  }, []);

  const allTimeStats = useMemo(() => computeMetrics(allCommits), [allCommits, computeMetrics]);
  const filteredStats = useMemo(() => computeMetrics(filteredCommits), [filteredCommits, computeMetrics]);

  // ─── Duration & Dates ──────────────────────────────────────────────────────
  const { durationLabel, activeDaysCount } = useMemo(() => {
    if (allCommits.length === 0) {
      return { durationLabel: 'Belum ada aktivitas', activeDaysCount: 0 };
    }
    const timestamps = allCommits.map((c) => new Date(c.timestamp).getTime());
    const minTime = new Date(Math.min(...timestamps));
    const maxTime = new Date(Math.max(...timestamps));

    const fromStr = minTime.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
    const toStr = maxTime.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });

    // Hitung perkiraan bulan
    const months =
      (maxTime.getFullYear() - minTime.getFullYear()) * 12 +
      (maxTime.getMonth() - minTime.getMonth()) +
      1;

    const label = `${fromStr} – ${toStr} (${months} Bulan Aktif)`;
    return { durationLabel: label, activeDaysCount: allTimeStats.activeDays };
  }, [allCommits, allTimeStats.activeDays]);

  // ─── Callback from Table Filter ────────────────────────────────────────────
  const handleFilterStateChange = useCallback((filtered: Commit[], filterActive: boolean) => {
    setFilteredCommits(filtered);
    setIsFiltered(filterActive);
  }, []);

  // Reset filter trigger (diteruskan jika user klik reset di card banner)
  const handleResetFilter = useCallback(() => {
    setFilteredCommits(allCommits);
    setIsFiltered(false);
  }, [allCommits]);

  // ─── Loading State ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="py-24">
        <LoadingIndicator text="Memuat profil dan histori commit kontributor..." />
      </div>
    );
  }

  // ─── Not Found / Empty Contributor State ────────────────────────────────────
  if (notFound || !contributor) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto py-8">
        <div className="flex items-center gap-2 text-xs text-app-text-secondary">
          <Link
            to="/repositories/repo-pbl-01"
            className="inline-flex items-center gap-1.5 hover:text-app-text-primary transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Hasil Analisis Repository
          </Link>
        </div>

        <Card className="p-8 sm:p-12 text-center border-dashed border-app-border space-y-4">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto shadow-sm">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-app-text-primary">
              Kontributor Tidak Ditemukan
            </h2>
            <p className="text-xs text-app-text-secondary max-w-md mx-auto mt-1">
              Data kontributor dengan ID <code className="font-mono text-app-accent-primary">"{contributorId}"</code> tidak ditemukan dalam basis data analisis repositori ini.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/repositories/repo-pbl-01">
              <Button variant="primary" size="sm" leftIcon={<FolderGit2 className="w-3.5 h-3.5" />}>
                Lihat Kontributor smart-inventory-pbl
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" size="sm" leftIcon={<Users className="w-3.5 h-3.5" />}>
                Kembali ke Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // ─── Main Content ──────────────────────────────────────────────────────────
  const repoId = repository?.id || contributor.repositoryId || 'repo-pbl-01';
  const repoName = repository?.name || 'smart-inventory-pbl';

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header Identitas Contributor & Repo Terkait */}
      <ContributorHeader
        contributor={contributor}
        repository={repository}
        activeDaysCount={activeDaysCount}
        durationLabel={durationLabel}
      />

      {/* 2. Catatan Etis & Metodologi */}
      <EthicalNoticeCard />

      {/* 3. Kartu Ringkasan Metrik (Konsisten dengan Filter Waktu) */}
      <ContributorStatCards
        allTimeStats={allTimeStats}
        filteredStats={filteredStats}
        isFiltered={isFiltered}
        onResetFilter={handleResetFilter}
      />

      {/* 4. Grafik Aktivitas Commit Berdasarkan Waktu (Merespons Filter) */}
      <ContributorActivityChart
        commits={filteredCommits}
        isFiltered={isFiltered}
      />

      {/* 5. Tabel Seluruh Commit Milik Kontributor (Excel-like Spreadsheet) */}
      <ContributorCommitTable
        commits={allCommits}
        repositoryId={repoId}
        repositoryName={repoName}
        onFilterStateChange={handleFilterStateChange}
      />
    </div>
  );
}
