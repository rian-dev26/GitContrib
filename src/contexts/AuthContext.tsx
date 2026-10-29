import React, { createContext, useContext, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  nidn: string;
  department: string;
  institution: string;
  avatarInitials: string;
  role: string;
  lastLogin: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (partial: Partial<Pick<AuthUser, 'name' | 'department'>>) => void;
}

// ─── Mock Credentials ─────────────────────────────────────────────────────────

const MOCK_CREDENTIAL = {
  email: 'dosen.pbl@polibatam.ac.id',
  password: 'GitContrib2024!',
};

const MOCK_USER: AuthUser = {
  id: 'user-dosen-01',
  name: 'Dr. Rizky Hendarman, M.T.',
  email: 'dosen.pbl@polibatam.ac.id',
  nidn: '1004198501001',
  department: 'Teknik Informatika',
  institution: 'Politeknik Negeri Batam',
  avatarInitials: 'RH',
  role: 'Dosen Pengampu',
  lastLogin: new Date().toISOString(),
};

const STORAGE_KEY = 'gitcontrib-auth-session';

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Restore from sessionStorage so refresh keeps you logged in within the tab
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as AuthUser) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);
      // Simulate network delay
      await new Promise((res) => setTimeout(res, 900));

      const trimmedEmail = email.trim().toLowerCase();
      const isValidEmail = trimmedEmail === MOCK_CREDENTIAL.email;
      const isValidPass =
        password === MOCK_CREDENTIAL.password || password.length >= 6;

      setIsLoading(false);

      if (!isValidEmail) {
        return { success: false, error: 'Email tidak terdaftar di sistem.' };
      }
      if (!isValidPass) {
        return {
          success: false,
          error: 'Kata sandi minimal 6 karakter.',
        };
      }

      const loggedUser: AuthUser = { ...MOCK_USER, lastLogin: new Date().toISOString() };
      setUser(loggedUser);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(loggedUser));
      return { success: true };
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const updateProfile = useCallback(
    (partial: Partial<Pick<AuthUser, 'name' | 'department'>>) => {
      setUser((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, ...partial };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: Boolean(user), isLoading, login, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
