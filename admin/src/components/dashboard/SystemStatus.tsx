import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface SystemStatusProps {
  loading: boolean;
  error: string | null;
}

export default function SystemStatus({ loading, error }: SystemStatusProps) {
  if (!loading && !error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 size={16} />
        Datos sincronizados
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dorado/20 bg-dorado/10 px-3 py-2 text-sm text-dorado">
        <Loader2 size={16} className="animate-spin" />
        Sincronizando dashboard
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">
      <AlertCircle size={16} />
      {error}
    </div>
  );
}
