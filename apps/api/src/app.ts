import cors from 'cors';
import express, { type Express } from 'express';
import { type ApiEnvConfig, loadApiEnvConfig } from './config/env.js';
import { centralizedErrorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { createHealthRouter } from './modules/health/health.routes.js';
import { createImageRouter } from './modules/image/image.routes.js';

/**
 * Creates and configures the Express application instance.
 * Extension points:
 * - `/api/v1/health` (Service health & readiness)
 * - `/api/v1/image/remove-background` (PhotoCraft AI background removal)
 */
export function createApp(customEnv?: ApiEnvConfig): Express {
  const env = customEnv ?? loadApiEnvConfig();
  const app = express();

  app.disable('x-powered-by');
  app.use(
    cors({
      origin: env.corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    }),
  );
  app.use(express.json({ limit: '25mb' }));

  app.use('/api/v1', createHealthRouter(env));
  app.use('/api/v1', createImageRouter());

  app.use(notFoundHandler);
  app.use(centralizedErrorHandler);

  return app;
}
