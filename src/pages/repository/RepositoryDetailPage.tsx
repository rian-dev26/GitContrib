import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FolderGit2,
  GitCommit,
  Users,
  ExternalLink,
  Calendar,
  User,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { MetricCard } from '../../components/common/MetricCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';
import { ErrorState } from '../../components/ui/ErrorState';
import { repositoryService } from '../../services/repositoryService';
import { analysisService } from '../../services/analysisService';
import { Repository, Contributor, Commit } from '../../types';

export function RepositoryDetailPage() {
  const { repositoryId = 'repo-pbl-01' } = useParams();
  const [repo, setRepo] = useState<Repository | null>(null);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [repoData, contribsData, commitsData] = await Promise.all([
          repositoryService.getRepositoryById(repositoryId),
          analysisService.getContributors(repositoryId),
          analysisService.getCommits(repositoryId),
        ]);
        setRepo(
          repoData || {
            id: repositoryId,
            name: repositoryId,
            fullName: `pbl/${repositoryId}`,
            url: `https://github.com/pbl/${repositoryId}`,
            defaultBranch: 'main',
            isPrivate: false,
            createdAt: new Date().toISOString(),
          }
        );
        setContributors(contribsData);
        setCommits(commitsData);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [repositoryId]);

  if (isLoading) {
    return <LoadingIndicator text="Memuat data analisis repository..." fullScreen={false} className="py-24" />;
  }

  if (!repo) {
    return <ErrorState title="Repository Tidak Ditemukan" description="Repository yang Anda cari tidak tersedia dalam basis data." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={repo.name}
        description={repo.description || `Analisis histori Git untuk repository ${repo.fullName}`}
        badge={
          <Badge variant="outline" size="md">
            branch: {repo.defaultBranch}
          </Badge>
        }
        actions={
          <a
            href={repo.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-app-border text-xs text-app-text-secondary hover:text-app-text-primary hover:bg-app-secondary transition-colors"
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            Buka di GitHub
            <ExternalLink className="w-3 h-3" />
          </a>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Total Mahasiswa Terdeteksi"
          value={contributors.length}
          subValue="Kontributor aktif repository"
          icon={<Users className="w-4 h-4 text-app-accent-secondary" />}
        />
        <MetricCard
          label="Total Commit Tercatat"
          value={repo.stats?.totalCommits ?? commits.length}
          subValue="Histori Git teranalisis"
          icon={<GitCommit className="w-4 h-4 text-app-accent-primary" />}
        />
        <MetricCard
          label="Status Model ML"
          value="Supervised v0.1"
          subValue="YES/NO commit level classifier"
          icon={<Badge variant="success" size="sm">Active</Badge>}
        />
      </div>

      {/* Contributors Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Kontributor Mahasiswa (PBL)</CardTitle>
          <span className="text-xs text-app-text-secondary">
            Ringkasan kontribusi dan rasio klasifikasi commit YES
          </span>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-app-secondary/50 text-app-text-secondary border-b border-app-border font-medium">
              <tr>
                <th className="py-3 px-4">Nama & Username</th>
                <th className="py-3 px-4">Total Commit</th>
                <th className="py-3 px-4">Klasifikasi YES</th>
                <th className="py-3 px-4">Klasifikasi NO</th>
                <th className="py-3 px-4">Rasio YES</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border">
              {contributors.map((c) => (
                <tr key={c.id} className="hover:bg-app-secondary/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-app-text-primary">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-app-secondary flex items-center justify-center text-app-text-secondary border border-app-border">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div>{c.name}</div>
                        <div className="text-[11px] text-app-text-secondary">@{c.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono">{c.metrics.totalCommits}</td>
                  <td className="py-3 px-4 font-mono text-app-accent-positive">
                    {c.metrics.classifiedYesCount}
                  </td>
                  <td className="py-3 px-4 font-mono text-app-accent-negative">
                    {c.metrics.classifiedNoCount}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-app-secondary overflow-hidden">
                        <div
                          className="h-full bg-app-accent-positive rounded-full"
                          style={{ width: `${Math.round(c.metrics.yesRatio * 100)}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px]">
                        {Math.round(c.metrics.yesRatio * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/contributors/${c.id}`}
                      className="inline-flex items-center gap-1 text-app-accent-primary hover:underline font-medium"
                    >
                      Detail <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Commits List Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Histori Commit & Hasil Klasifikasi Model</CardTitle>
          <span className="text-xs text-app-text-secondary">
            Tingkat commit individual dengan status prediksi YES/NO
          </span>
        </CardHeader>
        <div className="divide-y divide-app-border">
          {commits.map((commit) => (
            <div
              key={commit.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-app-secondary/20 transition-colors"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-app-accent-primary bg-app-accent-primary/10 px-1.5 py-0.5 rounded border border-app-accent-primary/20">
                    {commit.shortSha}
                  </span>
                  <span className="text-xs font-medium text-app-text-primary truncate">
                    {commit.message}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-app-text-secondary">
                  <span>Oleh: {commit.contributorName}</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(commit.timestamp).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <span>•</span>
                  <span className="font-mono text-app-accent-positive">+{commit.stats.additions}</span>
                  <span className="font-mono text-app-accent-negative">-{commit.stats.deletions}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {commit.classification && (
                  <StatusBadge
                    status={commit.classification.label}
                    confidence={commit.classification.confidence}
                    showConfidence
                  />
                )}
                <Link
                  to={`/commits/${commit.id}`}
                  className="text-xs text-app-text-secondary hover:text-app-text-primary px-2.5 py-1 rounded bg-app-secondary border border-app-border"
                >
                  Inspeksi
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
