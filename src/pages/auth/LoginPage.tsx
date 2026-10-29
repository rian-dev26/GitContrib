import { useState, useId, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LogIn,
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  Info,
  GitBranch,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';

// ─── Validation ───────────────────────────────────────────────────────────────

function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email tidak boleh kosong.';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) return 'Format email tidak valid.';
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return 'Kata sandi tidak boleh kosong.';
  if (password.length < 6) return 'Kata sandi minimal 6 karakter.';
  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  error?: string | null;
  children: React.ReactNode;
}

function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-app-text-primary">
        {label}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1.5 text-[11px] text-rose-500 font-medium">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// ─── LoginPage ────────────────────────────────────────────────────────────────

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, isAuthenticated } = useAuth();
  const emailId = useId();
  const passwordId = useId();

  // Redirect jika sudah login
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [email, setEmail] = useState('dosen.pbl@polibatam.ac.id');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const emailError = (touched.email || submitted) ? validateEmail(email) : null;
  const passwordError = (touched.password || submitted) ? validatePassword(password) : null;
  const isFormValid = !validateEmail(email) && !validatePassword(password);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError(null);

    if (!isFormValid) return;

    const result = await login(email, password);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setServerError(result.error ?? 'Login gagal. Coba lagi.');
    }
  };

  return (
    <div className="w-full">
      {/* Card */}
      <div className="bg-app-card border border-app-border rounded-2xl shadow-xl overflow-hidden">
        {/* Top accent strip */}
        <div className="h-1 w-full bg-app-accent-primary" />

        <div className="p-7 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-app-accent-primary/15 border border-app-accent-primary/30 flex items-center justify-center text-app-accent-primary shrink-0">
              <GitBranch className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-app-text-primary tracking-tight">
                Portal Masuk Dosen
              </h2>
              <p className="text-[11px] text-app-text-secondary mt-0.5">
                Sistem Analisis Kontribusi Repository PBL
              </p>
            </div>
          </div>

          {/* Prototype Notice */}
          <div className="p-3.5 rounded-xl bg-app-accent-primary/10 border border-app-accent-primary/25 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-app-accent-primary shrink-0 mt-0.5" />
            <div className="text-[11px] text-app-text-secondary leading-relaxed space-y-1">
              <p className="font-semibold text-app-text-primary">Mode Simulasi Frontend</p>
              <p>
                Gunakan email{' '}
                <code className="font-mono bg-app-accent-primary/20 text-app-accent-primary px-1 rounded">
                  dosen.pbl@polibatam.ac.id
                </code>{' '}
                dengan kata sandi apa saja (min. 6 karakter).
              </p>
            </div>
          </div>

          {/* Server Error */}
          {serverError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-center gap-2.5 text-xs text-rose-400 font-medium animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {serverError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email */}
            <Field id={emailId} label="Email Institusi" error={emailError}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-secondary pointer-events-none">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id={emailId}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                  placeholder="nama@polibatam.ac.id"
                  className={cn(
                    'w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border bg-app-secondary/50 text-app-text-primary placeholder:text-app-text-secondary/50',
                    'focus:outline-none focus:ring-2 transition-all duration-150',
                    emailError
                      ? 'border-rose-500/60 focus:ring-rose-500/30'
                      : 'border-app-border focus:ring-app-accent-primary/30 focus:border-app-accent-primary/60'
                  )}
                />
              </div>
            </Field>

            {/* Password */}
            <Field id={passwordId} label="Kata Sandi" error={passwordError}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-secondary pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id={passwordId}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                  placeholder="Masukkan kata sandi (min. 6 karakter)"
                  className={cn(
                    'w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border bg-app-secondary/50 text-app-text-primary placeholder:text-app-text-secondary/50',
                    'focus:outline-none focus:ring-2 transition-all duration-150',
                    passwordError
                      ? 'border-rose-500/60 focus:ring-rose-500/30'
                      : 'border-app-border focus:ring-app-accent-primary/30 focus:border-app-accent-primary/60'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-app-text-secondary hover:text-app-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg text-sm font-semibold',
                'bg-app-accent-primary text-white shadow-md transition-all duration-150',
                'hover:brightness-110 active:scale-[0.98]',
                'focus:outline-none focus:ring-2 focus:ring-app-accent-primary/40',
                'disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100',
                'mt-2'
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk ke Dashboard</span>
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="pt-2 border-t border-app-border/60 flex items-center gap-2 text-[11px] text-app-text-secondary">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>
              Halaman ini hanya untuk <strong className="text-app-text-primary">Dosen Pengampu</strong>. Tidak tersedia opsi pendaftaran mandiri.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
