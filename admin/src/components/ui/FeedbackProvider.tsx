import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { FeedbackContext, type ConfirmInput, type ToastInput, type ToastType } from './feedback';

interface ToastItem extends Required<ToastInput> {
  id: number;
}

interface ConfirmState extends Required<ConfirmInput> {
  resolve: (confirmed: boolean) => void;
}

const toastStyles: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950 dark:text-emerald-100',
  error: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950 dark:text-red-100',
  info: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/60 dark:bg-blue-950 dark:text-blue-100',
  warning: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950 dark:text-amber-100',
};

const ToastIcon = ({ type }: { type: ToastType }) => {
  if (type === 'success') return <CheckCircle2 size={18} />;
  if (type === 'error') return <XCircle size={18} />;
  if (type === 'warning') return <AlertTriangle size={18} />;
  return <Info size={18} />;
};

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const toast = useCallback((input: ToastInput | string) => {
    const normalized: ToastItem = {
      id: Date.now() + Math.random(),
      title: typeof input === 'string' ? '' : input.title || '',
      message: typeof input === 'string' ? input : input.message,
      type: typeof input === 'string' ? 'info' : input.type || 'info',
    };

    setToasts(prev => [...prev.slice(-3), normalized]);
    window.setTimeout(() => dismissToast(normalized.id), 4500);
  }, [dismissToast]);

  const confirm = useCallback((input: ConfirmInput) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({
        title: input.title,
        message: input.message,
        confirmLabel: input.confirmLabel || 'Confirmar',
        cancelLabel: input.cancelLabel || 'Cancelar',
        tone: input.tone || 'default',
        resolve,
      });
    });
  }, []);

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  const closeConfirm = (confirmed: boolean) => {
    confirmState?.resolve(confirmed);
    setConfirmState(null);
  };

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <div className="fixed right-4 top-4 z-[80] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
        {toasts.map(item => (
          <div
            key={item.id}
            className={`flex items-start gap-3 rounded-lg border p-4 shadow-lg ${toastStyles[item.type]}`}
          >
            <div className="mt-0.5 shrink-0">
              <ToastIcon type={item.type} />
            </div>
            <div className="min-w-0 flex-1">
              {item.title && <p className="text-sm font-bold">{item.title}</p>}
              <p className="text-sm leading-relaxed">{item.message}</p>
            </div>
            <button
              type="button"
              onClick={() => dismissToast(item.id)}
              className="rounded p-1 opacity-70 transition-opacity hover:opacity-100"
              aria-label="Cerrar notificación"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {confirmState && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 rounded-full p-2 ${confirmState.tone === 'danger' ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300' : 'bg-[#D4AF37]/15 text-[#D4AF37]'}`}>
                <AlertTriangle size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">{confirmState.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{confirmState.message}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => closeConfirm(false)}
                className="rounded-lg border border-[var(--border-color)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-primary)]"
              >
                {confirmState.cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => closeConfirm(true)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${
                  confirmState.tone === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-[#D4AF37] hover:bg-[#b8952d]'
                }`}
              >
                {confirmState.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}
