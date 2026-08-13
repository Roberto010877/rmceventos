import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface PhotoDisplayItem {
  id: string;
  categoria: 'decoracion' | 'mobiliario' | 'banqueteria';
  categoriaLabel: string;
  titulo: string;
  url: string;
  thumb: string;
  alt: string;
  wide?: boolean;
  visible?: boolean;
  mostrarEnNosotros?: boolean;
}

export const defaultPhotos: PhotoDisplayItem[] = [
  {
    id: '1',
    categoria: 'decoracion',
    categoriaLabel: 'Decoración',
    titulo: 'Salón con florales altos',
    url: '/images/extracted/img_12.jpeg',
    thumb: '/images/extracted/img_13.jpeg',
    alt: 'Salón de eventos con arreglos florales altos',
    wide: true,
    mostrarEnNosotros: true,
  },
  {
    id: '2',
    categoria: 'mobiliario',
    categoriaLabel: 'Mobiliario',
    titulo: 'Montaje con sillas doradas',
    url: '/images/extracted/img_14.jpeg',
    thumb: '/images/extracted/img_15.jpeg',
    alt: 'Mesa con sillas doradas y candelabros',
    mostrarEnNosotros: true,
  },
  {
    id: '3',
    categoria: 'banqueteria',
    categoriaLabel: 'Banquetería',
    titulo: 'Mesa de banquete',
    url: '/images/extracted/img_16.jpeg',
    thumb: '/images/extracted/img_17.jpeg',
    alt: 'Mesa de banquete con entradas y bebidas',
  },
  {
    id: '4',
    categoria: 'decoracion',
    categoriaLabel: 'Decoración',
    titulo: 'Arreglo floral colgante',
    url: '/images/extracted/img_18.jpeg',
    thumb: '/images/extracted/img_19.jpeg',
    alt: 'Arreglo floral colgante con hortensias',
  },
  {
    id: '5',
    categoria: 'mobiliario',
    categoriaLabel: 'Mobiliario',
    titulo: 'Ambientación en negro y dorado',
    url: '/images/extracted/img_20.jpeg',
    thumb: '/images/extracted/img_21.jpeg',
    alt: 'Salón de recepción en negro y dorado',
  },
  {
    id: '6',
    categoria: 'decoracion',
    categoriaLabel: 'Decoración',
    titulo: 'Centro de mesa en tonos borgoña',
    url: '/images/extracted/img_22.jpeg',
    thumb: '/images/extracted/img_23.jpeg',
    alt: 'Centro de mesa floral en tonos borgoña y rosa',
    wide: true,
    mostrarEnNosotros: true,
  },
  {
    id: '7',
    categoria: 'decoracion',
    categoriaLabel: 'Decoración',
    titulo: 'Mesa cálida con velas',
    url: '/images/extracted/img_24.jpeg',
    thumb: '/images/extracted/img_25.jpeg',
    alt: 'Mesa decorada con velas y luces cálidas',
    mostrarEnNosotros: true,
  },
];

export function usePhotos(): { 
  photos: PhotoDisplayItem[]; 
  nosotrosPhotos: PhotoDisplayItem[]; 
  loading: boolean 
} {
  const [photos, setPhotos] = useState<PhotoDisplayItem[]>(defaultPhotos);
  const [nosotrosPhotos, setNosotrosPhotos] = useState<PhotoDisplayItem[]>(
    defaultPhotos.filter(p => p.mostrarEnNosotros)
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const q = query(
        collection(db, 'fotos'),
        where('estadoProcesamiento', '==', 'listo'),
        orderBy('orden', 'asc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: PhotoDisplayItem[] = snapshot.docs
              .map((doc, index) => {
                const data = doc.data();
                const cat = (data.categoria as 'decoracion' | 'mobiliario' | 'banqueteria') || 'decoracion';
                const catLabel = cat === 'decoracion' ? 'Decoración' : cat === 'mobiliario' ? 'Mobiliario' : 'Banquetería';
                return {
                  id: doc.id,
                  categoria: cat,
                  categoriaLabel: catLabel,
                  titulo: data.descripcion || `Foto ${index + 1}`,
                  url: data.urlWebp || data.url || defaultPhotos[index % defaultPhotos.length].url,
                  thumb: data.urlThumbnail || data.urlWebp || data.url || defaultPhotos[index % defaultPhotos.length].thumb,
                  alt: data.descripcion || 'Foto RMC Eventos',
                  wide: index % 5 === 0,
                  visible: data.visible !== false,
                  mostrarEnNosotros: !!data.mostrarEnNosotros,
                };
              })
              .filter((item) => item.visible !== false);

            setPhotos(list.length > 0 ? list : defaultPhotos);
            
            // Filtrar las fotos destinadas al carrusel de Nosotros
            const nosotrosList = list.filter((p) => p.mostrarEnNosotros);
            setNosotrosPhotos(
              nosotrosList.length > 0 
                ? nosotrosList 
                : defaultPhotos.filter(p => p.mostrarEnNosotros)
            );
          } else {
            setPhotos(defaultPhotos);
            setNosotrosPhotos(defaultPhotos.filter(p => p.mostrarEnNosotros));
          }
          setLoading(false);
        },
        (error) => {
          console.warn('Firestore photos fallback in use:', error.message);
          setPhotos(defaultPhotos);
          setNosotrosPhotos(defaultPhotos.filter(p => p.mostrarEnNosotros));
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Firebase photos query error fallback:', err);
      setPhotos(defaultPhotos);
      setNosotrosPhotos(defaultPhotos.filter(p => p.mostrarEnNosotros));
      setLoading(false);
    }
  }, []);

  return { photos, nosotrosPhotos, loading };
}
