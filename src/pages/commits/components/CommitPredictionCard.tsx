import {
  CheckCircle2,
  XCircle,
  Cpu,
  ShieldAlert,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ClassificationResult } from '../../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { cn } from '../../../utils/cn';

interface CommitPredictionCardProps {
  classification?: ClassificationResult;
}

export function CommitPredictionCard({ classification }: CommitPredictionCardProps) {
  const isYes = classification?.label === 'YES';
  const confidencePercent = classification?.confidence
    ? Math.round(classification.confidence * 100)
    : 85;

  const modelVersion = classification?.metadata?.modelVersion || 'proto-v0.1-rf';
  const algorithm =
    classification?.metadata?.algorithm || 'Supervised Random Forest (Prototype)';
  const evaluatedAt = classification?.metadata?.evaluatedAt
    ? new Date(classification.metadata.evaluatedAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '25 Okt 2024';

  const featuresUsed = classification?.metadata?.featuresUsed || [
    'code_churn',
    'file_diversity',
    'message_clarity',
    'diff_entropy',
  ];

  return (
    <Card className="overflow-hidden border-app-border shadow-sm">
      <CardHeader className="pb-3 border-b border-app-border/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-app-accent-primary/10 border border-app-accent-primary/20 flex items-center justify-center text-app-accent-primary">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Prediksi Klasifikasi Model Machine Learning
              </CardTitle>
              <p className="text-xs text-app-text-secondary">
                Estimasi pola commit berdasarkan fitur statistik Git yang diekstraksi
              </p>
            </div>
          </div>

          <Badge variant="primary" className="text-xs">
            <Sparkles className="w-3 h-3 mr-1 inline" />
            Supervised Classifier
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-5">
        {/* Main Verdict & Confidence */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Verdict Badge */}
          <div
            className={cn(
              'p-4 rounded-xl border flex flex-col justify-between items-center text-center',
              isYes
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-300'
            )}
          >
            <span className="text-[11px] font-medium uppercase tracking-wider opacity-80">
              Hasil Prediksi Model
            </span>
            <div className="my-2 flex items-center justify-center gap-2">
              {isYes ? (
                <>
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 stroke-[2.5]" />
                  <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    YES
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-8 h-8 text-rose-500 stroke-[2.5]" />
                  <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
                    NO
                  </span>
                </>
              )}
            </div>
            <span className="text-xs font-medium">
              {isYes
                ? 'Pola kontribusi aktif / substantive commit'
                : 'Pola commit minor / routine chore'}
            </span>
          </div>

          {/* Confidence Score Bar */}
          <div className="p-4 rounded-xl border border-app-border bg-app-secondary/30 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-app-text-secondary">
                Estimasi Keyakinan Model
              </span>
              <span className="font-mono text-base font-bold text-app-text-primary">
                {confidencePercent}%
              </span>
            </div>

            <div className="w-full bg-app-border/60 rounded-full h-2.5 overflow-hidden my-2">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  isYes ? 'bg-emerald-500' : 'bg-rose-500'
                )}
                style={{ width: `${confidencePercent}%` }}
              />
            </div>

            <p className="text-[11px] text-app-text-secondary">
              Skor probabilitas klasifikasi posterior dari ensemble decision trees.
            </p>
          </div>

          {/* Model Specification */}
          <div className="p-4 rounded-xl border border-app-border bg-app-secondary/30 flex flex-col justify-between space-y-2 text-xs">
            <span className="text-xs font-medium text-app-text-secondary">
              Spesifikasi Prototype
            </span>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-app-text-secondary">Versi:</span>
                <span className="font-semibold text-app-text-primary">{modelVersion}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-app-text-secondary">Algoritma:</span>
                <span className="text-app-text-primary text-right truncate max-w-[150px]" title={algorithm}>
                  {algorithm}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-app-text-secondary">Evaluasi:</span>
                <span className="text-app-text-primary">{evaluatedAt}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Weights / Inputs */}
        <div className="p-3.5 bg-app-secondary/40 border border-app-border rounded-lg text-xs space-y-2">
          <div className="flex items-center gap-2 text-app-text-primary font-medium">
            <Layers className="w-3.5 h-3.5 text-app-accent-primary" />
            <span>Fitur Ekstraksi Git yang Dievaluasi:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {featuresUsed.map((feat) => (
              <span
                key={feat}
                className="font-mono text-[11px] px-2 py-0.5 rounded bg-app-card border border-app-border text-app-text-secondary"
              >
                {feat}
              </span>
            ))}
          </div>
        </div>

        {/* Ethical Transparency Notice */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="leading-relaxed text-[11px]">
            <strong>Catatan Transparansi Model:</strong> Prediksi YES/NO dihasilkan secara otomatis oleh prototype model Machine Learning pada tingkat commit individual untuk membantu pemetaan aktivitas. Hasil ini <strong>bukan</strong> representasi tunggal dari penilaian akademik, nilai PBL, atau dedikasi mahasiswa.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
