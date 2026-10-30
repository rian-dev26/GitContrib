import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Github,
  GitBranch,
  FolderGit2,
  Mail,
  UserCheck,
  Calendar,
} from 'lucide-react';
import { Contributor, Repository } from '../../../types';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

interface ContributorHeaderProps {
  contributor: Contributor;
  repository: Repository | null;
  activeDaysCount: number;
  durationLabel: string;
}

export function ContributorHeader({
  contributor,
  repository,
  activeDaysCount,
  durationLabel,
}: ContributorHeaderProps) {
  // Ambil inisial nama
  const initials = contributor.name
    .replace(/\s*\(Contoh\)\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  const repoId = repository?.id || contributor.repositoryId || 'repo-pbl-01';
  const repoName = repository?.name || 'smart-inventory-pbl';
  const repoFullName = repository?.fullName || `if-polibatam/${repoName}`;
  const branch = repository?.defaultBranch || 'main';

  return (
    <div className="space-y-4">
      {/* Navigation & Back Action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-app-text-secondary">
          <Link
            to="/contributors"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-app-secondary/60 hover:bg-app-secondary border border-app-border text-app-text-primary transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-app-accent-primary" />
            Daftar Kontributor
          </Link>
          <span className="text-app-border">/</span>
          <Link
            to={`/repositories/${repoId}`}
            className="hover:text-app-text-primary transition-colors"
          >
            {repoName}
          </Link>
          <span className="text-app-border">/</span>
          <span className="text-app-text-primary font-medium">{contributor.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`https://github.com/${contributor.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-app-border bg-app-card hover:bg-app-secondary text-app-text-primary transition-colors shadow-sm"
          >
            <Github className="w-3.5 h-3.5" />
            Profil GitHub
          </a>
          <Link to={`/repositories/${repoId}`}>
            <Button variant="outline" size="sm" leftIcon={<FolderGit2 className="w-3.5 h-3.5" />}>
              Detail Repo
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Profile Card */}
      <div className="bg-app-card border border-app-border rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            {/* Avatar Inisial */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-app-accent-primary/20 via-app-accent-secondary/15 to-app-accent-primary/5 border border-app-accent-primary/30 flex items-center justify-center text-app-accent-primary text-xl font-bold shrink-0 shadow-inner">
              {initials || 'U'}
            </div>

            {/* Profile Info */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-app-text-primary">
                  {contributor.name}
                </h1>
                <Badge variant="primary" className="text-[11px] font-medium">
                  <UserCheck className="w-3 h-3 mr-1 inline" />
                  Mahasiswa PBL
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-app-text-secondary">
                <span className="font-mono text-app-text-primary font-medium">
                  @{contributor.username}
                </span>
                <span className="inline-flex items-center gap-1 text-app-text-secondary">
                  <Mail className="w-3.5 h-3.5 text-app-text-secondary/70" />
                  {contributor.email}
                </span>
                <span className="inline-flex items-center gap-1 text-app-text-secondary">
                  <Calendar className="w-3.5 h-3.5 text-app-text-secondary/70" />
                  {durationLabel} ({activeDaysCount} hari aktif)
                </span>
              </div>
            </div>
          </div>

          {/* Connected Repository Pill */}
          <div className="w-full sm:w-auto p-3 bg-app-secondary/40 border border-app-border rounded-lg flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-app-accent-primary/10 border border-app-accent-primary/20 flex items-center justify-center text-app-accent-primary">
                <FolderGit2 className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <p className="text-[11px] text-app-text-secondary leading-none">Repository PBL</p>
                <p className="text-xs font-semibold text-app-text-primary mt-0.5">{repoFullName}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-app-secondary border border-app-border text-app-text-secondary">
              <GitBranch className="w-3 h-3 text-app-accent-primary" />
              {branch}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
