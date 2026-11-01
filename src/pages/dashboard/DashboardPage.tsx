import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Clock } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { EthicalNoticeCard } from '../../components/common/EthicalNoticeCard';
import { Button } from '../../components/ui/Button';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';
import { DashboardData, DailyCommitActivity, DashboardContributorItem, DashboardRecentCommit } from '../../types/dashboard';
import { repositoryService } from '../../services/repositoryService';
import { analysisService } from '../../services/analysisService';

// Subcomponents
import { DashboardStatCards } from './components/DashboardStatCards';
import { ContributionHeatmap } from './components/ContributionHeatmap';
import { ClassificationChart } from './components/ClassificationChart';
import { LastAnalyzedRepoCard } from './components/LastAnalyzedRepoCard';
import { ContributorSummaryTable } from './components/ContributorSummaryTable';
import { RecentCommitsList } from './components/RecentCommitsList';

const EMPTY_DASHBOARD_DATA: DashboardData = {
  lastUpdated: new Date().toISOString(),
  isPrototype: false,
  repository: null,
  statistics: {
    totalCommits: 0,
    totalContributors: 0,
    yesPredictions: 0,
    noPredictions: 0,
    unclassified: 0,
  },
  classification: {
    totalAnalyzed: 0,
    yesCount: 0,
    noCount: 0,
    unclassifiedCount: 0,
    yesPercentage: 0,
    noPercentage: 0,
    distribution: [],
    notice: 'Tidak ada data. Mulai analisis repository untuk melihat data di sini.',
  },
  heatmapActivities: [],
  contributors: [],
  recentCommits: [],
};

export function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData>(EMPTY_DASHBOARD_DATA);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        setIsLoading(true);
        const repos = await repositoryService.getRepositories();
        if (!repos || repos.length === 0) {
          if (isMounted) setData(EMPTY_DASHBOARD_DATA);
          return;
        }

        // Ambil repository terakhir dianalisis
        const latestRepo = repos[0];
        const [fullRepo, contribs, commits] = await Promise.all([
          repositoryService.getRepositoryById(latestRepo.id),
          analysisService.getContributors(latestRepo.id),
          analysisService.getCommits(latestRepo.id),
        ]);

        if (!isMounted) return;

        const currentRepo = fullRepo || latestRepo;
        const totalCommits = commits.length || currentRepo.stats?.totalCommits || 0;
        const totalContributors = contribs.length || currentRepo.stats?.totalContributors || 0;

        const yesCount = commits.filter((c) => c.classification?.label === 'YES').length;
        const noCount = commits.filter((c) => c.classification?.label === 'NO').length;
        const unclassifiedCount = Math.max(0, totalCommits - yesCount - noCount);

        const yesPercentage = totalCommits > 0 ? Math.round((yesCount / totalCommits) * 100) : 75;
        const noPercentage = totalCommits > 0 ? Math.round((noCount / totalCommits) * 100) : 25;

        // Hitung aktivitas harian untuk heatmap
        const dateCountMap = new Map<string, number>();
        commits.forEach((c) => {
          const dateStr = (c.timestamp || new Date().toISOString()).split('T')[0];
          dateCountMap.set(dateStr, (dateCountMap.get(dateStr) || 0) + 1);
        });

        const heatmapActivities: DailyCommitActivity[] = Array.from(dateCountMap.entries()).map(
          ([date, count]) => {
            let level: 0 | 1 | 2 | 3 | 4 = 1;
            if (count >= 8) level = 4;
            else if (count >= 5) level = 3;
            else if (count >= 3) level = 2;
            else if (count >= 1) level = 1;
            else level = 0;
            return { date, count, level };
          }
        );

        // Petakan contributor items
        const dashboardContributors: DashboardContributorItem[] = contribs.map((c) => {
          const authorCommits = commits.filter((cm) => cm.contributorId === c.id || cm.contributorName === c.name);
          const authorYes = authorCommits.filter((cm) => cm.classification?.label === 'YES').length;
          const authorNo = authorCommits.filter((cm) => cm.classification?.label === 'NO').length;

          return {
            id: c.id,
            name: c.name,
            username: c.username || c.name,
            avatarUrl: c.avatarUrl,
            totalCommits: c.metrics?.totalCommits || authorCommits.length || 0,
            activeDays: Math.min(30, Math.max(1, Math.round((c.metrics?.totalCommits || 1) / 3))),
            linesAdded: c.metrics?.totalAdditions || 0,
            linesDeleted: c.metrics?.totalDeletions || 0,
            yesCount: authorYes || c.metrics?.classifiedYesCount || 0,
            noCount: authorNo || c.metrics?.classifiedNoCount || 0,
          };
        });

        // Petakan recent commits (10 commit terbaru)
        const recentCommits: DashboardRecentCommit[] = commits.slice(0, 10).map((c) => ({
          id: c.id,
          shortSha: c.shortSha,
          message: c.message,
          contributorName: c.contributorName,
          contributorUsername: c.contributorEmail?.split('@')[0] || c.contributorName,
          timestamp: c.timestamp,
          classification: c.classification?.label || 'YES',
          linesChanged: c.stats?.totalChanges || 0,
        }));

        const repoOwner = (currentRepo.fullName || currentRepo.name).split('/')[0] || 'owner';
        const repoSimpleName = (currentRepo.fullName || currentRepo.name).split('/')[1] || currentRepo.name;

        setData({
          lastUpdated: currentRepo.lastAnalyzedAt || new Date().toISOString(),
          isPrototype: false,
          repository: {
            id: currentRepo.id,
            name: repoSimpleName,
            owner: repoOwner,
            fullName: currentRepo.fullName || `${repoOwner}/${repoSimpleName}`,
            url: currentRepo.url,
            analyzedAt: currentRepo.lastAnalyzedAt || new Date().toISOString(),
            status: 'COMPLETED',
            totalCommits,
            totalContributors,
            defaultBranch: currentRepo.defaultBranch || 'main',
          },
          statistics: {
            totalCommits,
            totalContributors,
            yesPredictions: yesCount,
            noPredictions: noCount,
            unclassified: unclassifiedCount,
          },
          classification: {
            totalAnalyzed: totalCommits,
            yesCount,
            noCount,
            unclassifiedCount,
            yesPercentage,
            noPercentage,
            distribution: [
              {
                label: 'YES',
                count: yesCount,
                percentage: yesPercentage,
                color: '#10B981',
              },
              {
                label: 'NO',
                count: noCount,
                percentage: noPercentage,
                color: '#EF4444',
              },
            ],
            notice: 'Klasifikasi YES mengindikasikan commit berfitur substantif, sedangkan NO merepresentasikan koreksi minor, formatting, atau non-fungsional.',
          },
          heatmapActivities,
          contributors: dashboardContributors,
          recentCommits,
        });
      } catch (err) {
        console.error('Gagal memuat data dashboard:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const hasData = data.repository !== null;
  const formattedUpdateTime = hasData
    ? new Date(data.lastUpdated).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  if (isLoading) {
    return <LoadingIndicator text="Memuat ringkasan data dashboard..." fullScreen={false} className="py-24" />;
  }

  return (
    <div className="space-y-6">
      {/* Header Dashboard */}
      <PageHeader
        title="Dashboard"
        description="Ringkasan aktivitas repository dan pola kontribusi"
        actions={
          <div className="flex items-center gap-3">
            {hasData && (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-app-text-secondary bg-app-card px-3 py-1.5 rounded-md border border-app-border">
                <Clock className="w-3.5 h-3.5" />
                <span>Diperbarui: {formattedUpdateTime} WIB</span>
              </div>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/analysis')}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Analisis Repository
            </Button>
          </div>
        }
      />

      {/* Panduan Etika Evaluasi Dosen */}
      <EthicalNoticeCard />

      {/* Repository Terakhir Dianalisis */}
      <LastAnalyzedRepoCard repository={data.repository} />

      {/* Komponen lainnya hanya tampil jika ada data */}
      {hasData && (
        <>
          {/* Empat Card Statistik Utama */}
          <DashboardStatCards
            totalCommits={data.statistics.totalCommits}
            totalContributors={data.statistics.totalContributors}
            yesCount={data.statistics.yesPredictions}
            noCount={data.statistics.noPredictions}
            unclassifiedCount={data.statistics.unclassified}
          />

          {/* Contribution Heatmap & Grafik Distribusi YES/NO */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <div className="lg:col-span-2">
              <ContributionHeatmap activities={data.heatmapActivities} />
            </div>
            <div className="lg:col-span-1">
              <ClassificationChart classification={data.classification} />
            </div>
          </div>

          {/* Ringkasan Contributor */}
          <ContributorSummaryTable contributors={data.contributors} />

          {/* Aktivitas Commit Terbaru */}
          <RecentCommitsList commits={data.recentCommits} />
        </>
      )}
    </div>
  );
}

export default DashboardPage;
