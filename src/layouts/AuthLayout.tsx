import { Outlet } from 'react-router-dom';
import { GitBranch } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="h-screen overflow-y-auto bg-app-bg text-app-text-primary flex flex-col justify-center items-center p-4">
      {/* Brand Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-app-accent-primary/20 border border-app-accent-primary/40 flex items-center justify-center text-app-accent-primary shadow-sm">
          <GitBranch className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-app-text-primary tracking-tight">
            GitContrib
          </h1>
          <p className="text-xs text-app-text-secondary">
            Sistem Analisis Pola Kontribusi PBL
          </p>
        </div>
      </div>

      <div className="w-full max-w-md">
        <Outlet />
      </div>

      <p className="mt-8 text-xs text-app-text-secondary/70 text-center max-w-sm">
        Platform evaluasi aktivitas Git mahasiswa berbasis Machine Learning untuk Dosen Pengampu mata kuliah PBL.
      </p>
    </div>
  );
}
