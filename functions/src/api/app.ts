/**
 * RMC EVENTOS — Express App
 *
 * Configuración central de Express con todos los middlewares globales
 * y el montaje de las rutas de la API v1.
 */

import express from 'express';
import cors from 'cors';
import { healthRouter } from './health';

const app = express();

// ── Middlewares globales ──

// CORS: solo dominios propios (se ampliarán con los dominios reales)
const allowedOrigins = [
  'http://localhost:5173',   // Vite dev server (landing)
  'http://localhost:5174',   // Vite dev server (admin)
  'http://localhost:5000',   // Firebase Hosting emulator
  // En producción se agregarán:
  // 'https://rmc-eventos-bo.web.app',
  // 'https://rmceventos.com',
  // 'https://admin.rmceventos.com',
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (ej. curl, Postman, Cloud Functions)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} no permitido por CORS`));
    }
  },
  credentials: true,
}));

// Parseo de JSON y URL-encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Rutas API v1 ──
app.use('/api/v1/health', healthRouter);

// Las demás rutas se agregarán en la Fase 1:
// app.use('/api/v1/fotos', fotosRouter);
// app.use('/api/v1/servicios', serviciosRouter);
// app.use('/api/v1/eventos', eventosRouter);
// app.use('/api/v1/testimonios', testimoniosRouter);
// app.use('/api/v1/contacto', contactoRouter);
// app.use('/api/v1/usuarios', usuariosRouter);

// ── Manejo de errores global ──
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error no manejado:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

export { app };
