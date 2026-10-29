import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  ChevronRight,
  User,
  Settings,
  LogOut,
} from 'lucide-react';
import { useLayout } from '../../contexts/LayoutContext';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeToggle } from '../common/ThemeToggle';
import { cn } from '../../utils/cn';

interface BreadcrumbItem {
  label: string;
  to?: string;
}

export function AppHeader() {
  const { toggleMobileOpen, toggleCollapsed } = useLayout();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate dynamic breadcrumbs based on active route
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const path = location.pathname;

    if (path === '/dashboard') {
      return [{ label: 'Dashboard' }];
    }
    if (path.startsWith('/analysis')) {
      return [
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Analisis Repository' },
      ];
    }
    if (path.startsWith('/history')) {
      return [
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Riwayat Analisis' },
      ];
    }
    if (path.startsWith('/contributors')) {
      const parts = path.split('/').filter(Boolean);
      const id = parts[1];
      if (!id || id === 'demo') {
        return [
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Contributor' },
        ];
      }
      return [
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Contributor', to: '/contributors/demo' },
        { label: id },
      ];
    }
    if (path.startsWith('/commits')) {
      const parts = path.split('/').filter(Boolean);
      const id = parts[1];
      if (!id || id === 'demo') {
        return [
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Detail Commit' },
        ];
      }
      return [
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Detail Commit', to: '/commits/demo' },
        { label: id.slice(0, 7) },
      ];
    }
    if (path.startsWith('/repositories')) {
      const parts = path.split('/').filter(Boolean);
      const repoId = parts[1] || 'repo';
      return [
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Analisis Repository', to: '/analysis' },
        { label: repoId },
      ];
    }
    if (path.startsWith('/reports')) {
      return [
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Laporan' },
      ];
    }
    if (path.startsWith('/settings')) {
      return [
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Pengaturan' },
      ];
    }

    return [{ label: 'Dashboard', to: '/dashboard' }, { label: 'Halaman' }];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <>
      <header className="h-[68px] px-4 sm:px-6 lg:px-8 border-b border-app-border bg-app-sidebar/95 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between gap-4">
        {/* Sisi Kiri: Toggle Sidebar & Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile hamburger toggle */}
          <button
            type="button"
            onClick={toggleMobileOpen}
            aria-label="Buka menu navigasi"
            className="lg:hidden p-2 rounded-md border border-app-border text-app-text-secondary hover:text-app-text-primary hover:bg-app-secondary transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Desktop quick toggle icon */}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label="Toggle ukuran sidebar"
            className="hidden lg:flex p-2 rounded-md border border-app-border text-app-text-secondary hover:text-app-text-primary hover:bg-app-secondary transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Breadcrumb berdasarkan halaman aktif */}
          <nav aria-label="Breadcrumb" className="min-w-0">
            <ol className="flex items-center gap-1.5 text-xs text-app-text-secondary truncate">
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <li key={crumb.label} className="flex items-center gap-1.5 truncate">
                    {idx > 0 && (
                      <ChevronRight className="w-3.5 h-3.5 text-app-text-secondary/50 shrink-0" />
                    )}
                    {crumb.to && !isLast ? (
                      <Link
                        to={crumb.to}
                        className="hover:text-app-text-primary transition-colors truncate"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className={cn('truncate', isLast && 'text-app-text-primary font-medium')}>
                        {crumb.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        {/* Sisi Kanan: Theme Toggle & Area Profil Pengguna */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Theme Switcher (Dark, Light, System) */}
          <ThemeToggle />

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              aria-label="Menu profil pengguna"
              aria-expanded={isProfileOpen}
              className={cn(
                'flex items-center gap-2.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-md border border-app-border hover:bg-app-secondary transition-colors duration-150',
                isProfileOpen && 'bg-app-secondary border-[#4A4D54]'
              )}
            >
              {/* Avatar inisial */}
              <div className="w-7 h-7 rounded-full bg-app-accent-primary/20 border border-app-accent-primary/40 flex items-center justify-center text-xs font-semibold text-app-accent-primary shrink-0">
                {user?.avatarInitials ?? 'DA'}
              </div>

              <div className="hidden sm:block text-left">
                <span className="text-xs font-medium text-app-text-primary block leading-none truncate max-w-[120px]">
                  {user?.name ?? 'Dosen Akademik'}
                </span>
                <span className="text-[10px] text-app-text-secondary leading-none">
                  {user?.role ?? 'Dosen'}
                </span>
              </div>
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <div
                role="menu"
                aria-label="Opsi Profil"
                className="absolute right-0 mt-2 w-56 rounded-md bg-app-card border border-app-border shadow-xl py-1.5 z-50 text-xs animate-fadeIn"
              >
                <div className="px-3 py-2 border-b border-app-border">
                  <p className="font-semibold text-app-text-primary truncate">{user?.name ?? 'Dosen Akademik'}</p>
                  <p className="text-[11px] text-app-text-secondary truncate">
                    {user?.email ?? 'dosen.pbl@polibatam.ac.id'}
                  </p>
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-app-secondary text-app-text-secondary border border-app-border mt-1.5">
                    {user?.department ?? 'Teknik Informatika'}
                  </span>
                </div>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsProfileOpen(false);
                    setShowProfileModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-app-text-primary hover:bg-app-secondary text-left transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-app-text-secondary" />
                  <span>Profil Pengguna</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-app-text-primary hover:bg-app-secondary text-left transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-app-text-secondary" />
                  <span>Pengaturan</span>
                </button>

                <div className="border-t border-app-border my-1" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                    navigate('/login', { replace: true });
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-app-accent-negative hover:bg-app-secondary text-left transition-colors font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modal dialog profil sederhana */}
      {showProfileModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm bg-app-card border border-app-border rounded-lg shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-app-accent-primary/20 border border-app-accent-primary/40 flex items-center justify-center text-sm font-semibold text-app-accent-primary">
                {user?.avatarInitials ?? 'DA'}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-app-text-primary">
                  {user?.name ?? 'Dosen Akademik'}
                </h3>
                <p className="text-xs text-app-text-secondary">
                  {user?.email ?? 'dosen.pbl@polibatam.ac.id'}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-app-text-secondary border-t border-b border-app-border py-3 my-3">
              <div className="flex justify-between">
                <span>Peran:</span>
                <span className="text-app-text-primary font-medium">{user?.role ?? 'Dosen'}</span>
              </div>
              <div className="flex justify-between">
                <span>Jurusan:</span>
                <span className="text-app-text-primary font-medium">{user?.department ?? 'Teknik Informatika'}</span>
              </div>
              <div className="flex justify-between">
                <span>NIDN:</span>
                <span className="text-app-text-primary font-medium font-mono">{user?.nidn ?? '0012345678'}</span>
              </div>
              <div className="flex justify-between">
                <span>Institusi:</span>
                <span className="text-app-text-primary font-medium">{user?.institution ?? 'Politeknik Negeri Batam'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowProfileModal(false);
                  navigate('/settings');
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-app-accent-primary text-white hover:bg-app-accent-primary-hover transition-colors"
              >
                Ubah di Pengaturan
              </button>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-app-secondary text-app-text-primary hover:bg-app-border/40 border border-app-border transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
