import {
  AnalysisSummary,
  AnalysisHistoryItem,
  Contributor,
  Commit,
} from '../types';
import {
  MOCK_ANALYSIS_SUMMARY,
  MOCK_ANALYSIS_HISTORY,
  MOCK_CONTRIBUTORS,
  MOCK_COMMITS,
} from '../mocks';

/**
 * Cek apakah data adalah dummy (belum ada analisis real dari backend)
 * Return true hanya jika SEMUA data punya "(Contoh)" - berarti belum ada analisis real
 */
const isDummyData = (): boolean => {
  if (MOCK_CONTRIBUTORS.length === 0) return true;
  // Dummy jika semua contributor punya "(Contoh)"
  const allDummy = MOCK_CONTRIBUTORS.every(c => c.name.includes('(Contoh)'));
  return allDummy;
};

/**
 * Analysis Service
 * Mengelola hasil analisis pola kontribusi Machine Learning (YES/NO) untuk Dosen.
 */
export const analysisService = {
  /**
   * Mengambil ringkasan analisis untuk repository
   */
  async getAnalysisSummary(repositoryId: string): Promise<AnalysisSummary | null> {
    await new Promise((resolve) => setTimeout(resolve, 250));
    if (repositoryId === MOCK_ANALYSIS_SUMMARY.repositoryId) {
      return { ...MOCK_ANALYSIS_SUMMARY };
    }
    // Return summary default jika repo berbeda
    return {
      ...MOCK_ANALYSIS_SUMMARY,
      repositoryId,
      repositoryName: `repo/${repositoryId}`,
    };
  },

  /**
   * Mengambil daftar contributor beserta ringkasan metrik commit
   * Return empty jika masih dummy data
   */
  async getContributors(repositoryId?: string): Promise<Contributor[]> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (isDummyData()) return [];
    if (!repositoryId || repositoryId === 'all' || repositoryId === 'ALL') {
      return [...MOCK_CONTRIBUTORS];
    }
    return MOCK_CONTRIBUTORS.filter((c) => c.repositoryId === repositoryId);
  },

  /**
   * Mengambil detail contributor spesifik
   */
  async getContributorById(contributorId: string): Promise<Contributor | null> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const found = MOCK_CONTRIBUTORS.find((c) => c.id === contributorId);
    return found ? { ...found } : null;
  },

  /**
   * Mengambil daftar commit dengan hasil klasifikasi YES/NO
   * Return empty jika masih dummy data
   */
  async getCommits(repositoryId?: string, contributorId?: string): Promise<Commit[]> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (isDummyData()) return [];
    let list = [...MOCK_COMMITS];
    if (repositoryId) {
      list = list.filter((c) => c.repositoryId === repositoryId);
    }
    if (contributorId) {
      list = list.filter((c) => c.contributorId === contributorId);
    }
    return list;
  },

  /**
   * Mengambil detail commit spesifik
   */
  async getCommitById(commitId: string): Promise<Commit | null> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const found = MOCK_COMMITS.find((c) => c.id === commitId || c.shortSha === commitId);
    return found ? { ...found } : null;
  },

  /**
   * Mengambil riwayat aktivitas analisis yang pernah dijalankan
   * Return empty jika masih dummy data
   */
  async getHistory(): Promise<AnalysisHistoryItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return isDummyData() ? [] : [...MOCK_ANALYSIS_HISTORY];
  },
};
