import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, FolderGit2, Users } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

interface CommitNotFoundProps {
  commitId: string;
}

export function CommitNotFound({ commitId }: CommitNotFoundProps) {
  return (
    <div className="space-y-6 max-w-3xl mx-auto py-8">
      <div className="flex items-center gap-2 text-xs text-app-text-secondary">
        <Link
          to="/repositories/repo-pbl-01"
          className="inline-flex items-center gap-1.5 hover:text-app-text-primary transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Hasil Analisis Repository
        </Link>
      </div>

      <Card className="p-8 sm:p-12 text-center border-dashed border-app-border space-y-4">
        <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto shadow-sm">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-app-text-primary">
            Commit Tidak Ditemukan
          </h2>
          <p className="text-xs text-app-text-secondary max-w-md mx-auto mt-1">
            Commit dengan hash/ID <code className="font-mono text-app-accent-primary">"{commitId}"</code> tidak ditemukan dalam basis data analisis repositori aktif.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link to="/repositories/repo-pbl-01">
            <Button variant="primary" size="sm" leftIcon={<FolderGit2 className="w-3.5 h-3.5" />}>
              Buka Tabel Seluruh Commit di smart-inventory-pbl
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline" size="sm" leftIcon={<Users className="w-3.5 h-3.5" />}>
              Kembali ke Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
