import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { loadApiEnvConfig } from '../src/config/env.js';

describe('@pencel/api health and error handling', () => {
  const testEnv = loadApiEnvConfig({
    PORT: '4000',
    HOST: '127.0.0.1',
    NODE_ENV: 'test',
    CORS_ORIGIN: 'http://localhost:5173',
  });
  const app = createApp(testEnv);

  it('returns 200 OK with structured HealthCheckResponse on GET /api/v1/health', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'ok',
      service: '@pencel/api',
      version: '0.1.0',
      environment: 'test',
    });
    expect(typeof response.body.timestamp).toBe('string');
    expect(typeof response.body.uptimeSeconds).toBe('number');
  });

  it('returns 404 structured ApiErrorResponse on unknown routes', async () => {
    const response = await request(app).get('/api/v1/non-existent-route');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      status: 'error',
      code: 'ROUTE_NOT_FOUND',
      message: 'Route GET /api/v1/non-existent-route was not found on @pencel/api.',
    });
  });

  it('validates invalid PORT values in loadApiEnvConfig', () => {
    expect(() => loadApiEnvConfig({ PORT: '99999' })).toThrow(/Invalid PORT environment variable/);
  });
});
