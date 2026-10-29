import { useState, useMemo, useCallback, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { MOCK_REPOSITORIES, MOCK_COMMITS } from '../../mocks';
import { Commit } from '../../types';
import { ReportFilterBar, ReportFilterState } from './components/ReportFilterBar';
import { ReportCommitTable } from './components/ReportCommitTable';
import { ExportNotification, NotificationState } from './components/ExportNotification';
import { exportCommitsToCSV, triggerPrintReport } from './utils/exportUtils';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPresetRange(preset: ReportFilterState['datePreset']): {
  from: Date | null;
  to: Date | null;
} {
  const now = new Date();
  if (preset === '7d') {
    const from = new Date(now);
    from.setDate(from.getDate() - 7);
    return { from, to: now };
  }
  if (preset === '30d') {
    const from = new Date(now);
    from.setDate(from.getDate() - 30);
    return { from, to: now };
  }
  return { from: null, to: null };
}

function buildTimeframeLabel(filter: ReportFilterState): string {
  if (filter.datePreset === 'all') return 'Semua Waktu';
  if (filter.datePreset === '7d') return '7 Hari Terakhir';
  if (filter.datePreset === '30d') return '30 Hari Terakhir';
  if (filter.datePreset === 'custom') {
    const from = filter.dateFrom || '—';
    const to = filter.dateTo || '—';
    return `${from} s/d ${to}`;
  }
  return 'Semua Waktu';
}

const DEFAULT_FILTER: ReportFilterState = {
  repositoryId: MOCK_REPOSITORIES[0]?.id ?? '',
  datePreset: 'all',
  dateFrom: '',
  dateTo: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ReportsPage() {
  const [filter, setFilter] = useState<ReportFilterState>(DEFAULT_FILTER);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [notification, setNotification] = useState<NotificationState | null>(null);

  // Auto-dismiss notification setelah 5 detik
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(timer);
  }, [notification]);

  // ─── 1. Filter Logik Data ───────────────────────────────────────────────────

  const selectedRepository = useMemo(
    () => MOCK_REPOSITORIES.find((r) => r.id === filter.repositoryId) ?? MOCK_REPOSITORIES[0],
    [filter.repositoryId]
  );

  const allRepoCommits: Commit[] = useMemo(() => {
    return MOCK_COMMITS.filter((c) => c.repositoryId === selectedRepository?.id);
  }, [selectedRepository]);

  const filteredCommits: Commit[] = useMemo(() => {
    if (filter.datePreset === 'all') return allRepoCommits;

    let rangeFrom: Date | null = null;
    let rangeTo: Date | null = null;

    if (filter.datePreset === 'custom') {
      rangeFrom = filter.dateFrom ? new Date(filter.dateFrom) : null;
      rangeTo = filter.dateTo ? new Date(filter.dateTo + 'T23:59:59') : null;
    } else {
      const range = getPresetRange(filter.datePreset);
      rangeFrom = range.from;
      rangeTo = range.to;
    }

    return allRepoCommits.filter((c) => {
      const commitDate = new Date(c.timestamp);
      if (rangeFrom && commitDate < rangeFrom) return false;
      if (rangeTo && commitDate > rangeTo) return false;
      return true;
    });
  }, [allRepoCommits, filter]);

  const timeframeLabel = buildTimeframeLabel(filter);

  // ─── 2. Handlers Filter & Ekspor ───────────────────────────────────────────

  const handleFilterChange = useCallback((partial: Partial<ReportFilterState>) => {
    setFilter((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleResetFilter = useCallback(() => {
    setFilter((prev) => ({
      ...prev,
      datePreset: 'all',
      dateFrom: '',
      dateTo: '',
    }));
  }, []);

  const handleExportPDF = useCallback(async () => {
    setIsExportingPDF(true);
    try {
      // Tunggu sebentar sebelum memicu dialog cetak
      await new Promise((res) => setTimeout(res, 200));
      const success = triggerPrintReport();
      setNotification(
        success
          ? {
              type: 'success',
              title: 'Dialog Cetak PDF Dibuka',
              message: 'Pilih "Simpan sebagai PDF" di dialog cetak browser Anda.',
              actionType: 'pdf',
            }
          : {
              type: 'error',
              title: 'Gagal Membuka Dialog Cetak',
              message: 'Pastikan popup/print tidak diblokir oleh browser Anda.',
              actionType: 'pdf',
            }
      );
    } finally {
      setIsExportingPDF(false);
    }
  }, []);

  const handleExportCSV = useCallback(async () => {
    setIsExportingCSV(true);
    try {
      await new Promise((res) => setTimeout(res, 200));
      const success = exportCommitsToCSV(
        filteredCommits,
        selectedRepository ?? null,
        timeframeLabel
      );
      setNotification(
        success
          ? {
              type: 'success',
              title: 'CSV Berhasil Diunduh',
              message: `${filteredCommits.length} data commit dari ${selectedRepository?.name ?? 'repositori'} berhasil diekspor.`,
              actionType: 'csv',
            }
          : {
              type: 'error',
              title: 'Gagal Mengekspor CSV',
              message: 'Tidak ada data commit untuk diekspor pada filter aktif.',
              actionType: 'csv',
            }
      );
    } finally {
      setIsExportingCSV(false);
    }
  }, [filteredCommits, selectedRepository, timeframeLabel]);

  // Tanggal cetak format ID
  const printedDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-5">
      {/* ─── Tampilan Layar Utama (Screen) ─────────────────────────────────── */}
      <div className="space-y-4 print:hidden">
        {/* Judul Sederhana Sesuai Permintaan */}
        <PageHeader
          title="Data Kontribusi Repository"
          description="Tabel seluruh data commit repository dalam format spreadsheet untuk keperluan analisis dan evaluasi kontribusi tim PBL."
        />

        {/* Notifikasi Toast Ekspor */}
        {notification && (
          <ExportNotification
            notification={notification}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Bar Filter & Ekspor (Dropdown Repo, Periode, Tombol CSV & PDF) */}
        <ReportFilterBar
          repositories={MOCK_REPOSITORIES}
          filter={filter}
          onFilterChange={handleFilterChange}
          onResetFilter={handleResetFilter}
          onExportPDF={handleExportPDF}
          onExportCSV={handleExportCSV}
          isExportingPDF={isExportingPDF}
          isExportingCSV={isExportingCSV}
          totalCommitsCount={filteredCommits.length}
        />

        {/* Tabel Data Commit (Fokus Utama Halaman) */}
        <ReportCommitTable
          commits={filteredCommits}
          totalRepoCommits={allRepoCommits.length}
        />
      </div>

      {/* ─── Tampilan Khusus Cetak / Simpan ke PDF (@media print) ────────────── */}
      <div id="printable-report" className="hidden print:block p-6 text-black bg-white space-y-4">
        {/* Kop Laporan Cetak */}
        <div className="border-b-2 border-slate-900 pb-3">
          <h1 className="text-xl font-bold text-slate-900">
            Data Kontribusi Repository — GitContrib
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Repositori: <strong>{selectedRepository?.fullName}</strong> ({selectedRepository?.defaultBranch}) • Periode: {timeframeLabel}
          </p>
          <p className="text-[11px] text-slate-500">
            Dicetak pada: {printedDate} • Total Commit: {filteredCommits.length} baris
          </p>
        </div>

        {/* Tabel Cetak Bersih */}
        <table className="w-full text-[10px] border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 font-semibold text-slate-800">
              <th className="p-1.5 border-r border-slate-300 text-left">Hash</th>
              <th className="p-1.5 border-r border-slate-300 text-left">Pesan Commit</th>
              <th className="p-1.5 border-r border-slate-300 text-left">Contributor</th>
              <th className="p-1.5 border-r border-slate-300 text-left">Tanggal & Waktu</th>
              <th className="p-1.5 border-r border-slate-300 text-right">Files</th>
              <th className="p-1.5 border-r border-slate-300 text-right">+Lines</th>
              <th className="p-1.5 border-r border-slate-300 text-right">-Lines</th>
              <th className="p-1.5 border-r border-slate-300 text-right">Total</th>
              <th className="p-1.5 text-center">Prediksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredCommits.map((c) => (
              <tr key={c.id}>
                <td className="p-1.5 border-r border-slate-200 font-mono text-[9px]">{c.shortSha}</td>
                <td className="p-1.5 border-r border-slate-200 max-w-[200px] truncate">{c.message}</td>
                <td className="p-1.5 border-r border-slate-200">{c.contributorName.replace(' (Contoh)', '')}</td>
                <td className="p-1.5 border-r border-slate-200 font-mono text-[9px]">
                  {new Date(c.timestamp).toLocaleString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="p-1.5 border-r border-slate-200 text-right font-mono">{c.stats.filesChanged}</td>
                <td className="p-1.5 border-r border-slate-200 text-right font-mono text-emerald-700 font-semibold">+{c.stats.additions}</td>
                <td className="p-1.5 border-r border-slate-200 text-right font-mono text-rose-700 font-semibold">-{c.stats.deletions}</td>
                <td className="p-1.5 border-r border-slate-200 text-right font-mono">{c.stats.totalChanges}</td>
                <td className="p-1.5 text-center font-bold">
                  {c.classification?.label === 'YES' ? (
                    <span className="text-emerald-700">YES</span>
                  ) : (
                    <span className="text-rose-700">NO</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Catatan Kaki Cetak */}
        <div className="pt-3 border-t border-slate-300 text-[9px] text-slate-500 flex justify-between">
          <span>GitContrib — Platform Analisis Pola Kontribusi Repository GitHub</span>
          <span>Halaman Dokumen Laporan</span>
        </div>
      </div>
    </div>
  );
}
