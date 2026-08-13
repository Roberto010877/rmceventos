/**
 * RMC EVENTOS — Seed Data
 *
 * Script para cargar datos iniciales en Firestore (emulador o producción).
 * Ejecutar con: npx ts-node src/seed/seedData.ts
 *
 * IMPORTANTE: Este script usa el Admin SDK, por lo que no está
 * sujeto a las reglas de seguridad de Firestore.
 */

import { db } from '../lib/firebase';

const generalConfig = {
  nombreNegocio: 'RMC EVENTOS',
  slogan: 'Decoración, mobiliario y banquetería para eventos únicos e irrepetibles.',
  whatsappNumero: '59172601952',
  telefonoMostrar: '+591 72601952',
  correoContacto: 'rmc.eventos2631@gmail.com',
  ciudad: 'Santa Cruz, Bolivia',
  direccion: 'Santa Cruz de la Sierra',
  instagramUrl: 'https://instagram.com/rmceventos',
  facebookUrl: 'https://facebook.com/rmceventos',
  tiktokUrl: 'https://tiktok.com/@rmceventos',
  horarioAtencion: 'Lunes a Sábado: 9:00 - 18:00',
};

const servicios = [
  {
    nombre: 'Decoración de Eventos',
    descripcion:
      'Transformamos tus espacios con decoraciones únicas y elegantes. Desde arreglos florales hasta ambientaciones temáticas completas, creamos la atmósfera perfecta para tu celebración.',
    ordenVisualizacion: 1,
  },
  {
    nombre: 'Alquiler de Mobiliario y Menaje',
    descripcion:
      'Mesas, sillas, vajilla, manteles, cubiertos y todo lo que necesitas para montar tu evento. Ofrecemos una amplia variedad de estilos para adaptarnos a cada ocasión.',
    ordenVisualizacion: 2,
  },
  {
    nombre: 'Banquetería y Catering',
    descripcion:
      'Menús personalizados para todo tipo de eventos. Desde cocteles y bocaditos hasta banquetes completos, con ingredientes frescos y presentaciones impecables.',
    ordenVisualizacion: 3,
  },
];

const testimonios = [
  {
    nombreCliente: 'María García',
    tipoEvento: 'Boda',
    mensaje:
      'RMC Eventos hizo de nuestra boda un sueño hecho realidad. La decoración fue espectacular y la atención de todo el equipo fue excepcional. ¡100% recomendados!',
    fecha: new Date('2026-06-15'),
    aprobado: true,
  },
  {
    nombreCliente: 'Carlos Rodríguez',
    tipoEvento: 'Corporativo',
    mensaje:
      'Contratamos sus servicios para nuestro evento corporativo anual. El catering fue de primera calidad y el mobiliario le dio un toque muy profesional al evento.',
    fecha: new Date('2026-07-20'),
    aprobado: true,
  },
  {
    nombreCliente: 'Ana Fernández',
    tipoEvento: 'Cumpleaños',
    mensaje:
      'Organizaron la fiesta de quinceañera de mi hija y quedó todo hermoso. Se encargaron de cada detalle con mucho profesionalismo y cariño.',
    fecha: new Date('2026-05-10'),
    aprobado: true,
  },
];

async function seed() {
  console.log('🌱 Iniciando carga de datos iniciales...\n');

  // Config General (coincide con Admin Panel)
  console.log('⚙️ Cargando configuración de general (configuracion/general)...');
  await db.collection('configuracion').doc('general').set(generalConfig);
  console.log('  ✅ Configuración guardada exitosamente.\n');

  // Servicios
  console.log('📋 Cargando servicios...');
  for (const servicio of servicios) {
    const ref = await db.collection('servicios').add(servicio);
    console.log(`  ✅ ${servicio.nombre} (${ref.id})`);
  }

  // Testimonios
  console.log('\n💬 Cargando testimonios de ejemplo...');
  for (const testimonio of testimonios) {
    const ref = await db.collection('testimonios').add(testimonio);
    console.log(`  ✅ ${testimonio.nombreCliente} - ${testimonio.tipoEvento} (${ref.id})`);
  }

  console.log('\n✨ Datos iniciales cargados exitosamente.');
  console.log('   Puedes verificarlos en el Emulator UI: http://localhost:4000');
}

seed().catch((error) => {
  console.error('❌ Error al cargar datos iniciales:', error);
  process.exit(1);
});
