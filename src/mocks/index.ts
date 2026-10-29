import {
  Repository,
  Contributor,
  Commit,
  AnalysisSummary,
  AnalysisHistoryItem,
} from '../types';

/**
 * Data prototype dummy untuk tahap setup fondasi GitContrib.
 * Seluruh data di bawah ini adalah data simulasi (mock) untuk pengembangan UI
 * dan BUKAN hasil evaluasi atau analisis nyata.
 */

export const MOCK_REPOSITORIES: Repository[] = [
  {
    id: 'repo-pbl-01',
    name: 'smart-inventory-pbl',
    fullName: 'if-polibatam/smart-inventory-pbl',
    url: 'https://github.com/if-polibatam/smart-inventory-pbl',
    defaultBranch: 'main',
    description: 'Proyek PBL Aplikasi Manajemen Inventaris Laboratorium - IF314',
    isPrivate: false,
    createdAt: '2024-02-10T08:00:00Z',
    lastAnalyzedAt: '2024-10-25T14:30:00Z',
    stats: {
      totalCommits: 142,
      totalContributors: 4,
      branchesCount: 3,
    },
  },
  {
    id: 'repo-pbl-02',
    name: 'attendance-mobile-app',
    fullName: 'if-polibatam/attendance-mobile-app',
    url: 'https://github.com/if-polibatam/attendance-mobile-app',
    defaultBranch: 'master',
    description: 'Aplikasi Presensi Perkuliahan Berbasis Geolocation - IF314 PBL',
    isPrivate: false,
    createdAt: '2024-02-15T09:15:00Z',
    lastAnalyzedAt: '2024-10-26T10:00:00Z',
    stats: {
      totalCommits: 98,
      totalContributors: 5,
      branchesCount: 2,
    },
  },
  {
    id: 'repo-pbl-03',
    name: 'pbl-course-portal',
    fullName: 'if-polibatam/pbl-course-portal',
    url: 'https://github.com/if-polibatam/pbl-course-portal',
    defaultBranch: 'main',
    description: 'Portal Informasi dan Monitoring Proyek PBL Mahasiswa',
    isPrivate: false,
    createdAt: '2024-03-01T11:00:00Z',
    lastAnalyzedAt: undefined,
    stats: {
      totalCommits: 64,
      totalContributors: 3,
      branchesCount: 1,
    },
  },
];

export const MOCK_CONTRIBUTORS: Contributor[] = [
  {
    id: 'contrib-01',
    name: 'Dimas Pratama (Contoh)',
    username: 'dimas-pbl',
    email: 'dimas.contoh@polibatam.ac.id',
    repositoryId: 'repo-pbl-01',
    metrics: {
      totalCommits: 52,
      classifiedYesCount: 44,
      classifiedNoCount: 8,
      yesRatio: 0.846,
      firstCommitDate: '2024-02-12T10:00:00Z',
      lastCommitDate: '2024-10-24T18:20:00Z',
      totalAdditions: 3420,
      totalDeletions: 890,
    },
  },
  {
    id: 'contrib-02',
    name: 'Siti Aisyah (Contoh)',
    username: 'siti-aisyah',
    email: 'siti.contoh@polibatam.ac.id',
    repositoryId: 'repo-pbl-01',
    metrics: {
      totalCommits: 41,
      classifiedYesCount: 35,
      classifiedNoCount: 6,
      yesRatio: 0.853,
      firstCommitDate: '2024-02-14T11:30:00Z',
      lastCommitDate: '2024-10-23T14:10:00Z',
      totalAdditions: 2150,
      totalDeletions: 430,
    },
  },
  {
    id: 'contrib-03',
    name: 'Rian Hidayat (Contoh)',
    username: 'rian-h',
    email: 'rian.contoh@polibatam.ac.id',
    repositoryId: 'repo-pbl-01',
    metrics: {
      totalCommits: 31,
      classifiedYesCount: 22,
      classifiedNoCount: 9,
      yesRatio: 0.709,
      firstCommitDate: '2024-02-18T09:00:00Z',
      lastCommitDate: '2024-10-20T16:45:00Z',
      totalAdditions: 1480,
      totalDeletions: 620,
    },
  },
  {
    id: 'contrib-04',
    name: 'Nurul Fadhilah (Contoh)',
    username: 'nurul-f',
    email: 'nurul.contoh@polibatam.ac.id',
    repositoryId: 'repo-pbl-01',
    metrics: {
      totalCommits: 18,
      classifiedYesCount: 12,
      classifiedNoCount: 6,
      yesRatio: 0.666,
      firstCommitDate: '2024-02-25T13:00:00Z',
      lastCommitDate: '2024-10-22T08:15:00Z',
      totalAdditions: 890,
      totalDeletions: 210,
    },
  },
];

// ─── Helper untuk generate commit dummy ────────────────────────────────────────
function makeCommit(
  idx: number,
  id: string,
  shortSha: string,
  repoId: string,
  contribId: string,
  contribName: string,
  contribEmail: string,
  message: string,
  timestamp: string,
  additions: number,
  deletions: number,
  filesChanged: number,
  label: 'YES' | 'NO',
  confidence: number
): Commit {
  void idx;
  return {
    id,
    shortSha,
    repositoryId: repoId,
    contributorId: contribId,
    contributorName: contribName,
    contributorEmail: contribEmail,
    message,
    timestamp,
    stats: {
      additions,
      deletions,
      totalChanges: additions + deletions,
      filesChanged,
    },
    classification: {
      label,
      confidence,
      metadata: {
        modelVersion: 'proto-v0.1-rf',
        algorithm: 'Supervised Random Forest (Prototype)',
        evaluatedAt: '2024-10-25T14:30:00Z',
        featuresUsed: ['code_churn', 'file_diversity', 'message_clarity', 'diff_entropy'],
      },
    },
  };
}

export const MOCK_COMMITS: Commit[] = [
  // ─── Dimas Pratama ────
  makeCommit(1, 'a1b2c3d4e5f67890', 'a1b2c3d', 'repo-pbl-01', 'contrib-01', 'Dimas Pratama (Contoh)', 'dimas.contoh@polibatam.ac.id', 'feat: implement barcode scanner handler for asset check-in', '2024-10-24T18:20:00Z', 185, 24, 4, 'YES', 0.94),
  makeCommit(2, 'a2b2c3d4e5f67891', 'a2b2c3d', 'repo-pbl-01', 'contrib-01', 'Dimas Pratama (Contoh)', 'dimas.contoh@polibatam.ac.id', 'feat: add asset categorization module with tree view UI', '2024-10-22T10:35:00Z', 212, 18, 5, 'YES', 0.91),
  makeCommit(3, 'a3b2c3d4e5f67892', 'a3b2c3d', 'repo-pbl-01', 'contrib-01', 'Dimas Pratama (Contoh)', 'dimas.contoh@polibatam.ac.id', 'fix: resolve race condition in barcode reader timeout', '2024-10-21T14:45:00Z', 38, 12, 2, 'YES', 0.87),
  makeCommit(4, 'a4b2c3d4e5f67893', 'a4b2c3d', 'repo-pbl-01', 'contrib-01', 'Dimas Pratama (Contoh)', 'dimas.contoh@polibatam.ac.id', 'refactor: split scanner logic into dedicated service layer', '2024-10-18T09:00:00Z', 145, 88, 6, 'YES', 0.89),
  makeCommit(5, 'a5b2c3d4e5f67894', 'a5b2c3d', 'repo-pbl-01', 'contrib-01', 'Dimas Pratama (Contoh)', 'dimas.contoh@polibatam.ac.id', 'test: add unit tests for inventory CRUD operations', '2024-10-15T16:30:00Z', 94, 8, 3, 'YES', 0.92),
  makeCommit(6, 'a6b2c3d4e5f67895', 'a6b2c3d', 'repo-pbl-01', 'contrib-01', 'Dimas Pratama (Contoh)', 'dimas.contoh@polibatam.ac.id', 'feat: integrate export to Excel for inventory report', '2024-10-10T11:20:00Z', 178, 22, 4, 'YES', 0.93),
  makeCommit(7, 'a7b2c3d4e5f67896', 'a7b2c3d', 'repo-pbl-01', 'contrib-01', 'Dimas Pratama (Contoh)', 'dimas.contoh@polibatam.ac.id', 'feat: implement QR code generation for asset labels', '2024-10-05T08:50:00Z', 220, 14, 5, 'YES', 0.95),
  makeCommit(8, 'a8b2c3d4e5f67897', 'a8b2c3d', 'repo-pbl-01', 'contrib-01', 'Dimas Pratama (Contoh)', 'dimas.contoh@polibatam.ac.id', 'fix: correct inventory count on bulk import validation', '2024-09-28T15:10:00Z', 56, 34, 3, 'YES', 0.85),
  makeCommit(9, 'a9b2c3d4e5f67898', 'a9b2c3d', 'repo-pbl-01', 'contrib-01', 'Dimas Pratama (Contoh)', 'dimas.contoh@polibatam.ac.id', 'chore: update dependencies and fix peer conflicts', '2024-09-20T12:00:00Z', 14, 92, 2, 'NO', 0.71),
  makeCommit(10, 'a0b2c3d4e5f67899', 'a0b2c3d', 'repo-pbl-01', 'contrib-01', 'Dimas Pratama (Contoh)', 'dimas.contoh@polibatam.ac.id', 'feat: add dashboard widget for low-stock alerts', '2024-09-15T09:30:00Z', 133, 10, 3, 'YES', 0.90),
  makeCommit(11, 'a1c3d4e5f6a78900', 'a1c3d4e', 'repo-pbl-01', 'contrib-01', 'Dimas Pratama (Contoh)', 'dimas.contoh@polibatam.ac.id', 'style: standardize form input spacing across all pages', '2024-09-08T14:20:00Z', 44, 42, 8, 'NO', 0.62),
  makeCommit(12, 'a2c3d4e5f6a78901', 'a2c3d4e', 'repo-pbl-01', 'contrib-01', 'Dimas Pratama (Contoh)', 'dimas.contoh@polibatam.ac.id', 'feat: implement asset loan management with approval flow', '2024-09-02T10:15:00Z', 290, 20, 7, 'YES', 0.96),
  makeCommit(13, 'a3c3d4e5f6a78902', 'a3c3d4e', 'repo-pbl-01', 'contrib-01', 'Dimas Pratama (Contoh)', 'dimas.contoh@polibatam.ac.id', 'test: add integration tests for barcode scan workflow', '2024-08-25T16:00:00Z', 118, 6, 3, 'YES', 0.91),

  // ─── Siti Aisyah ────
  makeCommit(14, 'b1c3d4e5f6a78910', 'b1c3d4e', 'repo-pbl-01', 'contrib-02', 'Siti Aisyah (Contoh)', 'siti.contoh@polibatam.ac.id', 'fix: validate serial number uniqueness before database insert', '2024-10-23T14:10:00Z', 42, 6, 2, 'YES', 0.88),
  makeCommit(15, 'b2c3d4e5f6a78911', 'b2c3d4e', 'repo-pbl-01', 'contrib-02', 'Siti Aisyah (Contoh)', 'siti.contoh@polibatam.ac.id', 'feat: add responsive table layout for asset list view', '2024-10-19T09:45:00Z', 164, 18, 4, 'YES', 0.90),
  makeCommit(16, 'b3c3d4e5f6a78912', 'b3c3d4e', 'repo-pbl-01', 'contrib-02', 'Siti Aisyah (Contoh)', 'siti.contoh@polibatam.ac.id', 'feat: implement role-based access control for admin vs staff', '2024-10-14T13:30:00Z', 198, 30, 6, 'YES', 0.93),
  makeCommit(17, 'b4c3d4e5f6a78913', 'b4c3d4e', 'repo-pbl-01', 'contrib-02', 'Siti Aisyah (Contoh)', 'siti.contoh@polibatam.ac.id', 'fix: null pointer exception on empty asset category fetch', '2024-10-09T08:20:00Z', 28, 8, 1, 'YES', 0.86),
  makeCommit(18, 'b5c3d4e5f6a78914', 'b5c3d4e', 'repo-pbl-01', 'contrib-02', 'Siti Aisyah (Contoh)', 'siti.contoh@polibatam.ac.id', 'feat: add CSV import for bulk asset registration', '2024-10-04T15:50:00Z', 176, 14, 5, 'YES', 0.92),
  makeCommit(19, 'b6c3d4e5f6a78915', 'b6c3d4e', 'repo-pbl-01', 'contrib-02', 'Siti Aisyah (Contoh)', 'siti.contoh@polibatam.ac.id', 'refactor: extract database helper into repository pattern', '2024-09-27T11:00:00Z', 210, 140, 8, 'YES', 0.88),
  makeCommit(20, 'b7c3d4e5f6a78916', 'b7c3d4e', 'repo-pbl-01', 'contrib-02', 'Siti Aisyah (Contoh)', 'siti.contoh@polibatam.ac.id', 'test: unit tests for user authentication middleware', '2024-09-18T14:40:00Z', 86, 4, 2, 'YES', 0.93),
  makeCommit(21, 'b8c3d4e5f6a78917', 'b8c3d4e', 'repo-pbl-01', 'contrib-02', 'Siti Aisyah (Contoh)', 'siti.contoh@polibatam.ac.id', 'docs: add inline JSDoc for API service functions', '2024-09-10T10:30:00Z', 48, 12, 4, 'YES', 0.79),
  makeCommit(22, 'b9c3d4e5f6a78918', 'b9c3d4e', 'repo-pbl-01', 'contrib-02', 'Siti Aisyah (Contoh)', 'siti.contoh@polibatam.ac.id', 'style: reformat code to follow eslint rules (mass)', '2024-09-04T09:00:00Z', 18, 18, 12, 'NO', 0.68),
  makeCommit(23, 'b0c3d4e5f6a78919', 'b0c3d4e', 'repo-pbl-01', 'contrib-02', 'Siti Aisyah (Contoh)', 'siti.contoh@polibatam.ac.id', 'feat: implement audit trail for all asset mutations', '2024-08-28T16:20:00Z', 244, 16, 6, 'YES', 0.95),
  makeCommit(24, 'b1d3d4e5f6a78920', 'b1d3d4e', 'repo-pbl-01', 'contrib-02', 'Siti Aisyah (Contoh)', 'siti.contoh@polibatam.ac.id', 'fix: prevent duplicate registration on rapid double-click submit', '2024-08-20T13:10:00Z', 34, 10, 2, 'YES', 0.87),

  // ─── Rian Hidayat ────
  makeCommit(25, 'c1d3d4e5f6a78930', 'c1d3d4e', 'repo-pbl-01', 'contrib-03', 'Rian Hidayat (Contoh)', 'rian.contoh@polibatam.ac.id', 'docs: update readme with setup instructions', '2024-10-20T16:45:00Z', 12, 4, 1, 'NO', 0.72),
  makeCommit(26, 'c2d3d4e5f6a78931', 'c2d3d4e', 'repo-pbl-01', 'contrib-03', 'Rian Hidayat (Contoh)', 'rian.contoh@polibatam.ac.id', 'feat: implement printing module for asset label PDF', '2024-10-16T09:30:00Z', 168, 22, 5, 'YES', 0.89),
  makeCommit(27, 'c3d3d4e5f6a78932', 'c3d3d4e', 'repo-pbl-01', 'contrib-03', 'Rian Hidayat (Contoh)', 'rian.contoh@polibatam.ac.id', 'fix: pagination offset calculation incorrect on last page', '2024-10-12T14:00:00Z', 22, 14, 2, 'YES', 0.83),
  makeCommit(28, 'c4d3d4e5f6a78933', 'c4d3d4e', 'repo-pbl-01', 'contrib-03', 'Rian Hidayat (Contoh)', 'rian.contoh@polibatam.ac.id', 'feat: add export to PDF for monthly inventory report', '2024-10-07T11:20:00Z', 142, 8, 4, 'YES', 0.91),
  makeCommit(29, 'c5d3d4e5f6a78934', 'c5d3d4e', 'repo-pbl-01', 'contrib-03', 'Rian Hidayat (Contoh)', 'rian.contoh@polibatam.ac.id', 'chore: reorganize folder structure per feature modules', '2024-10-01T08:45:00Z', 2, 4, 18, 'NO', 0.74),
  makeCommit(30, 'c6d3d4e5f6a78935', 'c6d3d4e', 'repo-pbl-01', 'contrib-03', 'Rian Hidayat (Contoh)', 'rian.contoh@polibatam.ac.id', 'feat: implement asset condition tracking (Good/Damaged/Lost)', '2024-09-24T15:30:00Z', 196, 26, 6, 'YES', 0.93),
  makeCommit(31, 'c7d3d4e5f6a78936', 'c7d3d4e', 'repo-pbl-01', 'contrib-03', 'Rian Hidayat (Contoh)', 'rian.contoh@polibatam.ac.id', 'fix: date range filter returns incorrect results for edge dates', '2024-09-16T10:10:00Z', 30, 18, 2, 'YES', 0.80),
  makeCommit(32, 'c8d3d4e5f6a78937', 'c8d3d4e', 'repo-pbl-01', 'contrib-03', 'Rian Hidayat (Contoh)', 'rian.contoh@polibatam.ac.id', 'docs: add API documentation for asset endpoints', '2024-09-08T13:00:00Z', 64, 8, 3, 'YES', 0.76),
  makeCommit(33, 'c9d3d4e5f6a78938', 'c9d3d4e', 'repo-pbl-01', 'contrib-03', 'Rian Hidayat (Contoh)', 'rian.contoh@polibatam.ac.id', 'style: minor spacing and naming changes', '2024-09-01T09:40:00Z', 8, 8, 6, 'NO', 0.66),
  makeCommit(34, 'c0d3d4e5f6a78939', 'c0d3d4e', 'repo-pbl-01', 'contrib-03', 'Rian Hidayat (Contoh)', 'rian.contoh@polibatam.ac.id', 'feat: integrate email notification for asset due return', '2024-08-22T14:50:00Z', 144, 18, 4, 'YES', 0.88),

  // ─── Nurul Fadhilah ────
  makeCommit(35, 'd1d3d4e5f6a78940', 'd1d3d4e', 'repo-pbl-01', 'contrib-04', 'Nurul Fadhilah (Contoh)', 'nurul.contoh@polibatam.ac.id', 'feat: create dashboard summary cards for asset overview', '2024-10-22T08:15:00Z', 110, 12, 4, 'YES', 0.87),
  makeCommit(36, 'd2d3d4e5f6a78941', 'd2d3d4e', 'repo-pbl-01', 'contrib-04', 'Nurul Fadhilah (Contoh)', 'nurul.contoh@polibatam.ac.id', 'fix: incorrect chart data binding on category filter change', '2024-10-17T12:30:00Z', 36, 20, 2, 'YES', 0.84),
  makeCommit(37, 'd3d3d4e5f6a78942', 'd3d3d4e', 'repo-pbl-01', 'contrib-04', 'Nurul Fadhilah (Contoh)', 'nurul.contoh@polibatam.ac.id', 'feat: implement bar chart for monthly procurement spending', '2024-10-11T10:00:00Z', 148, 10, 3, 'YES', 0.90),
  makeCommit(38, 'd4d3d4e5f6a78943', 'd4d3d4e', 'repo-pbl-01', 'contrib-04', 'Nurul Fadhilah (Contoh)', 'nurul.contoh@polibatam.ac.id', 'chore: update env config with placeholder values', '2024-10-05T15:00:00Z', 4, 4, 1, 'NO', 0.73),
  makeCommit(39, 'd5d3d4e5f6a78944', 'd5d3d4e', 'repo-pbl-01', 'contrib-04', 'Nurul Fadhilah (Contoh)', 'nurul.contoh@polibatam.ac.id', 'feat: add notification bell with unread count indicator', '2024-09-28T09:50:00Z', 96, 14, 4, 'YES', 0.86),
  makeCommit(40, 'd6d3d4e5f6a78945', 'd6d3d4e', 'repo-pbl-01', 'contrib-04', 'Nurul Fadhilah (Contoh)', 'nurul.contoh@polibatam.ac.id', 'fix: sidebar collapse state not persisted on navigation', '2024-09-21T11:45:00Z', 28, 18, 2, 'YES', 0.82),
  makeCommit(41, 'd7d3d4e5f6a78946', 'd7d3d4e', 'repo-pbl-01', 'contrib-04', 'Nurul Fadhilah (Contoh)', 'nurul.contoh@polibatam.ac.id', 'feat: implement dark mode toggle with localStorage persistence', '2024-09-12T14:20:00Z', 88, 8, 3, 'YES', 0.88),
  makeCommit(42, 'd8d3d4e5f6a78947', 'd8d3d4e', 'repo-pbl-01', 'contrib-04', 'Nurul Fadhilah (Contoh)', 'nurul.contoh@polibatam.ac.id', 'style: update color scheme to match brand guidelines', '2024-09-05T09:15:00Z', 52, 48, 10, 'NO', 0.67),
  makeCommit(43, 'd9d3d4e5f6a78948', 'd9d3d4e', 'repo-pbl-01', 'contrib-04', 'Nurul Fadhilah (Contoh)', 'nurul.contoh@polibatam.ac.id', 'feat: add print preview for inventory report', '2024-08-30T13:40:00Z', 118, 10, 4, 'YES', 0.91),
  makeCommit(44, 'd0d3d4e5f6a78949', 'd0d3d4e', 'repo-pbl-01', 'contrib-04', 'Nurul Fadhilah (Contoh)', 'nurul.contoh@polibatam.ac.id', 'fix: mobile layout overflow on asset detail modal', '2024-08-18T10:30:00Z', 44, 22, 3, 'YES', 0.84),

  // ─── Additional commits for range testing ────
  makeCommit(45, 'e1d3d4e5f6a78950', 'e1d3d4e', 'repo-pbl-01', 'contrib-01', 'Dimas Pratama (Contoh)', 'dimas.contoh@polibatam.ac.id', 'feat: setup initial project architecture and base modules', '2024-02-12T10:00:00Z', 520, 0, 12, 'YES', 0.95),
  makeCommit(46, 'e2d3d4e5f6a78951', 'e2d3d4e', 'repo-pbl-01', 'contrib-02', 'Siti Aisyah (Contoh)', 'siti.contoh@polibatam.ac.id', 'feat: add user authentication with JWT', '2024-02-14T11:30:00Z', 280, 0, 6, 'YES', 0.92),
  makeCommit(47, 'e3d3d4e5f6a78952', 'e3d3d4e', 'repo-pbl-01', 'contrib-03', 'Rian Hidayat (Contoh)', 'rian.contoh@polibatam.ac.id', 'feat: design database schema and migration scripts', '2024-02-18T09:00:00Z', 340, 0, 8, 'YES', 0.93),
  makeCommit(48, 'e4d3d4e5f6a78953', 'e4d3d4e', 'repo-pbl-01', 'contrib-04', 'Nurul Fadhilah (Contoh)', 'nurul.contoh@polibatam.ac.id', 'feat: create UI wireframe components and layout', '2024-02-25T13:00:00Z', 380, 0, 10, 'YES', 0.90),
  makeCommit(49, 'e5d3d4e5f6a78954', 'e5d3d4e', 'repo-pbl-01', 'contrib-01', 'Dimas Pratama (Contoh)', 'dimas.contoh@polibatam.ac.id', 'feat: asset management CRUD with form validation', '2024-03-10T10:00:00Z', 420, 30, 9, 'YES', 0.94),
  makeCommit(50, 'e6d3d4e5f6a78955', 'e6d3d4e', 'repo-pbl-01', 'contrib-02', 'Siti Aisyah (Contoh)', 'siti.contoh@polibatam.ac.id', 'feat: category and subcategory management module', '2024-03-18T14:20:00Z', 248, 12, 6, 'YES', 0.91),
  makeCommit(51, 'e7d3d4e5f6a78956', 'e7d3d4e', 'repo-pbl-01', 'contrib-01', 'Dimas Pratama (Contoh)', 'dimas.contoh@polibatam.ac.id', 'feat: implement stock in/out transaction recording', '2024-04-05T09:30:00Z', 312, 20, 8, 'YES', 0.92),
  makeCommit(52, 'e8d3d4e5f6a78957', 'e8d3d4e', 'repo-pbl-01', 'contrib-03', 'Rian Hidayat (Contoh)', 'rian.contoh@polibatam.ac.id', 'test: end-to-end tests for asset checkout workflow', '2024-04-20T15:45:00Z', 154, 10, 4, 'YES', 0.89),
];

export const MOCK_ANALYSIS_SUMMARY: AnalysisSummary = {
  id: 'analysis-sum-01',
  repositoryId: 'repo-pbl-01',
  repositoryName: 'if-polibatam/smart-inventory-pbl',
  branch: 'main',
  analyzedAt: '2024-10-25T14:30:00Z',
  totalCommitsAnalyzed: 142,
  totalContributors: 4,
  overallYesRatio: 0.795,
  overallNoRatio: 0.205,
  contributorsSummary: [
    {
      contributorId: 'contrib-01',
      contributorName: 'Dimas Pratama (Contoh)',
      username: 'dimas-pbl',
      totalCommits: 52,
      yesCommits: 44,
      noCommits: 8,
      yesPercentage: 84.6,
    },
    {
      contributorId: 'contrib-02',
      contributorName: 'Siti Aisyah (Contoh)',
      username: 'siti-aisyah',
      totalCommits: 41,
      yesCommits: 35,
      noCommits: 6,
      yesPercentage: 85.3,
    },
    {
      contributorId: 'contrib-03',
      contributorName: 'Rian Hidayat (Contoh)',
      username: 'rian-h',
      totalCommits: 31,
      yesCommits: 22,
      noCommits: 9,
      yesPercentage: 70.9,
    },
    {
      contributorId: 'contrib-04',
      contributorName: 'Nurul Fadhilah (Contoh)',
      username: 'nurul-f',
      totalCommits: 18,
      yesCommits: 12,
      noCommits: 6,
      yesPercentage: 66.6,
    },
  ],
  timeframe: {
    from: '2024-02-12',
    to: '2024-10-25',
  },
  notice:
    'Hasil klasifikasi YES/NO merupakan indikasi estimasi pola kontribusi commit berbasis model prototype. Hasil ini bukan representasi tunggal dari dedikasi atau nilai akademik mahasiswa.',
};

export const MOCK_ANALYSIS_HISTORY: AnalysisHistoryItem[] = [
  {
    id: 'hist-01',
    repositoryId: 'repo-pbl-01',
    repositoryName: 'if-polibatam/smart-inventory-pbl',
    branch: 'main',
    status: 'COMPLETED',
    startedAt: '2024-10-25T14:28:10Z',
    completedAt: '2024-10-25T14:30:00Z',
    totalCommits: 142,
    totalContributors: 4,
    triggeredBy: 'Dosen Pengampu IF314',
  },
  {
    id: 'hist-02',
    repositoryId: 'repo-pbl-02',
    repositoryName: 'if-polibatam/attendance-mobile-app',
    branch: 'master',
    status: 'COMPLETED',
    startedAt: '2024-10-26T09:58:00Z',
    completedAt: '2024-10-26T10:00:00Z',
    totalCommits: 98,
    totalContributors: 5,
    triggeredBy: 'Dosen Pengampu IF314',
  },
];
