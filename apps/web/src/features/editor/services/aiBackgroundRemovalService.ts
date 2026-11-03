/**
 * In-browser AI Background Removal Service using @huggingface/transformers and RMBG-1.4.
 *
 * Implements client-side, zero-cloud neural foreground segmentation (Solution B).
 * Adheres strictly to ADR 0019 and repository licensing / performance standards.
 */

export interface AiRemovalProgress {
  readonly status: 'loading-model' | 'downloading' | 'processing' | 'done' | 'error';
  readonly progress?: number;
  readonly message?: string;
}

export type AiRemovalProgressCallback = (progress: AiRemovalProgress) => void;

export interface AiRemovalResult {
  readonly success: boolean;
  readonly imageBase64?: string;
  readonly message?: string;
  readonly fallbackUsed?: boolean;
}

export const DEFAULT_SEGMENTATION_MODEL = 'briaai/RMBG-1.4';

type PipelineFunction = (
  input: string | HTMLImageElement | Blob | ImageData,
  options?: Record<string, unknown>,
) => Promise<unknown>;

let pipelineInstancePromise: Promise<PipelineFunction> | null = null;

/**
 * Resets the cached pipeline instance (useful for recovery or testing).
 */
export function resetBackgroundRemovalPipeline(): void {
  pipelineInstancePromise = null;
}

/**
 * Lazy loads and instantiates the background removal pipeline singleton.
 */
export async function getBackgroundRemovalPipeline(
  onProgress?: AiRemovalProgressCallback,
): Promise<PipelineFunction> {
  if (pipelineInstancePromise) {
    return pipelineInstancePromise;
  }

  pipelineInstancePromise = (async () => {
    onProgress?.({
      status: 'loading-model',
      progress: 0,
      message: 'Iniciando modelo neural RMBG-1.4...',
    });

    try {
      const { pipeline, env } = await import('@huggingface/transformers');

      // Configure Hugging Face Transformers environment for browser client execution
      env.allowLocalModels = false;
      env.useBrowserCache = true;

      const progressCallback = (info: {
        readonly status?: string;
        readonly progress?: number;
        readonly file?: string;
      }) => {
        if (info.status === 'progress' && typeof info.progress === 'number') {
          onProgress?.({
            status: 'downloading',
            progress: Math.round(info.progress),
            message: `Baixando pesos neurais (${Math.round(info.progress)}%)...`,
          });
        }
      };

      // Create segmentation pipeline
      const segmenter = await pipeline('background-removal', DEFAULT_SEGMENTATION_MODEL, {
        progress_callback: progressCallback,
      });

      return segmenter as PipelineFunction;
    } catch (error) {
      // Clear cache on failure so next attempt can retry
      pipelineInstancePromise = null;
      throw error;
    }
  })();

  return pipelineInstancePromise;
}

/**
 * Converts a RawImage from Transformers.js into a base64 PNG data URL.
 */
function convertRawImageToDataUrl(rawImage: {
  readonly toCanvas?: () => HTMLCanvasElement;
  readonly clone: () => {
    readonly rgba: () => {
      readonly data: Uint8Array | Uint8ClampedArray;
      readonly width: number;
      readonly height: number;
    };
  };
}): string {
  if (typeof rawImage.toCanvas === 'function') {
    try {
      const canvas = rawImage.toCanvas();
      if (typeof canvas?.toDataURL === 'function') {
        return canvas.toDataURL('image/png');
      }
    } catch {
      // Fallback to manual canvas conversion
    }
  }

  const rgbaImage = rawImage.clone().rgba();
  const canvas = document.createElement('canvas');
  canvas.width = rgbaImage.width;
  canvas.height = rgbaImage.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Contexto 2D indisponível para renderização da imagem processada.');
  }

  let imgData: ImageData;
  if (typeof ImageData !== 'undefined') {
    imgData = new ImageData(
      new Uint8ClampedArray(rgbaImage.data),
      rgbaImage.width,
      rgbaImage.height,
    );
  } else if (typeof ctx.createImageData === 'function') {
    imgData = ctx.createImageData(rgbaImage.width, rgbaImage.height);
    imgData.data.set(new Uint8ClampedArray(rgbaImage.data));
  } else {
    throw new Error('ImageData indisponível no ambiente.');
  }

  ctx.putImageData(imgData, 0, 0);

  return canvas.toDataURL('image/png');
}

/**
 * Removes the background of an image completely inside the browser using neural AI.
 *
 * @param imageSource Data URL, Blob, or HTMLImageElement
 * @param onProgress Optional callback for progress tracking
 * @returns Result object with imageBase64 if successful
 */
export async function removeBackgroundWithAi(
  imageSource: string | HTMLImageElement | Blob,
  onProgress?: AiRemovalProgressCallback,
): Promise<AiRemovalResult> {
  try {
    const segmenter = await getBackgroundRemovalPipeline(onProgress);

    onProgress?.({
      status: 'processing',
      progress: 90,
      message: 'Segmentando primeiro plano via IA...',
    });

    const output = await segmenter(imageSource);

    // If output is an array, take the first element
    const rawImage = Array.isArray(output) ? output[0] : output;

    if (!rawImage || typeof rawImage !== 'object' || !('clone' in rawImage)) {
      throw new Error('A saída do modelo não gerou uma imagem válida.');
    }

    const dataUrl = convertRawImageToDataUrl(
      rawImage as Parameters<typeof convertRawImageToDataUrl>[0],
    );

    onProgress?.({
      status: 'done',
      progress: 100,
      message: 'Fundo removido com sucesso via IA!',
    });

    return {
      success: true,
      imageBase64: dataUrl,
      message: 'Fundo removido com sucesso via IA RMBG-1.4!',
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    onProgress?.({
      status: 'error',
      message: `Falha na inferência local: ${errorMsg}`,
    });

    return {
      success: false,
      fallbackUsed: true,
      message: errorMsg,
    };
  }
}
