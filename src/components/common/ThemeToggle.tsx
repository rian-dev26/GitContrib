import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme, ThemeMode } from '../../contexts/ThemeContext';
import { cn } from '../../utils/cn';

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themeOptions: Array<{ mode: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { mode: 'light', label: 'Terang', icon: Sun },
    { mode: 'dark', label: 'Gelap', icon: Moon },
    { mode: 'system', label: 'Sistem', icon: Laptop },
  ];

  const CurrentIcon = resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Pilih mode tema tampilan (Terang / Gelap / Sistem)"
        aria-expanded={isOpen}
        className={cn(
          'w-9 h-9 rounded-md flex items-center justify-center border border-app-border text-app-text-secondary hover:text-app-text-primary hover:bg-app-secondary transition-colors duration-150',
          isOpen && 'bg-app-secondary text-app-text-primary'
        )}
      >
        <CurrentIcon className="w-4 h-4 transition-transform duration-200" />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Pilihan Tema"
          className="absolute right-0 mt-2 w-36 rounded-md bg-app-card border border-app-border shadow-lg py-1 z-50 text-xs animate-fadeIn"
        >
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.mode;
            return (
              <button
                key={opt.mode}
                type="button"
                role="menuitem"
                onClick={() => {
                  setTheme(opt.mode);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 text-left transition-colors duration-150',
                  isSelected
                    ? 'text-app-accent-primary font-medium bg-app-secondary/60'
                    : 'text-app-text-primary hover:bg-app-secondary'
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-app-accent-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
