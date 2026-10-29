import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  GitCommit,
  GitCommitHorizontal,
  Calendar,
  User,
  FileCode,
  Cpu,
  ArrowLeft,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingIndicator } from '../../components/ui/LoadingIndicator';
import { analysisService } from '../../services/analysisService';
import { Commit } from '../../types';

export function CommitDetailPage() {
  const { commitId = 'demo' } = useParams();
  const [commit, setCommit] = useState<Commit | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isDemo = commitId === 'demo';

  useEffect(() => {
    if (isDemo) {
      setIsLoading(false);
      return;
    }

    async function loadCommit() {
      try {
        setIsLoading(true);
        const data = await analysisService.getCommitById(commitId);
        setCommit(
          data || {
            id: commitId,
            shortSha: commitId.slice(0, 7),
            repositoryId: 'repo-pbl-01',
            contributorId: 'contrib-01',
            contributorName: 'Mahasiswa PBL (Simulasi)',
            contributorEmail: 'mhs@polibatam.ac.id',
            message: 'Commit simulasi untuk inspeksi detail',
            timestamp: new Date().toISOString(),
            stats: { additions: 35, deletions: 10, totalChanges: 45, filesChanged: 2 },
            classification: {
              label: 'YES',
              confidence: 0.89,
              metadata: {
                modelVersion: 'proto-v0.1-rf',
                algorithm: 'Supervised Random Forest (Prototype)',
                evaluatedAt: new Date().toISOString(),
              },
            },
          }
        );
      } finally {
        setIsLoading(false);
      }
    }
    loadCommit();
  }, [commitId, isDemo]);

  if (isLoading) {
    return <LoadingIndicator text="Memuat detail commit..." className="py-24" />;
  }

  // Tampilan Placeholder Rapi untuk Rute Demo
  if (isDemo) {
    return (
      <div className="space-y-6 max-w-4xl">
        <PageHeader
          title="Detail Commit"
          description="Inspeksi rincian ekstraksi Git diff dan skor prediksi machine learning YES/NO pada tingkat commit individual."
          badge={<Badge variant="secondary">Placeholder Navigasi</Badge>}
        />

        <Card className="border-dashed border-app-border text-center p-8 sm:p-12">
          <div className="w-14 h-14 rounded-full bg-app-secondary border border-app-border flex items-center justify-center text-app-accent-primary mx-auto mb-4 shadow-sm">
            <GitCommitHorizontal className="w-7 h-7 stroke-[1.8]" />
          </div>

          <h3 className="text-base font-semibold text-app-text-primary">
            Halaman Detail Commit
          </h3>

          <p className="text-xs text-app-text-secondary max-w-md mx-auto mt-2 leading-relaxed">
            Halaman ini menampilkan rincian ekstraksi Git diff dan estimasi pola kontribusi commit mahasiswa berbasis model supervised learning.
            Halaman ini akan dikembangkan pada tahap berikutnya.
          </p>

          <div className="p-3.5 bg-app-secondary/40 border border-app-border rounded-md text-xs text-app-text-secondary max-w-md mx-auto mt-6 text-left flex items-start gap-3">
            <Layers className="w-4 h-4 text-app-accent-secondary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-app-text-primary">Konteks Navigasi:</p>
              <p className="mt-0.5">
                Untuk menginspeksi commit individual yang telah terklasifikasi YES/NO oleh prototype model, Anda dapat melihat commit contoh pada repository aktif.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <Link to="/commits/a1b2c3d">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Lihat Contoh Commit a1b2c3d
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Kembali ke Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (!commit) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <Link
          to={`/repositories/${commit.repositoryId}`}
          className="inline-flex items-center gap-1.5 text-xs text-app-text-secondary hover:text-app-text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Repository
        </Link>
      </div>

      <PageHeader
        title={`Commit: ${commit.shortSha}`}
        description={commit.message}
        badge={
          commit.classification && (
            <StatusBadge
              status={commit.classification.label}
              confidence={commit.classification.confidence}
              showConfidence
            />
          )
        }
      />

      {/* Commit Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Author & Git Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Metadata Commit Git</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-app-border">
              <span className="text-app-text-secondary flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-app-accent-primary" /> Full SHA
              </span>
              <span className="font-mono text-app-text-primary break-all text-[11px]">
                {commit.id}
              </span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-app-border">
              <span className="text-app-text-secondary flex items-center gap-2">
                <User className="w-4 h-4 text-app-accent-secondary" /> Penulis
              </span>
              <span className="font-medium text-app-text-primary">
                {commit.contributorName}
              </span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-app-border">
              <span className="text-app-text-secondary flex items-center gap-2">
                <Calendar className="w-4 h-4 text-app-text-secondary" /> Waktu Commit
              </span>
              <span className="text-app-text-primary">
                {new Date(commit.timestamp).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-app-text-secondary flex items-center gap-2">
                <FileCode className="w-4 h-4 text-app-accent-positive" /> Perubahan Baris
              </span>
              <span className="font-mono">
                <span className="text-app-accent-positive">+{commit.stats.additions}</span> /{' '}
                <span className="text-app-accent-negative">-{commit.stats.deletions}</span>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Machine Learning Classification Details */}
        <Card className="border-app-accent-primary/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-app-accent-primary" />
              <CardTitle className="text-sm">Prediksi Machine Learning</CardTitle>
            </div>
            <Badge variant="primary" size="sm">
              Supervised Classifier
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-app-border">
              <span className="text-app-text-secondary">Hasil Klasifikasi</span>
              {commit.classification && (
                <StatusBadge
                  status={commit.classification.label}
                  confidence={commit.classification.confidence}
                />
              )}
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-app-border">
              <span className="text-app-text-secondary">Nilai Estimasi Keyakinan</span>
              <span className="font-mono text-app-text-primary font-medium">
                {commit.classification?.confidence
                  ? `${Math.round(commit.classification.confidence * 100)}%`
                  : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-app-border">
              <span className="text-app-text-secondary">Versi Model (Prototype)</span>
              <span className="font-mono text-app-text-secondary">
                {commit.classification?.metadata?.modelVersion || 'proto-v0.1'}
              </span>
            </div>
            <p className="text-[11px] text-app-text-secondary/80 leading-relaxed pt-1">
              *Prediksi ini dihitung dari histori perubahan kode (churn, jumlah file, entropy pesan commit) untuk
              membantu dosen memetakan pola kontribusi.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Files changed list */}
      {commit.files && commit.files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Daftar File yang Diubah</CardTitle>
          </CardHeader>
          <div className="divide-y divide-app-border">
            {commit.files.map((f) => (
              <div key={f.filename} className="p-3.5 flex items-center justify-between text-xs font-mono">
                <span className="text-app-text-primary">{f.filename}</span>
                <span className="text-app-text-secondary">
                  <span className="text-app-accent-positive">+{f.additions}</span>{' '}
                  <span className="text-app-accent-negative">-{f.deletions}</span>
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
