import type { HealthCheckResponse } from '@pencel/shared-types';
import { Router } from 'express';
import type { ApiEnvConfig } from '../../config/env.js';

export function createHealthRouter(env: ApiEnvConfig): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    const payload: HealthCheckResponse = {
      status: 'ok',
      service: '@pencel/api',
      version: '0.1.0',
      environment: env.nodeEnv,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    };

    res.status(200).json(payload);
  });

  return router;
}
