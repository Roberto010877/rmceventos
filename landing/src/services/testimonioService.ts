import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface NuevoTestimonioInput {
  nombreCliente: string;
  tipoEvento: string;
  mensaje: string;
  calificacion?: number;
}

export async function enviarTestimonio(data: NuevoTestimonioInput): Promise<string> {
  const cleanNombre = data.nombreCliente.trim();
  const cleanMensaje = data.mensaje.trim();
  const cleanTipo = data.tipoEvento.trim() || 'Evento';
  const calificacion = data.calificacion || 5;

  if (!cleanNombre || !cleanMensaje) {
    throw new Error('El nombre y el testimonio son obligatorios.');
  }

  const docRef = await addDoc(collection(db, 'testimonios'), {
    nombreCliente: cleanNombre,
    tipoEvento: cleanTipo,
    mensaje: cleanMensaje,
    calificacion,
    aprobado: false, // Moderación: requiere aprobación en el Admin
    fecha: serverTimestamp(),
  });

  return docRef.id;
}
