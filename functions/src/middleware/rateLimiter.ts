import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

export const publicRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 5, // 5 solicitudes por IP
  message: {
    error: 'Demasiadas solicitudes desde esta IP, por favor intenta de nuevo más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response, next, options) => {
    res.status(options.statusCode).json(options.message);
  }
});

export const contactRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 3, // 3 solicitudes por IP
  message: {
    error: 'Has enviado demasiados mensajes de contacto. Por favor intenta de nuevo en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response, next, options) => {
    res.status(options.statusCode).json(options.message);
  }
});
