import { FirebaseTimestamp } from './types';

/**
 * Interfaz que representa un registro de auditoría en el sistema
 */
export interface Auditoria {
  /** Identificador único del registro de auditoría */
  id: string;
  /** ID del usuario que realizó la acción */
  usuarioId: string;
  /** Correo electrónico del usuario que realizó la acción */
  usuarioEmail: string;
  /** Acción realizada (ej. 'crear_foto', 'eliminar_servicio') */
  accion: string;
  /** ID de la entidad afectada (opcional) */
  entidadId?: string;
  /** Detalles adicionales de la acción (opcional) */
  detalle?: string;
  /** Fecha en la que ocurrió la acción */
  fecha: FirebaseTimestamp;
}
