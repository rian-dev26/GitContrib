import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('dosen.pbl@polibatam.ac.id');
  const [password, setPassword] = useState('password-contoh');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulasi delay singkat tanpa autentikasi sungguhan
    setTimeout(() => {
      setIsLoading(false);
      navigate('/dashboard');
    }, 400);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div>
          <CardTitle className="text-lg">Portal Masuk Dosen</CardTitle>
          <CardDescription>
            Gunakan akun dosen pengampu untuk mengakses dashboard evaluasi PBL.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        {/* Prototype notice */}
        <div className="mb-5 p-3 rounded-md bg-app-accent-primary/10 border border-app-accent-primary/30 flex items-start gap-2.5 text-xs text-[#9BB7F5]">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Mode Prototype (Tahap 1):</strong> Sistem autentikasi sungguhan belum aktif.
            Klik tombol &ldquo;Masuk ke Dashboard&rdquo; untuk langsung menjelajahi antarmuka.
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Email Institusi"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@polibatam.ac.id"
            required
          />

          <Input
            label="Kata Sandi"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            helperText="Placeholder sandi untuk prototype"
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            isLoading={isLoading}
            leftIcon={<LogIn className="w-4 h-4" />}
          >
            Masuk ke Dashboard
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
