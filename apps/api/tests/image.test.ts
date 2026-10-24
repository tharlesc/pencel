import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { loadApiEnvConfig } from '../src/config/env.js';

const TINY_PNG_DATA_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

describe('@pencel/api image remove-background route', () => {
  const testEnv = loadApiEnvConfig({
    PORT: '4000',
    HOST: '127.0.0.1',
    NODE_ENV: 'test',
    CORS_ORIGIN: 'http://localhost:5173',
    MAX_IMAGE_BYTES: '512',
  });
  const app = createApp(testEnv);

  it('rejects requests without imageBase64 with 400', async () => {
    const res = await request(app).post('/api/v1/image/remove-background').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects unsupported MIME types with 400', async () => {
    const res = await request(app).post('/api/v1/image/remove-background').send({
      imageBase64: 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects payloads exceeding MAX_IMAGE_BYTES with 400', async () => {
    const oversized = Buffer.alloc(1024, 1).toString('base64');
    const res = await request(app)
      .post('/api/v1/image/remove-background')
      .send({ imageBase64: `data:image/png;base64,${oversized}` });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns fallback when PHOTOCRAFT_CLI_PATH is not configured', async () => {
    const res = await request(app)
      .post('/api/v1/image/remove-background')
      .send({ imageBase64: TINY_PNG_DATA_URI });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.fallback).toBe(true);
  });

  it('handles CLI timeout or error gracefully with fallback and cleans up temp files', async () => {
    const dummyCliPath = path.join(os.tmpdir(), `dummy_photocraft_${Date.now()}.cmd`);
    await fs.writeFile(dummyCliPath, '@echo off');

    try {
      const cliEnv = loadApiEnvConfig({
        PORT: '4000',
        HOST: '127.0.0.1',
        NODE_ENV: 'test',
        CORS_ORIGIN: 'http://localhost:5173',
        PHOTOCRAFT_CLI_PATH: dummyCliPath,
        PHOTOCRAFT_TIMEOUT_MS: '50',
      });

      let capturedInputPath = '';
      const timeoutApp = createApp(cliEnv, {
        cliRunner: async (_cli, args) => {
          capturedInputPath = args[1] ?? '';
          throw new Error('Command timed out after 50ms');
        },
      });

      const res = await request(timeoutApp)
        .post('/api/v1/image/remove-background')
        .send({ imageBase64: TINY_PNG_DATA_URI });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.fallback).toBe(true);

      // Verify temp file was cleaned up in finally
      expect(capturedInputPath.length).toBeGreaterThan(0);
      await expect(fs.access(capturedInputPath)).rejects.toThrow();
    } finally {
      await fs.unlink(dummyCliPath).catch(() => {});
    }
  });
});
