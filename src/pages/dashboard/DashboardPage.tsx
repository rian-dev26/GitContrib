import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Clock } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { EthicalNoticeCard } from '../../components/common/EthicalNoticeCard';
import { Button } from '../../components/ui/Button';
import { DashboardData } from '../../types/dashboard';

// Subcomponents
import { DashboardStatCards } from './components/DashboardStatCards';
import { ContributionHeatmap } from './components/ContributionHeatmap';
import { ClassificationChart } from './components/ClassificationChart';
import { LastAnalyzedRepoCard } from './components/LastAnalyzedRepoCard';
import { ContributorSummaryTable } from './components/ContributorSummaryTable';
import { RecentCommitsList } from './components/RecentCommitsList';

const EMPTY_DASHBOARD_DATA: DashboardData = {
  lastUpdated: new Date().toISOString(),
  isPrototype: true,
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
  // State data dashboard kosong sampai analisis repository baru selesai
  const [data] = useState<DashboardData>(EMPTY_DASHBOARD_DATA);

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

  return (
    <div className="space-y-6">
      {/* 4. Header Dashboard */}
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

      {/* 10. Repository Terakhir Dianalisis - Selalu tampil (empty state jika tidak ada) */}
      <LastAnalyzedRepoCard repository={data.repository} />

      {/* Komponen lainnya hanya tampil jika ada data */}
      {hasData && (
        <>
          {/* 5. Empat Card Statistik Utama */}
          <DashboardStatCards
            totalCommits={data.statistics.totalCommits}
            totalContributors={data.statistics.totalContributors}
            yesCount={data.statistics.yesPredictions}
            noCount={data.statistics.noPredictions}
            unclassifiedCount={data.statistics.unclassified}
          />

          {/* 6 & 7. Contribution Heatmap & Grafik Distribusi YES/NO */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <div className="lg:col-span-2">
              <ContributionHeatmap activities={data.heatmapActivities} />
            </div>
            <div className="lg:col-span-1">
              <ClassificationChart classification={data.classification} />
            </div>
          </div>

          {/* 8. Ringkasan Contributor */}
          <ContributorSummaryTable contributors={data.contributors} />

          {/* 9. Aktivitas Commit Terbaru */}
          <RecentCommitsList commits={data.recentCommits} />
        </>
      )}
    </div>
  );
}

export default DashboardPage;
