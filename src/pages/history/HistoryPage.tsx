import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { History, FolderGit2, ArrowRight } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';
import { analysisService } from '../../services/analysisService';
import { AnalysisHistoryItem } from '../../types';

export function HistoryPage() {
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await analysisService.getHistory();
        setHistory(data);
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Riwayat Analisis Repository"
        description="Daftar proses ekstraksi histori Git dan evaluasi machine learning yang telah dijalankan sebelumnya."
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-app-accent-primary" />
            <CardTitle>Log Aktivitas Analisis</CardTitle>
          </div>
          <span className="text-xs text-app-text-secondary">
            Total {history.length} sesi analisis
          </span>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingIndicator text="Memuat riwayat..." className="py-12" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-app-secondary/50 text-app-text-secondary border-b border-app-border">
                  <tr>
                    <th className="py-3 px-4">Repository</th>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Commits / Kontributor</th>
                    <th className="py-3 px-4">Waktu Selesai</th>
                    <th className="py-3 px-4">Inisiator</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-app-secondary/30 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-app-text-primary">
                        <div className="flex items-center gap-2">
                          <FolderGit2 className="w-4 h-4 text-app-accent-primary" />
                          <span>{item.repositoryName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-app-text-secondary">
                        {item.branch}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="success" size="sm" dot>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {item.totalCommits} commits / {item.totalContributors} mhs
                      </td>
                      <td className="py-3.5 px-4 text-app-text-secondary">
                        {item.completedAt
                          ? new Date(item.completedAt).toLocaleString('id-ID')
                          : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-app-text-secondary">
                        {item.triggeredBy}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/repositories/${item.repositoryId}`}
                          className="inline-flex items-center gap-1 text-app-accent-primary hover:underline font-medium"
                        >
                          Buka <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
