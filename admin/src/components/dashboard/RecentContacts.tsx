import { Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DashboardContact } from '../../types/dashboard';
import { formatDashboardTime } from './format';

interface RecentContactsProps {
  contacts: DashboardContact[];
}

export default function RecentContacts({ contacts }: RecentContactsProps) {
  return (
    <section className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5 shadow-sm">
      <PanelHeader title="Contactos pendientes" to="/contactos" />
      <div className="mt-4 space-y-3">
        {contacts.length === 0 ? (
          <EmptyState icon={Mail} text="No hay mensajes pendientes." />
        ) : (
          contacts.map((contact) => (
            <div key={contact.id} className="rounded-lg border border-[var(--border-color)] p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">{contact.nombre}</p>
                  <p className="mt-1 text-xs capitalize text-dorado">{contact.tipoEvento}</p>
                </div>
                <span className="text-xs text-[var(--text-secondary)]">
                  {formatDashboardTime(contact.fecha)}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-[var(--text-secondary)]">{contact.mensaje}</p>
              {contact.telefono && (
                <p className="mt-2 flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                  <Phone size={13} />
                  {contact.telefono}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function PanelHeader({ title, to }: { title: string; to: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-poppins text-lg font-bold text-[var(--text-primary)]">{title}</h2>
      <Link to={to} className="text-sm font-semibold text-dorado hover:underline">
        Ver todo
      </Link>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Mail; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-[var(--border-color)] p-4 text-sm text-[var(--text-secondary)]">
      <Icon size={18} />
      {text}
    </div>
  );
}
