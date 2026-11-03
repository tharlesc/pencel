import type { AiProvider } from './aiConfigService.js';
import { httpClient } from './httpClient.js';

export interface CanvasLayoutElementDto {
  readonly id: string;
  readonly type: 'rect' | 'circle' | 'triangle' | 'textbox';
  readonly left: number;
  readonly top: number;
  readonly width?: number;
  readonly height?: number;
  readonly radius?: number;
  readonly rx?: number;
  readonly ry?: number;
  readonly fill?: string;
  readonly stroke?: string;
  readonly strokeWidth?: number;
  readonly opacity?: number;
  readonly text?: string;
  readonly fontSize?: number;
  readonly fontFamily?: string;
  readonly fontWeight?: 'normal' | 'bold' | 400 | 500 | 600 | 700 | 800 | 900;
  readonly textAlign?: 'left' | 'center' | 'right';
  readonly name: string;
}

export interface GeneratedLayoutDto {
  readonly title: string;
  readonly backgroundColor: string;
  readonly elements: readonly CanvasLayoutElementDto[];
  readonly explanation: string;
}

export type LayoutStyleTheme =
  'tech' | 'promo' | 'minimal' | 'elegant' | 'vibrant' | 'bold' | 'dark';

export interface GenerateLayoutOptions {
  readonly prompt: string;
  readonly style?: LayoutStyleTheme;
  readonly dimensions?: { readonly width: number; readonly height: number };
  readonly apiKey?: string;
  readonly provider?: AiProvider;
  readonly model?: string;
}

interface GenerateLayoutApiResponse {
  readonly success: boolean;
  readonly layout?: GeneratedLayoutDto;
  readonly error?: string;
}

export async function requestAiLayoutGeneration(
  options: GenerateLayoutOptions,
  signal?: AbortSignal,
): Promise<
  | { readonly ok: true; readonly layout: GeneratedLayoutDto }
  | { readonly ok: false; readonly error: string }
> {
  try {
    const res = await httpClient.post<GenerateLayoutApiResponse, GenerateLayoutOptions>(
      '/ai/generate-layout',
      options,
      {
        timeoutMs: 35000,
        signal,
      },
    );

    if (res.ok && res.data.success && res.data.layout) {
      return { ok: true, layout: res.data.layout };
    }

    if (res.ok && res.data.error) {
      return { ok: false, error: res.data.error };
    }

    if (!res.ok) {
      return {
        ok: false,
        error: res.error.message ?? 'Falha na comunicação com o serviço de IA.',
      };
    }

    return {
      ok: false,
      error: res.data.error ?? 'Não foi possível gerar o layout solicitado.',
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Erro inesperado na geração com IA.',
    };
  }
}
