import { FirebaseTimestamp } from './types';

/**
 * Interfaz que representa un testimonio de un cliente
 */
export interface Testimonio {
  /** Identificador único del testimonio */
  id: string;
  /** Nombre del cliente que deja el testimonio */
  nombreCliente: string;
  /** Tipo de evento relacionado (opcional) */
  tipoEvento?: string;
  /** Mensaje o contenido del testimonio */
  mensaje: string;
  /** Fecha en la que se dejó el testimonio */
  fecha: FirebaseTimestamp;
  /** Indica si el testimonio ha sido aprobado para mostrarse públicamente */
  aprobado: boolean;
}
