/**
 * Interfaz que representa un servicio ofrecido por RMC Eventos
 */
export interface Servicio {
  /** Identificador único del servicio */
  id: string;
  /** Nombre del servicio */
  nombre: string;
  /** Descripción detallada del servicio */
  descripcion: string;
  /** Orden de visualización en la página */
  ordenVisualizacion: number;
}
