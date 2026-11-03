import type { ApiEnvConfig } from '../../config/env.js';
import type {
  CanvasLayoutElementDto,
  GeneratedLayoutDto,
  GenerateLayoutOptions,
  GenerateLayoutResponse,
} from './ai.types.js';

interface ColorPalette {
  readonly background: string;
  readonly cardBg: string;
  readonly accent: string;
  readonly accentHover: string;
  readonly highlight: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly textOnAccent: string;
  readonly border: string;
}

const PALETTES: Record<'tech' | 'promo' | 'minimal' | 'elegant' | 'vibrant', ColorPalette> = {
  tech: {
    background: '#0B0D13',
    cardBg: '#151922',
    accent: '#0A84FF',
    accentHover: '#0071E3',
    highlight: '#64D2FF',
    textPrimary: '#FBFBFD',
    textSecondary: '#8E8E93',
    textOnAccent: '#FFFFFF',
    border: '#2C2C2E',
  },
  promo: {
    background: '#121214',
    cardBg: '#1C1C1E',
    accent: '#FF3B30',
    accentHover: '#D70015',
    highlight: '#FFD60A',
    textPrimary: '#FFFFFF',
    textSecondary: '#AEAEC2',
    textOnAccent: '#FFFFFF',
    border: '#3A3A3C',
  },
  minimal: {
    background: '#F5F5F7',
    cardBg: '#FFFFFF',
    accent: '#1D1D1F',
    accentHover: '#000000',
    highlight: '#0071E3',
    textPrimary: '#1D1D1F',
    textSecondary: '#6E6E73',
    textOnAccent: '#FFFFFF',
    border: '#D2D2D7',
  },
  elegant: {
    background: '#16161D',
    cardBg: '#21212B',
    accent: '#D4AF37',
    accentHover: '#AA8825',
    highlight: '#F3E5AB',
    textPrimary: '#FBFBFD',
    textSecondary: '#98989D',
    textOnAccent: '#16161D',
    border: '#3A3A42',
  },
  vibrant: {
    background: '#0D0E15',
    cardBg: '#181A26',
    accent: '#BF5AF2',
    accentHover: '#AF52DE',
    highlight: '#30D158',
    textPrimary: '#FFFFFF',
    textSecondary: '#A1A1AA',
    textOnAccent: '#FFFFFF',
    border: '#33354A',
  },
};

function inferCategoryFromPrompt(
  prompt: string,
): 'tech' | 'promo' | 'minimal' | 'elegant' | 'vibrant' {
  const p = prompt.toLowerCase();
  if (
    p.includes('promo') ||
    p.includes('black friday') ||
    p.includes('desconto') ||
    p.includes('sale') ||
    p.includes('oferta') ||
    p.includes('off')
  ) {
    return 'promo';
  }
  if (
    p.includes('luxo') ||
    p.includes('elegante') ||
    p.includes('ouro') ||
    p.includes('joia') ||
    p.includes('imóve') ||
    p.includes('arquitet')
  ) {
    return 'elegant';
  }
  if (
    p.includes('clean') ||
    p.includes('minimal') ||
    p.includes('simples') ||
    p.includes('frase') ||
    p.includes('livro')
  ) {
    return 'minimal';
  }
  if (
    p.includes('festa') ||
    p.includes('show') ||
    p.includes('festival') ||
    p.includes('verão') ||
    p.includes('carnaval') ||
    p.includes('vibrante')
  ) {
    return 'vibrant';
  }
  return 'tech';
}

function extractHeadlineAndSubtitle(
  prompt: string,
  category: 'tech' | 'promo' | 'minimal' | 'elegant' | 'vibrant',
): { badge: string; headline: string; subtitle: string; cta: string } {
  const p = prompt.trim();
  const cleanPrompt = p.replace(/^(crie|gere|fazer|faça|quero|desenhe)\s+/i, '');

  switch (category) {
    case 'promo':
      return {
        badge: 'OFERTA ESPECIAL',
        headline: cleanPrompt.length > 5 ? cleanPrompt.toUpperCase() : 'SUPER DESCONTO EXCLUSIVO',
        subtitle: 'Aproveite até 50% OFF por tempo limitado. Estoque restrito!',
        cta: 'GARANTIR OFERTA',
      };
    case 'elegant':
      return {
        badge: 'EXCLUSIVIDADE & DESIGN',
        headline: cleanPrompt.length > 5 ? cleanPrompt : 'Elegância que Transcende o Tempo',
        subtitle: 'Uma experiência singular criada para os mais exigentes apreciadores.',
        cta: 'CONHECER COLEÇÃO',
      };
    case 'minimal':
      return {
        badge: 'DESIGN ESSENCIAL',
        headline: cleanPrompt.length > 5 ? cleanPrompt : 'Menos ruído, mais clareza.',
        subtitle: 'A harmonia perfeita entre forma, espaço em branco e propósito funcional.',
        cta: 'EXPLORAR MAIS',
      };
    case 'vibrant':
      return {
        badge: 'NOVA EXPERIÊNCIA',
        headline: cleanPrompt.length > 5 ? cleanPrompt.toUpperCase() : 'VIVA A INTENSIDADE',
        subtitle: 'Conecte-se com novas ideias, energia criativa e momentos inesquecíveis.',
        cta: 'PARTICIPAR AGORA',
      };
    case 'tech':
    default:
      return {
        badge: 'INOVAÇÃO & TECNOLOGIA',
        headline:
          cleanPrompt.length > 5 ? cleanPrompt : 'A Próxima Geração do Seu Fluxo de Trabalho',
        subtitle: 'Automatize tarefas, acelere sua criação gráfica e impulsione seus resultados.',
        cta: 'COMEÇAR AGORA',
      };
  }
}

function normalizeStyleCategory(
  style?: string,
  prompt = '',
): 'tech' | 'promo' | 'minimal' | 'elegant' | 'vibrant' {
  if (style === 'bold' || style === 'promo') return 'promo';
  if (style === 'dark' || style === 'tech') return 'tech';
  if (style === 'minimal') return 'minimal';
  if (style === 'elegant') return 'elegant';
  if (style === 'vibrant') return 'vibrant';
  return inferCategoryFromPrompt(prompt);
}

/**
 * Autonomous Design Intelligence engine:
 * Synthesizes coordinated typography, balanced geometry, and spatial hierarchy
 * strictly according to artboard dimensions and prompt context.
 */
export function synthesizeAutonomousLayout(options: GenerateLayoutOptions): GeneratedLayoutDto {
  const width = options.dimensions?.width ?? 1080;
  const height = options.dimensions?.height ?? 1080;

  const styleCategory = normalizeStyleCategory(options.style, options.prompt);
  const palette = PALETTES[styleCategory];
  const content = extractHeadlineAndSubtitle(options.prompt, styleCategory);

  const elements: CanvasLayoutElementDto[] = [];
  const centerX = Math.round(width / 2);

  // 1. Decorative geometric background accent (Glow or Floating Card)
  const isDark = palette.background !== '#F5F5F7' && palette.background !== '#FFFFFF';

  if (isDark) {
    // Subtle circular gradient glow behind the content
    const glowRadius = Math.round(Math.min(width, height) * 0.38);
    elements.push({
      id: 'bg-accent-glow',
      type: 'circle',
      name: 'Brilho Decorativo',
      left: Math.round(centerX - glowRadius),
      top: Math.round(height * 0.18 - glowRadius * 0.4),
      radius: glowRadius,
      fill: palette.accent,
      opacity: 0.14,
    });
  }

  // 2. Central Structural Frame / Container
  const cardW = Math.round(width * 0.88);
  const cardH = Math.round(height * 0.76);
  const cardLeft = Math.round(width * 0.06);
  const cardTop = Math.round(height * 0.12);

  elements.push({
    id: 'container-card',
    type: 'rect',
    name: 'Cartão Estrutural',
    left: cardLeft,
    top: cardTop,
    width: cardW,
    height: cardH,
    rx: 28,
    ry: 28,
    fill: palette.cardBg,
    stroke: palette.border,
    strokeWidth: 1.5,
    opacity: 0.94,
  });

  // 3. Overline Category Badge (Pill Shape + Text)
  const badgeTextW = Math.min(Math.round(cardW * 0.6), Math.max(180, content.badge.length * 11));
  const badgeH = 38;
  const badgeTop = cardTop + Math.round(height * 0.05);

  elements.push({
    id: 'badge-pill',
    type: 'rect',
    name: 'Pílula Badge',
    left: Math.round(centerX - badgeTextW / 2),
    top: badgeTop,
    width: badgeTextW,
    height: badgeH,
    rx: Math.round(badgeH / 2),
    ry: Math.round(badgeH / 2),
    fill: palette.accent,
    opacity: 0.18,
    stroke: palette.accent,
    strokeWidth: 1,
  });

  elements.push({
    id: 'badge-text',
    type: 'textbox',
    name: 'Texto Badge',
    left: Math.round(centerX - badgeTextW / 2),
    top: badgeTop + 9,
    width: badgeTextW,
    text: content.badge,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Inter',
    fill: isDark ? palette.highlight : palette.accent,
    textAlign: 'center',
  });

  // 4. Headline / Title
  const headlineW = Math.round(cardW * 0.84);
  const headlineLeft = Math.round(centerX - headlineW / 2);
  const headlineTop = badgeTop + badgeH + Math.round(height * 0.04);
  const headlineFontSize = Math.max(32, Math.min(68, Math.round(width * 0.058)));

  elements.push({
    id: 'title-headline',
    type: 'textbox',
    name: 'Título Principal',
    left: headlineLeft,
    top: headlineTop,
    width: headlineW,
    text: content.headline,
    fontSize: headlineFontSize,
    fontWeight: 900,
    fontFamily: 'Inter',
    fill: palette.textPrimary,
    textAlign: 'center',
  });

  // 5. Subtitle / Value Proposition
  const subtitleW = Math.round(cardW * 0.78);
  const subtitleLeft = Math.round(centerX - subtitleW / 2);
  const subtitleTop = headlineTop + Math.round(headlineFontSize * 2.2) + 16;
  const subtitleFontSize = Math.max(16, Math.min(26, Math.round(width * 0.024)));

  elements.push({
    id: 'subtitle-copy',
    type: 'textbox',
    name: 'Subtítulo',
    left: subtitleLeft,
    top: subtitleTop,
    width: subtitleW,
    text: content.subtitle,
    fontSize: subtitleFontSize,
    fontWeight: 500,
    fontFamily: 'Inter',
    fill: palette.textSecondary,
    textAlign: 'center',
  });

  // 6. Primary CTA Button (Pill Rect + Text)
  const ctaW = Math.round(Math.min(360, cardW * 0.65));
  const ctaH = 60;
  const ctaLeft = Math.round(centerX - ctaW / 2);
  const ctaTop = Math.min(cardTop + cardH - 110, subtitleTop + 140);

  elements.push({
    id: 'cta-btn-shape',
    type: 'rect',
    name: 'Botão CTA',
    left: ctaLeft,
    top: ctaTop,
    width: ctaW,
    height: ctaH,
    rx: 30,
    ry: 30,
    fill: palette.accent,
  });

  elements.push({
    id: 'cta-btn-text',
    type: 'textbox',
    name: 'Texto CTA',
    left: ctaLeft,
    top: ctaTop + 18,
    width: ctaW,
    text: content.cta,
    fontSize: 18,
    fontWeight: 700,
    fontFamily: 'Inter',
    fill: palette.textOnAccent,
    textAlign: 'center',
  });

  // 7. Footer Brand Note
  const footerTop = cardTop + cardH + Math.round(height * 0.025);
  elements.push({
    id: 'footer-brand',
    type: 'textbox',
    name: 'Rodapé Marca',
    left: Math.round(centerX - 160),
    top: footerTop,
    width: 320,
    text: 'PENCEL STUDIO • DESIGN AUTÔNOMO',
    fontSize: 11,
    fontWeight: 600,
    fontFamily: 'Inter',
    fill: isDark ? '#6E6E73' : '#86868B',
    textAlign: 'center',
  });

  return {
    title: content.headline.slice(0, 40),
    backgroundColor: palette.background,
    elements,
    explanation: `Layout sintetizado para o estilo "${styleCategory}" com paleta harmônica e hierarquia visual otimizada para ${width}×${height}px.`,
  };
}

/**
 * Attempts to generate a layout using an external LLM (Gemini or OpenAI)
 * if configured, or gracefully falls back to the autonomous synthesis engine.
 */
export async function generateLayoutWithAi(
  options: GenerateLayoutOptions,
  env: ApiEnvConfig,
): Promise<GenerateLayoutResponse> {
  const cleanPrompt = options.prompt?.trim();
  if (!cleanPrompt) {
    return {
      success: false,
      error: 'Prompt é obrigatório para gerar o layout com IA.',
    };
  }

  const effectiveProvider =
    options.provider ??
    (env.geminiApiKey
      ? 'gemini'
      : env.anthropicApiKey
        ? 'claude'
        : env.openaiApiKey
          ? 'openai'
          : env.deepseekApiKey
            ? 'deepseek'
            : 'gemini');
  const effectiveKey =
    options.apiKey ||
    (effectiveProvider === 'gemini'
      ? env.geminiApiKey
      : effectiveProvider === 'claude'
        ? env.anthropicApiKey
        : effectiveProvider === 'openai'
          ? env.openaiApiKey
          : env.deepseekApiKey);

  if (effectiveKey && env.nodeEnv !== 'test') {
    if (effectiveProvider === 'gemini') {
      try {
        const response = await callGeminiForLayout(options, effectiveKey, options.model);
        if (response) {
          return { success: true, layout: response };
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('Gemini AI generation error:', msg);
        return {
          success: false,
          error: `Falha ao gerar com o Google Gemini: ${msg}`,
        };
      }
      return {
        success: false,
        error:
          'Falha ao gerar com o Google Gemini. Verifique se sua chave está correta, ativa e com cota disponível.',
      };
    }

    if (effectiveProvider === 'claude') {
      try {
        const response = await callClaudeForLayout(options, effectiveKey, options.model);
        if (response) {
          return { success: true, layout: response };
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('Claude AI generation error:', msg);
        return {
          success: false,
          error: `Falha ao gerar com o Anthropic Claude: ${msg}`,
        };
      }
      return {
        success: false,
        error:
          'Falha ao gerar com o Anthropic Claude. Verifique se sua chave está correta e com créditos disponíveis.',
      };
    }

    if (effectiveProvider === 'openai') {
      try {
        const response = await callOpenAiForLayout(options, effectiveKey, options.model);
        if (response) {
          return { success: true, layout: response };
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('OpenAI generation error:', msg);
        return {
          success: false,
          error: `Falha ao gerar com o OpenAI: ${msg}`,
        };
      }
      return {
        success: false,
        error:
          'Falha ao gerar com o OpenAI. Verifique se sua chave está correta e com saldo de créditos.',
      };
    }

    if (effectiveProvider === 'deepseek') {
      try {
        const response = await callDeepSeekForLayout(options, effectiveKey, options.model);
        if (response) {
          return { success: true, layout: response };
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('DeepSeek generation error:', msg);
        return {
          success: false,
          error: `Falha ao gerar com o DeepSeek: ${msg}`,
        };
      }
      return {
        success: false,
        error:
          'Falha ao gerar com o DeepSeek. Verifique se sua chave está correta e com saldo de créditos.',
      };
    }
  }

  // Fallback in test mode for automated suite checks
  if (env.nodeEnv === 'test') {
    const layout = synthesizeAutonomousLayout(options);
    return {
      success: true,
      layout,
    };
  }

  return {
    success: false,
    error:
      'Chave de API não configurada. Por favor, insira sua chave do Google Gemini, Anthropic Claude, OpenAI ou DeepSeek em Configurações para que a IA crie seu design de forma autônoma.',
  };
}

function cleanJsonFromLlm(text: string): string {
  let cleaned = text.trim();
  cleaned = cleaned
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

function normalizeLlmLayout(
  raw: unknown,
  dimensions?: { width: number; height: number },
): GeneratedLayoutDto | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const defaultW = dimensions?.width ?? 1080;
  const _defaultH = dimensions?.height ?? 1080;

  const rawElements = Array.isArray(obj.elements)
    ? obj.elements
    : Array.isArray(obj.items)
      ? obj.items
      : Array.isArray(obj.components)
        ? obj.components
        : [];

  const elements: CanvasLayoutElementDto[] = [];
  for (let i = 0; i < rawElements.length; i++) {
    const el = rawElements[i];
    if (!el || typeof el !== 'object') continue;
    const item = el as Record<string, unknown>;

    const typeStr = String(item.type || '').toLowerCase();
    const type: 'rect' | 'circle' | 'triangle' | 'textbox' =
      typeStr === 'circle'
        ? 'circle'
        : typeStr === 'triangle'
          ? 'triangle'
          : typeStr === 'textbox' || typeStr === 'text'
            ? 'textbox'
            : 'rect';

    const id = typeof item.id === 'string' && item.id ? item.id : `ai-el-${i + 1}`;
    const name = typeof item.name === 'string' && item.name ? item.name : `Element ${i + 1}`;
    const left = Math.round(Number(item.left) || 0);
    const top = Math.round(Number(item.top) || 0);
    const width = Math.round(Number(item.width) || (type === 'textbox' ? defaultW * 0.7 : 200));
    const height = Math.round(Number(item.height) || (type === 'textbox' ? 60 : 200));

    const elementDto: CanvasLayoutElementDto = {
      id,
      type,
      name,
      left,
      top,
      width,
      height,
      fill: typeof item.fill === 'string' ? item.fill : '#FFFFFF',
      opacity: typeof item.opacity === 'number' ? Math.min(1, Math.max(0, item.opacity)) : 1,
      ...(item.stroke ? { stroke: String(item.stroke) } : {}),
      ...(item.strokeWidth ? { strokeWidth: Number(item.strokeWidth) } : {}),
      ...(type === 'circle' ? { radius: Math.round(Number(item.radius) || width / 2) } : {}),
      ...(type === 'rect' && item.rx
        ? { rx: Number(item.rx), ry: Number(item.ry || item.rx) }
        : {}),
      ...(type === 'textbox'
        ? {
            text: typeof item.text === 'string' ? item.text : 'Título',
            fontSize: Math.round(Number(item.fontSize) || 36),
            fontWeight:
              item.fontWeight === 'bold' || item.fontWeight === 700 || item.fontWeight === 900
                ? 'bold'
                : 'normal',
            fontFamily: typeof item.fontFamily === 'string' ? item.fontFamily : 'Inter',
            textAlign:
              item.textAlign === 'center' || item.textAlign === 'right' ? item.textAlign : 'left',
          }
        : {}),
    };

    elements.push(elementDto);
  }

  if (elements.length === 0) return null;

  const bgColor =
    typeof obj.backgroundColor === 'string'
      ? obj.backgroundColor
      : typeof obj.background === 'string'
        ? obj.background
        : '#121214';

  return {
    title: typeof obj.title === 'string' ? obj.title.slice(0, 80) : 'Design Autônomo',
    backgroundColor: bgColor,
    explanation:
      typeof obj.explanation === 'string'
        ? obj.explanation
        : 'Layout criado de forma autônoma pela inteligência artificial.',
    elements,
  };
}

async function getAvailableGeminiModels(apiKey: string): Promise<string[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: 'GET',
        signal: controller.signal,
      },
    );
    clearTimeout(timeoutId);
    if (!res.ok) return [];
    const data = (await res.json()) as {
      models?: Array<{ name?: string; supportedGenerationMethods?: string[] }>;
    };
    return (data.models || [])
      .filter((m) => m.name && m.supportedGenerationMethods?.includes('generateContent'))
      .map((m) => m.name!.replace(/^models\//, ''));
  } catch {
    return [];
  }
}

async function callGeminiForLayout(
  options: GenerateLayoutOptions,
  apiKey: string,
  model = 'gemini-2.5-flash',
): Promise<GeneratedLayoutDto | null> {
  const width = options.dimensions?.width ?? 1080;
  const height = options.dimensions?.height ?? 1080;

  // 1. Discover models supported by this specific user API key
  const availableModels = await getAvailableGeminiModels(apiKey);

  // 2. Build prioritized candidate models
  const candidateModels: string[] = [];

  const sanitizedRequested =
    model === 'gemini-3.8-flash' || model === 'gemini-1.5-flash'
      ? 'gemini-2.5-flash'
      : model || 'gemini-2.5-flash';

  if (availableModels.includes(sanitizedRequested)) {
    candidateModels.push(sanitizedRequested);
  }

  // Add available flash models first
  for (const m of availableModels) {
    if (m.includes('flash') && !candidateModels.includes(m)) {
      candidateModels.push(m);
    }
  }

  // Add remaining available models
  for (const m of availableModels) {
    if (!candidateModels.includes(m)) {
      candidateModels.push(m);
    }
  }

  // Fallbacks if ListModels returned empty or blocked
  const defaultFallbacks = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash',
  ];
  for (const fb of defaultFallbacks) {
    if (!candidateModels.includes(fb)) {
      candidateModels.push(fb);
    }
  }

  const systemInstructions = `Você é um diretor de arte e engenheiro gráfico sênior no Pencel Studio.
Crie um layout visual completo e profissional para um artboard de ${width}x${height}px.
Retorne EXCLUSIVAMENTE um objeto JSON válido (sem tags markdown ou crases) com a seguinte estrutura:
{
  "title": string,
  "backgroundColor": "#hex",
  "explanation": string,
  "elements": [
    {
      "id": string,
      "type": "rect" | "circle" | "triangle" | "textbox",
      "name": string,
      "left": number,
      "top": number,
      "width": number,
      "height": number,
      "radius": number,
      "rx": number,
      "ry": number,
      "fill": "#hex",
      "stroke": "#hex",
      "strokeWidth": number,
      "opacity": number,
      "text": string,
      "fontSize": number,
      "fontWeight": "bold" | "normal" | 400 | 700 | 900,
      "textAlign": "left" | "center" | "right"
    }
  ]
}`;

  const userQuery = `Prompt: "${options.prompt}". Estilo: "${options.style ?? 'automático'}". Dimensões: ${width}x${height}px.`;

  let lastError: Error | null = null;

  for (const targetModel of candidateModels) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 28000);

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemInstructions}\n\n${userQuery}` }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              responseMimeType: 'application/json',
            },
          }),
          signal: controller.signal,
        },
      );

      if (!res.ok) {
        const errorText = await res.text();
        let parsedMsg = '';
        let errorCode = '';
        try {
          const errorJson = JSON.parse(errorText) as {
            error?: { message?: string; status?: string; code?: number };
          };
          parsedMsg = errorJson?.error?.message ?? '';
          errorCode = errorJson?.error?.status ?? '';
        } catch {
          // Ignore
        }

        const lowerMsg = (parsedMsg + ' ' + errorText).toLowerCase();

        // 1. Invalid API Key -> throw clear error
        const isFatalKeyError =
          res.status === 401 ||
          errorCode === 'UNAUTHENTICATED' ||
          lowerMsg.includes('api key not valid') ||
          lowerMsg.includes('api_key_invalid');

        if (isFatalKeyError) {
          throw new Error(
            'Sua chave de API do Google Gemini é inválida. Por favor, verifique a chave em Configurações.',
          );
        }

        // 2. Quota exceeded -> throw clear error
        const isQuotaError =
          res.status === 429 ||
          errorCode === 'RESOURCE_EXHAUSTED' ||
          lowerMsg.includes('quota') ||
          lowerMsg.includes('rate limit');

        if (isQuotaError) {
          throw new Error(
            'Limite de requisições ou cota gratuita excedida no Google Gemini. Tente novamente em alguns instantes.',
          );
        }

        // 3. Model issue (not found, unsupported, not available, deprecated, permission denied)
        const isModelIssue =
          res.status === 404 ||
          res.status === 400 ||
          res.status === 403 ||
          lowerMsg.includes('not found') ||
          lowerMsg.includes('not supported') ||
          lowerMsg.includes('not available') ||
          lowerMsg.includes('deprecated') ||
          lowerMsg.includes('permission_denied');

        if (isModelIssue) {
          lastError = new Error(
            parsedMsg || `Modelo "${targetModel}" não disponível para esta chave.`,
          );
          continue;
        }

        // Non-model operational error - throw immediately
        throw new Error(
          parsedMsg || `Google Gemini API (${res.status}): ${errorText.slice(0, 160)}`,
        );
      }

      const json = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) return null;

      const cleaned = cleanJsonFromLlm(rawText);
      const parsed = JSON.parse(cleaned) as unknown;
      return normalizeLlmLayout(parsed, options.dimensions);
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.toLowerCase().includes('not found') ||
          err.message.toLowerCase().includes('not supported') ||
          err.message.toLowerCase().includes('não disponível'))
      ) {
        lastError = err;
        continue;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  if (lastError) {
    throw lastError;
  }
  return null;
}

async function callOpenAiForLayout(
  options: GenerateLayoutOptions,
  apiKey: string,
  model = 'gpt-4o-mini',
): Promise<GeneratedLayoutDto | null> {
  const width = options.dimensions?.width ?? 1080;
  const height = options.dimensions?.height ?? 1080;
  const targetModel = model || 'gpt-4o-mini';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 28000);

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: targetModel,
        messages: [
          {
            role: 'system',
            content: `Você é um diretor de arte e engenheiro gráfico sênior no Pencel Studio.
Crie um layout visual completo e profissional para um artboard de ${width}x${height}px.
Retorne um objeto JSON com title, backgroundColor, explanation e elements (rect, circle, triangle, textbox).`,
          },
          {
            role: 'user',
            content: `Prompt: "${options.prompt}". Estilo: "${options.style ?? 'automático'}".`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorText = await res.text();
      let parsedMsg = '';
      try {
        const errorJson = JSON.parse(errorText) as { error?: { message?: string } };
        parsedMsg = errorJson?.error?.message ?? '';
      } catch {
        // Ignore
      }
      throw new Error(parsedMsg || `OpenAI API (${res.status}): ${errorText.slice(0, 160)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const rawContent = json.choices?.[0]?.message?.content;
    if (!rawContent) return null;

    const cleaned = cleanJsonFromLlm(rawContent);
    const parsed = JSON.parse(cleaned) as unknown;
    return normalizeLlmLayout(parsed, options.dimensions);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callClaudeForLayout(
  options: GenerateLayoutOptions,
  apiKey: string,
  model = 'claude-3-7-sonnet-20250219',
): Promise<GeneratedLayoutDto | null> {
  const width = options.dimensions?.width ?? 1080;
  const height = options.dimensions?.height ?? 1080;

  const candidateModels = [
    model || 'claude-3-7-sonnet-20250219',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
  ];

  const systemInstructions = `Você é um diretor de arte e engenheiro gráfico sênior no Pencel Studio.
Crie um layout visual completo e profissional para um artboard de ${width}x${height}px.
Retorne EXCLUSIVAMENTE um objeto JSON válido (sem tags markdown, crases ou texto explicativo fora do JSON) com a seguinte estrutura:
{
  "title": string,
  "backgroundColor": "#hex",
  "explanation": string,
  "elements": [
    {
      "id": string,
      "type": "rect" | "circle" | "triangle" | "textbox",
      "name": string,
      "left": number,
      "top": number,
      "width": number,
      "height": number,
      "radius": number,
      "rx": number,
      "ry": number,
      "fill": "#hex",
      "stroke": "#hex",
      "strokeWidth": number,
      "opacity": number,
      "text": string,
      "fontSize": number,
      "fontWeight": "bold" | "normal" | 400 | 700 | 900,
      "textAlign": "left" | "center" | "right"
    }
  ]
}`;

  const userQuery = `Prompt: "${options.prompt}". Estilo: "${options.style ?? 'automático'}". Dimensões: ${width}x${height}px.`;

  let lastError: Error | null = null;

  for (const targetModel of candidateModels) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 28000);

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: targetModel,
          max_tokens: 4096,
          system: systemInstructions,
          messages: [
            {
              role: 'user',
              content: userQuery,
            },
          ],
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text();
        let parsedMsg = '';
        let errorType = '';
        try {
          const errorJson = JSON.parse(errorText) as {
            error?: { message?: string; type?: string };
          };
          parsedMsg = errorJson?.error?.message ?? '';
          errorType = errorJson?.error?.type ?? '';
        } catch {
          // Ignore
        }

        const lowerMsg = (parsedMsg + ' ' + errorText).toLowerCase();

        if (res.status === 401 || errorType === 'authentication_error') {
          throw new Error(
            'Sua chave de API da Anthropic Claude é inválida. Por favor, verifique a chave em Configurações.',
          );
        }

        if (res.status === 429 || errorType === 'rate_limit_error' || lowerMsg.includes('credit')) {
          throw new Error(
            'Limite de requisições ou créditos insuficientes na Anthropic Claude. Verifique sua conta no console Anthropic.',
          );
        }

        const isModelIssue =
          res.status === 404 ||
          res.status === 400 ||
          errorType === 'not_found_error' ||
          lowerMsg.includes('not found') ||
          lowerMsg.includes('model');

        if (isModelIssue) {
          lastError = new Error(
            parsedMsg || `Modelo Claude "${targetModel}" não disponível para esta chave.`,
          );
          continue;
        }

        throw new Error(
          parsedMsg || `Anthropic Claude API (${res.status}): ${errorText.slice(0, 160)}`,
        );
      }

      const json = (await res.json()) as {
        content?: Array<{ type?: string; text?: string }>;
      };
      const rawText = json.content?.find((c) => c.type === 'text')?.text ?? json.content?.[0]?.text;
      if (!rawText) return null;

      const cleaned = cleanJsonFromLlm(rawText);
      const parsed = JSON.parse(cleaned) as unknown;
      return normalizeLlmLayout(parsed, options.dimensions);
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.toLowerCase().includes('not found') ||
          err.message.toLowerCase().includes('não disponível'))
      ) {
        lastError = err;
        continue;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  if (lastError) throw lastError;
  return null;
}

async function callDeepSeekForLayout(
  options: GenerateLayoutOptions,
  apiKey: string,
  model = 'deepseek-chat',
): Promise<GeneratedLayoutDto | null> {
  const width = options.dimensions?.width ?? 1080;
  const height = options.dimensions?.height ?? 1080;
  const targetModel = model || 'deepseek-chat';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 28000);

  const systemInstructions = `Você é um diretor de arte e engenheiro gráfico sênior no Pencel Studio.
Crie um layout visual completo e profissional para um artboard de ${width}x${height}px.
Retorne EXCLUSIVAMENTE um objeto JSON com title, backgroundColor, explanation e elements (rect, circle, triangle, textbox).`;

  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: targetModel,
        messages: [
          {
            role: 'system',
            content: systemInstructions,
          },
          {
            role: 'user',
            content: `Prompt: "${options.prompt}". Estilo: "${options.style ?? 'automático'}". Dimensões: ${width}x${height}px.`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorText = await res.text();
      let parsedMsg = '';
      try {
        const errorJson = JSON.parse(errorText) as { error?: { message?: string } };
        parsedMsg = errorJson?.error?.message ?? '';
      } catch {
        // Ignore
      }

      if (res.status === 401) {
        throw new Error(
          'Sua chave de API do DeepSeek é inválida. Por favor, verifique a chave em Configurações.',
        );
      }
      if (res.status === 402 || res.status === 429) {
        throw new Error(
          'Saldo insuficiente ou limite de requisições excedido no DeepSeek. Verifique sua conta.',
        );
      }
      throw new Error(parsedMsg || `DeepSeek API (${res.status}): ${errorText.slice(0, 160)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const rawContent = json.choices?.[0]?.message?.content;
    if (!rawContent) return null;

    const cleaned = cleanJsonFromLlm(rawContent);
    const parsed = JSON.parse(cleaned) as unknown;
    return normalizeLlmLayout(parsed, options.dimensions);
  } finally {
    clearTimeout(timeoutId);
  }
}
