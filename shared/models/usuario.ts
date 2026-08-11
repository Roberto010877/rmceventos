import { FirebaseTimestamp } from './types';

export type Rol = 'editor' | 'admin' | 'superadmin';

/**
 * Interfaz que representa un usuario del panel de administración
 */
export interface Usuario {
  /** Identificador único del usuario (UID de Firebase Auth) */
  id: string;
  /** Correo electrónico del usuario */
  email: string;
  /** Nombre completo del usuario */
  nombre: string;
  /** Rol del usuario en el sistema */
  rol: Rol;
  /** Fecha de registro o alta en el sistema */
  fechaAlta: FirebaseTimestamp;
}
