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
import { createAiRouter } from './modules/ai/ai.routes.js';

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
  const allowedOrigin = env.corsOrigin;
  app.use(
    cors({
      origin: (requestOrigin, callback) => {
        if (!requestOrigin || allowedOrigin === '*') {
          return callback(null, true);
        }
        const normalizedRequest = requestOrigin.replace(/^https?:\/\//, '').replace(/\/+$/, '');
        const normalizedAllowed = allowedOrigin.replace(/^https?:\/\//, '').replace(/\/+$/, '');
        if (requestOrigin === allowedOrigin || normalizedRequest === normalizedAllowed) {
          return callback(null, true);
        }
        callback(null, false);
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    }),
  );
  app.use(express.json({ limit: '15mb' }));

  const healthRouter = createHealthRouter(env);
  const imageRouter = createImageRouter(env, options?.cliRunner);
  const mediaRouter = createMediaRouter(env);
  const aiRouter = createAiRouter(env);

  // Canonical API v1 routes
  app.use('/api/v1', healthRouter);
  app.use('/api/v1', imageRouter);
  app.use('/api/v1', mediaRouter);
  app.use('/api/v1', aiRouter);

  // Fallback aliases for proxies or clients without /api/v1 prefix
  app.use('/api', healthRouter);
  app.use('/api', imageRouter);
  app.use('/api', mediaRouter);
  app.use('/api', aiRouter);

  app.use('/', healthRouter);
  app.use('/', imageRouter);
  app.use('/', mediaRouter);
  app.use('/', aiRouter);

  app.use(notFoundHandler);
  app.use(centralizedErrorHandler);

  return app;
}
