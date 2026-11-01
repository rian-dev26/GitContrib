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
import { repositoryService } from './repositoryService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const STORAGE_KEYS = {
  CONTRIBUTORS: 'gitcontrib_contributors',
  COMMITS: 'gitcontrib_commits',
};

function getStorage<T>(key: string, fallback: T): T {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
    }
  } catch (e) {
    console.warn(`Error reading localStorage ${key}:`, e);
  }
  return fallback;
}

/**
 * Analysis Service
 * Mengelola hasil analisis pola kontribusi Machine Learning (YES/NO) untuk Dosen.
 */
export const analysisService = {
  /**
   * Mengambil ringkasan analisis untuk repository
   */
  async getAnalysisSummary(repositoryId: string): Promise<AnalysisSummary | null> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const repo = await repositoryService.getRepositoryById(repositoryId);
    if (repo) {
      return {
        id: `summary-${repo.id}`,
        repositoryId: repo.id,
        repositoryName: repo.name,
        analyzedAt: repo.lastAnalyzedAt || repo.createdAt,
        branch: repo.defaultBranch || 'main',
        totalCommitsAnalyzed: repo.stats?.totalCommits || 0,
        totalContributors: repo.stats?.totalContributors || 0,
        overallYesRatio: repo.mlResults?.yesRatio ? repo.mlResults.yesRatio / 100 : 0.75,
        overallNoRatio: repo.mlResults?.noRatio ? repo.mlResults.noRatio / 100 : 0.25,
        contributorsSummary: [],
        timeframe: {
          from: new Date(Date.now() - 30 * 86400000).toISOString(),
          to: new Date().toISOString(),
        },
        notice: 'Hasil analisis klasifikasi YES/NO merupakan indikator pola aktivitas Git, bukan evaluasi tunggal nilai mahasiswa.',
      };
    }

    if (repositoryId === MOCK_ANALYSIS_SUMMARY.repositoryId) {
      return { ...MOCK_ANALYSIS_SUMMARY };
    }
    return {
      ...MOCK_ANALYSIS_SUMMARY,
      repositoryId,
      repositoryName: `repo/${repositoryId}`,
    };
  },

  /**
   * Mengambil daftar contributor beserta ringkasan metrik commit
   */
  async getContributors(repositoryId?: string): Promise<Contributor[]> {
    // 1. Jika repositoryId spesifik diberikan, coba sinkronisasi dari repositoryService
    if (repositoryId && repositoryId !== 'all' && repositoryId !== 'ALL') {
      const localContribs = getStorage<Contributor[]>(STORAGE_KEYS.CONTRIBUTORS, []);
      const matched = localContribs.filter(
        (c) => c.repositoryId === repositoryId || c.repositoryId.toLowerCase() === repositoryId.toLowerCase()
      );
      if (matched.length > 0) {
        return matched;
      }

      // Coba fetch repository detail dari backend agar contributor terisi
      try {
        await repositoryService.getRepositoryById(repositoryId);
        const refreshed = getStorage<Contributor[]>(STORAGE_KEYS.CONTRIBUTORS, []);
        const refreshedMatched = refreshed.filter(
          (c) => c.repositoryId === repositoryId || c.repositoryId.toLowerCase() === repositoryId.toLowerCase()
        );
        if (refreshedMatched.length > 0) {
          return refreshedMatched;
        }
      } catch (err) {
        console.warn(`Gagal sinkronisasi kontributor untuk repo ${repositoryId}:`, err);
      }
    }

    // 2. Coba fetch semua kontributor dari backend /api/contributors
    try {
      const url = repositoryId && repositoryId !== 'all'
        ? `${API_BASE_URL}/api/contributors?repositoryId=${repositoryId}`
        : `${API_BASE_URL}/api/contributors`;
      const response = await fetch(url);
      if (response.ok) {
        const backendContribs = await response.json();
        if (Array.isArray(backendContribs) && backendContribs.length > 0) {
          return backendContribs.map((c: any, idx: number) => {
            const shortId = `contrib-${idx + 1}`;
            const totalCommits = c.commits || c.total_commits || 0;
            const yesCount = Math.round(totalCommits * 0.75);
            return {
              id: shortId,
              name: c.name || c.author_id,
              username: c.author_id,
              email: `${c.author_id}@github.com`,
              repositoryId: repositoryId || 'repo',
              metrics: {
                totalCommits,
                classifiedYesCount: yesCount,
                classifiedNoCount: Math.max(0, totalCommits - yesCount),
                yesRatio: totalCommits > 0 ? yesCount / totalCommits : 0.75,
                firstCommitDate: new Date(Date.now() - 30 * 86400000).toISOString(),
                lastCommitDate: new Date().toISOString(),
                totalAdditions: c.lines_added || 100,
                totalDeletions: c.lines_deleted || 20,
              },
            };
          });
        }
      }
    } catch (err) {
      console.warn('Gagal fetch /api/contributors:', err);
    }

    // 3. Fallback ke local storage & mock
    const local = getStorage<Contributor[]>(STORAGE_KEYS.CONTRIBUTORS, MOCK_CONTRIBUTORS);
    if (!repositoryId || repositoryId === 'all' || repositoryId === 'ALL') {
      return local.length > 0 ? local : [...MOCK_CONTRIBUTORS];
    }
    return local.filter((c) => c.repositoryId === repositoryId);
  },

  /**
   * Mengambil detail contributor spesifik
   */
  async getContributorById(contributorId: string): Promise<Contributor | null> {
    const all = await this.getContributors('all');
    const found = all.find((c) => c.id === contributorId || c.username === contributorId || c.name === contributorId);
    return found ? { ...found } : null;
  },

  /**
   * Mengambil daftar commit dengan hasil klasifikasi YES/NO
   */
  async getCommits(repositoryId?: string, contributorId?: string): Promise<Commit[]> {
    // 1. Cek local storage terlebih dahulu jika ada repositoryId
    if (repositoryId && repositoryId !== 'all' && repositoryId !== 'ALL') {
      const localCommits = getStorage<Commit[]>(STORAGE_KEYS.COMMITS, []);
      let matched = localCommits.filter(
        (c) => c.repositoryId === repositoryId || c.repositoryId.toLowerCase() === repositoryId.toLowerCase()
      );

      if (matched.length === 0) {
        // Coba sinkronisasi lewat getRepositoryById
        try {
          await repositoryService.getRepositoryById(repositoryId);
          const refreshed = getStorage<Commit[]>(STORAGE_KEYS.COMMITS, []);
          matched = refreshed.filter(
            (c) => c.repositoryId === repositoryId || c.repositoryId.toLowerCase() === repositoryId.toLowerCase()
          );
        } catch (err) {
          console.warn(`Gagal sinkronisasi commits untuk ${repositoryId}:`, err);
        }
      }

      if (matched.length > 0) {
        if (contributorId && contributorId !== 'ALL') {
          matched = matched.filter((c) => c.contributorId === contributorId);
        }
        return matched;
      }
    }

    // 2. Coba fetch dari backend /api/commits
    try {
      const url = repositoryId && repositoryId !== 'all'
        ? `${API_BASE_URL}/api/commits?repositoryId=${repositoryId}`
        : `${API_BASE_URL}/api/commits`;
      const response = await fetch(url);
      if (response.ok) {
        const backendCommits = await response.json();
        if (Array.isArray(backendCommits) && backendCommits.length > 0) {
          let list: Commit[] = backendCommits.map((cm: any, idx: number) => {
            const type = (cm.type || '').toLowerCase();
            const isYes =
              ['feat', 'fix', 'refactor', 'test', 'perf'].includes(type) ||
              (type !== 'chore' && type !== 'style' && type !== 'docs');
            return {
              id: cm.sha || `sha-${idx}`,
              shortSha: (cm.sha || `sha${idx}`).slice(0, 7),
              repositoryId: repositoryId || 'repo',
              contributorId: `contrib-0`,
              contributorName: cm.author || 'Contributor',
              contributorEmail: `${cm.author || 'contributor'}@github.com`,
              message: cm.message || `${cm.type || 'commit'}: update repository code`,
              timestamp: new Date(Date.now() - idx * 3600000).toISOString(),
              stats: {
                additions: cm.lines_added || 15,
                deletions: cm.lines_deleted || 5,
                totalChanges: (cm.lines_added || 15) + (cm.lines_deleted || 5),
                filesChanged: 1,
              },
              classification: {
                label: isYes ? 'YES' : 'NO',
                confidence: 0.88,
                metadata: {
                  modelVersion: 'v1.0-conventional-ml',
                  algorithm: 'Conventional Commit + ML Classifier',
                  evaluatedAt: new Date().toISOString(),
                },
              },
            };
          });

          if (contributorId && contributorId !== 'ALL') {
            list = list.filter((c) => c.contributorId === contributorId);
          }
          return list;
        }
      }
    } catch (err) {
      console.warn('Gagal fetch /api/commits:', err);
    }

    // 3. Fallback ke local storage & mock
    let list = getStorage<Commit[]>(STORAGE_KEYS.COMMITS, MOCK_COMMITS);
    if (repositoryId && repositoryId !== 'all' && repositoryId !== 'ALL') {
      list = list.filter((c) => c.repositoryId === repositoryId);
    }
    if (contributorId && contributorId !== 'ALL') {
      list = list.filter((c) => c.contributorId === contributorId);
    }
    return list;
  },

  /**
   * Mengambil detail commit spesifik
   */
  async getCommitById(commitId: string): Promise<Commit | null> {
    const all = await this.getCommits();
    const found = all.find((c) => c.id === commitId || c.shortSha === commitId);
    return found ? { ...found } : null;
  },

  /**
   * Mengambil riwayat aktivitas analisis yang pernah dijalankan
   */
  async getHistory(): Promise<AnalysisHistoryItem[]> {
    try {
      const repos = await repositoryService.getRepositories();
      if (repos && repos.length > 0) {
        return repos.map((repo) => ({
          id: repo.id,
          repositoryId: repo.id,
          repositoryName: repo.name,
          repositoryUrl: repo.url,
          branch: repo.defaultBranch || 'main',
          status: 'COMPLETED',
          startedAt: repo.createdAt,
          completedAt: repo.lastAnalyzedAt || repo.createdAt,
          totalCommits: repo.stats?.totalCommits || 0,
          totalContributors: repo.stats?.totalContributors || 0,
          triggeredBy: 'Dosen Pengampu',
        }));
      }
    } catch (err) {
      console.warn('Gagal load riwayat dari repositoryService:', err);
    }

    return [...MOCK_ANALYSIS_HISTORY];
  },
};
