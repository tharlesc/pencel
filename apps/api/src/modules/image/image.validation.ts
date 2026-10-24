export type SupportedImageMime = 'image/png' | 'image/jpeg' | 'image/webp';

export interface ValidatedImagePayload {
  readonly mimeType: SupportedImageMime;
  readonly extension: 'png' | 'jpg' | 'webp';
  readonly buffer: Buffer;
}

export type ImageValidationResult =
  | { readonly ok: true; readonly value: ValidatedImagePayload }
  | { readonly ok: false; readonly status: 400; readonly error: string };

const ALLOWED_MIMES: Readonly<
  Record<string, { mime: SupportedImageMime; ext: 'png' | 'jpg' | 'webp' }>
> = {
  png: { mime: 'image/png', ext: 'png' },
  jpeg: { mime: 'image/jpeg', ext: 'jpg' },
  jpg: { mime: 'image/jpeg', ext: 'jpg' },
  webp: { mime: 'image/webp', ext: 'webp' },
};

const BASE64_PATTERN = /^[A-Za-z0-9+/=\r\n]+$/;

/**
 * Validates incoming `imageBase64` payload for MIME allowlist, base64 integrity, and byte size limit.
 */
export function validateRemoveBackgroundInput(
  body: unknown,
  maxImageBytes: number,
): ImageValidationResult {
  if (!body || typeof body !== 'object') {
    return { ok: false, status: 400, error: 'Payload inválido: corpo JSON esperado.' };
  }

  const rawImage = (body as { readonly imageBase64?: unknown }).imageBase64;
  if (typeof rawImage !== 'string' || rawImage.trim().length === 0) {
    return { ok: false, status: 400, error: 'imageBase64 é obrigatório.' };
  }

  const trimmed = rawImage.trim();
  const dataUriMatch = trimmed.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);

  let formatKey = 'png';
  let base64Data = trimmed;

  if (dataUriMatch) {
    formatKey = (dataUriMatch[1] ?? '').toLowerCase();
    base64Data = dataUriMatch[2] ?? '';
  } else if (trimmed.startsWith('data:')) {
    return {
      ok: false,
      status: 400,
      error: 'Tipo MIME não suportado. Use image/png, image/jpeg ou image/webp.',
    };
  }

  const mimeEntry = ALLOWED_MIMES[formatKey];
  if (!mimeEntry) {
    return {
      ok: false,
      status: 400,
      error: `Formato de imagem não suportado (${formatKey}). Permitidos: png, jpeg, webp.`,
    };
  }

  if (!base64Data || !BASE64_PATTERN.test(base64Data)) {
    return {
      ok: false,
      status: 400,
      error: 'Codificação Base64 inválida.',
    };
  }

  const buffer = Buffer.from(base64Data, 'base64');
  if (buffer.byteLength === 0) {
    return {
      ok: false,
      status: 400,
      error: 'A imagem fornecida está vazia.',
    };
  }

  if (buffer.byteLength > maxImageBytes) {
    return {
      ok: false,
      status: 400,
      error: `Imagem excede o tamanho máximo permitido (${maxImageBytes} bytes).`,
    };
  }

  return {
    ok: true,
    value: {
      mimeType: mimeEntry.mime,
      extension: mimeEntry.ext,
      buffer,
    },
  };
}
