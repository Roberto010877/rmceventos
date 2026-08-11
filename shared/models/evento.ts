import { FirebaseTimestamp } from './types';

export type TipoEvento = 'boda' | 'aniversario' | 'corporativo' | 'cumpleanos' | 'otro';

/**
 * Interfaz que representa un evento gestionado por RMC Eventos
 */
export interface Evento {
  /** Identificador único del evento */
  id: string;
  /** Nombre o título del evento */
  nombre: string;
  /** Tipo de evento */
  tipoEvento: TipoEvento;
  /** Fecha en la que se realiza o realizó el evento */
  fecha: FirebaseTimestamp;
  /** Nombre del cliente del evento (opcional) */
  clienteNombre?: string;
  /** Descripción o detalles adicionales del evento (opcional) */
  descripcion?: string;
}
