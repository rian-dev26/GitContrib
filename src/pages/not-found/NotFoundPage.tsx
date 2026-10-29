import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-14 h-14 rounded-full bg-app-secondary border border-app-border flex items-center justify-center text-app-text-secondary mb-4">
        <FileQuestion className="w-7 h-7" />
      </div>
      <h1 className="text-2xl font-semibold text-app-text-primary">
        Halaman Tidak Ditemukan
      </h1>
      <p className="text-xs text-app-text-secondary max-w-sm mt-2 leading-relaxed">
        Halaman atau rute yang Anda tuju tidak tersedia dalam sistem GitContrib.
      </p>
      <div className="mt-6">
        <Link to="/dashboard">
          <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Kembali ke Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
