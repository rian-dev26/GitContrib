import { FileBarChart, Download, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export function ReportsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Laporan Evaluasi Proyek PBL"
        description="Ekspor ringkasan pola kontribusi tim dan individu untuk kebutuhan penilaian akhir semester."
        badge={<Badge variant="secondary">Placeholder Navigasi</Badge>}
      />

      <Card className="border-dashed border-app-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-app-accent-secondary" />
            <CardTitle>Generator Laporan Dosen</CardTitle>
          </div>
          <CardDescription>
            Halaman ini akan dikembangkan pada tahap berikutnya untuk menyediakan format rekapitulasi data kontribusi mahasiswa berbasis PDF dan CSV.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-app-text-secondary leading-relaxed">
            Pada tahap berikutnya, modul laporan akan memfasilitasi integrasi hasil klasifikasi YES/NO
            ke dalam template evaluasi mata kuliah PBL (IF314 Proyek Inovasi Agile), mencakup:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-md bg-app-secondary/40 border border-app-border space-y-1">
              <div className="flex items-center gap-2 font-medium text-app-text-primary">
                <CheckCircle2 className="w-3.5 h-3.5 text-app-accent-positive" />
                <span>Rekapitulasi Tim PBL</span>
              </div>
              <p className="text-app-text-secondary text-[11px]">
                Distribusi kontribusi antar anggota tim dan keseimbangan beban kerja.
              </p>
            </div>

            <div className="p-3 rounded-md bg-app-secondary/40 border border-app-border space-y-1">
              <div className="flex items-center gap-2 font-medium text-app-text-primary">
                <CheckCircle2 className="w-3.5 h-3.5 text-app-accent-positive" />
                <span>Ekspor Data CSV / Excel</span>
              </div>
              <p className="text-app-text-secondary text-[11px]">
                Data raw commit dan rasio klasifikasi untuk pengolahan nilai mandiri oleh dosen.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button variant="secondary" size="sm" disabled leftIcon={<Download className="w-3.5 h-3.5" />}>
              Ekspor Laporan (Akan Tersedia)
            </Button>
            <Link to="/dashboard">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Kembali ke Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
