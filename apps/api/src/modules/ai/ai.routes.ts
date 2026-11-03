import { Router } from 'express';
import { loadApiEnvConfig, type ApiEnvConfig } from '../../config/env.js';
import { generateLayoutWithAi } from './ai.service.js';
import type { GenerateLayoutOptions } from './ai.types.js';

export function createAiRouter(customEnv?: ApiEnvConfig): Router {
  const env = customEnv ?? loadApiEnvConfig();
  const router = Router();

  router.post('/ai/generate-layout', async (req, res) => {
    try {
      const body = req.body as Record<string, unknown> | undefined;
      const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';

      if (!prompt) {
        res.status(400).json({
          success: false,
          error: 'O campo "prompt" é obrigatório e deve ser uma string não vazia.',
        });
        return;
      }

      const style =
        typeof body?.style === 'string' &&
        ['minimal', 'bold', 'vibrant', 'elegant', 'dark', 'tech', 'promo'].includes(body.style)
          ? (body.style as GenerateLayoutOptions['style'])
          : undefined;

      let dimensions: { readonly width: number; readonly height: number } | undefined;
      if (
        body?.dimensions &&
        typeof body.dimensions === 'object' &&
        'width' in body.dimensions &&
        'height' in body.dimensions
      ) {
        const dimObj = body.dimensions as { width?: unknown; height?: unknown };
        const w = Number(dimObj.width);
        const h = Number(dimObj.height);
        if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
          dimensions = { width: Math.round(w), height: Math.round(h) };
        }
      }

      const apiKey = typeof body?.apiKey === 'string' ? body.apiKey.trim() : undefined;
      const provider =
        body?.provider === 'openai' ||
        body?.provider === 'gemini' ||
        body?.provider === 'claude' ||
        body?.provider === 'deepseek'
          ? (body.provider as GenerateLayoutOptions['provider'])
          : undefined;
      const model = typeof body?.model === 'string' ? body.model.trim() : undefined;

      const result = await generateLayoutWithAi(
        {
          prompt,
          ...(style ? { style } : {}),
          ...(dimensions ? { dimensions } : {}),
          ...(apiKey ? { apiKey } : {}),
          ...(provider ? { provider } : {}),
          ...(model ? { model } : {}),
        },
        env,
      );

      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({
        success: false,
        error:
          err instanceof Error ? err.message : 'Erro interno do servidor ao gerar layout com IA.',
      });
    }
  });

  return router;
}
