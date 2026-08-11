/**
 * RMC EVENTOS — Health Check Endpoint
 *
 * GET /api/v1/health
 * Devuelve el estado del servicio, versión y uptime.
 */

import { Router } from 'express';

const healthRouter = Router();

const startTime = Date.now();

healthRouter.get('/', (_req, res) => {
  const uptimeMs = Date.now() - startTime;
  const uptimeSeconds = Math.floor(uptimeMs / 1000);

  res.status(200).json({
    status: 'ok',
    service: 'rmc-eventos-api',
    version: '1.0.0',
    uptime: `${uptimeSeconds}s`,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
  });
});

export { healthRouter };
