import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  Check,
  Calendar,
  GitBranch,
  FolderGit2,
  User,
} from 'lucide-react';
import { Commit, Repository } from '../../../types';

interface CommitHeaderProps {
  commit: Commit;
  repository: Repository | null;
}

export function CommitHeader({ commit, repository }: CommitHeaderProps) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopySha = useCallback(() => {
    navigator.clipboard.writeText(commit.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [commit.id]);

  const repoId = repository?.id || commit.repositoryId || 'repo-pbl-01';
  const repoName = repository?.name || 'smart-inventory-pbl';
  const repoFullName = repository?.fullName || `if-polibatam/${repoName}`;
  const branch = repository?.defaultBranch || 'main';

  // Format tanggal & waktu lengkap
  const dateObj = new Date(commit.timestamp);
  const formattedDate = dateObj.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const formattedTime = dateObj.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-4">
      {/* ─── Breadcrumb & Navigation Actions ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-app-text-secondary">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-app-secondary/60 hover:bg-app-secondary border border-app-border text-app-text-primary transition-colors font-medium cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-app-accent-primary" />
            Kembali
          </button>
          <span className="text-app-border">/</span>
          <Link
            to={`/repositories/${repoId}`}
            className="hover:text-app-text-primary transition-colors"
          >
            {repoName}
          </Link>
          <span className="text-app-border">/</span>
          <Link
            to={`/contributors/${commit.contributorId}`}
            className="hover:text-app-text-primary transition-colors"
          >
            {commit.contributorName}
          </Link>
          <span className="text-app-border">/</span>
          <span className="font-mono text-app-text-primary font-medium">{commit.shortSha}</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/contributors/${commit.contributorId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-app-border bg-app-card hover:bg-app-secondary text-app-text-primary transition-colors shadow-sm"
          >
            <User className="w-3.5 h-3.5 text-app-accent-secondary" />
            Profil Kontributor
          </Link>
          <Link
            to={`/repositories/${repoId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-app-border bg-app-card hover:bg-app-secondary text-app-text-primary transition-colors shadow-sm"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-app-accent-primary" />
            Lihat di Repository
          </Link>
        </div>
      </div>

      {/* ─── Commit Main Title Card ─────────────────────────────────────────── */}
      <div className="bg-app-card border border-app-border rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
        {/* Top line: SHA & Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold text-app-accent-primary bg-app-accent-primary/10 px-2.5 py-1 rounded border border-app-accent-primary/20">
              commit {commit.shortSha}
            </span>

            <button
              type="button"
              onClick={handleCopySha}
              className="inline-flex items-center gap-1.5 text-xs text-app-text-secondary hover:text-app-text-primary px-2 py-1 rounded hover:bg-app-secondary border border-transparent hover:border-app-border transition-colors cursor-pointer"
              title="Salin Full SHA"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-medium">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="font-mono text-[11px] hidden sm:inline">{commit.id.slice(0, 16)}...</span>
                  <span className="text-[11px]">Salin SHA</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/repositories/${repoId}`}
              className="flex items-center gap-1.5 text-xs font-medium text-app-text-secondary hover:text-app-text-primary px-2.5 py-1 rounded bg-app-secondary/50 border border-app-border transition-colors"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-app-accent-primary" />
              <span>{repoFullName}</span>
            </Link>
            <span className="inline-flex items-center gap-1 text-xs font-mono px-2 py-1 rounded bg-app-secondary/50 border border-app-border text-app-text-secondary">
              <GitBranch className="w-3 h-3 text-app-accent-primary" />
              {branch}
            </span>
          </div>
        </div>

        {/* Commit Message Heading */}
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-app-text-primary leading-snug">
            {commit.message}
          </h1>
        </div>

        {/* Metadata Footer: Author & Timestamp */}
        <div className="pt-3 border-t border-app-border/60 flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-xs text-app-text-secondary">
          {/* Author */}
          <div className="flex items-center gap-2">
            <Link
              to={`/contributors/${commit.contributorId}`}
              className="group flex items-center gap-2 text-app-text-primary hover:text-app-accent-primary transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-app-accent-secondary/20 border border-app-accent-secondary/30 flex items-center justify-center text-[11px] font-bold text-app-accent-secondary">
                {commit.contributorName[0] || 'U'}
              </div>
              <span className="font-semibold group-hover:underline">
                {commit.contributorName}
              </span>
            </Link>
            <span className="text-app-text-secondary/70">committed</span>
            <span className="font-mono text-[11px] text-app-text-secondary">
              ({commit.contributorEmail})
            </span>
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-1.5 text-app-text-secondary">
            <Calendar className="w-3.5 h-3.5 text-app-accent-primary" />
            <span>
              {formattedDate}, pukul {formattedTime} WIB
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
