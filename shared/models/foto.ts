import { FirebaseTimestamp } from './types';

export type CategoriaFoto = 'decoracion' | 'mobiliario' | 'banqueteria';
export type EstadoProcesamiento = 'procesando' | 'listo' | 'error';

/**
 * Interfaz que representa una foto en el sistema RMC Eventos
 */
export interface Foto {
  /** Identificador único de la foto */
  id: string;
  /** URL de la imagen original */
  url: string;
  /** URL de la imagen en formato WebP */
  urlWebp: string;
  /** URL de la miniatura de la imagen */
  urlThumbnail: string;
  /** Categoría a la que pertenece la foto */
  categoria: CategoriaFoto;
  /** ID del evento asociado (opcional) */
  eventoId?: string;
  /** Descripción de la foto (opcional) */
  descripcion?: string;
  /** Fecha en la que se subió la foto */
  fechaSubida: FirebaseTimestamp;
  /** Indica si la foto está destacada en la galería */
  destacada: boolean;
  /** Indica si la foto es visible públicamente en la landing page (por defecto true) */
  visible: boolean;
  /** Indica si la foto se muestra en el carrusel de la sección Nosotros */
  mostrarEnNosotros?: boolean;
  /** ID del usuario que subió la foto */
  subidoPor: string;
  /** Estado del procesamiento de la imagen */
  estadoProcesamiento: EstadoProcesamiento;
  /** Orden de visualización en la galería */
  orden: number;
  /** Ancho de la imagen en píxeles (opcional) */
  ancho?: number;
  /** Alto de la imagen en píxeles (opcional) */
  alto?: number;
  /** Tamaño de la imagen en bytes (opcional) */
  tamanioBytes?: number;
}
