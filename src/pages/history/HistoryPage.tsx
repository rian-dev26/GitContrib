import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';
import { analysisService } from '../../services/analysisService';
import { AnalysisHistoryItem } from '../../types';
import { HistoryStatsSummary } from './components/HistoryStatsSummary';
import { HistoryTable } from './components/HistoryTable';

export function HistoryPage() {
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      try {
        setIsLoading(true);
        const data = await analysisService.getHistory();
        if (isMounted) {
          setHistory(data);
        }
      } catch (err) {
        console.error('Gagal memuat riwayat analisis:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Page Header */}
      <PageHeader
        title="Riwayat Analisis Repository"
        description="Daftar histori ekstraksi commit Git dan evaluasi machine learning YES/NO yang telah dijalankan di sistem GitContrib."
      />

      {/* 2. Loading State */}
      {isLoading ? (
        <div className="py-24">
          <LoadingIndicator text="Memuat riwayat analisis repositori..." />
        </div>
      ) : (
        <>
          {/* 3. Summary Stat Cards */}
          <HistoryStatsSummary history={history} />

          {/* 4. Interactive History Table with Search, Filter, Sort, Pagination */}
          <HistoryTable items={history} />
        </>
      )}
    </div>
  );
}
