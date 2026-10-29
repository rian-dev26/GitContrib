import { DashboardData, DailyCommitActivity } from '../types/dashboard';

/**
 * Data prototype simulasi untuk Dashboard GitContrib.
 * Seluruh data di bawah ini digunakan untuk kebutuhan visualisasi UI
 * dan bukan hasil analisis Machine Learning nyata.
 */

// Helper untuk menghasilkan histori aktivitas harian 12 minggu (~84 hari)
function generateHeatmapData(): DailyCommitActivity[] {
  const activities: DailyCommitActivity[] = [];
  const today = new Date(2024, 9, 25); // 25 Oktober 2024

  // Pola commit realistis per hari selama 12 minggu terakhir
  const seedCommitCounts = [
    0, 2, 0, 1, 3, 0, 0, 4, 2, 0, 1, 5, 2, 0, 0, 3, 6, 2, 4, 1, 0, 2, 7, 3, 5, 0, 1, 0,
    3, 8, 4, 2, 0, 0, 1, 4, 9, 3, 6, 2, 0, 0, 3, 5, 2, 4, 1, 0, 1, 6, 8, 3, 5, 2, 0, 0,
    2, 4, 7, 3, 1, 0, 0, 3, 6, 9, 4, 2, 0, 1, 5, 8, 3, 4, 1, 0, 2, 6, 10, 4, 7, 2, 0, 1,
  ];

  for (let i = seedCommitCounts.length - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const count = seedCommitCounts[seedCommitCounts.length - 1 - i] ?? 0;

    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (count >= 8) level = 4;
    else if (count >= 5) level = 3;
    else if (count >= 3) level = 2;
    else if (count >= 1) level = 1;

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');

    activities.push({
      date: `${yyyy}-${mm}-${dd}`,
      count,
      level,
    });
  }

  return activities;
}

export const MOCK_DASHBOARD_DATA: DashboardData = {
  lastUpdated: '2024-10-25T14:30:00Z',
  isPrototype: true,
  repository: {
    id: 'repo-pbl-01',
    name: 'smart-inventory-pbl',
    owner: 'if-polibatam',
    fullName: 'if-polibatam/smart-inventory-pbl',
    url: 'https://github.com/if-polibatam/smart-inventory-pbl',
    analyzedAt: '2024-10-25T14:30:00Z',
    status: 'COMPLETED',
    totalCommits: 142,
    totalContributors: 4,
    defaultBranch: 'main',
  },
  statistics: {
    totalCommits: 142,
    totalContributors: 4,
    yesPredictions: 113,
    noPredictions: 29,
    unclassified: 0,
  },
  classification: {
    totalAnalyzed: 142,
    yesCount: 113,
    noCount: 29,
    unclassifiedCount: 0,
    yesPercentage: 79.6,
    noPercentage: 20.4,
    distribution: [
      {
        label: 'YES',
        count: 113,
        percentage: 79.6,
        color: '#89E19C', // Aksen positif hijau lembut
      },
      {
        label: 'NO',
        count: 29,
        percentage: 20.4,
        color: '#E06C75', // Aksen negatif merah lembut
      },
    ],
    notice: 'Hasil klasifikasi model berdasarkan data commit yang tersedia.',
  },
  heatmapActivities: generateHeatmapData(),
  contributors: [
    {
      id: 'contrib-01',
      name: 'Dimas Pratama',
      username: 'dimas-pbl',
      totalCommits: 52,
      activeDays: 28,
      linesAdded: 3420,
      linesDeleted: 890,
      yesCount: 44,
      noCount: 8,
    },
    {
      id: 'contrib-02',
      name: 'Siti Aisyah',
      username: 'siti-aisyah',
      totalCommits: 41,
      activeDays: 24,
      linesAdded: 2150,
      linesDeleted: 430,
      yesCount: 35,
      noCount: 6,
    },
    {
      id: 'contrib-03',
      name: 'Rian Hidayat',
      username: 'rian-h',
      totalCommits: 31,
      activeDays: 19,
      linesAdded: 1480,
      linesDeleted: 620,
      yesCount: 22,
      noCount: 9,
    },
    {
      id: 'contrib-04',
      name: 'Nurul Fadhilah',
      username: 'nurul-f',
      totalCommits: 18,
      activeDays: 12,
      linesAdded: 890,
      linesDeleted: 210,
      yesCount: 12,
      noCount: 6,
    },
  ],
  recentCommits: [
    {
      id: 'a1b2c3d4e5f67890123456789abcdef012345678',
      shortSha: 'a1b2c3d',
      message: 'feat: implement barcode scanner handler for asset check-in',
      contributorName: 'Dimas Pratama',
      contributorUsername: 'dimas-pbl',
      timestamp: '2024-10-24T18:20:00Z',
      classification: 'YES',
      linesChanged: 209,
    },
    {
      id: 'b2c3d4e5f6a7890123456789abcdef0123456789',
      shortSha: 'b2c3d4e',
      message: 'fix: validate serial number uniqueness before database insert',
      contributorName: 'Siti Aisyah',
      contributorUsername: 'siti-aisyah',
      timestamp: '2024-10-23T14:10:00Z',
      classification: 'YES',
      linesChanged: 48,
    },
    {
      id: 'c3d4e5f6a7b8890123456789abcdef012345678a',
      shortSha: 'c3d4e5f',
      message: 'docs: update readme with setup instructions',
      contributorName: 'Rian Hidayat',
      contributorUsername: 'rian-h',
      timestamp: '2024-10-20T16:45:00Z',
      classification: 'NO',
      linesChanged: 16,
    },
    {
      id: 'd4e5f6a7b8c990123456789abcdef012345678b',
      shortSha: 'd4e5f6a',
      message: 'feat: add pagination and sorting to inventory list API',
      contributorName: 'Dimas Pratama',
      contributorUsername: 'dimas-pbl',
      timestamp: '2024-10-19T11:30:00Z',
      classification: 'YES',
      linesChanged: 135,
    },
    {
      id: 'e5f6a7b8c9d00123456789abcdef012345678c',
      shortSha: 'e5f6a7b',
      message: 'refactor: extract status badge component for consistency',
      contributorName: 'Nurul Fadhilah',
      contributorUsername: 'nurul-f',
      timestamp: '2024-10-18T09:15:00Z',
      classification: 'YES',
      linesChanged: 54,
    },
    {
      id: 'f6a7b8c9d0e1123456789abcdef012345678d',
      shortSha: 'f6a7b8c',
      message: 'chore: bump dependencies and fix typo in comment',
      contributorName: 'Rian Hidayat',
      contributorUsername: 'rian-h',
      timestamp: '2024-10-16T15:00:00Z',
      classification: 'NO',
      linesChanged: 8,
    },
  ],
};
