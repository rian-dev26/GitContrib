import { useState, useId, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LogIn,
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  GitBranch,
  Loader2,
  HelpCircle,
  X,
  Building2,
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

  const [email, setEmail] = useState('dosen@polibatam.ac.id');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
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
    <div className="w-full flex items-center justify-center">
      {/* ── Focused Single Form Card (Transparan pas: nampak sedikit BG Polibatam) ── */}
      <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-[0_25px_70px_-15px_rgba(0,0,0,0.85)] border border-white/20 bg-slate-950/60 backdrop-blur-xl p-8 sm:p-10 text-white relative animate-fadeIn">
        
        {/* Brand & Institution Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/25 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-md mb-3 backdrop-blur-sm">
            <GitBranch className="w-6 h-6 stroke-[2.3]" />
          </div>
          <h1 className="text-xl font-extrabold tracking-wider text-white uppercase drop-shadow-sm">
            GitContrib
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-0.5">
            Portal Masuk Dosen • Politeknik Negeri Batam
          </p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center gap-2.5 text-xs text-rose-300 font-medium animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Email / Username */}
          <div className="space-y-1.5">
            <label
              htmlFor={emailId}
              className="block text-xs font-medium text-slate-200"
            >
              Email Institusi / Akun Dosen
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
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
                  'w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-slate-900/70 border text-white placeholder:text-slate-500',
                  'focus:outline-none focus:ring-2 transition-all duration-150',
                  emailError
                    ? 'border-rose-500/60 focus:ring-rose-500/30'
                    : 'border-white/15 focus:ring-indigo-500/50 focus:border-indigo-400 focus:bg-slate-900/90'
                )}
              />
            </div>
            {emailError && (
              <p className="text-[11px] text-rose-400 font-medium pl-1">
                {emailError}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor={passwordId}
                className="block text-xs font-medium text-slate-200"
              >
                Kata Sandi
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer font-medium"
              >
                Lupa kata sandi?
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id={passwordId}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                placeholder="Masukkan kata sandi"
                className={cn(
                  'w-full pl-10 pr-10 py-3 rounded-xl text-sm bg-slate-900/70 border text-white placeholder:text-slate-500',
                  'focus:outline-none focus:ring-2 transition-all duration-150',
                  passwordError
                    ? 'border-rose-500/60 focus:ring-rose-500/30'
                    : 'border-white/15 focus:ring-indigo-500/50 focus:border-indigo-400 focus:bg-slate-900/90'
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordError && (
              <p className="text-[11px] text-rose-400 font-medium pl-1">
                {passwordError}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold cursor-pointer',
              'bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-600/30 border-t border-white/20',
              'hover:brightness-110 active:scale-[0.99] transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-indigo-400/50',
              'disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100',
              'mt-4'
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

        {/* Footer Security Note */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            Portal Evaluasi PBL
          </span>
        </div>

      </div>

      {/* ── Modal Lupa Kata Sandi ─────────────────────────────── */}
      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5 text-indigo-400">
                <HelpCircle className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">Bantuan Lupa Kata Sandi</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Tutup dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 leading-relaxed space-y-3">
              <p>
                Akun GitContrib terintegrasi dengan kredensial Dosen internal Politeknik Negeri Batam.
              </p>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 space-y-1.5">
                <p className="font-semibold text-white flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  Prosedur Reset Kata Sandi:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-slate-300">
                  <li>Hubungi Unit Layanan TIK / Admin Jurusan Teknik Informatika.</li>
                  <li>Kirim permohonan melalui email resmi ke: <strong className="text-indigo-400">admin@polibatam.ac.id</strong></li>
                  <li>Sertakan nama lengkap dan alamat email institusi Anda.</li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
