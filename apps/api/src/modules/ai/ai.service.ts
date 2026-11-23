import type { ApiEnvConfig } from '../../config/env.js';
import { fetchPhotosFromProvider } from '../media/media.service.js';
import { synthesizeAutonomousLayout, synthesizeAutonomousVariations } from './ai.autonomous.js';
import { analyzeDesignBrief } from './ai.designKnowledge.js';
import { cleanJsonFromLlm, normalizeLlmResponse } from './ai.postprocess.js';
import { buildCreativeSystemPrompt, buildCreativeUserPrompt } from './ai.prompts.js';
import type {
  CanvasLayoutElementDto,
  GeneratedLayoutDto,
  GenerateLayoutOptions,
  GenerateLayoutResponse,
} from './ai.types.js';

export { synthesizeAutonomousLayout, synthesizeAutonomousVariations };

const SINGLE_CONCEPT_TIMEOUT_MS = 32_000;
const MULTI_VARIATION_TIMEOUT_MS = 48_000;
const GEMINI_MODEL_CACHE_TTL_MS = 10 * 60 * 1000;

const geminiModelListCache = new Map<string, { readonly ts: number; readonly models: string[] }>();

function getAttemptTimeoutMs(options: GenerateLayoutOptions): number {
  return (options.variationsCount ?? 1) > 1
    ? MULTI_VARIATION_TIMEOUT_MS
    : SINGLE_CONCEPT_TIMEOUT_MS;
}

function isAbortOrTimeoutError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const name = err.name.toLowerCase();
  const msg = err.message.toLowerCase();
  return (
    name === 'aborterror' ||
    name === 'timeouterror' ||
    msg.includes('aborted') ||
    msg.includes('timed out') ||
    msg.includes('timeout')
  );
}

function isEligibleGeminiTextModel(modelName: string): boolean {
  const lower = modelName.toLowerCase();
  if (!lower.startsWith('gemini-')) return false;
  const blockedFragments = [
    'tts',
    'image',
    'audio',
    'live',
    'embedding',
    'aqa',
    'vision',
    'robotics',
    'computer-use',
    'deep-research',
    'thinking',
    'exp-0',
    'learnlm',
  ];
  return !blockedFragments.some((frag) => lower.includes(frag));
}

export function buildGeminiGenerationConfig(
  targetModel: string,
  variationsCount: number,
  includeThinkingConfig: boolean,
): Record<string, unknown> {
  const config: Record<string, unknown> = {
    temperature: 0.7,
    responseMimeType: 'application/json',
    maxOutputTokens: variationsCount > 1 ? 8192 : 4096,
  };

  if (!includeThinkingConfig) {
    return config;
  }

  const lower = targetModel.toLowerCase();
  if (/gemini-3/i.test(lower)) {
    config.thinkingConfig = {
      thinkingLevel: lower.includes('pro') ? 'low' : 'minimal',
    };
  } else if (/gemini-2\.5/i.test(lower)) {
    // Gemini 2.5 Flash enables dynamic thinking by default (can take 40-90s); cap/disable for fast JSON
    config.thinkingConfig = {
      thinkingBudget: lower.includes('pro') ? 512 : 0,
    };
  }

  return config;
}

function extractGeminiJsonText(json: {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string; thought?: boolean }> };
  }>;
}): string | null {
  const parts = json.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) return null;

  const nonThoughtTexts = parts
    .filter((p) => !p.thought && typeof p.text === 'string' && p.text.trim().length > 0)
    .map((p) => p.text!);

  if (nonThoughtTexts.length > 0) {
    return nonThoughtTexts.join('\n');
  }

  const fallbackText = parts.find(
    (p) => typeof p.text === 'string' && p.text.trim().length > 0,
  )?.text;
  return fallbackText ?? null;
}

async function resolvePhotoUrlOnServer(
  query: string,
  env: ApiEnvConfig,
): Promise<string | undefined> {
  if (!query.trim() || env.nodeEnv === 'test') return undefined;
  if (!env.unsplashAccessKey && !env.pexelsApiKey) return undefined;

  try {
    const provider = env.unsplashAccessKey ? 'unsplash' : 'pexels';
    const raw = (await fetchPhotosFromProvider(
      { provider, query: query.trim(), page: 1, perPage: 4 },
      env,
    )) as Record<string, unknown>;

    if (provider === 'unsplash' && Array.isArray(raw.results)) {
      const first = raw.results[0] as { urls?: { regular?: string; full?: string } } | undefined;
      return first?.urls?.regular ?? first?.urls?.full;
    }

    if (provider === 'pexels' && Array.isArray(raw.photos)) {
      const first = raw.photos[0] as { src?: { large2x?: string; large?: string } } | undefined;
      return first?.src?.large2x ?? first?.src?.large;
    }
  } catch {
    // Graceful fallback: frontend media search will resolve imageQuery if server keys are unavailable
  }
  return undefined;
}

async function enrichLayoutsWithStockPhotos(
  layouts: readonly GeneratedLayoutDto[],
  env: ApiEnvConfig,
): Promise<GeneratedLayoutDto[]> {
  if (env.nodeEnv === 'test' || (!env.unsplashAccessKey && !env.pexelsApiKey)) {
    return [...layouts];
  }

  const queryCache = new Map<string, Promise<string | undefined>>();
  const getPhoto = (q: string): Promise<string | undefined> => {
    const key = q.trim().toLowerCase();
    const existing = queryCache.get(key);
    if (existing) return existing;
    const promise = resolvePhotoUrlOnServer(q, env);
    queryCache.set(key, promise);
    return promise;
  };

  return Promise.all(
    layouts.map(async (layout) => {
      const hasUnresolvedImages = layout.elements.some(
        (el) => el.type === 'image' && el.imageQuery && !el.imageUrl,
      );
      if (!hasUnresolvedImages) return layout;

      const enrichedElements: CanvasLayoutElementDto[] = await Promise.all(
        layout.elements.map(async (el) => {
          if (el.type === 'image' && el.imageQuery && !el.imageUrl) {
            const resolvedUrl = await getPhoto(el.imageQuery);
            if (resolvedUrl) {
              return { ...el, imageUrl: resolvedUrl };
            }
          }
          return el;
        }),
      );

      return { ...layout, elements: enrichedElements };
    }),
  );
}

/**
 * Generates one or more creative layouts using the configured external LLM provider
 * (Gemini, Anthropic Claude, OpenAI, or DeepSeek) or the local Parametric Creative Studio Engine.
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

  // Explicit local parametric studio mode or automated test environment
  if (options.useLocalEngine || env.nodeEnv === 'test') {
    const variations = synthesizeAutonomousVariations(options);
    const enriched = await enrichLayoutsWithStockPhotos(variations, env);
    return {
      success: true,
      layout: enriched[0],
      variations: enriched,
      source: 'autonomous',
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

  if (effectiveKey) {
    if (effectiveProvider === 'gemini') {
      try {
        const result = await callGeminiForLayout(options, effectiveKey, options.model);
        if (result && result.layouts.length > 0) {
          const enriched = await enrichLayoutsWithStockPhotos(result.layouts, env);
          return {
            success: true,
            layout: enriched[0],
            variations: enriched,
            source: 'llm',
            providerUsed: 'gemini',
            modelUsed: result.modelUsed,
          };
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
        const result = await callClaudeForLayout(options, effectiveKey, options.model);
        if (result && result.layouts.length > 0) {
          const enriched = await enrichLayoutsWithStockPhotos(result.layouts, env);
          return {
            success: true,
            layout: enriched[0],
            variations: enriched,
            source: 'llm',
            providerUsed: 'claude',
            modelUsed: result.modelUsed,
          };
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
        const result = await callOpenAiForLayout(options, effectiveKey, options.model);
        if (result && result.layouts.length > 0) {
          const enriched = await enrichLayoutsWithStockPhotos(result.layouts, env);
          return {
            success: true,
            layout: enriched[0],
            variations: enriched,
            source: 'llm',
            providerUsed: 'openai',
            modelUsed: result.modelUsed,
          };
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
        const result = await callDeepSeekForLayout(options, effectiveKey, options.model);
        if (result && result.layouts.length > 0) {
          const enriched = await enrichLayoutsWithStockPhotos(result.layouts, env);
          return {
            success: true,
            layout: enriched[0],
            variations: enriched,
            source: 'llm',
            providerUsed: 'deepseek',
            modelUsed: result.modelUsed,
          };
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

  return {
    success: false,
    error:
      'Chave de API não configurada. Insira sua chave do Google Gemini, Anthropic Claude, OpenAI ou DeepSeek em Configurações, ou ative o Estúdio Local.',
  };
}

interface ProviderCallResult {
  readonly layouts: GeneratedLayoutDto[];
  readonly modelUsed: string;
}

async function getAvailableGeminiModels(apiKey: string): Promise<string[]> {
  const cacheKey = `${apiKey.slice(0, 8)}:${apiKey.slice(-4)}`;
  const cached = geminiModelListCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < GEMINI_MODEL_CACHE_TTL_MS) {
    return cached.models;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      method: 'GET',
      headers: { 'x-goog-api-key': apiKey },
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      models?: Array<{ name?: string; supportedGenerationMethods?: string[] }>;
    };
    const models = (data.models || [])
      .filter((m) => m.name && m.supportedGenerationMethods?.includes('generateContent'))
      .map((m) => m.name!.replace(/^models\//, ''))
      .filter(isEligibleGeminiTextModel);

    geminiModelListCache.set(cacheKey, { ts: Date.now(), models });
    return models;
  } catch {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function callGeminiForLayout(
  options: GenerateLayoutOptions,
  apiKey: string,
  model = 'gemini-2.5-flash',
): Promise<ProviderCallResult | null> {
  const sanitizedRequested =
    model === 'gemini-3.8-flash' || model === 'gemini-1.5-flash'
      ? 'gemini-2.5-flash'
      : model || 'gemini-2.5-flash';

  const candidateQueue: string[] = Array.from(
    new Set([sanitizedRequested, 'gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash']),
  );

  const systemInstructions = buildCreativeSystemPrompt(options);
  const userQuery = buildCreativeUserPrompt(options);
  const variationsCount = options.mode === 'refine' ? 1 : (options.variationsCount ?? 1);
  const timeoutMs = getAttemptTimeoutMs(options);

  let discoveredModelsLoaded = false;
  let lastError: Error | null = null;
  let attempts = 0;
  const maxAttempts = 5;

  const invokeGeminiModel = async (
    targetModel: string,
    includeThinkingConfig: boolean,
    inlineSystemPrompt: boolean,
  ): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const requestBody: Record<string, unknown> = inlineSystemPrompt
      ? {
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstructions}\n\n${userQuery}` }],
            },
          ],
          generationConfig: buildGeminiGenerationConfig(
            targetModel,
            variationsCount,
            includeThinkingConfig,
          ),
        }
      : {
          systemInstruction: {
            parts: [{ text: systemInstructions }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userQuery }],
            },
          ],
          generationConfig: buildGeminiGenerationConfig(
            targetModel,
            variationsCount,
            includeThinkingConfig,
          ),
        };

    try {
      return await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        },
      );
    } finally {
      clearTimeout(timeoutId);
    }
  };

  for (let idx = 0; idx < candidateQueue.length && attempts < maxAttempts; idx++) {
    const targetModel = candidateQueue[idx]!;
    attempts += 1;

    try {
      let res = await invokeGeminiModel(targetModel, true, false);

      // If this model rejects thinkingConfig or systemInstruction with 400, retry same model cleanly
      if (res.status === 400) {
        const firstErrText = await res.text();
        const lowerFirstErr = firstErrText.toLowerCase();
        const isConfigRejection =
          lowerFirstErr.includes('thinking') ||
          lowerFirstErr.includes('systeminstruction') ||
          lowerFirstErr.includes('system_instruction') ||
          lowerFirstErr.includes('unknown name');

        if (isConfigRejection) {
          res = await invokeGeminiModel(targetModel, false, lowerFirstErr.includes('system'));
        } else {
          res = new Response(firstErrText, { status: 400, statusText: 'Bad Request' });
        }
      }

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
          // Ignore non-JSON error body
        }

        const lowerMsg = (parsedMsg + ' ' + errorText).toLowerCase();

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

        const isQuotaError =
          res.status === 429 ||
          errorCode === 'RESOURCE_EXHAUSTED' ||
          lowerMsg.includes('quota') ||
          lowerMsg.includes('rate limit');

        if (isQuotaError) {
          // Free tier quotas are separate per Gemini model; try next candidate before giving up
          lastError = new Error(
            'Limite de requisições ou cota gratuita excedida no Google Gemini. Tente novamente em alguns instantes ou troque o modelo em Configurações.',
          );
          continue;
        }

        const isModelIssue =
          res.status === 404 ||
          res.status === 400 ||
          res.status === 403 ||
          res.status === 503 ||
          lowerMsg.includes('not found') ||
          lowerMsg.includes('not supported') ||
          lowerMsg.includes('not available') ||
          lowerMsg.includes('deprecated') ||
          lowerMsg.includes('overloaded') ||
          lowerMsg.includes('permission_denied');

        if (isModelIssue) {
          lastError = new Error(
            parsedMsg || `Modelo "${targetModel}" indisponível para esta chave.`,
          );
          // Lazily discover available Flash models for this key only when a model fails
          if (!discoveredModelsLoaded) {
            discoveredModelsLoaded = true;
            const discovered = await getAvailableGeminiModels(apiKey);
            const flashFirst = [
              ...discovered.filter((m) => m.includes('flash-lite')),
              ...discovered.filter((m) => m.includes('flash') && !m.includes('flash-lite')),
            ].filter((m) => !candidateQueue.includes(m));
            if (flashFirst.length > 0) {
              candidateQueue.splice(idx + 1, 0, ...flashFirst.slice(0, 3));
            }
          }
          continue;
        }

        throw new Error(
          parsedMsg || `Google Gemini API (${res.status}): ${errorText.slice(0, 160)}`,
        );
      }

      const json = (await res.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string; thought?: boolean }> };
        }>;
      };
      const rawText = extractGeminiJsonText(json);
      if (!rawText) {
        lastError = new Error(
          `O modelo "${targetModel}" retornou uma resposta vazia. Tentando alternativa.`,
        );
        continue;
      }

      const cleaned = cleanJsonFromLlm(rawText);
      const parsed = JSON.parse(cleaned) as unknown;
      const blueprint = analyzeDesignBrief(options);
      const layouts = normalizeLlmResponse(
        parsed,
        options.dimensions,
        options.archetype,
        blueprint.summary,
      );
      if (layouts.length === 0) {
        lastError = new Error(
          `O modelo "${targetModel}" retornou um layout sem elementos válidos.`,
        );
        continue;
      }
      return { layouts, modelUsed: targetModel };
    } catch (err) {
      if (isAbortOrTimeoutError(err)) {
        lastError = new Error(
          `Tempo limite esgotado (${Math.round(timeoutMs / 1000)}s) ao aguardar o modelo "${targetModel}". Tente um prompt mais direto, use 1 conceito ou selecione Gemini 2.5 Flash-Lite.`,
        );
        continue;
      }

      if (err instanceof SyntaxError) {
        lastError = new Error(
          `Resposta JSON incompleta recebida de "${targetModel}". Tentando próximo modelo.`,
        );
        continue;
      }

      if (
        err instanceof Error &&
        (err.message.toLowerCase().includes('not found') ||
          err.message.toLowerCase().includes('not supported') ||
          err.message.toLowerCase().includes('indisponível') ||
          err.message.toLowerCase().includes('não disponível'))
      ) {
        lastError = err;
        continue;
      }
      throw err;
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
): Promise<ProviderCallResult | null> {
  const targetModel = model || 'gpt-4o-mini';
  const isReasoningModel = /^o[134]/i.test(targetModel);

  const systemInstructions = buildCreativeSystemPrompt(options);
  const userQuery = buildCreativeUserPrompt(options);
  const timeoutMs = getAttemptTimeoutMs(options);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const payload: Record<string, unknown> = {
      model: targetModel,
      messages: [
        { role: 'system', content: systemInstructions },
        { role: 'user', content: userQuery },
      ],
      response_format: { type: 'json_object' },
    };
    if (!isReasoningModel) {
      payload.temperature = 0.72;
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
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
          'Sua chave de API da OpenAI é inválida. Por favor, verifique a chave em Configurações.',
        );
      }
      if (res.status === 429) {
        throw new Error(
          'Limite de requisições ou saldo insuficiente na OpenAI. Verifique sua conta.',
        );
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
    const blueprint = analyzeDesignBrief(options);
    const layouts = normalizeLlmResponse(
      parsed,
      options.dimensions,
      options.archetype,
      blueprint.summary,
    );
    if (layouts.length === 0) return null;
    return { layouts, modelUsed: targetModel };
  } catch (err) {
    if (isAbortOrTimeoutError(err)) {
      throw new Error(
        `Tempo limite esgotado (${Math.round(timeoutMs / 1000)}s) ao aguardar a OpenAI (${targetModel}).`,
        { cause: err },
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callClaudeForLayout(
  options: GenerateLayoutOptions,
  apiKey: string,
  model = 'claude-3-7-sonnet-20250219',
): Promise<ProviderCallResult | null> {
  const candidateModels = Array.from(
    new Set([
      model || 'claude-sonnet-4-20250514',
      'claude-sonnet-4-20250514',
      'claude-3-7-sonnet-20250219',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
    ]),
  );

  const systemInstructions = buildCreativeSystemPrompt(options);
  const userQuery = buildCreativeUserPrompt(options);
  const timeoutMs = getAttemptTimeoutMs(options);

  let lastError: Error | null = null;

  for (const targetModel of candidateModels) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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
          max_tokens: 6144,
          system: systemInstructions,
          messages: [{ role: 'user', content: userQuery }],
          temperature: 0.72,
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
      const blueprint = analyzeDesignBrief(options);
      const layouts = normalizeLlmResponse(
        parsed,
        options.dimensions,
        options.archetype,
        blueprint.summary,
      );
      if (layouts.length === 0) return null;
      return { layouts, modelUsed: targetModel };
    } catch (err) {
      if (isAbortOrTimeoutError(err)) {
        lastError = new Error(
          `Tempo limite esgotado (${Math.round(timeoutMs / 1000)}s) ao aguardar o modelo Claude "${targetModel}".`,
        );
        continue;
      }
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
): Promise<ProviderCallResult | null> {
  const targetModel = model || 'deepseek-chat';
  const isReasoner = targetModel.includes('reasoner');

  const systemInstructions = buildCreativeSystemPrompt(options);
  const userQuery = buildCreativeUserPrompt(options);
  const timeoutMs = getAttemptTimeoutMs(options);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const payload: Record<string, unknown> = {
      model: targetModel,
      messages: [
        { role: 'system', content: systemInstructions },
        { role: 'user', content: userQuery },
      ],
    };

    // DeepSeek-R1 (reasoner) rejects temperature / json_object in strict mode; handle safely
    if (!isReasoner) {
      payload.response_format = { type: 'json_object' };
      payload.temperature = 0.72;
    }

    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
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
    const blueprint = analyzeDesignBrief(options);
    const layouts = normalizeLlmResponse(
      parsed,
      options.dimensions,
      options.archetype,
      blueprint.summary,
    );
    if (layouts.length === 0) return null;
    return { layouts, modelUsed: targetModel };
  } catch (err) {
    if (isAbortOrTimeoutError(err)) {
      throw new Error(
        `Tempo limite esgotado (${Math.round(timeoutMs / 1000)}s) ao aguardar o DeepSeek (${targetModel}).`,
        { cause: err },
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
