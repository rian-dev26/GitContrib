import {
  FolderGit2,
  GitBranch,
  FileText,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Printer,
  Calendar,
  Layers,
} from 'lucide-react';
import { Commit, Contributor, Repository } from '../../../types';
import { cn } from '../../../utils/cn';

interface ReportPreviewDocumentProps {
  repository: Repository | null;
  contributors: Contributor[];
  commits: Commit[];
  timeframeLabel: string;
  isFiltered: boolean;
  onPrint: () => void;
}

export function ReportPreviewDocument({
  repository,
  contributors,
  commits,
  timeframeLabel,
  isFiltered,
  onPrint,
}: ReportPreviewDocumentProps) {
  const repoName = repository?.name || 'smart-inventory-pbl';
  const repoFullName = repository?.fullName || `if-polibatam/${repoName}`;
  const repoUrl = repository?.url || `https://github.com/${repoFullName}`;
  const branch = repository?.defaultBranch || 'main';

  // Perhitungan statistik dari commit yang terfilter
  const totalCommits = commits.length;
  const yesCount = commits.filter((c) => c.classification?.label === 'YES').length;
  const noCount = commits.filter((c) => c.classification?.label === 'NO').length;
  const yesPercent = totalCommits > 0 ? Math.round((yesCount / totalCommits) * 100) : 0;
  const totalAdditions = commits.reduce((acc, c) => acc + c.stats.additions, 0);
  const totalDeletions = commits.reduce((acc, c) => acc + c.stats.deletions, 0);
  const totalChurn = totalAdditions + totalDeletions;

  // Tanggal cetak laporan
  const printedDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Agregasi kontributor dari data commits yang terfilter
  const contributorStats = contributors.map((contrib) => {
    const userCommits = commits.filter((c) => c.contributorId === contrib.id);
    const uTotal = userCommits.length;
    const uYes = userCommits.filter((c) => c.classification?.label === 'YES').length;
    const uNo = userCommits.filter((c) => c.classification?.label === 'NO').length;
    const uYesRatio = uTotal > 0 ? Math.round((uYes / uTotal) * 100) : 0;
    const uAdd = userCommits.reduce((acc, c) => acc + c.stats.additions, 0);
    const uDel = userCommits.reduce((acc, c) => acc + c.stats.deletions, 0);

    return {
      ...contrib,
      userTotal: uTotal,
      userYes: uYes,
      userNo: uNo,
      userYesRatio: uYesRatio,
      userAdditions: uAdd,
      userDeletions: uDel,
    };
  });

  return (
    <div className="space-y-3">
      {/* ─── Preview Header Action Bar ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-app-accent-primary" />
          <h2 className="text-sm font-semibold text-app-text-primary">
            Pratinjau Dokumen Laporan (Print Ready)
          </h2>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-app-secondary border border-app-border text-app-text-secondary">
            A4 Format
          </span>
        </div>

        <button
          type="button"
          onClick={onPrint}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg border border-app-border bg-app-card hover:bg-app-secondary text-app-text-primary transition-colors cursor-pointer shadow-xs"
        >
          <Printer className="w-3.5 h-3.5 text-app-accent-primary" />
          Cetak / Simpan PDF
        </button>
      </div>

      {/* ─── Paper-styled Document Container ─────────────────────────────────── */}
      <div
        id="printable-report"
        className="bg-app-card border border-app-border rounded-xl p-6 sm:p-10 shadow-md space-y-8 max-w-5xl mx-auto"
      >
        {/* Kop Surat / Header Laporan Resmi */}
        <div className="border-b-2 border-app-border pb-6 text-center space-y-2">
          <div className="text-[11px] font-bold tracking-widest text-app-text-secondary uppercase">
            POLITEKNIK NEGERI BATAM • JURUSAN TEKNIK INFORMATIKA
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-app-text-primary tracking-tight">
            LAPORAN REKAPITULASI POLA KONTRIBUSI GIT
          </h1>
          <p className="text-xs text-app-text-secondary max-w-xl mx-auto">
            Hasil Ekstraksi Histori Git dan Estimasi Pola Kontribusi Berbasis Machine Learning (GitContrib)
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs text-app-text-secondary font-mono">
            <span>Tanggal Cetak: <strong>{printedDate}</strong></span>
            <span>•</span>
            <span>Sistem: <strong>GitContrib v0.1.0</strong></span>
            <span>•</span>
            <span>Status Data: <strong>Simulasi Prototype</strong></span>
          </div>
        </div>

        {/* Metadata Repositori & Parameter Laporan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-app-secondary/30 border border-app-border text-xs">
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-app-border/60">
              <span className="text-app-text-secondary">Nama Repositori:</span>
              <span className="font-semibold text-app-text-primary">{repoFullName}</span>
            </div>
            <div className="flex items-center justify-between pb-1.5 border-b border-app-border/60">
              <span className="text-app-text-secondary">URL Repository:</span>
              <span className="font-mono text-app-accent-primary truncate max-w-[220px]" title={repoUrl}>
                {repoUrl}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-app-text-secondary">Branch Utama:</span>
              <span className="font-mono font-medium text-app-text-primary">{branch}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-app-border/60">
              <span className="text-app-text-secondary">Periode Analisis:</span>
              <span className="font-semibold text-app-text-primary">
                {timeframeLabel} {isFiltered && '(Filtered)'}
              </span>
            </div>
            <div className="flex items-center justify-between pb-1.5 border-b border-app-border/60">
              <span className="text-app-text-secondary">Dosen Pengampu / Penilai:</span>
              <span className="font-medium text-app-text-primary">Dosen Akademik (IF314)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-app-text-secondary">Model Evaluator:</span>
              <span className="font-mono text-app-text-secondary">Random Forest (proto-v0.1-rf)</span>
            </div>
          </div>
        </div>

        {/* Ringkasan Metrik Angka (4 Kolom Mini) */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-app-text-secondary mb-3">
            I. Ringkasan Eksekutif
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-app-secondary/40 border border-app-border text-center">
              <span className="text-[11px] text-app-text-secondary block">Total Commit</span>
              <span className="text-xl font-extrabold text-app-text-primary">{totalCommits}</span>
            </div>
            <div className="p-3 rounded-lg bg-app-secondary/40 border border-app-border text-center">
              <span className="text-[11px] text-app-text-secondary block">Mahasiswa Aktif</span>
              <span className="text-xl font-extrabold text-app-text-primary">{contributors.length}</span>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 block">Commit YES</span>
              <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {yesCount} <span className="text-xs font-normal">({yesPercent}%)</span>
              </span>
            </div>
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-center">
              <span className="text-[11px] text-rose-700 dark:text-rose-300 block">Commit NO</span>
              <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400">{noCount}</span>
            </div>
          </div>
        </div>

        {/* Tabel Rekapitulasi Per Mahasiswa */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-app-text-secondary mb-3">
            II. Rekapitulasi Kontribusi Mahasiswa
          </h3>
          <div className="overflow-x-auto border border-app-border rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-app-secondary/50 border-b border-app-border text-[11px] text-app-text-secondary font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Nama Mahasiswa</th>
                  <th className="py-2.5 px-3">Username</th>
                  <th className="py-2.5 px-3 text-right">Commit</th>
                  <th className="py-2.5 px-3 text-right">YES</th>
                  <th className="py-2.5 px-3 text-right">NO</th>
                  <th className="py-2.5 px-3 text-right">Rasio YES</th>
                  <th className="py-2.5 px-3 text-right">Lines Added</th>
                  <th className="py-2.5 px-3 text-right">Lines Deleted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border font-sans">
                {contributorStats.map((c, idx) => (
                  <tr key={c.id} className={idx % 2 === 1 ? 'bg-app-secondary/20' : ''}>
                    <td className="py-2 px-3 font-semibold text-app-text-primary whitespace-nowrap">
                      {c.name}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-app-text-secondary whitespace-nowrap">
                      @{c.username}
                    </td>
                    <td className="py-2 px-3 font-mono text-right font-medium text-app-text-primary">
                      {c.userTotal}
                    </td>
                    <td className="py-2 px-3 font-mono text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                      {c.userYes}
                    </td>
                    <td className="py-2 px-3 font-mono text-right text-rose-600 dark:text-rose-400 font-semibold">
                      {c.userNo}
                    </td>
                    <td className="py-2 px-3 font-mono text-right font-bold text-app-text-primary">
                      {c.userYesRatio}%
                    </td>
                    <td className="py-2 px-3 font-mono text-right text-emerald-600 dark:text-emerald-400">
                      +{c.userAdditions.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 px-3 font-mono text-right text-rose-600 dark:text-rose-400">
                      -{c.userDeletions.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabel Cuplikan Commit Teranalisis (Max 15 commit pertama dalam cetak preview) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-app-text-secondary">
              III. Rincian Histori Commit ({commits.length})
            </h3>
            <span className="text-[11px] text-app-text-secondary">
              Data lengkap dapat diunduh melalui tombol <strong>Ekspor Data CSV</strong>.
            </span>
          </div>

          <div className="overflow-x-auto border border-app-border rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-app-secondary/50 border-b border-app-border text-[11px] text-app-text-secondary font-semibold uppercase">
                <tr>
                  <th className="py-2 px-3">Hash</th>
                  <th className="py-2 px-3">Pesan Commit</th>
                  <th className="py-2 px-3">Kontributor</th>
                  <th className="py-2 px-3">Tanggal</th>
                  <th className="py-2 px-3 text-right">Perubahan</th>
                  <th className="py-2 px-3 text-center">Prediksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border/70 font-sans text-[11px]">
                {commits.slice(0, 15).map((commit, idx) => {
                  const isYes = commit.classification?.label === 'YES';
                  const dateStr = new Date(commit.timestamp).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr key={commit.id} className={idx % 2 === 1 ? 'bg-app-secondary/20' : ''}>
                      <td className="py-2 px-3 font-mono font-medium text-app-accent-primary whitespace-nowrap">
                        {commit.shortSha}
                      </td>
                      <td className="py-2 px-3 text-app-text-primary font-medium max-w-[280px] truncate" title={commit.message}>
                        {commit.message}
                      </td>
                      <td className="py-2 px-3 text-app-text-secondary whitespace-nowrap">
                        {commit.contributorName}
                      </td>
                      <td className="py-2 px-3 text-app-text-secondary whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-2 px-3 font-mono text-right whitespace-nowrap">
                        <span className="text-emerald-600 dark:text-emerald-400">+{commit.stats.additions}</span>{' '}
                        <span className="text-rose-600 dark:text-rose-400">-{commit.stats.deletions}</span>
                      </td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-block px-2 py-0.5 rounded text-[10px] font-bold border',
                            isYes
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25'
                          )}
                        >
                          {isYes ? 'YES' : 'NO'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {commits.length > 15 && (
            <p className="text-[11px] text-app-text-secondary text-center mt-2 italic">
              Menampilkan 15 dari {commits.length} commit pada dokumen preview. Gunakan opsi ekspor CSV untuk mengunduh seluruh baris commit.
            </p>
          )}
        </div>

        {/* Disclaimer Transparansi Akademik */}
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Pernyataan Etika & Transparansi Akademik (GitContrib)</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Prediksi YES/NO dalam laporan ini dihitung secara matematis menggunakan prototype Machine Learning pada tingkat commit individual untuk membantu Dosen memetakan dinamika tim PBL. Hasil ini <strong>bukan</strong> penentu mutlak nilai akhir mahasiswa dan wajib dikonfirmasi dengan capaian fungsional proyek secara komprehensif.
          </p>
        </div>

        {/* Tanda Tangan Pengesahan (Layout Resmi) */}
        <div className="pt-8 border-t border-app-border/80 flex justify-between text-xs text-app-text-secondary font-sans">
          <div>
            <p>Mengetahui,</p>
            <p className="font-semibold text-app-text-primary mt-1">Koordinator PBL / Dosen Pengampu</p>
            <div className="h-16" />
            <p className="font-mono text-app-text-primary underline font-medium">( ............................................ )</p>
            <p className="text-[10px]">NIP. IF-POLIBATAM</p>
          </div>

          <div className="text-right">
            <p>Batam, {printedDate}</p>
            <p className="font-semibold text-app-text-primary mt-1">Dosen Penilai Lapangan</p>
            <div className="h-16" />
            <p className="font-mono text-app-text-primary underline font-medium">( ............................................ )</p>
            <p className="text-[10px]">NIP. IF-POLIBATAM</p>
          </div>
        </div>
      </div>
    </div>
  );
}
