import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Foto, PendingFileItem } from '../types/photo';

export interface UserAuditContext {
  uid: string;
  email: string;
}

export const photoService = {
  /**
   * Suscribe en tiempo real a la colección de fotos ordenadas por fecha de subida descendente.
   */
  subscribeToPhotos(
    onData: (fotos: Foto[]) => void,
    onError?: (error: any) => void
  ): () => void {
    const q = query(collection(db, 'fotos'), orderBy('fechaSubida', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => {
          const item = d.data();
          return {
            id: d.id,
            url: item.url,
            categoria: item.categoria || 'decoracion',
            estadoProcesamiento: item.estadoProcesamiento || 'listo',
            fechaSubida: item.fechaSubida,
            subidoPor: item.subidoPor,
            descripcion: item.descripcion || '',
            destacada: !!item.destacada,
            visible: item.visible !== false,
            mostrarEnNosotros: !!item.mostrarEnNosotros,
          } as Foto;
        });
        onData(data);
      },
      (err) => {
        console.error('Error al escuchar fotos:', err);
        if (onError) onError(err);
      }
    );
  },

  /**
   * Alterna la visibilidad pública de una foto.
   */
  async toggleVisibility(id: string, currentVisible: boolean): Promise<void> {
    await updateDoc(doc(db, 'fotos', id), {
      visible: !currentVisible,
    });
  },

  /**
   * Alterna la marca de foto destacada.
   */
  async toggleDestacada(id: string, currentDestacada: boolean): Promise<void> {
    await updateDoc(doc(db, 'fotos', id), {
      destacada: !currentDestacada,
    });
  },

  /**
   * Alterna la asignación de foto al carrusel "Nosotros".
   */
  async toggleNosotros(id: string, currentNosotros: boolean): Promise<void> {
    await updateDoc(doc(db, 'fotos', id), {
      mostrarEnNosotros: !currentNosotros,
    });
  },

  /**
   * Guarda las ediciones de metadatos de una foto y registra la acción en auditoría.
   */
  async updatePhoto(
    id: string,
    data: {
      categoria: string;
      descripcion: string;
      destacada: boolean;
      visible: boolean;
      mostrarEnNosotros: boolean;
    },
    user?: UserAuditContext | null
  ): Promise<void> {
    await updateDoc(doc(db, 'fotos', id), {
      categoria: data.categoria,
      descripcion: data.descripcion,
      destacada: data.destacada,
      visible: data.visible,
      mostrarEnNosotros: data.mostrarEnNosotros,
    });

    if (user) {
      await addDoc(collection(db, 'auditoria'), {
        usuarioId: user.uid,
        usuarioEmail: user.email,
        accion: 'foto.editar',
        entidadId: id,
        detalle: `Foto editada (${data.categoria})`,
        fecha: new Date(),
      });
    }
  },

  /**
   * Elimina una foto y registra la acción en auditoría.
   */
  async deletePhoto(id: string, user?: UserAuditContext | null): Promise<void> {
    await deleteDoc(doc(db, 'fotos', id));
    if (user) {
      await addDoc(collection(db, 'auditoria'), {
        usuarioId: user.uid,
        usuarioEmail: user.email,
        accion: 'foto.eliminar',
        entidadId: id,
        detalle: 'Foto eliminada de galería',
        fecha: new Date(),
      });
    }
  },

  /**
   * Sube un lote de fotos a Firestore y registra auditoría masiva.
   */
  async uploadBatchPhotos(
    pendingItems: PendingFileItem[],
    user: UserAuditContext,
    onProgress?: (current: number, total: number) => void
  ): Promise<void> {
    const now = Date.now();
    const total = pendingItems.length;

    for (let i = 0; i < total; i++) {
      const item = pendingItems[i];

      await addDoc(collection(db, 'fotos'), {
        url: item.previewUrl,
        urlWebp: item.previewUrl,
        urlThumbnail: item.previewUrl,
        categoria: item.categoria,
        descripcion: item.descripcion,
        destacada: item.destacada,
        visible: true,
        mostrarEnNosotros: item.mostrarEnNosotros,
        estadoProcesamiento: 'listo',
        orden: now + i,
        fechaSubida: new Date(),
        subidoPor: user.uid,
      });

      if (onProgress) {
        onProgress(i + 1, total);
      }
    }

    await addDoc(collection(db, 'auditoria'), {
      usuarioId: user.uid,
      usuarioEmail: user.email,
      accion: 'foto.crear_masivo',
      detalle: `Se subieron ${total} fotos a la galería`,
      fecha: new Date(),
    });
  },
};
