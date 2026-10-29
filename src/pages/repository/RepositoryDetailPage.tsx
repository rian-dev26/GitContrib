import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FolderGit2,
  GitCommit,
  Users,
  ExternalLink,
  User,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Info,
  Calendar,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { MetricCard } from '../../components/common/MetricCard';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';
import { ErrorState } from '../../components/ui/ErrorState';
import { repositoryService } from '../../services/repositoryService';
import { analysisService } from '../../services/analysisService';
import { Repository, Contributor, Commit } from '../../types';
import { CommitTable } from './components/CommitTable';

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

  // ─── Ringkasan total keseluruhan ─────────────────────────────────────────
  const totalYes = useMemo(
    () => commits.filter((c) => c.classification?.label === 'YES').length,
    [commits]
  );
  const totalNo = useMemo(
    () => commits.filter((c) => c.classification?.label === 'NO').length,
    [commits]
  );

  // ─── Tanggal rentang analisis dari commit ─────────────────────────────────
  const dateRange = useMemo(() => {
    if (!commits.length) return null;
    const timestamps = commits.map((c) => new Date(c.timestamp).getTime());
    const from = new Date(Math.min(...timestamps));
    const to = new Date(Math.max(...timestamps));
    return {
      from: from.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      to: to.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
    };
  }, [commits]);

  if (isLoading) {
    return <LoadingIndicator text="Memuat data analisis repository..." fullScreen={false} className="py-24" />;
  }

  if (!repo) {
    return <ErrorState title="Repository Tidak Ditemukan" description="Repository yang Anda cari tidak tersedia dalam basis data." />;
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ─────────────────────────────────────────── */}
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

      {/* ─── Ringkasan Global (Card Stat) ───────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          label="Total Commit"
          value={commits.length}
          subValue="Commit teranalisis"
          icon={<GitCommit className="w-4 h-4 text-app-accent-primary" />}
        />
        <MetricCard
          label="Kontributor"
          value={contributors.length}
          subValue="Mahasiswa aktif"
          icon={<Users className="w-4 h-4 text-app-accent-secondary" />}
        />
        <MetricCard
          label="Klasifikasi YES"
          value={totalYes}
          subValue={`${commits.length ? Math.round((totalYes / commits.length) * 100) : 0}% dari total`}
          icon={<CheckCircle2 className="w-4 h-4 text-app-accent-positive" />}
        />
        <MetricCard
          label="Klasifikasi NO"
          value={totalNo}
          subValue={`${commits.length ? Math.round((totalNo / commits.length) * 100) : 0}% dari total`}
          icon={<XCircle className="w-4 h-4 text-app-accent-negative" />}
        />
      </div>

      {/* ─── Info Rentang Waktu Analisis ────────────────────── */}
      {dateRange && (
        <div className="flex items-center gap-2 p-2.5 px-4 rounded-md bg-app-secondary/50 border border-app-border text-xs text-app-text-secondary">
          <Calendar className="w-3.5 h-3.5 text-app-accent-primary shrink-0" />
          <span>
            Rentang commit repository:{' '}
            <strong className="text-app-text-primary">{dateRange.from}</strong>
            {' '}&ndash;{' '}
            <strong className="text-app-text-primary">{dateRange.to}</strong>
          </span>
          <span className="ml-auto flex items-center gap-1 italic text-app-text-secondary/70 text-[11px]">
            <Info className="w-3 h-3" />
            Data simulasi prototype
          </span>
        </div>
      )}

      {/* ─── Tabel Commit Lengkap ────────────────────────────── */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Histori Commit & Hasil Klasifikasi Model</CardTitle>
            <CardDescription>
              Seluruh commit dianalisis pada tingkat individual. Gunakan filter, pencarian, dan sorting untuk eksplorasi data.
            </CardDescription>
          </div>
          <Badge variant="outline" size="sm" className="bg-app-accent-primary/10 border-app-accent-primary/30 text-app-accent-primary shrink-0">
            {commits.length} Commit
          </Badge>
        </CardHeader>
        <CardContent>
          <CommitTable commits={commits} repositoryId={repositoryId} />
        </CardContent>
      </Card>

      {/* ─── Tabel Kontributor ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Ringkasan per Kontributor Mahasiswa</CardTitle>
            <CardDescription>
              Agregasi klasifikasi commit berdasarkan identitas mahasiswa PBL.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-app-secondary/50 text-app-text-secondary border-b border-app-border font-medium">
                <tr>
                  <th className="py-3 px-4">Nama &amp; Username</th>
                  <th className="py-3 px-4 text-right">Total Commit</th>
                  <th className="py-3 px-4 text-right">Klasifikasi YES</th>
                  <th className="py-3 px-4 text-right">Klasifikasi NO</th>
                  <th className="py-3 px-4">Rasio YES</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {contributors.map((c) => (
                  <tr key={c.id} className="hover:bg-app-secondary/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-app-text-primary">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-app-secondary flex items-center justify-center text-app-text-secondary border border-app-border shrink-0">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div>{c.name.replace(' (Contoh)', '')}</div>
                          <div className="text-[11px] text-app-text-secondary">@{c.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-right text-emerald-500 dark:text-emerald-400 font-semibold">
                      {c.metrics.classifiedYesCount}
                    </td>
                    <td className="py-3 px-4 font-mono text-right text-rose-500 dark:text-rose-400 font-semibold">
                      {c.metrics.classifiedNoCount}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-app-secondary overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.round(c.metrics.yesRatio * 100)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-app-text-primary">
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
        </CardContent>
      </Card>

      {/* ─── Ethical Notice ──────────────────────────────────── */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-md border border-app-accent-secondary/30 bg-app-accent-secondary/5 text-xs text-app-text-secondary">
        <Info className="w-4 h-4 text-app-accent-secondary shrink-0 mt-0.5" />
        <span>
          <strong className="text-app-text-primary">Catatan Etis:</strong>{' '}
          Hasil klasifikasi YES/NO merupakan indikasi estimasi pola kontribusi commit berbasis model prototype.
          Hasil ini bukan representasi tunggal dari dedikasi atau nilai akademik mahasiswa dan tidak boleh
          digunakan sebagai satu-satunya dasar penilaian.
        </span>
      </div>
    </div>
  );
}
