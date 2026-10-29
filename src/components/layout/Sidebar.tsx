import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  GitBranch,
  History,
  Users,
  GitCommitHorizontal,
  FileBarChart,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
  Settings,
} from 'lucide-react';
import { useLayout } from '../../contexts/LayoutContext';
import { cn } from '../../utils/cn';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Analisis Repository',
    to: '/analysis',
    icon: GitBranch,
  },
  {
    label: 'Riwayat Analisis',
    to: '/history',
    icon: History,
  },
  {
    label: 'Contributor',
    to: '/contributors/demo',
    icon: Users,
  },
  {
    label: 'Detail Commit',
    to: '/commits/demo',
    icon: GitCommitHorizontal,
  },
  {
    label: 'Laporan',
    to: '/reports',
    icon: FileBarChart,
  },
];

export function Sidebar() {
  const { isCollapsed, toggleCollapsed, isMobileOpen, closeMobileDrawer } = useLayout();
  const navigate = useNavigate();

  return (
    <>
      {/* Backdrop overlay khusus tampilan mobile drawer */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity animate-fadeIn"
          onClick={closeMobileDrawer}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container - Berdiri sendiri, fixed di desktop dan mobile drawer */}
      <aside
        className={cn(
          'bg-app-sidebar border-r border-app-border flex flex-col shrink-0 h-full z-40 select-none transition-all duration-200 ease-in-out',
          // Desktop sizing & positioning (berdiri sendiri di samping konten)
          isCollapsed ? 'lg:w-[72px]' : 'lg:w-[248px]',
          'relative hidden lg:flex',
          // Mobile drawer positioning
          isMobileOpen && '!flex fixed inset-y-0 left-0 w-[248px] z-50 shadow-2xl animate-fadeIn'
        )}
      >
        {/* Header Sidebar (Tinggi konsisten 68px sesuai standar layout) */}
        <div
          className={cn(
            'h-[68px] border-b border-app-border flex items-center shrink-0 px-4 transition-all duration-200',
            isCollapsed && !isMobileOpen ? 'justify-center px-2' : 'justify-between'
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Logo sederhana berbasis Git branch */}
            <div className="w-9 h-9 rounded-md bg-app-accent-primary/15 border border-app-accent-primary/30 flex items-center justify-center text-app-accent-primary shrink-0 shadow-sm">
              <GitBranch className="w-5 h-5 stroke-[2.2]" />
            </div>

            {(!isCollapsed || isMobileOpen) && (
              <div className="min-w-0">
                <span className="font-semibold text-sm text-app-text-primary tracking-tight font-sans block truncate">
                  GitContrib
                </span>
                <p className="text-[11px] text-app-text-secondary leading-tight truncate">
                  Analisis Kontribusi
                </p>
              </div>
            )}
          </div>

          {/* Tombol tutup khusus mobile drawer */}
          <button
            type="button"
            onClick={closeMobileDrawer}
            aria-label="Tutup menu navigasi"
            className="lg:hidden p-1.5 rounded-md text-app-text-secondary hover:text-app-text-primary hover:bg-app-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigasi Utama (Scroll mandiri jika item panjang) */}
        <nav
          aria-label="Navigasi Utama"
          className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden"
        >
          {(!isCollapsed || isMobileOpen) && (
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-app-text-secondary/60">
              Menu Utama
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={isCollapsed && !isMobileOpen ? item.label : undefined}
                onClick={() => {
                  if (isMobileOpen) closeMobileDrawer();
                }}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center rounded-md text-xs font-medium transition-colors duration-150',
                    isCollapsed && !isMobileOpen
                      ? 'justify-center h-10 w-10 mx-auto px-0'
                      : 'gap-3 px-3 py-2.5',
                    isActive
                      ? 'bg-app-secondary/80 text-app-text-primary font-semibold shadow-sm'
                      : 'text-app-text-secondary hover:text-app-text-primary hover:bg-app-secondary/50'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Indikator aksen biru yang tipis saat menu aktif */}
                    {isActive && (
                      <span
                        className={cn(
                          'absolute bg-app-accent-primary rounded-full transition-all',
                          isCollapsed && !isMobileOpen
                            ? 'left-0 top-2 bottom-2 w-1'
                            : 'left-0 top-1.5 bottom-1.5 w-1 rounded-r-md'
                        )}
                        aria-hidden="true"
                      />
                    )}

                    <Icon
                      className={cn(
                        'shrink-0 stroke-[1.8] transition-colors',
                        isCollapsed && !isMobileOpen ? 'w-5 h-5' : 'w-4 h-4',
                        isActive
                          ? 'text-app-accent-primary'
                          : 'text-app-text-secondary group-hover:text-app-text-primary'
                      )}
                    />

                    {(!isCollapsed || isMobileOpen) && (
                      <span className="truncate">{item.label}</span>
                    )}

                    {/* Tooltip hover saat sidebar desktop dalam mode icon */}
                    {isCollapsed && !isMobileOpen && (
                      <div className="absolute left-full ml-3 px-2.5 py-1 bg-app-card text-app-text-primary text-xs rounded border border-app-border shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                        {item.label}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bagian Bawah Sidebar: Profil Pengguna Demo & Collapse Toggle */}
        <div className="p-3 border-t border-app-border shrink-0 space-y-2">
          {/* Card Profil Pengguna Demo */}
          <div
            className={cn(
              'rounded-md bg-app-card border border-app-border transition-all duration-150 flex items-center',
              isCollapsed && !isMobileOpen ? 'p-1.5 justify-center' : 'p-2.5 gap-3'
            )}
          >
            {/* Avatar Inisial DA */}
            <div
              className="w-8 h-8 rounded-full bg-app-accent-primary/20 border border-app-accent-primary/40 flex items-center justify-center text-xs font-semibold text-app-accent-primary shrink-0"
              title="Dosen Akademik"
            >
              DA
            </div>

            {(!isCollapsed || isMobileOpen) && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-app-text-primary truncate">
                  Dosen Akademik
                </p>
                <span className="inline-block px-1.5 py-0.2 rounded text-[10px] bg-app-secondary text-app-text-secondary border border-app-border mt-0.5">
                  Dosen
                </span>
              </div>
            )}

            {/* Quick action profile / settings di sidebar */}
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => navigate('/settings')}
                  aria-label="Buka Pengaturan"
                  className="p-1 rounded text-app-text-secondary hover:text-app-text-primary hover:bg-app-secondary transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  aria-label="Keluar ke halaman login"
                  className="p-1 rounded text-app-text-secondary hover:text-app-accent-negative hover:bg-app-secondary transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Tombol Toggle Collapse Desktop */}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={isCollapsed ? 'Perbesar sidebar' : 'Perkecil sidebar'}
            className={cn(
              'hidden lg:flex w-full items-center py-2 rounded-md border border-app-border text-xs text-app-text-secondary hover:text-app-text-primary hover:bg-app-secondary transition-colors duration-150',
              isCollapsed ? 'justify-center px-0' : 'justify-between px-3'
            )}
          >
            {!isCollapsed && <span className="text-[11px]">Sembunyikan Sidebar</span>}
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
