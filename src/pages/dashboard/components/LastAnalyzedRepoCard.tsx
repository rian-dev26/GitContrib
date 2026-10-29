import { useNavigate } from 'react-router-dom';
import { FolderGit2, ExternalLink, Calendar, GitCommit, Users, ArrowRight } from 'lucide-react';
import { LastAnalyzedRepository } from '../../../types/dashboard';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

interface LastAnalyzedRepoCardProps {
  repository: LastAnalyzedRepository | null;
}

export function LastAnalyzedRepoCard({ repository }: LastAnalyzedRepoCardProps) {
  const navigate = useNavigate();

  if (!repository) {
    return (
      <Card className="p-6 text-center border-dashed border-app-border">
        <div className="w-10 h-10 rounded-full bg-app-secondary border border-app-border flex items-center justify-center text-app-text-secondary mx-auto mb-3">
          <FolderGit2 className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-semibold text-app-text-primary">
          Belum Ada Repository Dianalisis
        </h4>
        <p className="text-xs text-app-text-secondary max-w-sm mx-auto mt-1 mb-4">
          Mulai daftarkan repository GitHub publik untuk melakukan ekstraksi commit dan klasifikasi kontribusi.
        </p>
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/analysis')}
          leftIcon={<FolderGit2 className="w-3.5 h-3.5" />}
        >
          Mulai Analisis
        </Button>
      </Card>
    );
  }

  const formattedDate = new Date(repository.analyzedAt).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FolderGit2 className="w-4 h-4 text-app-accent-primary" />
          <CardTitle className="text-sm">Repository Terakhir Dianalisis</CardTitle>
        </div>
        <Badge variant="success" size="sm" dot>
          {repository.status === 'COMPLETED' ? 'Selesai' : repository.status}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Repo Title & External link */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-app-text-primary">
                {repository.name}
              </span>
              <span className="text-xs font-mono text-app-text-secondary">
                ({repository.defaultBranch})
              </span>
            </div>
            <p className="text-xs text-app-text-secondary mt-0.5">
              Pemilik:{' '}
              <span className="text-app-text-primary font-medium">
                {repository.owner}
              </span>
            </p>
          </div>

          <a
            href={repository.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-app-accent-primary hover:underline self-start sm:self-auto"
          >
            <span>Buka di GitHub</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Metadata stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-md bg-app-secondary/40 border border-app-border text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-app-text-secondary shrink-0" />
            <div>
              <span className="text-[11px] text-app-text-secondary block">Waktu Analisis</span>
              <span className="font-medium text-app-text-primary">{formattedDate} WIB</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-app-accent-primary shrink-0" />
            <div>
              <span className="text-[11px] text-app-text-secondary block">Histori Commit</span>
              <span className="font-mono font-medium text-app-text-primary">
                {repository.totalCommits} commits
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-app-accent-secondary shrink-0" />
            <div>
              <span className="text-[11px] text-app-text-secondary block">Kontributor</span>
              <span className="font-mono font-medium text-app-text-primary">
                {repository.totalContributors} mahasiswa
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-1">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/repositories/${repository.id}`)}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Lihat Hasil Analisis Lengkap
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
