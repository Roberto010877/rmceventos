import { ShieldCheck } from 'lucide-react';
import type { DashboardRole } from '../../types/dashboard';

interface DashboardHeaderProps {
  name?: string;
  role?: DashboardRole;
  loading: boolean;
}

export default function DashboardHeader({ name, role, loading }: DashboardHeaderProps) {
  const firstName = name?.split(' ')[0] || 'Administrador';

  return (
    <header className="flex flex-col gap-4 border-b border-[var(--border-color)] pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-dorado">Panel RMC Eventos</p>
        <h1 className="mt-2 font-poppins text-3xl font-bold text-[var(--text-primary)]">
          Hola, {firstName}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
          Resumen operativo para priorizar mensajes, contenido y agenda sin perder el pulso del negocio.
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-secondary)] shadow-sm">
        <ShieldCheck size={18} className="text-dorado" />
        <span className="capitalize">{loading ? 'Sincronizando' : role || 'usuario'}</span>
      </div>
    </header>
  );
}
