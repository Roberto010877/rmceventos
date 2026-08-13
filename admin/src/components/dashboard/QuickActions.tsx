import { CalendarPlus, ImagePlus, Mail, MessageSquare, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DashboardPermissions } from '../../types/dashboard';

interface QuickActionsProps {
  permissions: DashboardPermissions;
}

export default function QuickActions({ permissions }: QuickActionsProps) {
  const actions = [
    { to: '/fotos', label: 'Subir fotos', icon: ImagePlus, show: permissions.canManageContent },
    { to: '/eventos', label: 'Crear evento', icon: CalendarPlus, show: permissions.canManageContent },
    { to: '/contactos', label: 'Ver mensajes', icon: Mail, show: permissions.canReadContacts },
    { to: '/testimonios', label: 'Moderar', icon: MessageSquare, show: permissions.canReadTestimonials },
    { to: '/configuracion', label: 'Configuracion', icon: Settings, show: permissions.canReadContacts },
  ];

  return (
    <section className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5 shadow-sm">
      <h2 className="font-poppins text-lg font-bold text-[var(--text-primary)]">Acciones rapidas</h2>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {actions
          .filter((action) => action.show)
          .map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.to}
                to={action.to}
                className="flex items-center justify-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:border-dorado hover:text-dorado"
              >
                <Icon size={18} />
                {action.label}
              </Link>
            );
          })}
      </div>
    </section>
  );
}
