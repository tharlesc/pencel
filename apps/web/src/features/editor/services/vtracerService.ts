/**
 * In-browser WebAssembly VTracer Vectorization Service.
 *
 * Implements client-side, zero-cloud bitmap-to-SVG vectorization (Image Trace)
 * using WebAssembly running in an isolated Web Worker.
 * Adheres strictly to ADR 0029, AGENTS.md, and repository performance standards.
 */

import type {
  ConvertOptions,
  VTracerOptions,
  VTracerProgress,
  VTracerProgressHandler,
} from 'vtracer-browser';

export type { VTracerOptions, VTracerProgress, VTracerProgressHandler };

export type VectorizePresetKey = 'logo' | 'silhouette' | 'high-fidelity' | 'geometric';

export interface VectorizePresetDefinition {
  readonly key: VectorizePresetKey;
  readonly label: string;
  readonly description: string;
  readonly iconName: string;
  readonly options: VTracerOptions;
}

export const VECTORIZE_PRESETS: Record<VectorizePresetKey, VectorizePresetDefinition> = {
  logo: {
    key: 'logo',
    label: 'Logotipo / Ilustração',
    description: 'Cores vivas, recortes limpos e curvas suaves de Bézier',
    iconName: 'shapes',
    options: {
      preset: 'poster',
      clustering: 'color-cluster',
      mode: 'spline',
      hierarchical: 'cutout',
      colorPrecision: 6,
      filterSpeckle: 8,
      cornerThreshold: 60,
      simplify: 1.2,
      optimize: 2,
      pathPrecision: 2,
      maxColors: 24,
    },
  },
  silhouette: {
    key: 'silhouette',
    label: 'Silhueta P&B / Tinta',
    description: 'Traço binário de alto contraste para ícones, selos e carimbos',
    iconName: 'brush',
    options: {
      preset: 'bw',
      clustering: 'binary',
      mode: 'spline',
      binaryThreshold: 128,
      filterSpeckle: 6,
      cornerThreshold: 45,
      simplify: 1.0,
      optimize: 2,
      pathPrecision: 2,
    },
  },
  'high-fidelity': {
    key: 'high-fidelity',
    label: 'Alta Fidelidade',
    description: 'Preserva nuances, sombras e gradientes com maior riqueza de camadas',
    iconName: 'sparkles',
    options: {
      preset: 'photo',
      clustering: 'color-cluster',
      mode: 'spline',
      hierarchical: 'stacked',
      colorPrecision: 7,
      filterSpeckle: 4,
      layerDifference: 12,
      simplify: 1.0,
      optimize: 2,
      pathPrecision: 2,
      maxColors: 32,
    },
  },
  geometric: {
    key: 'geometric',
    label: 'Geométrico / Low-Poly',
    description: 'Arestas retas poligonais marcadas estilo flat art',
    iconName: 'layers',
    options: {
      clustering: 'color-cluster',
      mode: 'polygon',
      colorPrecision: 4,
      filterSpeckle: 12,
      cornerThreshold: 120,
      optimize: 2,
      pathPrecision: 2,
      maxColors: 16,
    },
  },
};

export interface VectorizeRequestOptions {
  readonly preset: VectorizePresetKey;
  readonly customOverrides?: Partial<VTracerOptions>;
  readonly widthLimit?: number;
  readonly heightLimit?: number;
  readonly onProgress?: VTracerProgressHandler;
}

export interface VectorizeResult {
  readonly success: boolean;
  readonly svgString?: string;
  readonly error?: string;
}

interface VTracerWorkerInstance {
  convert(input: Blob | ImageData | HTMLCanvasElement, options?: ConvertOptions): Promise<string>;
  convertPixels(
    pixels: Uint8Array | Uint8ClampedArray,
    width: number,
    height: number,
    options?: ConvertOptions,
  ): Promise<string>;
  terminate(): void;
}

let activeTracer: VTracerWorkerInstance | null = null;
let tracerLoadingPromise: Promise<VTracerWorkerInstance> | null = null;
let activeJobId = 0;

/**
 * Lazy loads and instantiates the VTracer Web Worker singleton.
 */
export async function getVTracer(): Promise<VTracerWorkerInstance> {
  if (activeTracer) {
    return activeTracer;
  }

  if (tracerLoadingPromise) {
    return tracerLoadingPromise;
  }

  tracerLoadingPromise = (async () => {
    try {
      const { createVTracer } = await import('vtracer-browser');
      activeTracer = createVTracer();
      return activeTracer;
    } catch (err) {
      activeTracer = null;
      tracerLoadingPromise = null;
      throw err;
    } finally {
      tracerLoadingPromise = null;
    }
  })();

  return tracerLoadingPromise;
}

/**
 * Terminates the active worker instance and frees WebAssembly memory.
 */
export function terminateVTracer(): void {
  if (activeTracer) {
    try {
      activeTracer.terminate();
    } catch {
      // Ignore cleanup error if worker was already dead
    }
    activeTracer = null;
  }
}

/**
 * Builds the merged VTracerOptions from preset + overrides.
 */
export function resolveVectorizeConfig(
  presetKey: VectorizePresetKey,
  overrides?: Partial<VTracerOptions>,
): VTracerOptions {
  const base = VECTORIZE_PRESETS[presetKey]?.options ?? VECTORIZE_PRESETS.logo.options;
  return {
    ...base,
    ...overrides,
  };
}

/**
 * Vectorizes raw RGBA pixels (ImageData or Uint8ClampedArray) to an SVG string.
 * Automatically recycles stale workers to prevent backlog freezing on heavy details.
 */
export async function vectorizeImageData(
  imageData: ImageData,
  options: VectorizeRequestOptions,
): Promise<VectorizeResult> {
  const currentJobId = ++activeJobId;

  try {
    // If a worker is running a previous heavy calculation, reset it to cancel in-flight computation
    if (activeTracer && currentJobId > 1) {
      terminateVTracer();
    }

    const tracer = await getVTracer();
    if (currentJobId !== activeJobId) {
      return { success: false, error: 'Substituído por uma operação mais recente.' };
    }

    const config = resolveVectorizeConfig(options.preset, options.customOverrides);

    const convertOpts: ConvertOptions = {
      ...config,
      width: options.widthLimit,
      height: options.heightLimit,
      onProgress: (p) => {
        if (currentJobId === activeJobId) {
          options.onProgress?.(p);
        }
      },
    };

    const svgString = await tracer.convertPixels(
      imageData.data,
      imageData.width,
      imageData.height,
      convertOpts,
    );

    if (currentJobId !== activeJobId) {
      return { success: false, error: 'Substituído por uma operação mais recente.' };
    }

    return { success: true, svgString };
  } catch (err) {
    if (currentJobId !== activeJobId) {
      return { success: false, error: 'Cancelado.' };
    }
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes('MIME type') ||
      msg.includes('application/wasm') ||
      msg.includes('Incorrect response')
    ) {
      return {
        success: false,
        error:
          'Falha ao carregar o motor WebAssembly (MIME type incorreto). O servidor precisa servir arquivos .wasm como application/wasm.',
      };
    }
    return { success: false, error: msg };
  }
}

/**
 * Vectorizes an image from a URL or data URL by drawing it onto an offscreen canvas.
 * Restricts maximum dimension to 1024px for smooth real-time performance.
 */
export async function vectorizeImageFromUrl(
  imageUrl: string,
  options: VectorizeRequestOptions,
): Promise<VectorizeResult> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = async () => {
      try {
        const naturalW = img.naturalWidth || img.width;
        const naturalH = img.naturalHeight || img.height;

        // Constrain max processing dimensions to 1024px to prevent worker thread lag
        const MAX_DIM = 1024;
        let targetW = naturalW;
        let targetH = naturalH;

        if (targetW > MAX_DIM || targetH > MAX_DIM) {
          if (targetW > targetH) {
            targetH = Math.round((targetH * MAX_DIM) / targetW);
            targetW = MAX_DIM;
          } else {
            targetW = Math.round((targetW * MAX_DIM) / targetH);
            targetH = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          resolve({
            success: false,
            error: 'Não foi possível obter contexto 2D para extração de pixels.',
          });
          return;
        }

        ctx.drawImage(img, 0, 0, targetW, targetH);
        const imgData = ctx.getImageData(0, 0, targetW, targetH);

        const result = await vectorizeImageData(imgData, options);
        resolve(result);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        resolve({ success: false, error: msg });
      }
    };

    img.onerror = () => {
      resolve({
        success: false,
        error: 'Falha ao carregar a imagem selecionada para vetorização.',
      });
    };

    img.src = imageUrl;
  });
}
