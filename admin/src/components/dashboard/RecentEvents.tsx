import { CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DashboardEvent } from '../../types/dashboard';

interface RecentEventsProps {
  events: DashboardEvent[];
}

export default function RecentEvents({ events }: RecentEventsProps) {
  return (
    <section className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-poppins text-lg font-bold text-[var(--text-primary)]">Eventos recientes</h2>
        <Link to="/eventos" className="text-sm font-semibold text-dorado hover:underline">
          Ver agenda
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {events.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-[var(--border-color)] p-4 text-sm text-[var(--text-secondary)]">
            <CalendarDays size={18} />
            No hay eventos registrados.
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="flex items-center justify-between gap-4 rounded-lg border border-[var(--border-color)] p-3">
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{event.nombre}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {event.clienteNombre || 'Cliente sin nombre'} · {event.tipoEvento}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-dorado">{event.fecha || 'Sin fecha'}</p>
                <p className="mt-1 text-xs capitalize text-[var(--text-secondary)]">{event.estado.replace('_', ' ')}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
