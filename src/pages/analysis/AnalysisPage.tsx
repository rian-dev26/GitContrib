import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Github,
  GitBranch,
  Play,
  CheckCircle2,
  AlertCircle,
  FolderGit2,
  ArrowRight,
  RotateCcw,
  ShieldAlert,
  ExternalLink,
  Sparkles,
  Info,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { EthicalNoticeCard } from '../../components/common/EthicalNoticeCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { validateGitHubRepoUrl } from '../../utils/githubUrl';
import { repositoryService } from '../../services/repositoryService';
import { Repository } from '../../types';
import { AnalysisProgressBar } from './components/AnalysisProgressBar';
import { AnalysisStepIndicator, ANALYSIS_STAGES } from './components/AnalysisStepIndicator';
import { CommitStreamAnimation } from './components/CommitStreamAnimation';
import { AiNodeNetworkAnimation } from './components/AiNodeNetworkAnimation';

type AnalysisStatus = 'idle' | 'analyzing' | 'success' | 'error';

export function AnalysisPage() {
  const navigate = useNavigate();

  // Form State
  const [repoUrl, setRepoUrl] = useState('https://github.com/if-polibatam/smart-inventory-pbl');
  const [branch, setBranch] = useState('main');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Analysis Progression State
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [activeStep, setActiveStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analyzedRepo, setAnalyzedRepo] = useState<Repository | null>(null);

  // Progressive timer for the 5 distinct stages
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (status === 'analyzing') {
      if (activeStep === 1) {
        setProgress(20);
        timeoutId = setTimeout(() => {
          setActiveStep(2);
        }, 800);
      } else if (activeStep === 2) {
        setProgress(42);
        timeoutId = setTimeout(() => {
          setActiveStep(3);
        }, 1100);
      } else if (activeStep === 3) {
        setProgress(65);
        timeoutId = setTimeout(() => {
          setActiveStep(4);
        }, 1000);
      } else if (activeStep === 4) {
        setProgress(88);
        timeoutId = setTimeout(() => {
          setActiveStep(5);
        }, 1200);
      } else if (activeStep === 5) {
        setProgress(100);
        timeoutId = setTimeout(async () => {
          try {
            const validation = validateGitHubRepoUrl(repoUrl);
            const result = await repositoryService.registerRepository(
              validation.cleanUrl || repoUrl,
              branch
            );
            setAnalyzedRepo(result);
            setStatus('success');
          } catch (err) {
            setStatus('error');
            setErrorMessage(
              err instanceof Error
                ? err.message
                : 'Terjadi kegagalan saat mengekstraksi atau menganalisis repository.'
            );
          }
        }, 700);
      }
    }

    return () => clearTimeout(timeoutId);
  }, [status, activeStep, repoUrl, branch]);

  // Handler Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setErrorMessage(null);

    // 1. Validasi format URL di Frontend
    const validation = validateGitHubRepoUrl(repoUrl);
    if (!validation.isValid) {
      setValidationError(validation.error || 'URL repository GitHub tidak valid.');
      return;
    }

    // Periksa skenario error simulasi sejak awal (jika mengandung kata kunci simulasi)
    const lowerUrl = repoUrl.toLowerCase();
    if (lowerUrl.includes('private') || lowerUrl.includes('secret')) {
      setStatus('analyzing');
      setActiveStep(1);
      setProgress(15);
      setTimeout(() => {
        setStatus('error');
        setErrorMessage(
          'Repository bersifat privat atau memerlukan autentikasi khusus. GitContrib saat ini hanya mendukung repository GitHub publik.'
        );
      }, 700);
      return;
    }

    if (lowerUrl.includes('404') || lowerUrl.includes('notfound') || lowerUrl.includes('tidakada')) {
      setStatus('analyzing');
      setActiveStep(1);
      setProgress(15);
      setTimeout(() => {
        setStatus('error');
        setErrorMessage(
          'Repository tidak dapat diakses atau tidak ditemukan di GitHub. Pastikan URL dan nama repository sudah tepat.'
        );
      }, 700);
      return;
    }

    if (lowerUrl.includes('fail') || lowerUrl.includes('gagal')) {
      setStatus('analyzing');
      setActiveStep(2);
      setProgress(35);
      setTimeout(() => {
        setStatus('error');
        setErrorMessage(
          'Proses ekstraksi Git clone gagal: Koneksi remote timeout atau repository kosong.'
        );
      }, 900);
      return;
    }

    // 2. Mulai State Loading & 5 Tahapan Simulasi
    setStatus('analyzing');
    setActiveStep(1);
    setProgress(10);
  };

  // Reset form untuk analisis baru
  const handleReset = () => {
    setStatus('idle');
    setErrorMessage(null);
    setValidationError(null);
    setActiveStep(1);
    setProgress(0);
  };

  const currentStage = ANALYSIS_STAGES.find((s) => s.id === activeStep) || ANALYSIS_STAGES[0];

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Analisis Repository GitHub"
        description="Jalankan ekstraksi histori Git dan klasifikasi Machine Learning YES/NO untuk memahami pola kontribusi anggota tim PBL."
        badge={
          <Badge variant="secondary" size="sm">
            Mode Prototype Frontend
          </Badge>
        }
      />

      <EthicalNoticeCard />

      {/* STATE 1: IDLE (Form Input & Validasi) */}
      {status === 'idle' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Form Pendaftaran Repository</CardTitle>
              <CardDescription>
                Masukkan URL repository GitHub publik yang ingin dianalisis.
              </CardDescription>
            </div>
            <Badge variant="outline" size="sm" className="bg-app-accent-primary/10 border-app-accent-primary/30 text-app-accent-primary">
              Public Repos Only
            </Badge>
          </CardHeader>

          <CardContent className="space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="URL Repository GitHub"
                value={repoUrl}
                onChange={(e) => {
                  setRepoUrl(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="https://github.com/organisasi/nama-repo"
                required
                leftIcon={<Github className="w-4 h-4" />}
                helperText="Format: https://github.com/owner/repository (hanya repository publik)"
                error={validationError || undefined}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Target Branch"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main"
                  leftIcon={<GitBranch className="w-4 h-4" />}
                  helperText="Default branch untuk evaluasi histori commit (contoh: main, master)."
                />

                <div className="flex flex-col justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    leftIcon={<Play className="w-4 h-4 fill-current" />}
                    className="w-full h-9"
                  >
                    Mulai Analisis
                  </Button>
                </div>
              </div>
            </form>

            {/* Banner Informasi Public Repository */}
            <div className="flex items-start gap-2.5 p-3 rounded-md bg-app-secondary/50 border border-app-border text-xs text-app-text-secondary">
              <Info className="w-4 h-4 text-app-accent-primary shrink-0 mt-0.5" />
              <span>
                <strong>Catatan Aksesibilitas:</strong> GitContrib saat ini dirancang untuk repository berstatus <strong>Publik</strong> tanpa kredensial akses privat. Pastikan repositori GitHub PBL dapat diakses publik oleh umum.
              </span>
            </div>

            {/* Preset Uji Coba Skenario */}
            <div className="pt-3 border-t border-app-border">
              <p className="text-xs font-medium text-app-text-secondary mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-app-accent-primary" />
                Uji Coba Skenario Cepat (Preset Demo):
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setRepoUrl('https://github.com/if-polibatam/smart-inventory-pbl');
                    setBranch('main');
                    setValidationError(null);
                  }}
                  className="px-2.5 py-1 rounded bg-app-secondary border border-app-border text-app-text-primary hover:border-app-accent-primary text-[11px] transition-colors"
                >
                  ✓ Repo Valid (smart-inventory-pbl)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRepoUrl('https://github.com/contoh-lab/private-repository');
                    setBranch('main');
                    setValidationError(null);
                  }}
                  className="px-2.5 py-1 rounded bg-app-secondary border border-app-border text-app-accent-secondary hover:border-app-accent-secondary text-[11px] transition-colors"
                >
                  ⚠ Simulasi Repo Privat
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRepoUrl('https://github.com/contoh-lab/repo-404-notfound');
                    setBranch('main');
                    setValidationError(null);
                  }}
                  className="px-2.5 py-1 rounded bg-app-secondary border border-app-border text-app-accent-negative hover:border-app-accent-negative text-[11px] transition-colors"
                >
                  ⚠ Simulasi Tidak Ditemukan (404)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRepoUrl('https://github.com/contoh-lab/fail-timeout-repo');
                    setBranch('main');
                    setValidationError(null);
                  }}
                  className="px-2.5 py-1 rounded bg-app-secondary border border-app-border text-app-accent-negative hover:border-app-accent-negative text-[11px] transition-colors"
                >
                  ✗ Simulasi Gagal Ekstraksi
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STATE 2: ANALYZING (State Loading, Stepper, Live Stream & AI Node) */}
      {status === 'analyzing' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Progress Bar Visual */}
          <AnalysisProgressBar
            progress={progress}
            stageLabel={currentStage.label}
          />

          {/* Stepper Indikator 5 Tahapan */}
          <Card>
            <CardHeader className="pb-3">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Alur Pemrosesan Bertahap
                </CardTitle>
                <CardDescription className="text-xs">
                  Tahapan ekstraksi histori Git dan inferensi klasifikasi pola kontribusi commit.
                </CardDescription>
              </div>
              <Badge variant="outline" size="sm" className="bg-app-accent-primary/10 text-app-accent-primary border-app-accent-primary/30">
                Tahap {activeStep} dari 5
              </Badge>
            </CardHeader>
            <CardContent>
              <AnalysisStepIndicator activeStep={activeStep} />
            </CardContent>
          </Card>

          {/* Animasi Interaktif: Live Git Commit Stream & AI Node Minimalis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CommitStreamAnimation activeStep={activeStep} />
            <AiNodeNetworkAnimation isAnalyzing={true} activeStep={activeStep} />
          </div>
        </div>
      )}

      {/* STATE 3: ERROR (State Gagal & Opsi Retry) */}
      {status === 'error' && (
        <Card className="border-app-accent-negative/40 bg-app-accent-negative/5 animate-fadeIn">
          <CardHeader>
            <div className="flex items-center gap-2.5 text-app-accent-negative">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <CardTitle className="text-base text-app-accent-negative">
                  Analisis Repository Tidak Dapat Diselesaikan
                </CardTitle>
                <CardDescription className="text-app-text-secondary text-xs">
                  Sistem tidak dapat memproses repository GitHub yang ditentukan.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3.5 rounded-md bg-app-card border border-app-accent-negative/30 text-xs text-app-text-primary leading-relaxed">
              <strong>Penyebab Kesalahan:</strong> {errorMessage}
            </div>

            <div className="text-xs text-app-text-secondary space-y-1">
              <p className="font-semibold text-app-text-primary">Panduan Solusi untuk Dosen:</p>
              <ul className="list-disc list-inside space-y-0.5 text-app-text-secondary">
                <li>Pastikan repository berstatus <strong>Publik</strong> dan dapat di-clone tanpa login.</li>
                <li>Periksa ejaan URL repository (contoh yang valid: <code>https://github.com/owner/repository</code>).</li>
                <li>Pastikan target branch (misal: <code>main</code> atau <code>master</code>) benar-benar ada pada repository.</li>
                <li>Jika repository privat, ubah visibility menjadi publik sementara di GitHub Settings.</li>
              </ul>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleReset}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Coba Lagi
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STATE 4: SUCCESS (State Berhasil dengan Tombol Lihat Hasil Analisis) */}
      {status === 'success' && analyzedRepo && (
        <Card className="border-app-accent-positive/40 bg-app-accent-positive/5 animate-fadeIn">
          <CardHeader>
            <div className="flex items-center gap-2.5 text-app-accent-positive">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <CardTitle className="text-base text-app-accent-positive">
                  Analisis Repository Selesai!
                </CardTitle>
                <CardDescription>
                  Simulasi ekstraksi histori Git dan inferensi model Machine Learning telah selesai disintesis.
                </CardDescription>
              </div>
            </div>
            <Badge variant="success" size="sm">
              Selesai (100%)
            </Badge>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Repository Summary Box */}
            <div className="p-4 rounded-md bg-app-card border border-app-border space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-app-accent-primary" />
                  <span className="font-semibold text-sm text-app-text-primary">
                    {analyzedRepo.fullName || analyzedRepo.name}
                  </span>
                  <Badge variant="outline" size="sm">
                    {analyzedRepo.defaultBranch}
                  </Badge>
                </div>
                <a
                  href={analyzedRepo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-app-accent-primary hover:underline"
                >
                  Buka di GitHub <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-app-border text-xs">
                <div>
                  <span className="text-[11px] text-app-text-secondary block">Total Commit</span>
                  <span className="font-mono font-semibold text-app-text-primary">
                    {analyzedRepo.stats?.totalCommits ?? 84} commits
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-app-text-secondary block">Kontributor Mahasiswa</span>
                  <span className="font-mono font-semibold text-app-text-primary">
                    {analyzedRepo.stats?.totalContributors ?? 4} mahasiswa
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-app-text-secondary block">Estimasi Pola ML</span>
                  <span className="font-mono font-semibold text-app-accent-positive">
                    78% YES / 22% NO
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/repositories/${analyzedRepo.id}`)}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Lihat Hasil Analisis
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Analisis Repository Lain
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informasi Cakupan Analisis (Scope & Limitations) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 bg-app-card/60">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-app-accent-positive shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-app-text-primary">
                Cakupan Analisis yang Didukung
              </p>
              <ul className="text-app-text-secondary list-disc list-inside space-y-0.5">
                <li>Repository GitHub berstatus <strong>Publik</strong></li>
                <li>Ekstraksi riwayat Git log & metadata commit</li>
                <li>Klasifikasi pola kontribusi tingkat commit (YES/NO)</li>
                <li>Agregasi ringkasan pada tingkat kontributor mahasiswa</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-app-card/60">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 text-app-accent-secondary shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-app-text-primary">
                Batasan Sistem (Out-of-Scope)
              </p>
              <ul className="text-app-text-secondary list-disc list-inside space-y-0.5">
                <li>Repository privat memerlukan konfigurasi personal access token terpisah</li>
                <li>Tidak menganalisis aktivitas offline / non-Git mahasiswa</li>
                <li>Tidak menggantikan rubrik penilaian akademik dosen</li>
                <li>Saat ini berjalan dalam mode simulasi prototype frontend</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default AnalysisPage;
