import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  User,
  Users,
  GitCommit,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { MetricCard } from '../../components/common/MetricCard';
import { EthicalNoticeCard } from '../../components/common/EthicalNoticeCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';
import { analysisService } from '../../services/analysisService';
import { Contributor, Commit } from '../../types';

export function ContributorDetailPage() {
  const { contributorId = 'demo' } = useParams();
  const [contributor, setContributor] = useState<Contributor | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isDemo = contributorId === 'demo';

  useEffect(() => {
    if (isDemo) {
      setIsLoading(false);
      return;
    }

    async function loadData() {
      try {
        setIsLoading(true);
        const [contribData, commitsData] = await Promise.all([
          analysisService.getContributorById(contributorId),
          analysisService.getCommits(undefined, contributorId),
        ]);
        setContributor(
          contribData || {
            id: contributorId,
            name: `Kontributor (${contributorId})`,
            username: contributorId,
            email: `${contributorId}@polibatam.ac.id`,
            repositoryId: 'repo-pbl-01',
            metrics: {
              totalCommits: 25,
              classifiedYesCount: 20,
              classifiedNoCount: 5,
              yesRatio: 0.8,
              firstCommitDate: new Date().toISOString(),
              lastCommitDate: new Date().toISOString(),
              totalAdditions: 1200,
              totalDeletions: 300,
            },
          }
        );
        setCommits(commitsData);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [contributorId, isDemo]);

  if (isLoading) {
    return <LoadingIndicator text="Memuat profil kontributor..." className="py-24" />;
  }

  // Tampilan Placeholder Rapi untuk Rute Demo
  if (isDemo) {
    return (
      <div className="space-y-6 max-w-4xl">
        <PageHeader
          title="Direktori Contributor"
          description="Daftar kontributor mahasiswa dan agregasi pola aktivitas commit dalam proyek PBL."
          badge={<Badge variant="secondary">Placeholder Navigasi</Badge>}
        />

        <Card className="border-dashed border-app-border text-center p-8 sm:p-12">
          <div className="w-14 h-14 rounded-full bg-app-secondary border border-app-border flex items-center justify-center text-app-accent-secondary mx-auto mb-4 shadow-sm">
            <Users className="w-7 h-7 stroke-[1.8]" />
          </div>

          <h3 className="text-base font-semibold text-app-text-primary">
            Halaman Contributor
          </h3>

          <p className="text-xs text-app-text-secondary max-w-md mx-auto mt-2 leading-relaxed">
            Halaman ini digunakan untuk melihat daftar dan profil kontribusi mahasiswa dalam proyek PBL.
            Halaman ini akan dikembangkan pada tahap berikutnya.
          </p>

          <div className="p-3.5 bg-app-secondary/40 border border-app-border rounded-md text-xs text-app-text-secondary max-w-md mx-auto mt-6 text-left flex items-start gap-3">
            <Layers className="w-4 h-4 text-app-accent-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-app-text-primary">Konteks Navigasi:</p>
              <p className="mt-0.5">
                Untuk meninjau data kontributor mahasiswa yang telah diekstraksi, silakan buka repository aktif di Dashboard atau klik tombol di bawah.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <Link to="/repositories/repo-pbl-01">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Lihat Kontributor di smart-inventory-pbl
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Kembali ke Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (!contributor) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-app-text-secondary hover:text-app-text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Dashboard
        </Link>
      </div>

      <PageHeader
        title={contributor.name}
        description={`Evaluasi pola kontribusi commit untuk mahasiswa @${contributor.username} (${contributor.email})`}
      />

      <EthicalNoticeCard />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Commits"
          value={contributor.metrics.totalCommits}
          subValue="Histori Git tercatat"
          icon={<GitCommit className="w-4 h-4 text-app-accent-primary" />}
        />
        <MetricCard
          label="Commit YES"
          value={contributor.metrics.classifiedYesCount}
          subValue="Pola kontribusi aktif"
          icon={<CheckCircle2 className="w-4 h-4 text-app-accent-positive" />}
        />
        <MetricCard
          label="Commit NO"
          value={contributor.metrics.classifiedNoCount}
          subValue="Pola minor / low churn"
          icon={<XCircle className="w-4 h-4 text-app-accent-negative" />}
        />
        <MetricCard
          label="Rasio YES"
          value={`${Math.round(contributor.metrics.yesRatio * 100)}%`}
          subValue="Proporsi klasifikasi model"
          icon={<User className="w-4 h-4 text-app-accent-secondary" />}
        />
      </div>

      {/* Commits by this contributor */}
      <Card>
        <CardHeader>
          <CardTitle>Histori Commit Kontributor</CardTitle>
          <span className="text-xs text-app-text-secondary">
            Semua commit yang diajukan oleh mahasiswa ini
          </span>
        </CardHeader>
        <CardContent>
          {commits.length === 0 ? (
            <p className="text-xs text-app-text-secondary py-4 text-center">
              Belum ada commit khusus yang difilter untuk kontributor ini.
            </p>
          ) : (
            <div className="divide-y divide-app-border -mx-5 -my-5">
              {commits.map((commit) => (
                <div
                  key={commit.id}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-app-secondary/20 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-app-accent-primary bg-app-accent-primary/10 px-1.5 py-0.5 rounded border border-app-accent-primary/20">
                        {commit.shortSha}
                      </span>
                      <span className="text-xs font-medium text-app-text-primary">
                        {commit.message}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-app-text-secondary">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(commit.timestamp).toLocaleDateString('id-ID')}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-app-accent-positive">+{commit.stats.additions}</span>
                      <span className="font-mono text-app-accent-negative">-{commit.stats.deletions}</span>
                    </div>
                  </div>

                  {commit.classification && (
                    <StatusBadge
                      status={commit.classification.label}
                      confidence={commit.classification.confidence}
                      showConfidence
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
