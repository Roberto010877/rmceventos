import { createContext, useContext } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastInput {
  title?: string;
  message: string;
  type?: ToastType;
}

export interface ConfirmInput {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'default';
}

export interface FeedbackContextValue {
  toast: (input: ToastInput | string) => void;
  confirm: (input: ConfirmInput) => Promise<boolean>;
}

export const FeedbackContext = createContext<FeedbackContextValue | undefined>(undefined);

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback debe usarse dentro de FeedbackProvider');
  }
  return context;
}
