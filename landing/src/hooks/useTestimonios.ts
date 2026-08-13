import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface TestimonioItem {
  id: string;
  nombreCliente: string;
  tipoEvento?: string;
  mensaje: string;
  calificacion?: number;
}

export const defaultTestimonios: TestimonioItem[] = [
  {
    id: '1',
    nombreCliente: 'María Fernanda L.',
    tipoEvento: 'Boda',
    mensaje: 'Hicieron que mi boda fuera un sueño hecho realidad. La decoración estuvo impecable, el catering exquisito y el equipo súper atento. Totalmente recomendados.',
    calificacion: 5,
  },
  {
    id: '2',
    nombreCliente: 'Carlos Rodríguez',
    tipoEvento: 'Evento Corporativo',
    mensaje: 'Profesionalismo de principio a fin. RMC Eventos se encargó de nuestra cena de fin de año y todo el mobiliario y la iluminación estuvo de lujo.',
    calificacion: 5,
  },
  {
    id: '3',
    nombreCliente: 'Sofía V. & Familia',
    tipoEvento: 'Quinceañero',
    mensaje: 'Mis 15 años fueron increíbles gracias a ellos. Captaron exactamente la temática que quería y el resultado final superó todas nuestras expectativas.',
    calificacion: 5,
  },
  {
    id: '4',
    nombreCliente: 'Andrés & Paula',
    tipoEvento: 'Aniversario',
    mensaje: 'La atención a los detalles es lo que los distingue. La calidad del mobiliario y la ambientación nos dejó sin palabras. Gracias por tanto cariño.',
    calificacion: 5,
  },
];

export function useTestimonios(): { testimonios: TestimonioItem[]; loading: boolean } {
  const [testimonios, setTestimonios] = useState<TestimonioItem[]>(defaultTestimonios);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const q = query(
        collection(db, 'testimonios'),
        where('aprobado', '==', true)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: TestimonioItem[] = snapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                nombreCliente: data.nombreCliente || data.nombre || 'Cliente',
                tipoEvento: data.tipoEvento || 'Evento',
                mensaje: data.mensaje || data.text || '',
                calificacion: data.calificacion || 5,
              };
            });
            setTestimonios(list);
          } else {
            setTestimonios(defaultTestimonios);
          }
          setLoading(false);
        },
        (error) => {
          console.warn('Firestore testimonios fallback in use:', error.message);
          setTestimonios(defaultTestimonios);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Firebase testimonios query error fallback:', err);
      setTestimonios(defaultTestimonios);
      setLoading(false);
    }
  }, []);

  return { testimonios, loading };
}
