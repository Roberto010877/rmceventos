import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Foto, FilterCategory, PhotoCounts, PendingFileItem } from '../types/photo';
import { photoService, type UserAuditContext } from '../services/photoService';

export function usePhotos() {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterCategory>('todas');

  useEffect(() => {
    const unsubscribe = photoService.subscribeToPhotos(
      (data) => {
        setFotos(data);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const counts: PhotoCounts = useMemo(
    () => ({
      todas: fotos.length,
      decoracion: fotos.filter((f) => f.categoria === 'decoracion').length,
      mobiliario: fotos.filter((f) => f.categoria === 'mobiliario').length,
      banqueteria: fotos.filter((f) => f.categoria === 'banqueteria').length,
      nosotros: fotos.filter((f) => f.mostrarEnNosotros).length,
      destacadas: fotos.filter((f) => !!f.destacada).length,
      ocultas: fotos.filter((f) => f.visible === false).length,
    }),
    [fotos]
  );

  const filteredFotos = useMemo(() => {
    return fotos.filter((f) => {
      if (filter === 'todas') return true;
      if (filter === 'destacadas') return !!f.destacada;
      if (filter === 'ocultas') return f.visible === false;
      if (filter === 'nosotros') return !!f.mostrarEnNosotros;
      return f.categoria === filter;
    });
  }, [fotos, filter]);

  const toggleVisibility = useCallback(async (foto: Foto) => {
    try {
      await photoService.toggleVisibility(foto.id, foto.visible !== false);
    } catch (error) {
      console.error('Error al cambiar visibilidad:', error);
    }
  }, []);

  const toggleDestacada = useCallback(async (foto: Foto) => {
    try {
      await photoService.toggleDestacada(foto.id, !!foto.destacada);
    } catch (error) {
      console.error('Error al cambiar destacada:', error);
    }
  }, []);

  const toggleNosotros = useCallback(async (foto: Foto) => {
    try {
      await photoService.toggleNosotros(foto.id, !!foto.mostrarEnNosotros);
    } catch (error) {
      console.error('Error al cambiar marca de Nosotros:', error);
    }
  }, []);

  const updatePhoto = useCallback(
    async (
      id: string,
      data: {
        categoria: string;
        descripcion: string;
        destacada: boolean;
        visible: boolean;
        mostrarEnNosotros: boolean;
      },
      user?: UserAuditContext | null
    ) => {
      await photoService.updatePhoto(id, data, user);
    },
    []
  );

  const deletePhoto = useCallback(
    async (id: string, user?: UserAuditContext | null) => {
      if (window.confirm('¿Estás seguro de eliminar esta foto de la galería?')) {
        await photoService.deletePhoto(id, user);
      }
    },
    []
  );

  const uploadBatch = useCallback(
    async (
      pendingItems: PendingFileItem[],
      user: UserAuditContext,
      onProgress?: (current: number, total: number) => void
    ) => {
      await photoService.uploadBatchPhotos(pendingItems, user, onProgress);
    },
    []
  );

  return {
    fotos,
    filteredFotos,
    loading,
    filter,
    setFilter,
    counts,
    toggleVisibility,
    toggleDestacada,
    toggleNosotros,
    updatePhoto,
    deletePhoto,
    uploadBatch,
  };
}
