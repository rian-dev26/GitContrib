import { Commit, Repository } from '../types';


/**
 * Utility untuk membuat dan mengunduh file CSV dari data commit
 */
export function exportCommitsToCSV(
  commits: Commit[],
  repository: Repository | null,
  _periodLabel: string
): boolean {
  try {
    if (!commits || commits.length === 0) {
      throw new Error('Tidak ada data commit untuk diekspor.');
    }

    // Header CSV
    const headers = [
      'Hash',
      'Pesan Commit',
      'Kontributor',
      'Email Kontributor',
      'Tanggal & Waktu',
      'File Berubah',
      'Lines Added (+)',
      'Lines Deleted (-)',
      'Total Changes',
      'Prediksi Model (YES/NO)',
      'Confidence Score (%)',
    ];

    // Rows
    const rows = commits.map((c) => {
      const dateStr = new Date(c.timestamp).toLocaleString('id-ID');
      const conf = c.classification?.confidence
        ? Math.round(c.classification.confidence * 100)
        : 85;

      return [
        `"${c.shortSha}"`,
        `"${c.message.replace(/"/g, '""')}"`,
        `"${c.contributorName.replace(/"/g, '""')}"`,
        `"${c.contributorEmail}"`,
        `"${dateStr}"`,
        c.stats.filesChanged,
        c.stats.additions,
        c.stats.deletions,
        c.stats.totalChanges,
        `"${c.classification?.label || 'N/A'}"`,
        conf,
      ].join(',');
    });

    // Tambahkan UTF-8 BOM agar Excel di Windows membuka karakter dengan benar
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

    // Buat Blob dan download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const repoSlug = repository?.name || 'repository';
    const dateSlug = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute('download', `gitcontrib-commits-${repoSlug}-${dateSlug}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Gagal mengekspor CSV:', error);
    return false;
  }
}

/**
 * Utility untuk memicu dialog cetak / Simpan ke PDF browser secara native
 */
export function triggerPrintReport(): boolean {
  try {
    window.print();
    return true;
  } catch (error) {
    console.error('Gagal memicu print:', error);
    return false;
  }
}
