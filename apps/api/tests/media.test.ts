import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { loadApiEnvConfig } from '../src/config/env.js';

describe('@pencel/api media proxy, security headers & rate limiting', () => {
  const testEnv = loadApiEnvConfig({
    PORT: '4000',
    HOST: '127.0.0.1',
    NODE_ENV: 'test',
    CORS_ORIGIN: 'http://localhost:5173',
  });
  const app = createApp(testEnv);

  it('sets defensive security headers on responses', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  it('returns fallback empty list on /api/v1/media/photos when provider keys are unset', async () => {
    const res = await request(app).get('/api/v1/media/photos?provider=unsplash&query=nature');
    expect(res.status).toBe(200);
    expect(res.body.fallback).toBe(true);
    expect(res.body.items).toEqual([]);
  });

  it('returns fallback empty list on /api/v1/media/stickers when GIPHY_API_KEY is unset', async () => {
    const res = await request(app).get('/api/v1/media/stickers?query=sparkles');
    expect(res.status).toBe(200);
    expect(res.body.fallback).toBe(true);
    expect(res.body.items).toEqual([]);
  });

  it('rejects /api/v1/media/download without downloadLocation with 400', async () => {
    const res = await request(app).post('/api/v1/media/download').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('synthesizes a 5-color harmonic palette on /api/v1/media/palettes without insecure HTTP calls', async () => {
    const res = await request(app).post('/api/v1/media/palettes').send({ seedHex: '#0071E3' });
    expect(res.status).toBe(200);
    expect(res.body.colors).toHaveLength(5);
    expect(res.body.colors[0]).toBe('#0071E3');
    expect(res.body.result).toHaveLength(5);
  });

  it('enforces rate limiting with HTTP 429 when maxRequestsPerMinute is exceeded', async () => {
    const limitedApp = createApp(testEnv, { maxRequestsPerMinute: 2 });
    const r1 = await request(limitedApp).get('/api/v1/health');
    const r2 = await request(limitedApp).get('/api/v1/health');
    const r3 = await request(limitedApp).get('/api/v1/health');

    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(r3.status).toBe(429);
    expect(r3.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});
