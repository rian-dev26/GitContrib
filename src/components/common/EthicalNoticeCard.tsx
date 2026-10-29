import { Info } from 'lucide-react';

export function EthicalNoticeCard() {
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-md bg-app-card border border-app-border text-xs text-app-text-secondary shadow-sm">
      <Info className="w-4 h-4 text-app-accent-secondary shrink-0 mt-0.5" />
      <div className="leading-relaxed">
        <span className="font-semibold text-app-text-primary mr-1">
          Prinsip Evaluasi Dosen:
        </span>
        Klasifikasi pola kontribusi <span className="font-mono text-app-accent-positive font-semibold">YES</span>/
        <span className="font-mono text-app-accent-negative font-semibold">NO</span> merupakan indikasi analitik
        berdasarkan histori commit Git dan <strong>bukan nilai akhir akademik</strong>. Aktivitas di luar Git
        (seperti diskusi tim, ide perancangan, atau dokumentasi offline) tidak tercakup dalam analisis ini.
      </div>
    </div>
  );
}
