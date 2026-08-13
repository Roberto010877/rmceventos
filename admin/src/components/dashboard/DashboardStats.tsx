import { Calendar, ImageIcon, Mail, MessageSquare } from 'lucide-react';
import type { DashboardPermissions, DashboardStats as Stats } from '../../types/dashboard';
import StatCard from './StatCard';

interface DashboardStatsProps {
  stats: Stats;
  permissions: DashboardPermissions;
}

export default function DashboardStats({ stats, permissions }: DashboardStatsProps) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={ImageIcon}
        label="Fotos"
        value={stats.fotos}
        helper="Contenido cargado en la galeria."
      />
      <StatCard
        icon={Calendar}
        label="Eventos"
        value={stats.eventos}
        helper="Agenda y cotizaciones registradas."
      />
      <StatCard
        icon={Mail}
        label="Mensajes pendientes"
        value={permissions.canReadContacts ? stats.mensajesNoAtendidos : 0}
        tone={stats.mensajesNoAtendidos > 0 ? 'urgent' : 'success'}
        helper={permissions.canReadContacts ? 'Contactos esperando respuesta.' : 'Disponible para admin y superadmin.'}
      />
      <StatCard
        icon={MessageSquare}
        label="Testimonios"
        value={permissions.canReadTestimonials ? stats.testimoniosPendientes : 0}
        tone={stats.testimoniosPendientes > 0 ? 'urgent' : 'success'}
        helper={permissions.canReadTestimonials ? 'Pendientes de moderacion.' : 'Disponible para admin y superadmin.'}
      />
    </section>
  );
}
