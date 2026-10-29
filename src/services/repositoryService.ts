import { Repository } from '../types';
import { MOCK_REPOSITORIES } from '../mocks';

/**
 * Repository Service
 * Mengelola interaksi data repository GitHub yang dianalisis oleh Dosen.
 */
export const repositoryService = {
  /**
   * Mengambil daftar repository yang pernah dianalisis
   */
  async getRepositories(): Promise<Repository[]> {
    // Simulasi latency jaringan
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
   * Simulasi pendaftaran dan analisis repository baru
   */
  async registerRepository(repoUrl: string, defaultBranch: string = 'main'): Promise<Repository> {
    // Simulasi proses analisis bertahap
    const lowerUrl = repoUrl.toLowerCase();

    // Skenario error simulasi: Repository privat
    if (lowerUrl.includes('private') || lowerUrl.includes('secret')) {
      throw new Error(
        'Repository bersifat privat atau memerlukan autentikasi khusus. GitContrib saat ini hanya mendukung repository GitHub publik.'
      );
    }

    // Skenario error simulasi: Repository tidak ditemukan / 404
    if (lowerUrl.includes('404') || lowerUrl.includes('notfound') || lowerUrl.includes('tidakada')) {
      throw new Error(
        'Repository tidak dapat diakses atau tidak ditemukan di GitHub. Pastikan URL dan nama repository sudah tepat.'
      );
    }

    // Skenario error simulasi: Proses cloning gagal
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

    // Buat objek repository hasil analisis prototype
    const newRepo: Repository = {
      id: `repo-${Date.now()}`,
      name,
      fullName: `${owner}/${name}`,
      url: `https://github.com/${owner}/${name}`,
      defaultBranch: defaultBranch || 'main',
      description: `Repository proyek PBL ${name} berhasil diekstrak dan dianalisis polanya.`,
      isPrivate: false,
      createdAt: new Date().toISOString(),
      lastAnalyzedAt: new Date().toISOString(),
      stats: {
        totalCommits: 84,
        totalContributors: 4,
        branchesCount: 2,
      },
    };

    // Tambahkan ke repositori mock agar dapat dibuka di rute /repositories/:id
    MOCK_REPOSITORIES.unshift(newRepo);

    return newRepo;
  },
};
