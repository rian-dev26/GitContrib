/**
 * Type definitions for GitContrib
 * Sistem Analisis Pola Kontribusi pada Repository GitHub Berbasis Machine Learning
 */

/**
 * Nilai klasifikasi model Machine Learning untuk setiap commit.
 * Catatan penting: Klasifikasi YES/NO adalah indikasi pola kontribusi dalam histori Git,
 * BUKAN nilai akademik dan tidak boleh langsung diartikan sebagai mahasiswa rajin atau malas.
 */
export type ContributionClassification = 'YES' | 'NO';

export interface ModelMetadata {
  modelVersion?: string;
  algorithm?: string;
  evaluatedAt?: string;
  featuresUsed?: string[];
}

export interface ClassificationResult {
  label: ContributionClassification;
  confidence?: number; // e.g. 0.85 (85%) jika tersedia
  metadata?: ModelMetadata;
}

export interface CommitFileChange {
  filename: string;
  additions: number;
  deletions: number;
  changes: number;
}

export interface Commit {
  id: string; // Commit SHA
  shortSha: string;
  repositoryId: string;
  contributorId: string;
  contributorName: string;
  contributorEmail: string;
  message: string;
  timestamp: string; // ISO date string
  stats: {
    additions: number;
    deletions: number;
    totalChanges: number;
    filesChanged: number;
  };
  files?: CommitFileChange[];
  classification?: ClassificationResult;
}

export interface Contributor {
  id: string;
  name: string;
  username: string; // GitHub username
  email: string;
  avatarUrl?: string;
  repositoryId: string;
  metrics: {
    totalCommits: number;
    classifiedYesCount: number;
    classifiedNoCount: number;
    yesRatio: number; // 0.0 - 1.0 (proporsi commit terklasifikasi YES)
    firstCommitDate: string;
    lastCommitDate: string;
    totalAdditions: number;
    totalDeletions: number;
  };
}

export interface Repository {
  id: string;
  name: string;
  fullName: string; // owner/repo
  url: string;
  defaultBranch: string;
  description?: string;
  isPrivate: boolean; // Repository versi awal adalah public
  createdAt: string;
  lastAnalyzedAt?: string;
  stats?: {
    totalCommits: number;
    totalContributors: number;
    branchesCount: number;
  };
}

export interface ContributorSummary {
  contributorId: string;
  contributorName: string;
  username: string;
  totalCommits: number;
  yesCommits: number;
  noCommits: number;
  yesPercentage: number;
}

export interface AnalysisSummary {
  id: string;
  repositoryId: string;
  repositoryName: string;
  analyzedAt: string;
  branch: string;
  totalCommitsAnalyzed: number;
  totalContributors: number;
  overallYesRatio: number;
  overallNoRatio: number;
  contributorsSummary: ContributorSummary[];
  timeframe: {
    from: string;
    to: string;
  };
  notice: string; // Catatan etis terkait hasil analisis
}

export interface AnalysisHistoryItem {
  id: string;
  repositoryId: string;
  repositoryName: string;
  repositoryUrl?: string;
  branch: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED';
  startedAt: string;
  completedAt?: string;
  totalCommits: number;
  totalContributors: number;
  triggeredBy: string; // Dosen user ID/name
}
