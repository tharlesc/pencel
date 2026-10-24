import cors from 'cors';
import express, { type Express } from 'express';
import { type ApiEnvConfig, loadApiEnvConfig } from './config/env.js';
import { centralizedErrorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { createRateLimiterMiddleware } from './middleware/rateLimiter.js';
import { createSecurityHeadersMiddleware } from './middleware/securityHeaders.js';
import { createHealthRouter } from './modules/health/health.routes.js';
import { createImageRouter } from './modules/image/image.routes.js';
import type { CliRunner } from './modules/image/image.service.js';
import { createMediaRouter } from './modules/media/media.routes.js';

export interface CreateAppOptions {
  readonly cliRunner?: CliRunner;
  readonly maxRequestsPerMinute?: number;
}

/**
 * Creates and configures the Express application instance.
 * Extension points:
 * - `/api/v1/health` (Service health & readiness)
 * - `/api/v1/image/remove-background` (PhotoCraft AI background removal)
 * - `/api/v1/media/*` (Server-side proxy for Unsplash, Pexels, GIPHY, and Color Palettes)
 */
export function createApp(customEnv?: ApiEnvConfig, options?: CreateAppOptions): Express {
  const env = customEnv ?? loadApiEnvConfig();
  const app = express();

  app.disable('x-powered-by');
  app.use(createSecurityHeadersMiddleware());
  app.use(
    createRateLimiterMiddleware({
      windowMs: 60_000,
      maxRequests: options?.maxRequestsPerMinute ?? 120,
    }),
  );
  app.use(
    cors({
      origin: env.corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    }),
  );
  app.use(express.json({ limit: '15mb' }));

  app.use('/api/v1', createHealthRouter(env));
  app.use('/api/v1', createImageRouter(env, options?.cliRunner));
  app.use('/api/v1', createMediaRouter(env));

  app.use(notFoundHandler);
  app.use(centralizedErrorHandler);

  return app;
}
