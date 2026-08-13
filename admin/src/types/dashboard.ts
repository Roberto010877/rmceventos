import type { Timestamp } from 'firebase/firestore';

export type DashboardRole = 'editor' | 'admin' | 'superadmin';

export interface DashboardStats {
  fotos: number;
  eventos: number;
  mensajesNoAtendidos: number;
  testimoniosPendientes: number;
}

export interface DashboardContact {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  tipoEvento: string;
  mensaje: string;
  fecha: DashboardDateValue;
}

export interface DashboardTestimonial {
  id: string;
  nombreCliente: string;
  tipoEvento: string;
  mensaje: string;
  fecha: DashboardDateValue;
}

export interface DashboardEvent {
  id: string;
  nombre: string;
  clienteNombre: string;
  fecha: string;
  estado: string;
  tipoEvento: string;
}

export interface DashboardPhoto {
  id: string;
  url: string;
  categoria: string;
  descripcion: string;
  fechaSubida: DashboardDateValue;
  destacada: boolean;
  visible: boolean;
}

export interface DashboardActivity {
  id: string;
  accion: string;
  detalle: string;
  usuarioEmail: string;
  fecha: DashboardDateValue;
}

export interface DashboardData {
  stats: DashboardStats;
  contactosPendientes: DashboardContact[];
  testimoniosPendientes: DashboardTestimonial[];
  eventosRecientes: DashboardEvent[];
  fotosRecientes: DashboardPhoto[];
  actividadReciente: DashboardActivity[];
}

export type DashboardDateValue =
  | Timestamp
  | { seconds: number; nanoseconds?: number }
  | Date
  | string
  | null
  | undefined;

export interface DashboardPermissions {
  canReadContacts: boolean;
  canReadTestimonials: boolean;
  canReadAudit: boolean;
  canManageContent: boolean;
}
