import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { loadApiEnvConfig } from '../src/config/env.js';

describe('@pencel/api image remove-background route', () => {
  const testEnv = loadApiEnvConfig({
    PORT: '4000',
    HOST: '127.0.0.1',
    NODE_ENV: 'test',
    CORS_ORIGIN: 'http://localhost:5173',
  });
  const app = createApp(testEnv);

  it('rejects requests without imageBase64 with 400', async () => {
    const res = await request(app).post('/api/v1/image/remove-background').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('handles image removal request and returns success or fallback', async () => {
    // 1x1 transparent PNG data url
    const tinyPng =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const res = await request(app)
      .post('/api/v1/image/remove-background')
      .send({ imageBase64: tinyPng });

    expect(res.status).toBe(200);
    expect(typeof res.body.success).toBe('boolean');
  });
});
