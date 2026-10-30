import {
  Repository,
  Contributor,
  Commit,
  AnalysisSummary,
  AnalysisHistoryItem,
} from '../types';

/**
 * MOCKS KOSONG - Semua dummy data telah dihapus.
 * Data hanya diisi otomatis saat backend menyelesaikan analisis repository.
 * 
 * Frontend hanya menampilkan data real dari backend, tidak ada fallback dummy.
 */

export const MOCK_REPOSITORIES: Repository[] = [];

export const MOCK_CONTRIBUTORS: Contributor[] = [];

export const MOCK_COMMITS: Commit[] = [];

export const MOCK_ANALYSIS_HISTORY: AnalysisHistoryItem[] = [];

export const MOCK_ANALYSIS_SUMMARY: AnalysisSummary = {
  id: '',
  repositoryId: '',
  repositoryName: '',
  analyzedAt: '',
  branch: '',
  totalCommitsAnalyzed: 0,
  totalContributors: 0,
  overallYesRatio: 0,
  overallNoRatio: 0,
  contributorsSummary: [],
  timeframe: {
    from: '',
    to: '',
  },
  notice: 'Belum ada data analisis. Mulai analisis repository untuk melihat hasil di sini.',
};

