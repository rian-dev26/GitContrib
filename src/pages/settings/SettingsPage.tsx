import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  User,
  Lock,
  Palette,
  Sun,
  Moon,
  Laptop,
  LogOut,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  BadgeInfo,
  Loader2,
  ShieldAlert,
  Sliders,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, ThemeMode } from '../../contexts/ThemeContext';
import { cn } from '../../utils/cn';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle>{title}</CardTitle>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0 py-2.5 border-b border-app-border/60 last:border-0">
      <span className="text-xs text-app-text-secondary font-medium sm:w-40 shrink-0">{label}</span>
      <span className="text-xs text-app-text-primary font-medium">{value}</span>
    </div>
  );
}

interface AlertBannerProps {
  type: 'success' | 'error';
  message: string;
}

function AlertBanner({ type, message }: AlertBannerProps) {
  return (
    <div
      className={cn(
        'p-3 rounded-lg border flex items-center gap-2.5 text-xs font-medium animate-fadeIn',
        type === 'success'
          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
          : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
      )}
    >
      {type === 'success' ? (
        <CheckCircle2 className="w-4 h-4 shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 shrink-0" />
      )}
      {message}
    </div>
  );
}

// ─── SettingsPage ─────────────────────────────────────────────────────────────

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, updateProfile, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  // ── Profile Edit State ─────────────────────────────────────────────────────
  const [profileName, setProfileName] = useState(user?.name ?? '');
  const [profileDept, setProfileDept] = useState(user?.department ?? '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileAlert, setProfileAlert] = useState<AlertBannerProps | null>(null);

  // ── Password Change State ──────────────────────────────────────────────────
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [showPwCurrent, setShowPwCurrent] = useState(false);
  const [showPwNew, setShowPwNew] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwAlert, setPwAlert] = useState<AlertBannerProps | null>(null);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const [loggingOut, setLoggingOut] = useState(false);

  const themeOptions: Array<{ mode: ThemeMode; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }> = [
    { mode: 'light', label: 'Mode Terang', desc: 'Latar belakang bersih dan kontras tinggi', icon: Sun },
    { mode: 'dark', label: 'Mode Gelap', desc: 'Desain developer tools gelap minimalis', icon: Moon },
    { mode: 'system', label: 'Ikuti Sistem', desc: 'Menyesuaikan dengan preferensi OS Anda', icon: Laptop },
  ];

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSaveProfile = useCallback(async () => {
    setProfileSaving(true);
    setProfileAlert(null);
    await new Promise((r) => setTimeout(r, 800));

    if (!profileName.trim()) {
      setProfileSaving(false);
      setProfileAlert({ type: 'error', message: 'Nama lengkap tidak boleh kosong.' });
      return;
    }

    updateProfile({ name: profileName.trim(), department: profileDept.trim() });
    setProfileSaving(false);
    setProfileAlert({ type: 'success', message: 'Profil berhasil diperbarui.' });
    setTimeout(() => setProfileAlert(null), 4000);
  }, [profileName, profileDept, updateProfile]);

  const handleChangePassword = useCallback(async () => {
    setPwSaving(true);
    setPwAlert(null);
    await new Promise((r) => setTimeout(r, 900));

    if (!pwCurrent) {
      setPwSaving(false);
      setPwAlert({ type: 'error', message: 'Kata sandi saat ini wajib diisi.' });
      return;
    }
    if (pwNew.length < 8) {
      setPwSaving(false);
      setPwAlert({ type: 'error', message: 'Kata sandi baru minimal 8 karakter.' });
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwSaving(false);
      setPwAlert({ type: 'error', message: 'Konfirmasi kata sandi tidak cocok.' });
      return;
    }

    // Simulasi — selalu berhasil jika validasi lulus
    setPwSaving(false);
    setPwCurrent('');
    setPwNew('');
    setPwConfirm('');
    setPwAlert({ type: 'success', message: 'Kata sandi berhasil diubah (simulasi).' });
    setTimeout(() => setPwAlert(null), 5000);
  }, [pwCurrent, pwNew, pwConfirm]);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    await new Promise((r) => setTimeout(r, 500));
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  // ── Password Field Helper ───────────────────────────────────────────────────

  const PasswordInput = ({
    id,
    label,
    value,
    onChange,
    show,
    onToggleShow,
    placeholder,
    helperText,
  }: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    show: boolean;
    onToggleShow: () => void;
    placeholder?: string;
    helperText?: string;
  }) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-app-text-primary">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-3 pr-10 py-2.5 text-sm rounded-lg border border-app-border bg-app-secondary/50 text-app-text-primary placeholder:text-app-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-app-accent-primary/30 focus:border-app-accent-primary/60 transition-all duration-150"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-app-text-secondary hover:text-app-text-primary transition-colors"
          aria-label={show ? 'Sembunyikan' : 'Tampilkan'}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {helperText && <p className="text-[11px] text-app-text-secondary">{helperText}</p>}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Pengaturan Akun"
        description="Kelola profil dosen, keamanan akun, dan preferensi tampilan antarmuka GitContrib."
        badge={
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-app-accent-primary/15 text-app-accent-primary border border-app-accent-primary/25">
            <Settings className="w-3 h-3" /> Konfigurasi
          </span>
        }
      />

      {/* ── 1. Profil Dosen ─────────────────────────────────────────────────── */}
      <SectionCard
        icon={<User className="w-5 h-5 text-app-accent-primary" />}
        title="Profil Dosen"
        description="Informasi identitas Anda di dalam sistem GitContrib."
      >
        <div className="space-y-4">
          {/* Read-only info */}
          <div className="p-4 rounded-xl bg-app-secondary/40 border border-app-border/60">
            <div className="flex items-center gap-4 mb-4">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-app-accent-primary to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0 select-none">
                {user?.avatarInitials ?? 'D'}
              </div>
              <div>
                <p className="text-sm font-bold text-app-text-primary">{user?.name}</p>
                <p className="text-xs text-app-text-secondary mt-0.5">{user?.role}</p>
                <p className="text-[11px] text-app-accent-primary/80 font-mono mt-0.5">
                  NIDN: {user?.nidn}
                </p>
              </div>
            </div>
            <InfoRow label="Email" value={user?.email ?? '—'} />
            <InfoRow label="Program Studi" value={user?.department ?? '—'} />
            <InfoRow label="Institusi" value={user?.institution ?? '—'} />
            <InfoRow
              label="Login Terakhir"
              value={
                user?.lastLogin
                  ? new Date(user.lastLogin).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—'
              }
            />
          </div>

          {/* Editable fields */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="profile-name" className="block text-xs font-semibold text-app-text-primary">
                Nama Lengkap
              </label>
              <input
                id="profile-name"
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-app-border bg-app-secondary/50 text-app-text-primary placeholder:text-app-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-app-accent-primary/30 focus:border-app-accent-primary/60 transition-all duration-150"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="profile-dept" className="block text-xs font-semibold text-app-text-primary">
                Program Studi / Jurusan
              </label>
              <input
                id="profile-dept"
                type="text"
                value={profileDept}
                onChange={(e) => setProfileDept(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-app-border bg-app-secondary/50 text-app-text-primary placeholder:text-app-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-app-accent-primary/30 focus:border-app-accent-primary/60 transition-all duration-150"
              />
              <p className="text-[11px] text-app-text-secondary flex items-center gap-1">
                <BadgeInfo className="w-3 h-3" />
                Email dan NIDN tidak dapat diubah melalui antarmuka ini.
              </p>
            </div>
          </div>

          {profileAlert && <AlertBanner {...profileAlert} />}

          <div className="pt-1">
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={profileSaving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-app-accent-primary text-white shadow transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {profileSaving ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...</>
              ) : (
                <><Save className="w-3.5 h-3.5" /> Simpan Perubahan Profil</>
              )}
            </button>
          </div>
        </div>
      </SectionCard>

      {/* ── 2. Ganti Kata Sandi ──────────────────────────────────────────────── */}
      <SectionCard
        icon={<Lock className="w-5 h-5 text-app-accent-primary" />}
        title="Keamanan Akun"
        description="Ubah kata sandi akun Anda. Simulasi — tidak ada backend aktif."
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-start gap-2 text-[11px] text-amber-400">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Ini adalah simulasi perubahan kata sandi. Validasi dilakukan secara lokal dan tidak mengubah data nyata.
            </span>
          </div>

          <div className="grid gap-4">
            <PasswordInput
              id="pw-current"
              label="Kata Sandi Saat Ini"
              value={pwCurrent}
              onChange={setPwCurrent}
              show={showPwCurrent}
              onToggleShow={() => setShowPwCurrent((p) => !p)}
              placeholder="Masukkan kata sandi saat ini"
            />
            <PasswordInput
              id="pw-new"
              label="Kata Sandi Baru"
              value={pwNew}
              onChange={setPwNew}
              show={showPwNew}
              onToggleShow={() => setShowPwNew((p) => !p)}
              placeholder="Min. 8 karakter"
              helperText="Minimal 8 karakter dengan kombinasi huruf dan angka."
            />
            <PasswordInput
              id="pw-confirm"
              label="Konfirmasi Kata Sandi Baru"
              value={pwConfirm}
              onChange={setPwConfirm}
              show={showPwConfirm}
              onToggleShow={() => setShowPwConfirm((p) => !p)}
              placeholder="Ulangi kata sandi baru"
            />
          </div>

          {pwAlert && <AlertBanner {...pwAlert} />}

          <div className="pt-1">
            <button
              type="button"
              onClick={handleChangePassword}
              disabled={pwSaving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-app-secondary border border-app-border text-app-text-primary shadow-sm transition-all hover:bg-app-secondary/80 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {pwSaving ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Memproses...</>
              ) : (
                <><Lock className="w-3.5 h-3.5" /> Ganti Kata Sandi</>
              )}
            </button>
          </div>
        </div>
      </SectionCard>

      {/* ── 3. Tema Tampilan ─────────────────────────────────────────────────── */}
      <SectionCard
        icon={<Palette className="w-5 h-5 text-app-accent-primary" />}
        title="Tema Tampilan Antarmuka"
        description="Pilih mode visual yang nyaman untuk mengevaluasi aktivitas commit mahasiswa."
      >
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
                  'flex flex-col items-start p-3.5 rounded-xl border text-left transition-all duration-150',
                  isSelected
                    ? 'border-app-accent-primary bg-app-accent-primary/10 shadow-sm'
                    : 'border-app-border bg-app-card hover:bg-app-secondary/50 text-app-text-secondary hover:text-app-text-primary'
                )}
              >
                <div className="flex items-center gap-2 mb-2 font-semibold text-xs">
                  <Icon className={cn('w-4 h-4', isSelected ? 'text-app-accent-primary' : 'text-app-text-secondary')} />
                  <span className={isSelected ? 'text-app-accent-primary' : ''}>{opt.label}</span>
                  {isSelected && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-app-accent-primary ml-auto" />
                  )}
                </div>
                <p className="text-[11px] leading-relaxed opacity-80">{opt.desc}</p>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* ── 4. Preferensi Analisis ───────────────────────────────────────────── */}
      <SectionCard
        icon={<Sliders className="w-5 h-5 text-app-accent-primary" />}
        title="Preferensi Analisis PBL"
        description="Pengaturan dasar ekstraksi riwayat Git repositori mahasiswa."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-app-text-primary">
              Default Branch Target
            </label>
            <input
              type="text"
              defaultValue="main"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-app-border bg-app-secondary/50 text-app-text-primary focus:outline-none focus:ring-2 focus:ring-app-accent-primary/30 focus:border-app-accent-primary/60 transition-all duration-150"
            />
            <p className="text-[11px] text-app-text-secondary">
              Branch utama yang akan dievaluasi saat repository didaftarkan.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-app-text-primary">
              Tahun Akademik &amp; Semester
            </label>
            <input
              type="text"
              defaultValue="2024/2025 - Ganjil"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-app-border bg-app-secondary/50 text-app-text-primary focus:outline-none focus:ring-2 focus:ring-app-accent-primary/30 focus:border-app-accent-primary/60 transition-all duration-150"
            />
            <p className="text-[11px] text-app-text-secondary">
              Konteks semester perkuliahan PBL.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-app-secondary/40 border border-app-border text-xs text-app-text-secondary flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 text-app-accent-secondary shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-app-text-primary">Model Supervised Learning: </span>
              Pengaturan bobot feature dan ambang batas klasifikasi dikelola secara otomatis oleh pipeline backend FastAPI pada tahap pengembangan selanjutnya.
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── 5. Zona Logout ───────────────────────────────────────────────────── */}
      <div className="p-5 rounded-2xl border border-rose-500/25 bg-rose-500/5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-rose-400">Keluar dari Sesi</p>
            <p className="text-xs text-app-text-secondary mt-1">
              Sesi Anda akan dihapus dan Anda akan diarahkan kembali ke halaman login.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-rose-500 text-white shadow transition-all hover:bg-rose-600 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
          >
            {loggingOut ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Keluar...</>
            ) : (
              <><LogOut className="w-4 h-4" /> Keluar dari GitContrib</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
