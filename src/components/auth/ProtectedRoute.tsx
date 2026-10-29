import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * ProtectedRoute — simulasi guard route frontend.
 * Jika pengguna belum terautentikasi (sesi tidak ada),
 * akan diarahkan ke halaman login dan menyimpan lokasi asal
 * agar setelah login bisa kembali ke halaman yang dimaksud.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
