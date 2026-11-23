import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { loadApiEnvConfig } from '../src/config/env.js';
import { analyzeDesignBrief } from '../src/modules/ai/ai.designKnowledge.js';
import {
  calculateContrastRatio,
  cleanJsonFromLlm,
  normalizeLlmResponse,
} from '../src/modules/ai/ai.postprocess.js';
import {
  buildCreativeSystemPrompt,
  buildCreativeUserPrompt,
} from '../src/modules/ai/ai.prompts.js';
import {
  buildGeminiGenerationConfig,
  callGeminiForLayout,
  synthesizeAutonomousLayout,
  synthesizeAutonomousVariations,
} from '../src/modules/ai/ai.service.js';

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
      (el: { type: string }) => el.type === 'rect' || el.type === 'circle' || el.type === 'polygon',
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
    expect(layout.backgroundGradient?.stops.length).toBeGreaterThanOrEqual(2);

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

  it('generates 3 genuinely distinct variations with brief overrides via HTTP endpoint', async () => {
    const res = await request(app)
      .post('/api/v1/ai/generate-layout')
      .send({
        prompt: 'Specialty coffee launch campaign',
        style: 'editorial',
        variationsCount: 3,
        useLocalEngine: true,
        dimensions: { width: 1080, height: 1350 },
        brief: {
          headline: 'ROASTED AT DAWN',
          ctaText: 'ORDER TASTING BOX',
          brandName: '@ATELIER.ROAST',
          brandColor: '#D9534F',
          includeImagery: true,
          language: 'en',
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.source).toBe('autonomous');
    expect(Array.isArray(res.body.variations)).toBe(true);
    expect(res.body.variations).toHaveLength(3);

    const archetypes = new Set(res.body.variations.map((v: { archetype?: string }) => v.archetype));
    expect(archetypes.size).toBe(3);

    const first = res.body.variations[0];
    const headlineEl = first.elements.find(
      (el: { text?: string }) => el.text === 'ROASTED AT DAWN',
    );
    const ctaEl = first.elements.find((el: { text?: string }) => el.text === 'ORDER TASTING BOX');
    const hasImageEl = first.elements.some((el: { type: string }) => el.type === 'image');
    expect(headlineEl).toBeDefined();
    expect(ctaEl).toBeDefined();
    expect(hasImageEl).toBe(true);
  });

  it('supports iterative refinement mode preserving existing elements while applying adjustments', async () => {
    const initial = synthesizeAutonomousLayout({
      prompt: 'Lançamento de curso de fotografia',
      style: 'minimal',
      dimensions: { width: 1080, height: 1080 },
    });

    const res = await request(app)
      .post('/api/v1/ai/generate-layout')
      .send({
        prompt: 'Deixe o visual escuro e aumente o título principal',
        mode: 'refine',
        useLocalEngine: true,
        currentLayout: initial,
        dimensions: { width: 1080, height: 1080 },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.layout.backgroundColor).toBe('#0B0D13');

    const initialTitle = initial.elements.find((el) => el.name === 'Título Principal');
    const refinedTitle = res.body.layout.elements.find(
      (el: { name: string }) => el.name === 'Título Principal',
    );
    expect(refinedTitle.fontSize).toBeGreaterThan(initialTitle?.fontSize ?? 0);
  });

  it('post-processes raw LLM JSON: repairs trailing commas, enforces WCAG contrast, and resolves text collisions', () => {
    const messyLlmText =
      'Here is your layout:\n```json\n' +
      JSON.stringify({
        title: 'Contrast & Overlap Test',
        backgroundColor: '#111318',
        backgroundGradient: {
          type: 'linear',
          angle: 135,
          stops: [
            { offset: 0, color: '#111318' },
            { offset: 1, color: '#1E2433' },
          ],
        },
        elements: [
          {
            id: 'h1',
            type: 'textbox',
            name: 'Headline',
            left: 80,
            top: 120,
            width: 800,
            text: 'A Bold Headline With Terrible Dark Fill That Must Be Repaired',
            fontSize: 64,
            fontWeight: 800,
            fontFamily: 'Space Grotesk',
            fill: '#181A20',
            lineHeight: 1.1,
          },
          {
            id: 'sub',
            type: 'textbox',
            name: 'Subtitle',
            left: 80,
            top: 150,
            width: 760,
            text: 'Subtitle intentionally colliding vertically with headline',
            fontSize: 24,
            fontWeight: 500,
            fill: '#1A1C22',
          },
          {
            id: 'seal',
            type: 'polygon',
            name: 'Promo Star',
            left: 820,
            top: 60,
            width: 140,
            height: 140,
            sides: 8,
            isStar: true,
            fill: '#FF3B30',
            angle: -12,
          },
        ],
      }).replace(/\]\}/, ',]}') +
      '\n```';

    const cleaned = cleanJsonFromLlm(messyLlmText);
    const parsed = JSON.parse(cleaned) as unknown;
    const layouts = normalizeLlmResponse(parsed, { width: 1080, height: 1080 });

    expect(layouts).toHaveLength(1);
    const layout = layouts[0]!;
    const h1 = layout.elements.find((e) => e.id === 'h1')!;
    const sub = layout.elements.find((e) => e.id === 'sub')!;
    const seal = layout.elements.find((e) => e.id === 'seal')!;

    // WCAG contrast auto-repaired against #111318 background
    expect(calculateContrastRatio(h1.fill!, '#111318')).toBeGreaterThanOrEqual(4.5);
    expect(calculateContrastRatio(sub.fill!, '#111318')).toBeGreaterThanOrEqual(4.5);

    // Numeric fontWeight 800 preserved (not flattened to 'bold'/'normal')
    expect(h1.fontWeight).toBe(800);

    // Vertical collision resolved: subtitle nudged below headline
    expect(sub.top).toBeGreaterThan(h1.top + 80);

    // Star polygon metadata preserved
    expect(seal.type).toBe('polygon');
    expect(seal.isStar).toBe(true);
    expect(seal.angle).toBe(-12);
    expect(layout.palette?.length).toBeGreaterThanOrEqual(2);
    expect(layout.fontsUsed).toContain('Space Grotesk');
  });

  it('builds unified art-direction prompts with format, brief, variations, and refine context', () => {
    const baseVariations = synthesizeAutonomousVariations({
      prompt: 'Editorial coffee menu',
      style: 'organic',
      variationsCount: 2,
      dimensions: { width: 1080, height: 1920 },
    });
    expect(baseVariations).toHaveLength(2);

    const sysPrompt = buildCreativeSystemPrompt({
      prompt: 'Vertical story ad for skincare',
      style: 'organic',
      archetype: 'photo-overlay',
      variationsCount: 3,
      dimensions: { width: 1080, height: 1920 },
      brief: { includeImagery: true },
    });
    expect(sysPrompt).toContain('Vertical Story / Reel');
    expect(sysPrompt).toContain('"variations"');
    expect(sysPrompt).toContain('type: "image"');

    const userPrompt = buildCreativeUserPrompt({
      prompt: 'Make the CTA greener',
      mode: 'refine',
      currentLayout: baseVariations[0],
      brief: { headline: 'PURE MATCHA', brandName: '@KOTO' },
    });
    expect(userPrompt).toContain('REFINEMENT MODE');
    expect(userPrompt).toContain('PURE MATCHA');
    expect(userPrompt).toContain('@KOTO');
  });

  describe('Gemini resilience (thinkingConfig, AbortError fallback, thought parts)', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('configures thinkingBudget: 0 for gemini-2.5-flash and thinkingLevel for gemini-3 models', () => {
      const flash25 = buildGeminiGenerationConfig('gemini-2.5-flash', 1, true);
      expect(flash25.thinkingConfig).toEqual({ thinkingBudget: 0 });

      const pro25 = buildGeminiGenerationConfig('gemini-2.5-pro', 1, true);
      expect(pro25.thinkingConfig).toEqual({ thinkingBudget: 512 });

      const flash3 = buildGeminiGenerationConfig('gemini-3.5-flash', 1, true);
      expect(flash3.thinkingConfig).toEqual({ thinkingLevel: 'minimal' });

      const flash20 = buildGeminiGenerationConfig('gemini-2.0-flash', 1, true);
      expect(flash20.thinkingConfig).toBeUndefined();
    });

    it('falls back to gemini-2.5-flash-lite when primary model aborts/times out and skips thought parts', async () => {
      const mockLayoutJson = JSON.stringify({
        title: 'Recovered Creative',
        backgroundColor: '#0B0D13',
        explanation: 'Generated via fast fallback.',
        elements: [
          {
            id: 't1',
            type: 'textbox',
            name: 'Headline',
            left: 80,
            top: 120,
            width: 800,
            text: 'FAST RECOVERY',
            fontSize: 64,
            fill: '#FFFFFF',
          },
        ],
      });

      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockRejectedValueOnce(new DOMException('This operation was aborted', 'AbortError'))
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              candidates: [
                {
                  content: {
                    parts: [
                      { thought: true, text: 'Hidden reasoning summary...' },
                      { text: mockLayoutJson },
                    ],
                  },
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );

      const res = await callGeminiForLayout(
        { prompt: 'Banner tech moderno', dimensions: { width: 1080, height: 1080 } },
        'AIzaSyMockKey123456',
        'gemini-2.5-flash',
      );

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(String(fetchSpy.mock.calls[0]?.[0])).toContain('gemini-2.5-flash:generateContent');
      expect(String(fetchSpy.mock.calls[1]?.[0])).toContain(
        'gemini-2.5-flash-lite:generateContent',
      );
      expect(res?.modelUsed).toBe('gemini-2.5-flash-lite');
      expect(res?.layouts[0]?.title).toBe('Recovered Creative');
    });

    it('retries same model without thinkingConfig if Gemini rejects thinkingConfig with HTTP 400', async () => {
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              error: { message: 'Unknown name "thinkingConfig" at generation_config' },
            }),
            { status: 400 },
          ),
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              candidates: [
                {
                  content: {
                    parts: [
                      {
                        text: JSON.stringify({
                          title: 'Retry Clean',
                          backgroundColor: '#121214',
                          explanation: 'Retried without thinkingConfig.',
                          elements: [
                            {
                              id: 'h1',
                              type: 'textbox',
                              name: 'Headline',
                              left: 80,
                              top: 100,
                              width: 700,
                              text: 'CLEAN RETRY',
                              fontSize: 56,
                              fill: '#FFFFFF',
                            },
                          ],
                        }),
                      },
                    ],
                  },
                },
              ],
            }),
            { status: 200 },
          ),
        );

      const res = await callGeminiForLayout(
        { prompt: 'Promo poster', dimensions: { width: 1080, height: 1080 } },
        'AIzaSyMockKey123456',
        'gemini-2.5-flash',
      );

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      const secondBody = JSON.parse(String(fetchSpy.mock.calls[1]?.[1]?.body)) as {
        generationConfig?: { thinkingConfig?: unknown };
      };
      expect(secondBody.generationConfig?.thinkingConfig).toBeUndefined();
      expect(res?.layouts[0]?.title).toBe('Retry Clean');
    });
  });

  describe('Graphic Design Knowledge Engine & Social-First Compositions', () => {
    it('maps prompts to graphic domains, piece types, Swiss grid coordinates, and Story safe zones', () => {
      const foodBlueprint = analyzeDesignBrief({
        prompt: 'Post para Instagram de hambúrguer smash artesanal na brasa com cheddar',
        dimensions: { width: 1080, height: 1080 },
      });
      expect(foodBlueprint.domain).toBe('food-gastronomy');
      expect(foodBlueprint.pieceType).toBe('product-showcase');
      expect(foodBlueprint.isWebInterface).toBe(false);
      expect(foodBlueprint.grammar.defaultArchetype).toBe('product-spotlight');
      expect(foodBlueprint.grid.columns).toBe(4);
      expect(foodBlueprint.grid.columnX).toHaveLength(4);

      const carouselBlueprint = analyzeDesignBrief({
        prompt: 'Carrossel 5 dicas de tipografia suíça para designers',
        dimensions: { width: 1080, height: 1350 },
      });
      expect(carouselBlueprint.domain).toBe('education-carousel');
      expect(carouselBlueprint.pieceType).toBe('carousel-slide');
      expect(carouselBlueprint.grammar.defaultArchetype).toBe('carousel-cover');

      const storyBlueprint = analyzeDesignBrief({
        prompt: 'Cartaz cultural para show de jazz sábado 20h',
        dimensions: { width: 1080, height: 1920 },
      });
      expect(storyBlueprint.domain).toBe('culture-event');
      expect(storyBlueprint.grid.isStoryVertical).toBe(true);
      expect(storyBlueprint.grid.safeTop).toBeGreaterThanOrEqual(200);
      expect(storyBlueprint.grid.safeBottom).toBeLessThanOrEqual(1650);

      const webBlueprint = analyzeDesignBrief({
        prompt: 'Hero de site SaaS para gestão financeira',
        pieceType: 'web-banner',
        dimensions: { width: 1920, height: 1080 },
      });
      expect(webBlueprint.isWebInterface).toBe(true);
      expect(webBlueprint.pieceType).toBe('web-banner');
    });

    it('enforces anti-website-UI graphic design rules for social posts and switches to Web Banner mode when requested', () => {
      const socialPrompt = buildCreativeSystemPrompt({
        prompt: 'Post de pizza artesanal de fermentação natural',
        dimensions: { width: 1080, height: 1080 },
      });
      expect(socialPrompt).toContain('STRICT SOCIAL MEDIA GRAPHIC DESIGN DISCIPLINE');
      expect(socialPrompt).toContain('MATHEMATICAL SWISS GRID');
      expect(socialPrompt).toContain('Triple Typographic Dimension');
      expect(socialPrompt).toContain('textBackgroundColor');

      const webPrompt = buildCreativeSystemPrompt({
        prompt: 'Banner para cabeçalho de site',
        pieceType: 'web-banner',
        dimensions: { width: 1200, height: 400 },
      });
      expect(webPrompt).toContain('WEB BANNER MODE');
      expect(webPrompt).not.toContain('STRICT SOCIAL MEDIA GRAPHIC DESIGN DISCIPLINE');
    });

    it('synthesizes social-first archetypes without floating SaaS cards or HTML pill buttons and returns artDirection', async () => {
      const carouselRes = await request(app)
        .post('/api/v1/ai/generate-layout')
        .send({
          prompt: 'Carrossel 5 dicas de grid suíço e espaço negativo',
          pieceType: 'carousel-slide',
          useLocalEngine: true,
          dimensions: { width: 1080, height: 1350 },
        });

      expect(carouselRes.status).toBe(200);
      expect(carouselRes.body.success).toBe(true);
      const carousel = carouselRes.body.layout;
      expect(carousel.archetype).toBe('carousel-cover');
      expect(carousel.artDirection?.pieceType).toBe('carousel-slide');
      expect(carousel.artDirection?.gridSystem).toContain('Grid');
      expect(
        carousel.elements.some((el: { name: string }) => el.name === 'Cartão Estrutural'),
      ).toBe(false);
      expect(carousel.elements.some((el: { name: string }) => el.name === 'Botão CTA')).toBe(false);
      expect(
        carousel.elements.some((el: { textBackgroundColor?: string }) =>
          Boolean(el.textBackgroundColor),
        ),
      ).toBe(true);

      const burger = synthesizeAutonomousLayout({
        prompt: 'Post de hambúrguer artesanal smash duplo R$ 34,90',
        dimensions: { width: 1080, height: 1080 },
      });
      expect(burger.archetype).toBe('product-spotlight');
      expect(burger.artDirection?.domain).toContain('Gastronomia');
      expect(burger.elements.some((el) => el.type === 'image')).toBe(true);
      expect(burger.elements.some((el) => el.name === 'Linha de Ênfase Visível')).toBe(true);
      expect(burger.elements.some((el) => el.text === 'R$ 34,90')).toBe(true);
    });

    it('preserves hollow outlined poster text, textBackgroundColor, watermarks, and Story 9:16 safe zones in post-processing', () => {
      const blueprint = analyzeDesignBrief({
        prompt: 'Story cartaz festival de música',
        dimensions: { width: 1080, height: 1920 },
      });

      const layouts = normalizeLlmResponse(
        {
          title: 'Festival Poster',
          archetype: 'poster-impact',
          backgroundColor: '#0E0F1D',
          explanation: 'Swiss poster typography with hollow display accent.',
          elements: [
            {
              id: 'wm',
              type: 'textbox',
              name: 'Watermark',
              left: 300,
              top: 20,
              width: 720,
              text: '26',
              fontSize: 300,
              fill: '#FFFFFF',
              opacity: 0.08,
            },
            {
              id: 'top-tag',
              type: 'textbox',
              name: 'Top Label',
              left: 80,
              top: 30,
              width: 500,
              text: 'EDIÇÃO 2026',
              fontSize: 18,
              fill: '#FFFFFF',
            },
            {
              id: 'hollow',
              type: 'textbox',
              name: 'Hollow Display',
              left: 80,
              top: 520,
              width: 820,
              text: 'NOITE JAZZ',
              fontSize: 110,
              fontWeight: 900,
              fill: 'transparent',
              stroke: '#C056F7',
              strokeWidth: 3,
            },
            {
              id: 'marker',
              type: 'textbox',
              name: 'Marker Tag',
              left: 80,
              top: 760,
              width: 480,
              text: ' ENTRADA GRATUITA ',
              fontSize: 22,
              fontWeight: 700,
              fill: '#111318',
              textBackgroundColor: '#FFD60A',
            },
          ],
        },
        { width: 1080, height: 1920 },
        'poster-impact',
        blueprint.summary,
      );

      expect(layouts).toHaveLength(1);
      const layout = layouts[0]!;
      expect(layout.artDirection?.domain).toBe(blueprint.summary.domain);

      const wm = layout.elements.find((e) => e.id === 'wm')!;
      const topTag = layout.elements.find((e) => e.id === 'top-tag')!;
      const hollow = layout.elements.find((e) => e.id === 'hollow')!;
      const marker = layout.elements.find((e) => e.id === 'marker')!;

      // Low-opacity watermark left untouched
      expect(wm.top).toBe(20);
      expect(wm.opacity).toBe(0.08);

      // Readable top tag clamped down into 9:16 mobile Story safe zone (>= 9.5% of 1920 = 182px)
      expect(topTag.top).toBeGreaterThanOrEqual(180);

      // Hollow outlined text kept transparent fill + stroke
      expect(hollow.fill).toBe('transparent');
      expect(hollow.stroke).toBe('#C056F7');
      expect(hollow.strokeWidth).toBe(3);

      // Marker text kept textBackgroundColor and dark ink contrast against yellow highlight
      expect(marker.textBackgroundColor).toBe('#FFD60A');
      expect(calculateContrastRatio(marker.fill!, '#FFD60A')).toBeGreaterThanOrEqual(4.5);
    });
  });
});
