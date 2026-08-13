import { FirebaseTimestamp } from './types';

export type TipoEventoClave = 'boda' | 'cumpleanos' | 'aniversario' | 'empresarial' | 'otro';
export type EstadoContacto = 'nuevo' | 'en_contacto' | 'cerrado';

export interface NotificacionEstado {
  estado: 'pendiente' | 'enviada' | 'error';
  enviadoAt?: FirebaseTimestamp;
  intentos: number;
  error?: string;
  idempotencyKey?: string;
}

/**
 * Interfaz que representa un mensaje de contacto a través de la web (V2.1)
 */
export interface Contacto {
  /** Identificador único del mensaje de contacto */
  id: string;
  /** Nombre de la persona que contacta */
  nombre: string;
  /** Correo electrónico oficial del cliente */
  email: string;
  /** Número de teléfono de contacto */
  telefono: string;
  /** Tipo de evento normalizado ('boda', 'cumpleanos', 'aniversario', 'empresarial', 'otro') preservando autocompletado */
  tipoEvento?: TipoEventoClave | (string & {});
  /** Mensaje de la consulta (sanitizado) */
  mensaje: string;
  /** Fecha en la que se envió el mensaje */
  fecha: FirebaseTimestamp;
  /** Estado del contacto en el flujo comercial ('nuevo', 'en_contacto', 'cerrado') */
  estado: EstadoContacto;
  /** Campo de compatibilidad previa */
  atendido: boolean;
  /** Origen del mensaje (ej: 'landing', 'campaign', 'instagram') */
  source: string;
  /** Estado de envío de la notificación por email */
  notificacion?: NotificacionEstado;
}
