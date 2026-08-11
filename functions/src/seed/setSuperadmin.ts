/**
 * RMC EVENTOS — Script para asignar Custom Claims de Superadmin
 *
 * Ejecutar una sola vez para configurar al primer superadmin.
 * Uso: npx ts-node src/seed/setSuperadmin.ts
 *
 * IMPORTANTE: El usuario debe existir primero en Firebase Authentication.
 */

import { auth, db } from '../lib/firebase';

const SUPERADMIN_EMAIL = 'melgar.robertocarlos@gmail.com';

async function setSuperadmin() {
  console.log(`🔑 Configurando superadmin: ${SUPERADMIN_EMAIL}\n`);

  try {
    // Obtener usuario por email
    const userRecord = await auth.getUserByEmail(SUPERADMIN_EMAIL);
    console.log(`  📧 Usuario encontrado: ${userRecord.uid}`);

    // Asignar custom claims con rol de superadmin
    await auth.setCustomUserClaims(userRecord.uid, { rol: 'superadmin' });
    console.log('  ✅ Custom claims asignados: { rol: "superadmin" }');

    // Crear/actualizar documento en la colección usuarios
    await db.collection('usuarios').doc(userRecord.uid).set(
      {
        email: SUPERADMIN_EMAIL,
        nombre: userRecord.displayName || 'Administrador',
        rol: 'superadmin',
        fechaAlta: new Date(),
      },
      { merge: true }
    );
    console.log('  ✅ Documento de usuario creado en Firestore');

    console.log('\n✨ Superadmin configurado exitosamente.');
    console.log('   El usuario debe cerrar sesión y volver a iniciar para que los claims tomen efecto.');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setSuperadmin();
