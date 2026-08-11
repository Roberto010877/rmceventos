/**
 * RMC EVENTOS — Cloud Functions
 *
 * Entry point para todas las Cloud Functions:
 * - API REST (Express) bajo /api/v1/
 * - Storage trigger para procesamiento de imágenes
 * - Firestore triggers para notificaciones
 */

import * as functions from 'firebase-functions';
import { app } from './api/app';

// ── API REST ──
// Todas las rutas de la API están bajo /api/v1/
export const api = functions.https.onRequest(app);

// ── Triggers ──
// Se exportarán aquí cuando se implementen en Fase 1
// export { onImageUpload } from './triggers/imageProcessing';
// export { onContactCreated } from './triggers/emailNotification';
