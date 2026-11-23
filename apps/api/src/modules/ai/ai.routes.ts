import { Router } from 'express';
import { loadApiEnvConfig, type ApiEnvConfig } from '../../config/env.js';
import { generateLayoutWithAi } from './ai.service.js';
import type {
  CreativeBriefInput,
  CreativePieceType,
  GeneratedLayoutDto,
  GenerateLayoutOptions,
  LayoutCompositionArchetype,
  LayoutGenerationMode,
  LayoutStyleTheme,
} from './ai.types.js';

const VALID_STYLES = new Set<LayoutStyleTheme>([
  'minimal',
  'bold',
  'vibrant',
  'elegant',
  'dark',
  'tech',
  'promo',
  'editorial',
  'organic',
]);

const VALID_ARCHETYPES = new Set<LayoutCompositionArchetype>([
  'auto',
  'poster-impact',
  'swiss-editorial',
  'carousel-cover',
  'product-spotlight',
  'photo-overlay',
  'editorial-split',
  'bold-typo',
  'framed-card',
  'hero-bento',
]);

const VALID_PIECE_TYPES = new Set<CreativePieceType>([
  'auto',
  'social-post',
  'carousel-slide',
  'story-poster',
  'promo-flyer',
  'editorial-quote',
  'product-showcase',
  'web-banner',
]);

function parseBrief(raw: unknown): CreativeBriefInput | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const obj = raw as Record<string, unknown>;
  const headline = typeof obj.headline === 'string' ? obj.headline.trim().slice(0, 140) : undefined;
  const ctaText = typeof obj.ctaText === 'string' ? obj.ctaText.trim().slice(0, 60) : undefined;
  const brandName =
    typeof obj.brandName === 'string' ? obj.brandName.trim().slice(0, 60) : undefined;
  const brandColor =
    typeof obj.brandColor === 'string' && /^#[0-9a-fA-F]{3,6}$/.test(obj.brandColor.trim())
      ? obj.brandColor.trim()
      : undefined;
  const includeImagery = typeof obj.includeImagery === 'boolean' ? obj.includeImagery : undefined;
  const language =
    obj.language === 'en' || obj.language === 'pt' || obj.language === 'es'
      ? obj.language
      : undefined;

  if (
    !headline &&
    !ctaText &&
    !brandName &&
    !brandColor &&
    includeImagery === undefined &&
    !language
  ) {
    return undefined;
  }

  return {
    ...(headline ? { headline } : {}),
    ...(ctaText ? { ctaText } : {}),
    ...(brandName ? { brandName } : {}),
    ...(brandColor ? { brandColor } : {}),
    ...(includeImagery !== undefined ? { includeImagery } : {}),
    ...(language ? { language } : {}),
  };
}

function parseCurrentLayout(raw: unknown): GeneratedLayoutDto | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.backgroundColor !== 'string' || !Array.isArray(obj.elements)) {
    return undefined;
  }
  return obj as unknown as GeneratedLayoutDto;
}

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
        typeof body?.style === 'string' && VALID_STYLES.has(body.style as LayoutStyleTheme)
          ? (body.style as LayoutStyleTheme)
          : undefined;

      const archetype =
        typeof body?.archetype === 'string' &&
        VALID_ARCHETYPES.has(body.archetype as LayoutCompositionArchetype)
          ? (body.archetype as LayoutCompositionArchetype)
          : undefined;

      const pieceType =
        typeof body?.pieceType === 'string' &&
        VALID_PIECE_TYPES.has(body.pieceType as CreativePieceType)
          ? (body.pieceType as CreativePieceType)
          : undefined;

      const mode: LayoutGenerationMode | undefined =
        body?.mode === 'refine' ? 'refine' : body?.mode === 'create' ? 'create' : undefined;

      const rawCount = Number(body?.variationsCount);
      const variationsCount: 1 | 2 | 3 | undefined =
        rawCount === 2 ? 2 : rawCount === 3 ? 3 : rawCount === 1 ? 1 : undefined;

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
          dimensions = {
            width: Math.min(8000, Math.round(w)),
            height: Math.min(8000, Math.round(h)),
          };
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
      const useLocalEngine = body?.useLocalEngine === true ? true : undefined;
      const brief = parseBrief(body?.brief);
      const currentLayout = parseCurrentLayout(body?.currentLayout);

      const result = await generateLayoutWithAi(
        {
          prompt,
          ...(style ? { style } : {}),
          ...(archetype ? { archetype } : {}),
          ...(pieceType ? { pieceType } : {}),
          ...(mode ? { mode } : {}),
          ...(variationsCount ? { variationsCount } : {}),
          ...(brief ? { brief } : {}),
          ...(currentLayout ? { currentLayout } : {}),
          ...(dimensions ? { dimensions } : {}),
          ...(apiKey ? { apiKey } : {}),
          ...(provider ? { provider } : {}),
          ...(model ? { model } : {}),
          ...(useLocalEngine ? { useLocalEngine } : {}),
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
