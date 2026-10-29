import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'primary',
  isLoading = false,
}: ConfirmDialogProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div className="relative w-full max-w-md bg-app-card border border-app-border rounded-lg shadow-xl overflow-hidden p-6">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-app-text-secondary hover:text-app-text-primary p-1 rounded-md hover:bg-app-secondary transition-colors"
          aria-label="Tutup dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center shrink-0 border',
              variant === 'danger'
                ? 'bg-app-accent-negative/10 border-app-accent-negative/30 text-app-accent-negative'
                : 'bg-app-accent-primary/10 border-app-accent-primary/30 text-app-accent-primary'
            )}
          >
            <AlertTriangle className="w-5 h-5 stroke-[1.75]" />
          </div>

          <div className="flex-1">
            <h3 id="dialog-title" className="text-base font-semibold text-app-text-primary">
              {title}
            </h3>
            <p className="text-xs text-app-text-secondary mt-1.5 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-app-border">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
