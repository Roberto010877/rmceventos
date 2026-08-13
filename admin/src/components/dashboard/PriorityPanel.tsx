import { CheckCircle2, Mail, MessageSquare, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import type {
  DashboardContact,
  DashboardPermissions,
  DashboardTestimonial,
} from '../../types/dashboard';

interface PriorityPanelProps {
  contacts: DashboardContact[];
  testimonials: DashboardTestimonial[];
  permissions: DashboardPermissions;
}

export default function PriorityPanel({ contacts, testimonials, permissions }: PriorityPanelProps) {
  const hasContacts = permissions.canReadContacts && contacts.length > 0;
  const hasTestimonials = permissions.canReadTestimonials && testimonials.length > 0;
  const isClear = !hasContacts && !hasTestimonials;

  return (
    <section className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-poppins text-lg font-bold text-[var(--text-primary)]">Prioridades</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Lo que conviene revisar primero al entrar al panel.
          </p>
        </div>
        <ShieldAlert size={20} className={isClear ? 'text-emerald-500' : 'text-dorado'} />
      </div>

      <div className="mt-5 space-y-3">
        {hasContacts && (
          <PriorityLink
            to="/contactos"
            icon={Mail}
            title={`${contacts.length} contacto${contacts.length === 1 ? '' : 's'} sin atender`}
            detail={contacts[0]?.nombre ? `Primero: ${contacts[0].nombre}` : 'Responder mensajes nuevos.'}
          />
        )}

        {hasTestimonials && (
          <PriorityLink
            to="/testimonios"
            icon={MessageSquare}
            title={`${testimonials.length} testimonio${testimonials.length === 1 ? '' : 's'} pendiente${testimonials.length === 1 ? '' : 's'}`}
            detail={testimonials[0]?.nombreCliente ? `Revisar a ${testimonials[0].nombreCliente}` : 'Moderar testimonios nuevos.'}
          />
        )}

        {isClear && (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 size={22} />
            <div>
              <p className="font-semibold">Todo esta al dia</p>
              <p className="text-sm opacity-80">No hay pendientes urgentes para tu rol.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

interface PriorityLinkProps {
  to: string;
  icon: typeof Mail;
  title: string;
  detail: string;
}

function PriorityLink({ to, icon: Icon, title, detail }: PriorityLinkProps) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-lg border border-dorado/20 bg-dorado/10 p-4 text-[var(--text-primary)] transition-colors hover:border-dorado"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-dorado text-blanco">
        <Icon size={20} />
      </span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="text-sm text-[var(--text-secondary)]">{detail}</span>
      </span>
    </Link>
  );
}
