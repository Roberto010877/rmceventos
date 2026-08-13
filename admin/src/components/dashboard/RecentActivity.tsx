import { History } from 'lucide-react';
import type { DashboardActivity } from '../../types/dashboard';
import { formatDashboardTime } from './format';

interface RecentActivityProps {
  activity: DashboardActivity[];
}

export default function RecentActivity({ activity }: RecentActivityProps) {
  return (
    <section className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <History size={18} className="text-dorado" />
        <h2 className="font-poppins text-lg font-bold text-[var(--text-primary)]">Actividad reciente</h2>
      </div>

      <div className="mt-4 space-y-3">
        {activity.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--border-color)] p-4 text-sm text-[var(--text-secondary)]">
            Sin actividad reciente disponible.
          </div>
        ) : (
          activity.map((item) => (
            <div key={item.id} className="border-b border-[var(--border-color)] pb-3 last:border-0 last:pb-0">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{item.detalle || item.accion}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {item.usuarioEmail || 'Sistema'} · {formatDashboardTime(item.fecha)}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
