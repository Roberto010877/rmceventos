import { FirebaseTimestamp } from './types';

/**
 * Interfaz que representa un mensaje de contacto a través de la web
 */
export interface Contacto {
  /** Identificador único del mensaje de contacto */
  id: string;
  /** Nombre de la persona que contacta */
  nombre: string;
  /** Número de teléfono de contacto */
  telefono: string;
  /** Tipo de evento para el que consultan (opcional) */
  tipoEvento?: string;
  /** Mensaje de la consulta */
  mensaje: string;
  /** Fecha en la que se envió el mensaje */
  fecha: FirebaseTimestamp;
  /** Indica si el mensaje ya fue atendido o respondido */
  atendido: boolean;
}
