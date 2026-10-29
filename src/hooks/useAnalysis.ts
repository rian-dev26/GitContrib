import { useState, useEffect } from 'react';
import { analysisService } from '../services/analysisService';
import { AnalysisSummary } from '../types';

/**
 * Custom hook untuk mengambil data ringkasan analisis repository
 */
export function useAnalysisSummary(repositoryId: string) {
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchSummary() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await analysisService.getAnalysisSummary(repositoryId);
        if (isMounted) {
          setSummary(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Gagal memuat analisis'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (repositoryId) {
      fetchSummary();
    }

    return () => {
      isMounted = false;
    };
  }, [repositoryId]);

  return { summary, isLoading, error };
}
