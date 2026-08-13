import {
  collection,
  getCountFromServer,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type {
  DashboardActivity,
  DashboardContact,
  DashboardEvent,
  DashboardPermissions,
  DashboardPhoto,
  DashboardRole,
  DashboardStats,
  DashboardTestimonial,
} from '../types/dashboard';

export const emptyDashboardStats: DashboardStats = {
  fotos: 0,
  eventos: 0,
  mensajesNoAtendidos: 0,
  testimoniosPendientes: 0,
};

export function getDashboardPermissions(role?: DashboardRole | null): DashboardPermissions {
  const isAdmin = role === 'admin' || role === 'superadmin';

  return {
    canReadContacts: isAdmin,
    canReadTestimonials: isAdmin,
    canReadAudit: role === 'superadmin',
    canManageContent: role === 'editor' || isAdmin,
  };
}

export async function loadDashboardCounts(
  permissions: DashboardPermissions
): Promise<Partial<DashboardStats>> {
  const [fotosSnapshot, eventosSnapshot, contactosSnapshot, testimoniosSnapshot] =
    await Promise.all([
      getCountFromServer(collection(db, 'fotos')),
      getCountFromServer(collection(db, 'eventos')),
      permissions.canReadContacts
        ? getCountFromServer(query(collection(db, 'contactos'), where('atendido', '==', false)))
        : Promise.resolve(null),
      permissions.canReadTestimonials
        ? getCountFromServer(query(collection(db, 'testimonios'), where('aprobado', '==', false)))
        : Promise.resolve(null),
    ]);

  return {
    fotos: fotosSnapshot.data().count,
    eventos: eventosSnapshot.data().count,
    mensajesNoAtendidos: contactosSnapshot?.data().count ?? 0,
    testimoniosPendientes: testimoniosSnapshot?.data().count ?? 0,
  };
}

export function subscribeDashboardRealtime(
  permissions: DashboardPermissions,
  handlers: {
    onContacts?: (items: DashboardContact[]) => void;
    onTestimonials?: (items: DashboardTestimonial[]) => void;
    onError?: (message: string) => void;
  }
): Unsubscribe {
  const unsubscribers: Unsubscribe[] = [];

  if (permissions.canReadContacts) {
    const contactsQuery = query(
      collection(db, 'contactos'),
      where('atendido', '==', false),
      limit(5)
    );

    unsubscribers.push(
      onSnapshot(
        contactsQuery,
        (snapshot) => {
          const contacts = snapshot.docs
            .map((docSnap) => {
              const data = docSnap.data();
              return {
                id: docSnap.id,
                nombre: String(data.nombre || 'Contacto sin nombre'),
                telefono: String(data.telefono || ''),
                email: String(data.email || data.correo || ''),
                tipoEvento: String(data.tipoEvento || 'evento'),
                mensaje: String(data.mensaje || ''),
                fecha: data.fecha,
              } satisfies DashboardContact;
            })
            .sort((a, b) => toMillis(b.fecha) - toMillis(a.fecha));

          handlers.onContacts?.(contacts);
        },
        (error) => {
          console.error('Error al escuchar contactos pendientes:', error);
          handlers.onError?.('No se pudieron sincronizar los contactos pendientes.');
        }
      )
    );
  }

  if (permissions.canReadTestimonials) {
    const testimonialsQuery = query(
      collection(db, 'testimonios'),
      where('aprobado', '==', false),
      limit(5)
    );

    unsubscribers.push(
      onSnapshot(
        testimonialsQuery,
        (snapshot) => {
          const testimonials = snapshot.docs
            .map((docSnap) => {
              const data = docSnap.data();
              return {
                id: docSnap.id,
                nombreCliente: String(data.nombreCliente || data.nombre || 'Cliente'),
                tipoEvento: String(data.tipoEvento || 'evento'),
                mensaje: String(data.mensaje || ''),
                fecha: data.fecha,
              } satisfies DashboardTestimonial;
            })
            .sort((a, b) => toMillis(b.fecha) - toMillis(a.fecha));

          handlers.onTestimonials?.(testimonials);
        },
        (error) => {
          console.error('Error al escuchar testimonios pendientes:', error);
          handlers.onError?.('No se pudieron sincronizar los testimonios pendientes.');
        }
      )
    );
  }

  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
}

export function subscribeDashboardRecentLists(
  permissions: DashboardPermissions,
  handlers: {
    onEvents?: (items: DashboardEvent[]) => void;
    onPhotos?: (items: DashboardPhoto[]) => void;
    onActivity?: (items: DashboardActivity[]) => void;
    onError?: (message: string) => void;
  }
): Unsubscribe {
  const unsubscribers: Unsubscribe[] = [];

  unsubscribers.push(
    onSnapshot(
      query(collection(db, 'eventos'), orderBy('fecha', 'desc'), limit(5)),
      (snapshot) => {
        handlers.onEvents?.(
          snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              nombre: String(data.nombre || 'Evento sin nombre'),
              clienteNombre: String(data.clienteNombre || ''),
              fecha: String(data.fecha || ''),
              estado: String(data.estado || 'cotizacion'),
              tipoEvento: String(data.tipoEvento || 'evento'),
            } satisfies DashboardEvent;
          })
        );
      },
      (error) => {
        console.error('Error al escuchar eventos recientes:', error);
        handlers.onError?.('No se pudieron cargar los eventos recientes.');
      }
    )
  );

  unsubscribers.push(
    onSnapshot(
      query(collection(db, 'fotos'), orderBy('fechaSubida', 'desc'), limit(6)),
      (snapshot) => {
        handlers.onPhotos?.(
          snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              url: String(data.url || data.urlThumbnail || ''),
              categoria: String(data.categoria || 'decoracion'),
              descripcion: String(data.descripcion || ''),
              fechaSubida: data.fechaSubida,
              destacada: Boolean(data.destacada),
              visible: data.visible !== false,
            } satisfies DashboardPhoto;
          })
        );
      },
      (error) => {
        console.error('Error al escuchar fotos recientes:', error);
        handlers.onError?.('No se pudieron cargar las fotos recientes.');
      }
    )
  );

  if (permissions.canReadAudit) {
    unsubscribers.push(
      onSnapshot(
        query(collection(db, 'auditoria'), orderBy('fecha', 'desc'), limit(5)),
        (snapshot) => {
          handlers.onActivity?.(
            snapshot.docs.map((docSnap) => {
              const data = docSnap.data();
              return {
                id: docSnap.id,
                accion: String(data.accion || 'actividad'),
                detalle: String(data.detalle || ''),
                usuarioEmail: String(data.usuarioEmail || ''),
                fecha: data.fecha,
              } satisfies DashboardActivity;
            })
          );
        },
        (error) => {
          console.error('Error al escuchar auditoria reciente:', error);
          handlers.onError?.('No se pudo cargar la actividad reciente.');
        }
      )
    );
  }

  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
}

function toMillis(value: unknown): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }
  if (typeof value === 'object' && 'seconds' in value) {
    return Number((value as { seconds: number }).seconds) * 1000;
  }
  return 0;
}
