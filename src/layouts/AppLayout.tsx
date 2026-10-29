import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { AppHeader } from '../components/layout/AppHeader';
import { LayoutProvider } from '../contexts/LayoutContext';

export function AppLayout() {
  return (
    <LayoutProvider>
      {/* Root Layout Container - Fixed viewport height, no global document scroll */}
      <div className="flex h-screen w-full overflow-hidden bg-app-bg text-app-text-primary transition-colors duration-150">
        {/* Sidebar Navigasi - Berdiri sendiri, fixed/statis di sisi kiri */}
        <Sidebar />

        {/* Area Konten Kanan - Memiliki header tetap dan area scroll independen */}
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
          {/* Header Aplikasi Konsisten (Tinggi 68px, tidak ikut scroll) */}
          <AppHeader />

          {/* Kontainer Konten Utama - Scroll vertikal alami independen */}
          <main className="flex-1 overflow-y-auto min-w-0 focus:outline-none">
            <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </LayoutProvider>
  );
}

export default AppLayout;
