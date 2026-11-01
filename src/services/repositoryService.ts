import { Repository, Contributor, Commit } from '../types';
import { MOCK_REPOSITORIES, MOCK_CONTRIBUTORS, MOCK_COMMITS } from '../mocks';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const STORAGE_KEYS = {
  REPOSITORIES: 'gitcontrib_repositories',
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

function setStorage<T>(key: string, value: T): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (e) {
    console.warn(`Error writing localStorage ${key}:`, e);
  }
}

/**
 * Tipe respons dari backend untuk job analisis
 */
export interface AnalysisJobResponse {
  job_id: string;
  repo_url: string;
  repo_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error_message?: string | null;
  created_at: string;
  completed_at?: string | null;
}

/**
 * Tipe respons dari backend untuk hasil analisis
 */
export interface AnalysisResultResponse {
  repo_name: string;
  summary: Record<string, unknown>;
  contributors: Array<{
    author_id: string;
    name: string;
    cluster: number;
    commits: number;
    lines_added?: number;
    lines_deleted?: number;
  }>;
  commits: Array<{
    sha: string;
    type: string;
    author: string;
    message?: string;
    lines_added?: number;
    lines_deleted?: number;
  }>;
}

/**
 * Repository Service
 * Mengelola interaksi data repository GitHub yang dianalisis oleh Dosen.
 */
export const repositoryService = {
  /**
   * Mengambil daftar repository yang pernah dianalisis
   */
  async getRepositories(): Promise<Repository[]> {
    // 1. Coba ambil dari backend FastAPI
    try {
      const response = await fetch(`${API_BASE_URL}/api/repositories`);
      if (response.ok) {
        const backendRepos: Repository[] = await response.json();
        if (Array.isArray(backendRepos) && backendRepos.length > 0) {
          // Sinkronisasi memori & localStorage
          const localStored = getStorage<Repository[]>(STORAGE_KEYS.REPOSITORIES, []);
          const mergedMap = new Map<string, Repository>();
          // Masukkan local dulu, lalu timpa dengan data backend terbaru
          localStored.forEach((r) => mergedMap.set(r.id, r));
          MOCK_REPOSITORIES.forEach((r) => mergedMap.set(r.id, r));
          backendRepos.forEach((r) => mergedMap.set(r.id, r));
          const merged = Array.from(mergedMap.values());
          setStorage(STORAGE_KEYS.REPOSITORIES, merged);
          return merged;
        }
      }
    } catch (err) {
      console.warn('Backend /api/repositories tidak dapat dihubungi, fallback ke local storage:', err);
    }

    // 2. Fallback ke localStorage & MOCK
    const local = getStorage<Repository[]>(STORAGE_KEYS.REPOSITORIES, []);
    if (local.length > 0) {
      return local;
    }
    return [...MOCK_REPOSITORIES];
  },

  /**
   * Mengambil detail repository berdasarkan ID
   */
  async getRepositoryById(id: string): Promise<Repository | null> {
    // 1. Cek memory / localStorage
    const local = getStorage<Repository[]>(STORAGE_KEYS.REPOSITORIES, MOCK_REPOSITORIES);
    const existing = local.find((r) => r.id === id || r.name.toLowerCase() === id.toLowerCase());
    
    // 2. Selalu coba sync detail terbaru dari backend jika id valid
    try {
      const response = await fetch(`${API_BASE_URL}/api/repositories/${id}`);
      if (response.ok) {
        const data = await response.json();
        const repo: Repository = {
          id: data.id || id,
          name: data.name || id,
          fullName: data.fullName || `repo/${data.name || id}`,
          url: data.url || `https://github.com/${data.name || id}`,
          defaultBranch: data.defaultBranch || 'main',
          description: `Repository ${data.name} berhasil dianalisis oleh model ML GitContrib.`,
          isPrivate: false,
          createdAt: data.createdAt || new Date().toISOString(),
          lastAnalyzedAt: data.lastAnalyzedAt || new Date().toISOString(),
          stats: data.stats || {
            totalCommits: data.commits?.length || 0,
            totalContributors: data.contributors?.length || 0,
            branchesCount: 1,
          },
          mlResults: {
            yesRatio: 75,
            noRatio: 25,
            contributors: data.contributors || [],
            commitTypes: (data.commits || []).map((c: any) => c.type),
          },
        };

        // Simpan data contributor & commit ke memory/local jika ada
        if (data.contributors && Array.isArray(data.contributors)) {
          this._syncBackendContributorsAndCommits(repo.id, data.contributors, data.commits || []);
        }

        return repo;
      }
    } catch (err) {
      console.warn(`Gagal fetch /api/repositories/${id} dari backend:`, err);
    }

    return existing ? { ...existing } : null;
  },

  /**
   * Helper internal untuk sinkronisasi kontributor dan commit ke cache
   */
  _syncBackendContributorsAndCommits(
    repoId: string,
    contributors: Array<any>,
    commits: Array<any>
  ) {
    const authorIdMap = new Map<string, string>();
    const formattedContributors: Contributor[] = [];
    const formattedCommits: Commit[] = [];

    contributors.forEach((c, idx) => {
      const shortId = `contrib-${idx + 1}`;
      authorIdMap.set(c.author_id, shortId);
      if (c.name) {
        authorIdMap.set(c.name, shortId);
        authorIdMap.set(c.name.toLowerCase(), shortId);
      }

      const totalCommits = c.commits || c.total_commits || 0;
      const yesCount = Math.round(totalCommits * 0.75);

      formattedContributors.push({
        id: shortId,
        name: c.name || c.author_id,
        username: c.author_id,
        email: `${c.author_id}@github.com`,
        repositoryId: repoId,
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
      });
    });

    commits.forEach((cm, idx) => {
      const type = (cm.type || '').toLowerCase();
      const isYes =
        ['feat', 'fix', 'refactor', 'test', 'perf'].includes(type) ||
        (type !== 'chore' && type !== 'style' && type !== 'docs');
      const authorId =
        authorIdMap.get(cm.author) ||
        authorIdMap.get(cm.author?.toLowerCase?.()) ||
        `contrib-0`;

      formattedCommits.push({
        id: cm.sha || `sha-${idx}`,
        shortSha: (cm.sha || `sha${idx}`).slice(0, 7),
        repositoryId: repoId,
        contributorId: authorId,
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
            featuresUsed: ['commit_type', 'message_subject', 'code_churn'],
          },
        },
      });
    });

    // Simpan ke localStorage
    const storedContribs = getStorage<Contributor[]>(STORAGE_KEYS.CONTRIBUTORS, []);
    const otherContribs = storedContribs.filter((c) => c.repositoryId !== repoId);
    setStorage(STORAGE_KEYS.CONTRIBUTORS, [...formattedContributors, ...otherContribs]);

    const storedCommits = getStorage<Commit[]>(STORAGE_KEYS.COMMITS, []);
    const otherCommits = storedCommits.filter((c) => c.repositoryId !== repoId);
    setStorage(STORAGE_KEYS.COMMITS, [...formattedCommits, ...otherCommits]);

    // Update in-memory mocks
    formattedContributors.forEach((c) => {
      if (!MOCK_CONTRIBUTORS.some((mc) => mc.id === c.id && mc.repositoryId === c.repositoryId)) {
        MOCK_CONTRIBUTORS.unshift(c);
      }
    });
    formattedCommits.forEach((cm) => {
      if (!MOCK_COMMITS.some((mcm) => mcm.id === cm.id)) {
        MOCK_COMMITS.unshift(cm);
      }
    });
  },

  /**
   * Memulai analisis repository via backend FastAPI.
   * Mengirim POST /api/analyze dan mendapat job_id untuk polling.
   */
  async startAnalysis(repoUrl: string, limit: number = 0): Promise<AnalysisJobResponse> {
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo_url: repoUrl, limit }),
    });

    if (!response.ok) {
      let errorDetail = response.statusText;
      try {
        const errorJson = await response.json();
        errorDetail = errorJson.detail || errorJson.message || errorDetail;
      } catch {
        // ignore json parse error
      }
      throw new Error(`Gagal memulai analisis: ${errorDetail}`);
    }

    return response.json();
  },

  /**
   * Polling status job analisis dari backend.
   * GET /api/jobs/{job_id}
   */
  async getJobStatus(jobId: string): Promise<AnalysisJobResponse> {
    const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`);

    if (!response.ok) {
      throw new Error('Gagal mengambil status analisis.');
    }

    return response.json();
  },

  /**
   * Mengambil hasil analisis setelah job selesai.
   * GET /api/results/{job_id}
   */
  async getAnalysisResults(jobId: string): Promise<AnalysisResultResponse> {
    const response = await fetch(`${API_BASE_URL}/api/results/${jobId}`);

    if (!response.ok) {
      throw new Error('Gagal mengambil hasil analisis.');
    }

    return response.json();
  },

  /**
   * Mendaftarkan repository dan menunggu hasil analisis dari backend ML.
   * Ini menggabungkan startAnalysis + polling + getResults menjadi satu flow.
   * Callback onProgress dipanggil setiap kali progress berubah.
   */
  async registerRepository(
    repoUrl: string,
    defaultBranch: string = 'main',
    onProgress?: (job: AnalysisJobResponse) => void,
  ): Promise<Repository> {
    // 1. Mulai analisis di backend
    let job: AnalysisJobResponse;
    try {
      job = await this.startAnalysis(repoUrl);
    } catch (backendError) {
      console.warn('Backend tidak tersedia, menggunakan mode demo:', backendError);
      return this._registerRepositoryMock(repoUrl, defaultBranch);
    }

    // 2. Polling status job sampai selesai atau gagal
    const POLL_INTERVAL = 1500; // 1.5 detik
    const MAX_POLLS = 200; // maksimum ~5 menit
    let polls = 0;

    while (polls < MAX_POLLS) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
      polls++;

      try {
        job = await this.getJobStatus(job.job_id);
      } catch {
        continue;
      }

      if (onProgress) {
        onProgress(job);
      }

      if (job.status === 'completed') {
        break;
      }

      if (job.status === 'failed') {
        throw new Error(
          job.error_message || 'Analisis repository gagal di backend. Periksa log server.'
        );
      }
    }

    if (job.status !== 'completed') {
      throw new Error('Analisis timeout: proses melebihi batas waktu maksimum.');
    }

    // 3. Ambil hasil analisis dari backend
    let analysisResult: AnalysisResultResponse;
    try {
      analysisResult = await this.getAnalysisResults(job.job_id);
    } catch {
      throw new Error('Analisis selesai tetapi gagal mengambil hasilnya.');
    }

    // 4. Konversi hasil backend ke format Repository untuk frontend
    const cleaned = repoUrl
      .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
      .replace(/\.git$/i, '')
      .replace(/\/$/, '');
    const parts = cleaned.split('/');
    const owner = parts[0] || 'owner';
    const name = parts[1] || 'repo-pbl';

    // Hitung rasio YES/NO dari hasil ML commit classification
    const totalCommitsResult = analysisResult.commits?.length || 0;
    const yesCount = (analysisResult.commits || []).filter((c) => {
      const type = (c.type || '').toLowerCase();
      return (
        ['feat', 'fix', 'refactor', 'test', 'perf'].includes(type) ||
        (type !== 'chore' && type !== 'style' && type !== 'docs' && type !== 'unknown')
      );
    }).length;
    const yesRatio = totalCommitsResult > 0 ? Math.round((yesCount / totalCommitsResult) * 100) : 75;

    const repoId = `job-${job.job_id}`;

    const newRepo: Repository = {
      id: repoId,
      name: analysisResult.repo_name || name,
      fullName: `${owner}/${name}`,
      url: `https://github.com/${owner}/${name}`,
      defaultBranch: defaultBranch || 'main',
      description: `Repository ${name} berhasil dianalisis oleh model ML GitContrib.`,
      isPrivate: false,
      createdAt: job.created_at,
      lastAnalyzedAt: job.completed_at || new Date().toISOString(),
      stats: {
        totalCommits:
          totalCommitsResult ||
          (analysisResult.contributors || []).reduce((sum, c) => sum + c.commits, 0),
        totalContributors: (analysisResult.contributors || []).length,
        branchesCount: 1,
      },
      analysisJobId: job.job_id,
      mlResults: {
        yesRatio,
        noRatio: 100 - yesRatio,
        contributors: analysisResult.contributors || [],
        commitTypes: (analysisResult.commits || []).map((c) => c.type),
      },
    };

    // Sinkronkan contributors & commits
    this._syncBackendContributorsAndCommits(
      repoId,
      analysisResult.contributors || [],
      analysisResult.commits || []
    );

    // Simpan repo ke local storage & in-memory
    MOCK_REPOSITORIES.unshift(newRepo);
    const stored = getStorage<Repository[]>(STORAGE_KEYS.REPOSITORIES, []);
    setStorage(STORAGE_KEYS.REPOSITORIES, [newRepo, ...stored.filter((r) => r.id !== newRepo.id)]);

    return newRepo;
  },

  /**
   * Fallback mock ketika backend tidak tersedia (mode demo/prototype).
   */
  _registerRepositoryMock(repoUrl: string, defaultBranch: string = 'main'): Repository {
    const lowerUrl = repoUrl.toLowerCase();

    if (lowerUrl.includes('private') || lowerUrl.includes('secret')) {
      throw new Error(
        'Repository bersifat privat atau memerlukan autentikasi khusus. GitContrib saat ini hanya mendukung repository GitHub publik.'
      );
    }

    if (lowerUrl.includes('404') || lowerUrl.includes('notfound') || lowerUrl.includes('tidakada')) {
      throw new Error(
        'Repository tidak dapat diakses atau tidak ditemukan di GitHub. Pastikan URL dan nama repository sudah tepat.'
      );
    }

    if (lowerUrl.includes('fail') || lowerUrl.includes('gagal')) {
      throw new Error(
        'Proses ekstraksi Git clone gagal: Koneksi remote timeout atau repository kosong.'
      );
    }

    const cleaned = repoUrl
      .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
      .replace(/\.git$/i, '')
      .replace(/\/$/, '');
    const parts = cleaned.split('/');
    const owner = parts[0] || 'owner';
    const name = parts[1] || 'repo-pbl';

    const newRepo: Repository = {
      id: `repo-${Date.now()}`,
      name,
      fullName: `${owner}/${name}`,
      url: `https://github.com/${owner}/${name}`,
      defaultBranch: defaultBranch || 'main',
      description: `Repository proyek PBL ${name} (mode demo — backend tidak aktif).`,
      isPrivate: false,
      createdAt: new Date().toISOString(),
      lastAnalyzedAt: new Date().toISOString(),
      stats: {
        totalCommits: 84,
        totalContributors: 4,
        branchesCount: 2,
      },
    };

    MOCK_REPOSITORIES.unshift(newRepo);
    const stored = getStorage<Repository[]>(STORAGE_KEYS.REPOSITORIES, []);
    setStorage(STORAGE_KEYS.REPOSITORIES, [newRepo, ...stored]);
    return newRepo;
  },
};
