import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { AnalysisPage } from '../pages/analysis/AnalysisPage';
import { RepositoryDetailPage } from '../pages/repository/RepositoryDetailPage';
import { ContributorDetailPage } from '../pages/contributors/ContributorDetailPage';
import { CommitDetailPage } from '../pages/commits/CommitDetailPage';
import { HistoryPage } from '../pages/history/HistoryPage';
import { ReportsPage } from '../pages/reports/ReportsPage';
import { SettingsPage } from '../pages/settings/SettingsPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { NotFoundPage } from '../pages/not-found/NotFoundPage';

/**
 * Membungkus AppLayout dengan ProtectedRoute sehingga:
 *  - Pengguna yang belum login diarahkan ke /login
 *  - Pengguna yang sudah login mendapatkan AppLayout dengan Outlet
 */
function ProtectedAppLayout() {
  return (
    <ProtectedRoute>
      <AppLayout />
    </ProtectedRoute>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Root — arahkan ke /dashboard (ProtectedRoute akan handle jika belum login) */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* ─── Auth Routes (tanpa sidebar) ─────────────────────────────────────── */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* ─── Protected Application Routes ────────────────────────────────────── */}
      <Route element={<ProtectedAppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />

        {/* Repositories & alias */}
        <Route path="/repositories" element={<Navigate to="/repositories/repo-pbl-01" replace />} />
        <Route path="/repositories/:repositoryId" element={<RepositoryDetailPage />} />
        <Route path="/repository" element={<Navigate to="/repositories/repo-pbl-01" replace />} />
        <Route path="/repository/:repositoryId" element={<RepositoryDetailPage />} />

        {/* Contributors & alias */}
        <Route path="/contributors" element={<Navigate to="/contributors/contrib-01" replace />} />
        <Route path="/contributors/:contributorId" element={<ContributorDetailPage />} />

        {/* Commits & alias */}
        <Route path="/commits" element={<Navigate to="/commits/a1b2c3d" replace />} />
        <Route path="/commits/:commitId" element={<CommitDetailPage />} />

        <Route path="/history" element={<HistoryPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
