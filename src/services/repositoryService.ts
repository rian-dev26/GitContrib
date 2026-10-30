import { Repository } from '../types';
import { MOCK_REPOSITORIES, MOCK_CONTRIBUTORS, MOCK_COMMITS } from '../mocks';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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
    await new Promise((resolve) => setTimeout(resolve, 200));
    return [...MOCK_REPOSITORIES];
  },

  /**
   * Mengambil detail repository berdasarkan ID
   */
  async getRepositoryById(id: string): Promise<Repository | null> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const repo = MOCK_REPOSITORIES.find((r) => r.id === id);
    return repo ? { ...repo } : null;
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
      // Fallback: jika backend tidak aktif, gunakan mode mock/demo
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
        // Jika polling gagal, lanjutkan retry
        continue;
      }

      // Kirim update progress ke caller
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
    const totalCommitsResult = analysisResult.commits.length;
    const yesCount = analysisResult.commits.filter((c) => {
      const type = (c.type || '').toLowerCase();
      return ['feat', 'fix', 'refactor', 'test', 'perf'].includes(type) || (type !== 'chore' && type !== 'style' && type !== 'docs' && type !== 'unknown');
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
        totalCommits: totalCommitsResult || analysisResult.contributors.reduce((sum, c) => sum + c.commits, 0),
        totalContributors: analysisResult.contributors.length,
        branchesCount: 1,
      },
      analysisJobId: job.job_id,
      mlResults: {
        yesRatio,
        noRatio: 100 - yesRatio,
        contributors: analysisResult.contributors,
        commitTypes: analysisResult.commits.map((c) => c.type),
      },
    };

    // Tambahkan ke repositori agar dapat dibuka di rute /repositories/:id
    MOCK_REPOSITORIES.unshift(newRepo);

    // Tambahkan kontributor dari hasil backend
    analysisResult.contributors.forEach((c) => {
      MOCK_CONTRIBUTORS.unshift({
        id: `contrib-${repoId}-${c.author_id}`,
        name: c.name || c.author_id,
        username: c.author_id,
        email: `${c.author_id}@example.com`,
        repositoryId: repoId,
        metrics: {
          totalCommits: c.commits,
          classifiedYesCount: Math.round(c.commits * (yesRatio / 100)),
          classifiedNoCount: Math.max(0, c.commits - Math.round(c.commits * (yesRatio / 100))),
          yesRatio: yesRatio / 100,
          firstCommitDate: new Date(Date.now() - 30 * 86400000).toISOString(),
          lastCommitDate: new Date().toISOString(),
          totalAdditions: c.lines_added || 120,
          totalDeletions: c.lines_deleted || 25,
        },
      });
    });

    // Tambahkan commits dari hasil backend
    analysisResult.commits.forEach((cm, idx) => {
      const type = (cm.type || '').toLowerCase();
      const isYes = ['feat', 'fix', 'refactor', 'test', 'perf'].includes(type) || (type !== 'chore' && type !== 'style' && type !== 'docs');
      MOCK_COMMITS.unshift({
        id: cm.sha || `sha-${idx}`,
        shortSha: (cm.sha || `sha${idx}`).slice(0, 7),
        repositoryId: repoId,
        contributorId: `contrib-${repoId}-${cm.author}`,
        contributorName: cm.author || 'Contributor',
        contributorEmail: `${cm.author || 'contributor'}@example.com`,
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
    return newRepo;
  },
};
