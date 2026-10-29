import { Outlet } from 'react-router-dom';
import { GitBranch, Shield, BarChart3, Users } from 'lucide-react';

const FEATURES = [
  {
    icon: BarChart3,
    label: 'Analisis Commit',
    desc: 'Visualisasi pola kontribusi berbasis histori Git',
  },
  {
    icon: Users,
    label: 'Evaluasi Tim PBL',
    desc: 'Identifikasi distribusi kerja antar anggota proyek',
  },
  {
    icon: Shield,
    label: 'Klasifikasi ML',
    desc: 'Model supervised learning prediksi YES/NO per commit',
  },
];

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-app-bg text-app-text-primary flex items-stretch">
      {/* ── Left Panel — Branding (hidden on small screens) ─────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[560px] shrink-0 bg-app-sidebar border-r border-app-border p-10 pl-14 relative">
        {/* Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl bg-app-accent-primary/20 border border-app-accent-primary/40 flex items-center justify-center text-app-accent-primary shadow-sm">
              <GitBranch className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-app-text-primary tracking-tight">GitContrib</h1>
              <p className="text-[11px] text-app-text-secondary">Analisis Pola Kontribusi PBL</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-app-text-primary leading-snug mb-3">
            Platform Evaluasi<br />
            <span className="text-app-accent-primary">Aktivitas Git</span> Mahasiswa
          </h2>
          <p className="text-sm text-app-text-secondary leading-relaxed">
            Bantu dosen pengampu memahami pola kontribusi nyata setiap anggota tim berdasarkan histori commit repository GitHub.
          </p>

          <div className="mt-10 space-y-4">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-app-accent-primary/15 border border-app-accent-primary/25 flex items-center justify-center text-app-accent-primary shrink-0 mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-app-text-primary">{label}</p>
                  <p className="text-[11px] text-app-text-secondary mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="relative z-10 text-[11px] text-app-text-secondary/60">
          © 2024 GitContrib — Dikembangkan sebagai Proyek Riset Informatika
        </p>
      </div>

      {/* ── Right Panel — Login Form ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 overflow-y-auto">
        {/* Mobile brand header */}
        <div className="lg:hidden flex items-center gap-3 mb-8 self-start">
          <div className="w-9 h-9 rounded-lg bg-app-accent-primary/20 border border-app-accent-primary/40 flex items-center justify-center text-app-accent-primary">
            <GitBranch className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-base font-bold text-app-text-primary">GitContrib</span>
            <p className="text-[11px] text-app-text-secondary">Analisis Kontribusi PBL</p>
          </div>
        </div>

        <div className="w-full max-w-md">
          <Outlet />
        </div>

        <p className="mt-8 text-[11px] text-app-text-secondary/60 text-center max-w-sm">
          Hanya untuk <strong className="text-app-text-secondary">Dosen Pengampu</strong> mata kuliah Project-Based Learning (PBL). Tidak tersedia opsi pendaftaran mandiri.
        </p>
      </div>
    </div>
  );
}
