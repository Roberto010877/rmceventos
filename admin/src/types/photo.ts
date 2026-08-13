export interface Foto {
  id: string;
  url: string;
  categoria: string;
  estadoProcesamiento: string;
  fechaSubida: any;
  subidoPor: string;
  descripcion?: string;
  destacada?: boolean;
  visible?: boolean;
  mostrarEnNosotros?: boolean;
}

export interface PendingFileItem {
  id: string;
  file?: File;
  previewUrl: string;
  categoria: string;
  descripcion: string;
  destacada: boolean;
  mostrarEnNosotros: boolean;
}

export type FilterCategory = 'todas' | 'decoracion' | 'mobiliario' | 'banqueteria' | 'nosotros' | 'destacadas' | 'ocultas';

export interface PhotoCounts {
  todas: number;
  decoracion: number;
  mobiliario: number;
  banqueteria: number;
  nosotros: number;
  destacadas: number;
  ocultas: number;
}
