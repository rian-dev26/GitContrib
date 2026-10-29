import { Settings, Sliders, ShieldAlert, Palette, Sun, Moon, Laptop, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useTheme, ThemeMode } from '../../contexts/ThemeContext';
import { cn } from '../../utils/cn';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const themeOptions: Array<{ mode: ThemeMode; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }> = [
    { mode: 'light', label: 'Mode Terang', desc: 'Latar belakang bersih dan kontras tinggi', icon: Sun },
    { mode: 'dark', label: 'Mode Gelap', desc: 'Desain developer tools gelap minimalis', icon: Moon },
    { mode: 'system', label: 'Ikuti Sistem', desc: 'Menyesuaikan dengan preferensi OS Anda', icon: Laptop },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Pengaturan Sistem"
        description="Konfigurasi parameter analisis repositori, tema antarmuka, dan preferensi evaluasi dosen."
        badge={<Badge variant="outline">Konfigurasi</Badge>}
      />

      {/* Preferensi Tema Tampilan */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-app-accent-primary" />
            <CardTitle>Tema Tampilan Antarmuka</CardTitle>
          </div>
          <CardDescription>
            Pilih mode visual yang nyaman untuk mengevaluasi aktivitas commit mahasiswa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.mode;
              return (
                <button
                  key={opt.mode}
                  type="button"
                  onClick={() => setTheme(opt.mode)}
                  className={cn(
                    'flex flex-col items-start p-3.5 rounded-lg border text-left transition-all duration-150',
                    isSelected
                      ? 'border-app-accent-primary bg-app-accent-primary/10 text-app-text-primary shadow-sm'
                      : 'border-app-border bg-app-card hover:bg-app-secondary/50 text-app-text-secondary hover:text-app-text-primary'
                  )}
                >
                  <div className="flex items-center gap-2 mb-2 font-medium text-xs">
                    <Icon className={cn('w-4 h-4', isSelected ? 'text-app-accent-primary' : 'text-app-text-secondary')} />
                    <span className={isSelected ? 'text-app-accent-primary font-semibold' : ''}>{opt.label}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-80">
                    {opt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Preferensi Evaluasi PBL */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-app-accent-primary" />
            <CardTitle>Preferensi Analisis PBL</CardTitle>
          </div>
          <CardDescription>
            Pengaturan dasar untuk ekstraksi riwayat git repository mahasiswa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Default Branch Target"
            defaultValue="main"
            helperText="Branch utama yang akan dievaluasi saat repository didaftarkan."
          />

          <Input
            label="Tahun Akademik & Semester"
            defaultValue="2024/2025 - Ganjil"
            helperText="Konteks semester perkuliahan PBL."
          />

          <div className="p-3.5 rounded-md bg-app-secondary/40 border border-app-border text-xs text-app-text-secondary flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 text-app-accent-secondary shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-app-text-primary">Model Supervised Learning: </span>
              Pengaturan bobot feature dan ambang batas klasifikasi (threshold) dikelola secara otomatis
              oleh pipeline backend FastAPI pada tahap selanjutnya. Halaman ini akan dikembangkan pada tahap berikutnya.
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Button variant="secondary" size="sm" disabled leftIcon={<Settings className="w-3.5 h-3.5" />}>
              Simpan Perubahan
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
