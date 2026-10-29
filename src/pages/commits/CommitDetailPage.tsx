import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';
import { EthicalNoticeCard } from '../../components/common/EthicalNoticeCard';
import { analysisService } from '../../services/analysisService';
import { repositoryService } from '../../services/repositoryService';
import { Commit, Repository } from '../../types';
import { CommitHeader } from './components/CommitHeader';
import { CommitMetricsRow } from './components/CommitMetricsRow';
import { CommitPredictionCard } from './components/CommitPredictionCard';
import { CommitFilesList } from './components/CommitFilesList';
import { CommitNotFound } from './components/CommitNotFound';

export function CommitDetailPage() {
  const { commitId = 'a1b2c3d' } = useParams<{ commitId: string }>();

  const [commit, setCommit] = useState<Commit | null>(null);
  const [repository, setRepository] = useState<Repository | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function loadCommitData() {
      try {
        setIsLoading(true);
        setNotFound(false);

        // Jika rute demo dipanggil langsung, gunakan hash pertama yang valid
        const effectiveId = commitId === 'demo' ? 'a1b2c3d' : commitId;

        const data = await analysisService.getCommitById(effectiveId);

        if (!isMounted) return;

        if (!data) {
          setNotFound(true);
          setIsLoading(false);
          return;
        }

        setCommit(data);

        // Ambil info repository terkait
        const repoData = await repositoryService.getRepositoryById(data.repositoryId);
        if (isMounted) {
          setRepository(repoData);
        }
      } catch (err) {
        console.error('Gagal memuat data commit:', err);
        if (isMounted) setNotFound(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadCommitData();

    return () => {
      isMounted = false;
    };
  }, [commitId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="py-24">
        <LoadingIndicator text="Memuat rincian ekstraksi Git dan hasil prediksi commit..." />
      </div>
    );
  }

  // Not found state
  if (notFound || !commit) {
    return <CommitNotFound commitId={commitId} />;
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-5xl">
      {/* 1. Header Informasi Commit (Hash, Pesan, Contributor, Waktu, Repo) */}
      <CommitHeader commit={commit} repository={repository} />

      {/* 2. Catatan Etis & Metodologi */}
      <EthicalNoticeCard />

      {/* 3. Baris Metrik Utama (File Berubah, Additions, Deletions, Total Code Churn) */}
      <CommitMetricsRow
        filesChanged={commit.stats.filesChanged}
        additions={commit.stats.additions}
        deletions={commit.stats.deletions}
        totalChanges={commit.stats.totalChanges}
      />

      {/* 4. Kartu Prediksi Klasifikasi Model Machine Learning (YES / NO) */}
      <CommitPredictionCard classification={commit.classification} />

      {/* 5. Daftar File yang Berubah (Dummy Data Konsisten) */}
      <CommitFilesList
        files={commit.files}
        totalAdditions={commit.stats.additions}
        totalDeletions={commit.stats.deletions}
      />
    </div>
  );
}
