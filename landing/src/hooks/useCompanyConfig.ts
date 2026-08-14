import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface CompanyConfig {
  nombreNegocio: string;
  slogan: string;
  email: string;
  telefono: string;
  whatsappNumber: string;
  whatsappUrl: string;
  ubicacion: string;
  ciudad: string;
  direccion: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  horarioAtencion: string;
  descripcion: string;
  heroImagenUrl: string;
}

export const defaultConfig: CompanyConfig = {
  nombreNegocio: 'RMC EVENTOS',
  slogan: 'Hacemos de tu evento algo inolvidable',
  email: 'rmc.eventos2631@gmail.com',
  telefono: '+591 75674494',
  whatsappNumber: '59175674494',
  whatsappUrl: 'https://wa.me/59175674494?text=Hola,%20me%20interesa%20cotizar%20un%20evento',
  ubicacion: 'Santa Cruz, Bolivia',
  ciudad: 'Santa Cruz, Bolivia',
  direccion: '',
  instagramUrl: 'https://instagram.com',
  facebookUrl: 'https://facebook.com',
  tiktokUrl: 'https://tiktok.com',
  horarioAtencion: 'Lunes a Sábado: 9:00 - 18:00',
  descripcion: 'Decoración, mobiliario y banquetería para eventos únicos e irrepetibles.',
  heroImagenUrl: '/images/extracted/img_6.jpeg',
};

export function useCompanyConfig(): CompanyConfig {
  const [config, setConfig] = useState<CompanyConfig>(defaultConfig);

  useEffect(() => {
    try {
      const docRef = doc(db, 'configuracion', 'general');
      const unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const rawWa = data.whatsappNumero || '';
            const cleanWa = rawWa.replace(/[^\d]/g, '');
            const waUrl = cleanWa
              ? `https://wa.me/${cleanWa}?text=Hola,%20me%20interesa%20cotizar%20un%20evento`
              : defaultConfig.whatsappUrl;

            const ubicacionTexto = data.direccion && data.ciudad
              ? `${data.direccion}, ${data.ciudad}`
              : data.ciudad || data.direccion || defaultConfig.ubicacion;

            // Determinar teléfono a mostrar prioritario
            const telefonoCalculado = data.telefonoMostrar && data.telefonoMostrar.trim() !== ''
              ? data.telefonoMostrar.trim()
              : (cleanWa ? (cleanWa.startsWith('591') ? `+${cleanWa.slice(0, 3)} ${cleanWa.slice(3)}` : `+${cleanWa}`) : defaultConfig.telefono);

            setConfig({
              nombreNegocio: data.nombreNegocio || defaultConfig.nombreNegocio,
              slogan: data.slogan || defaultConfig.slogan,
              email: data.correoContacto || defaultConfig.email,
              telefono: telefonoCalculado,
              whatsappNumber: cleanWa || defaultConfig.whatsappNumber,
              whatsappUrl: waUrl,
              ubicacion: ubicacionTexto,
              ciudad: data.ciudad || defaultConfig.ciudad,
              direccion: data.direccion || '',
              instagramUrl: data.instagramUrl || defaultConfig.instagramUrl,
              facebookUrl: data.facebookUrl || defaultConfig.facebookUrl,
              tiktokUrl: data.tiktokUrl || defaultConfig.tiktokUrl,
              horarioAtencion: data.horarioAtencion || defaultConfig.horarioAtencion,
              descripcion: data.slogan || defaultConfig.descripcion,
              heroImagenUrl: data.heroImagenUrl || defaultConfig.heroImagenUrl,
            });
          }
        },
        (error) => {
          console.warn('Firestore configuracion/general fallback:', error.message);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('Firebase listener error fallback:', err);
    }
  }, []);

  return config;
}
