import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ServiceDisplayItem {
  id: string;
  nombre: string;
  descripcion: string;
  imagenUrl: string;
  alt: string;
}

export const defaultServices: ServiceDisplayItem[] = [
  {
    id: '1',
    nombre: 'Decoración de eventos',
    descripcion: 'Ambientación, montaje y decoración que reflejan tu estilo y hacen único cada detalle.',
    imagenUrl: '/images/extracted/img_9.jpeg',
    alt: 'Arreglo floral colgante sobre mesa de evento',
  },
  {
    id: '2',
    nombre: 'Mobiliario y menaje',
    descripcion: 'Mesas, sillas, vajilla, manteles, cubiertos y complementos para tu montaje.',
    imagenUrl: '/images/extracted/img_10.jpeg',
    alt: 'Montaje de mesa con sillas doradas y mantelería negra',
  },
  {
    id: '3',
    nombre: 'Banquetería & catering',
    descripcion: 'Menús personalizados con presentación cuidada y opciones pensadas para tu celebración.',
    imagenUrl: '/images/extracted/img_11.jpeg',
    alt: 'Mesa de banquete con entradas y bebidas servidas',
  },
];

export function useServices(): { services: ServiceDisplayItem[]; loading: boolean } {
  const [services, setServices] = useState<ServiceDisplayItem[]>(defaultServices);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const q = query(
        collection(db, 'servicios'),
        orderBy('ordenVisualizacion', 'asc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: ServiceDisplayItem[] = snapshot.docs.map((doc, index) => {
              const data = doc.data();
              const fallbackImg = defaultServices[index % defaultServices.length].imagenUrl;
              return {
                id: doc.id,
                nombre: data.nombre || `Servicio ${index + 1}`,
                descripcion: data.descripcion || '',
                imagenUrl: data.imagenUrl || fallbackImg,
                alt: data.nombre || 'Servicio RMC Eventos',
              };
            });
            setServices(list);
          } else {
            setServices(defaultServices);
          }
          setLoading(false);
        },
        (error) => {
          console.warn('Firestore servicios fallback in use:', error.message);
          setServices(defaultServices);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Firebase servicios query error fallback:', err);
      setServices(defaultServices);
      setLoading(false);
    }
  }, []);

  return { services, loading };
}
