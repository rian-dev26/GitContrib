import { ContributionClassification } from './index';

/**
 * Tipe data untuk halaman Dashboard GitContrib
 */

export interface DashboardStatCardData {
  label: string;
  value: number;
  subText?: string;
  iconType: 'commits' | 'contributors' | 'yes' | 'no';
}

export interface ClassificationDistribution {
  label: ContributionClassification;
  count: number;
  percentage: number;
  color: string;
}

export interface ClassificationSummary {
  totalAnalyzed: number;
  yesCount: number;
  noCount: number;
  unclassifiedCount: number;
  yesPercentage: number;
  noPercentage: number;
  distribution: ClassificationDistribution[];
  notice: string;
}

export interface DailyCommitActivity {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4; // Intensitas aktivitas: 0 (0), 1 (1-2), 2 (3-4), 3 (5-7), 4 (8+)
}

export interface DashboardContributorItem {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  totalCommits: number;
  activeDays: number;
  linesAdded: number;
  linesDeleted: number;
  yesCount: number;
  noCount: number;
}

export interface DashboardRecentCommit {
  id: string; // SHA
  shortSha: string;
  message: string;
  contributorName: string;
  contributorUsername: string;
  timestamp: string;
  classification: ContributionClassification;
  linesChanged: number;
}

export interface LastAnalyzedRepository {
  id: string;
  name: string;
  owner: string;
  fullName: string;
  url: string;
  analyzedAt: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED';
  totalCommits: number;
  totalContributors: number;
  defaultBranch: string;
}

export interface DashboardData {
  lastUpdated: string;
  isPrototype: boolean;
  repository: LastAnalyzedRepository | null;
  statistics: {
    totalCommits: number;
    totalContributors: number;
    yesPredictions: number;
    noPredictions: number;
    unclassified: number;
  };
  classification: ClassificationSummary;
  heatmapActivities: DailyCommitActivity[];
  contributors: DashboardContributorItem[];
  recentCommits: DashboardRecentCommit[];
}

// Type aliases for strict naming compliance
export type DashboardSummary = DashboardData;
export type ContributorSummaryItem = DashboardContributorItem;
export type RecentCommit = DashboardRecentCommit;
export type RepositorySummary = LastAnalyzedRepository;
