import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { loadApiEnvConfig } from '../src/config/env.js';
import { synthesizeAutonomousLayout } from '../src/modules/ai/ai.service.js';

describe('@pencel/api AI layout generator', () => {
  const testEnv = loadApiEnvConfig({
    PORT: '4000',
    HOST: '127.0.0.1',
    NODE_ENV: 'test',
    CORS_ORIGIN: 'http://localhost:5173',
  });
  const app = createApp(testEnv);

  it('rejects POST /api/v1/ai/generate-layout when prompt is missing or empty', async () => {
    const res = await request(app).post('/api/v1/ai/generate-layout').send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('prompt');
  });

  it('generates an autonomous layout for promo prompts', async () => {
    const res = await request(app)
      .post('/api/v1/ai/generate-layout')
      .send({
        prompt: 'Super Black Friday com 50% de desconto em todo o site',
        style: 'bold',
        dimensions: { width: 1080, height: 1080 },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.layout).toBeDefined();

    const layout = res.body.layout;
    expect(typeof layout.backgroundColor).toBe('string');
    expect(Array.isArray(layout.elements)).toBe(true);
    expect(layout.elements.length).toBeGreaterThanOrEqual(4);

    // Verify elements contain both text and shapes
    const hasText = layout.elements.some((el: { type: string }) => el.type === 'textbox');
    const hasShape = layout.elements.some(
      (el: { type: string }) => el.type === 'rect' || el.type === 'circle',
    );
    expect(hasText).toBe(true);
    expect(hasShape).toBe(true);
  });

  it('generates an autonomous layout for tech prompts with proper scaling', async () => {
    const layout = synthesizeAutonomousLayout({
      prompt: 'Lançamento de app de inteligência artificial',
      style: 'tech',
      dimensions: { width: 1920, height: 1080 },
    });

    expect(layout.elements.length).toBeGreaterThanOrEqual(5);
    expect(layout.backgroundColor).toBe('#0B0D13');

    // Title should be scaled proportionally
    const title = layout.elements.find((el) => el.name === 'Título Principal');
    expect(title).toBeDefined();
    expect(title?.fontSize).toBeGreaterThanOrEqual(40);
  });

  it('handles minimal style synthesis correctly', () => {
    const layout = synthesizeAutonomousLayout({
      prompt: 'Frase de design minimalista com tipografia suíça',
      style: 'minimal',
      dimensions: { width: 1080, height: 1080 },
    });

    expect(layout.backgroundColor).toBe('#F5F5F7');
    const badge = layout.elements.find((el) => el.name === 'Texto Badge');
    expect(badge).toBeDefined();
  });

  it('accepts and passes through user BYOK options (apiKey, provider, model)', async () => {
    const res = await request(app)
      .post('/api/v1/ai/generate-layout')
      .send({
        prompt: 'Banner de oferta tecnológica',
        style: 'tech',
        apiKey: 'AIzaSyMockUserProvidedKey',
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        dimensions: { width: 1080, height: 1080 },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.layout).toBeDefined();
  });

  it('accepts and passes through Anthropic Claude and DeepSeek provider options', async () => {
    const claudeRes = await request(app)
      .post('/api/v1/ai/generate-layout')
      .send({
        prompt: 'Design elegante para restaurante de luxo',
        style: 'elegant',
        apiKey: 'sk-ant-mock-key-12345',
        provider: 'claude',
        model: 'claude-3-7-sonnet-20250219',
        dimensions: { width: 1080, height: 1080 },
      });

    expect(claudeRes.status).toBe(200);
    expect(claudeRes.body.success).toBe(true);
    expect(claudeRes.body.layout).toBeDefined();

    const deepseekRes = await request(app)
      .post('/api/v1/ai/generate-layout')
      .send({
        prompt: 'Flyer promocional vibrante',
        style: 'vibrant',
        apiKey: 'sk-deepseek-mock-key-12345',
        provider: 'deepseek',
        model: 'deepseek-chat',
        dimensions: { width: 1080, height: 1080 },
      });

    expect(deepseekRes.status).toBe(200);
    expect(deepseekRes.body.success).toBe(true);
    expect(deepseekRes.body.layout).toBeDefined();
  });
});
