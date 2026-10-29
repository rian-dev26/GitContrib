import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';

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

export function AppRoutes() {
  return (
    <Routes>
      {/* Route root mengarahkan sementara ke /dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Auth Route */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Main Application Routes */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/repositories/:repositoryId" element={<RepositoryDetailPage />} />
        <Route path="/contributors/:contributorId" element={<ContributorDetailPage />} />
        <Route path="/commits/:commitId" element={<CommitDetailPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
