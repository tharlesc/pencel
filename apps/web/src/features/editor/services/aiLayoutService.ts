import type {
  AiProvider,
  ArtDirectionSummaryDto,
  CanvasLayoutElementDto,
  CanvasLayoutElementType,
  CreativeBriefInput,
  CreativePieceType,
  GeneratedLayoutDto,
  GenerateLayoutOptions,
  GenerateLayoutResponse,
  LayoutCompositionArchetype,
  LayoutGenerationMode,
  LayoutGradientSpec,
  LayoutGradientStop,
  LayoutShadowSpec,
  LayoutStyleTheme,
} from '@pencel/shared-types';
import { httpClient } from './httpClient.js';

export type {
  AiProvider,
  ArtDirectionSummaryDto,
  CanvasLayoutElementDto,
  CanvasLayoutElementType,
  CreativeBriefInput,
  CreativePieceType,
  GeneratedLayoutDto,
  GenerateLayoutOptions,
  GenerateLayoutResponse,
  LayoutCompositionArchetype,
  LayoutGenerationMode,
  LayoutGradientSpec,
  LayoutGradientStop,
  LayoutShadowSpec,
  LayoutStyleTheme,
};

export type AiLayoutGenerationResult =
  | {
      readonly ok: true;
      readonly layout: GeneratedLayoutDto;
      readonly variations?: readonly GeneratedLayoutDto[];
      readonly source?: 'llm' | 'autonomous';
      readonly providerUsed?: string;
      readonly modelUsed?: string;
    }
  | { readonly ok: false; readonly error: string; readonly aborted?: boolean };

export async function requestAiLayoutGeneration(
  options: GenerateLayoutOptions,
  signal?: AbortSignal,
): Promise<AiLayoutGenerationResult> {
  try {
    const res = await httpClient.post<GenerateLayoutResponse, GenerateLayoutOptions>(
      '/ai/generate-layout',
      options,
      {
        timeoutMs: 95_000,
        signal,
      },
    );

    if (res.ok && res.data.success && res.data.layout) {
      const variations =
        Array.isArray(res.data.variations) && res.data.variations.length > 0
          ? res.data.variations
          : [res.data.layout];
      return {
        ok: true,
        layout: res.data.layout,
        variations,
        ...(res.data.source ? { source: res.data.source } : {}),
        ...(res.data.providerUsed ? { providerUsed: res.data.providerUsed } : {}),
        ...(res.data.modelUsed ? { modelUsed: res.data.modelUsed } : {}),
      };
    }

    if (res.ok && res.data.error) {
      return { ok: false, error: res.data.error };
    }

    if (!res.ok) {
      const aborted = signal?.aborted === true || res.error.code === 'ABORTED';
      return {
        ok: false,
        error: res.error.message ?? 'Falha na comunicação com o serviço de IA.',
        ...(aborted ? { aborted: true } : {}),
      };
    }

    return {
      ok: false,
      error: res.data.error ?? 'Não foi possível gerar o layout solicitado.',
    };
  } catch (err) {
    const aborted = signal?.aborted === true || (err instanceof Error && err.name === 'AbortError');
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Erro inesperado na geração com IA.',
      ...(aborted ? { aborted: true } : {}),
    };
  }
}
