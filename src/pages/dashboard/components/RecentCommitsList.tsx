import { Link, useNavigate } from 'react-router-dom';
import { GitCommitHorizontal, Calendar, ArrowRight, User } from 'lucide-react';
import { DashboardRecentCommit } from '../../../types/dashboard';
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Button } from '../../../components/ui/Button';

interface RecentCommitsListProps {
  commits: DashboardRecentCommit[];
}

export function RecentCommitsList({ commits }: RecentCommitsListProps) {
  const navigate = useNavigate();

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCommitHorizontal className="w-4 h-4 text-app-accent-primary" />
          <CardTitle className="text-sm">Aktivitas Commit Terbaru</CardTitle>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/commits/demo')}
          className="text-xs"
          rightIcon={<ArrowRight className="w-3 h-3" />}
        >
          Lihat Semua Commit
        </Button>
      </CardHeader>

      <div className="divide-y divide-app-border">
        {commits.map((commit) => (
          <div
            key={commit.id}
            onClick={() => navigate(`/commits/${commit.id}`)}
            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-app-secondary/30 transition-colors cursor-pointer group"
          >
            {/* Commit Message & Short Hash */}
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-semibold text-app-accent-primary bg-app-accent-primary/10 px-2 py-0.5 rounded border border-app-accent-primary/25 shrink-0">
                  {commit.shortSha}
                </span>
                <span className="text-xs font-medium text-app-text-primary group-hover:text-app-accent-primary transition-colors line-clamp-1">
                  {commit.message}
                </span>
              </div>

              {/* Contributor & Timestamp */}
              <div className="flex items-center gap-3 text-[11px] text-app-text-secondary flex-wrap">
                <span className="inline-flex items-center gap-1 font-medium text-app-text-primary/90">
                  <User className="w-3 h-3 text-app-text-secondary" />
                  {commit.contributorName}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(commit.timestamp)}
                </span>
                <span>•</span>
                <span className="text-app-text-secondary">
                  {commit.linesChanged} baris berubah
                </span>
              </div>
            </div>

            {/* Classification Badge & Detail Button */}
            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
              <StatusBadge status={commit.classification} />

              <Link
                to={`/commits/${commit.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs px-2.5 py-1 rounded bg-app-secondary border border-app-border text-app-text-secondary group-hover:text-app-text-primary group-hover:border-app-accent-primary/40 transition-colors"
              >
                Detail
              </Link>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
