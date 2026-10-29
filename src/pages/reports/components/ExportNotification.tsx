import { AlertTriangle, X, FileSpreadsheet, Printer } from 'lucide-react';
import { cn } from '../../../utils/cn';

export interface NotificationState {
  type: 'success' | 'error';
  title: string;
  message: string;
  actionType?: 'csv' | 'pdf';
}

interface ExportNotificationProps {
  notification: NotificationState | null;
  onClose: () => void;
}

export function ExportNotification({ notification, onClose }: ExportNotificationProps) {
  if (!notification) return null;

  const isSuccess = notification.type === 'success';

  return (
    <div
      className={cn(
        'p-4 rounded-xl border shadow-lg flex items-start justify-between gap-3 text-xs animate-fadeIn transition-all',
        isSuccess
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
          : 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200'
      )}
    >
      <div className="flex items-start gap-2.5">
        {isSuccess ? (
          notification.actionType === 'csv' ? (
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <Printer className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          )
        ) : (
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
        )}

        <div className="space-y-0.5">
          <p className="font-semibold text-sm">{notification.title}</p>
          <p className="text-xs opacity-90">{notification.message}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="text-app-text-secondary hover:text-app-text-primary p-1 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
