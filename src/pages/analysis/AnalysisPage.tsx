import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { repositoryService, AnalysisJobResponse } from '../../services/repositoryService';
import { Repository } from '../../types';
import { AnalysisProgressBar } from './components/AnalysisProgressBar';
import { AnalysisStepIndicator, ANALYSIS_STAGES } from './components/AnalysisStepIndicator';
import { CommitStreamAnimation } from './components/CommitStreamAnimation';
import { AiNodeNetworkAnimation } from './components/AiNodeNetworkAnimation';

type AnalysisStatus = 'idle' | 'analyzing' | 'success' | 'error';

/**
 * Menghitung activeStep (1-5) berdasarkan progress job dari backend.
 */
function progressToStep(progress: number): number {
  if (progress < 20) return 1; // Validasi & koneksi
  if (progress < 40) return 2; // Git clone
  if (progress < 65) return 3; // Ekstraksi fitur
  if (progress < 85) return 4; // Inferensi ML
  return 5; // Finalisasi
}

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
  const [isBackendMode, setIsBackendMode] = useState(false);

  // Ref untuk membatalkan polling jika user reset
  const abortRef = useRef(false);

  // Callback ketika backend mengirim update progress
  const handleBackendProgress = useCallback((job: AnalysisJobResponse) => {
    setProgress(job.progress);
    setActiveStep(progressToStep(job.progress));
  }, []);

  // Fallback: timer-based progress untuk mode demo (ketika backend tidak aktif)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    // Hanya jalankan timer simulasi jika BUKAN mode backend
    if (status === 'analyzing' && !isBackendMode) {
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
        // Di mode demo, panggil registerRepository langsung (fallback ke mock)
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
  }, [status, activeStep, repoUrl, branch, isBackendMode]);

  // Handler Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setErrorMessage(null);
    abortRef.current = false;

    // 1. Validasi format URL di Frontend
    const validation = validateGitHubRepoUrl(repoUrl);
    if (!validation.isValid) {
      setValidationError(validation.error || 'URL repository GitHub tidak valid.');
      return;
    }

    // Periksa skenario error simulasi (untuk preset demo)
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

    // 2. Mulai analisis — coba backend dulu, fallback ke demo
    setStatus('analyzing');
    setActiveStep(1);
    setProgress(10);

    // Coba hubungkan ke backend
    try {
      const cleanUrl = validation.cleanUrl || repoUrl;
      setIsBackendMode(true);

      const result = await repositoryService.registerRepository(
        cleanUrl,
        branch,
        handleBackendProgress
      );

      if (!abortRef.current) {
        setProgress(100);
        setActiveStep(5);
        setAnalyzedRepo(result);
        setStatus('success');
      }
    } catch (err) {
      if (abortRef.current) return;

      // Cek apakah error dari backend atau koneksi gagal
      const errorMsg = err instanceof Error ? err.message : String(err);

      if (errorMsg.includes('mode demo') || errorMsg.includes('Backend tidak tersedia')) {
        // Fallback ke mode demo — biarkan useEffect timer berjalan
        setIsBackendMode(false);
        // Timer di useEffect akan mengambil alih
      } else {
        setStatus('error');
        setErrorMessage(errorMsg);
      }
    }
  };

  // Reset form untuk analisis baru
  const handleReset = () => {
    abortRef.current = true;
    setStatus('idle');
    setErrorMessage(null);
    setValidationError(null);
    setActiveStep(1);
    setProgress(0);
    setIsBackendMode(false);
  };

  const currentStage = ANALYSIS_STAGES.find((s) => s.id === activeStep) || ANALYSIS_STAGES[0];

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Analisis Repository GitHub"
        description="Jalankan ekstraksi histori Git dan klasifikasi Machine Learning YES/NO untuk memahami pola kontribusi anggota tim."
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
                    setRepoUrl('https://github.com/octocat/Hello-World');
                    setBranch('master');
                    setValidationError(null);
                  }}
                  className="px-2.5 py-1 rounded bg-app-accent-positive/10 border border-app-accent-positive/30 text-app-accent-positive hover:border-app-accent-positive text-[11px] transition-colors font-medium"
                >
                  ⚡ Live Repo Nyata (octocat/Hello-World)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRepoUrl('https://github.com/if-polibatam/smart-inventory-pbl');
                    setBranch('main');
                    setValidationError(null);
                  }}
                  className="px-2.5 py-1 rounded bg-app-secondary border border-app-border text-app-text-primary hover:border-app-accent-primary text-[11px] transition-colors"
                >
                  ✓ Demo PBL (smart-inventory-pbl)
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
          {/* Mode Indicator */}
          <div className="flex items-center gap-2 text-xs text-app-text-secondary">
            <div className={`w-2 h-2 rounded-full ${isBackendMode ? 'bg-app-accent-positive animate-pulse' : 'bg-app-accent-secondary'}`} />
            <span>
              {isBackendMode
                ? 'Terhubung ke Backend ML — analisis real-time'
                : 'Mode Demo — simulasi tahapan analisis'}
            </span>
          </div>

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
              <p className="font-semibold text-app-text-primary">Panduan Solusi:</p>
              <ul className="list-disc list-inside space-y-0.5 text-app-text-secondary">
                <li>Pastikan repository berstatus <strong>Publik</strong> dan dapat di-clone tanpa login.</li>
                <li>Periksa ejaan URL repository (contoh yang valid: <code>https://github.com/owner/repository</code>).</li>
                <li>Pastikan target branch (misal: <code>main</code> atau <code>master</code>) benar-benar ada pada repository.</li>
                <li>Jika repository privat, ubah visibility menjadi publik sementara di GitHub Settings.</li>
                <li>Pastikan backend GitContrib API sedang berjalan (<code>python main.py</code> di folder backend).</li>
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
                  {analyzedRepo.analysisJobId
                    ? 'Ekstraksi histori Git dan inferensi model Machine Learning telah selesai diproses oleh backend.'
                    : 'Simulasi ekstraksi histori Git dan inferensi model Machine Learning telah selesai disintesis.'}
                </CardDescription>
              </div>
            </div>
            <Badge variant="success" size="sm">
              Selesai (100%)
            </Badge>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Mode Indicator di Success */}
            {analyzedRepo.analysisJobId && (
              <div className="flex items-center gap-2 text-xs text-app-accent-positive">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Hasil dari model ML backend (bukan data simulasi)</span>
              </div>
            )}

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
                    {analyzedRepo.stats?.totalCommits ?? '—'} commits
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-app-text-secondary block">Kontributor Mahasiswa</span>
                  <span className="font-mono font-semibold text-app-text-primary">
                    {analyzedRepo.stats?.totalContributors ?? '—'} mahasiswa
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-app-text-secondary block">Estimasi Pola ML</span>
                  <span className="font-mono font-semibold text-app-accent-positive">
                    {analyzedRepo.mlResults
                      ? `${analyzedRepo.mlResults.yesRatio}% YES / ${analyzedRepo.mlResults.noRatio}% NO`
                      : `${analyzedRepo.stats?.totalCommits ? '—' : '78'}% YES / ${analyzedRepo.stats?.totalCommits ? '—' : '22'}% NO`}
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
                <li>Ekstraksi riwayat Git log &amp; metadata commit</li>
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
                <li>Tidak menggantikan rubrik penilaian akademik</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default AnalysisPage;
