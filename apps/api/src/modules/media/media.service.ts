import type { ApiEnvConfig } from '../../config/env.js';

export interface MediaPhotosQuery {
  readonly provider?: string;
  readonly query?: string;
  readonly mode?: string;
  readonly page?: number;
  readonly perPage?: number;
}

export interface MediaStickersQuery {
  readonly query?: string;
  readonly limit?: number;
  readonly offset?: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  const num = Number.parseInt(
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean,
    16,
  );
  if (Number.isNaN(num)) return [0, 113, 227];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number): number => Math.max(0, Math.min(255, Math.round(v)));
  const hex = [clamp(r), clamp(g), clamp(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `#${hex.toUpperCase()}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (h >= 0 && h < 60) {
    rPrime = c;
    gPrime = x;
  } else if (h >= 60 && h < 120) {
    rPrime = x;
    gPrime = c;
  } else if (h >= 120 && h < 180) {
    gPrime = c;
    bPrime = x;
  } else if (h >= 180 && h < 240) {
    gPrime = x;
    bPrime = c;
  } else if (h >= 240 && h < 300) {
    rPrime = x;
    bPrime = c;
  } else {
    rPrime = c;
    bPrime = x;
  }

  return [
    Math.round((rPrime + m) * 255),
    Math.round((gPrime + m) * 255),
    Math.round((bPrime + m) * 255),
  ];
}

export async function fetchPhotosFromProvider(
  params: MediaPhotosQuery,
  env: ApiEnvConfig,
): Promise<unknown> {
  const provider = (params.provider ?? 'unsplash').toLowerCase();
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.max(1, Math.min(50, params.perPage ?? 24));
  const query = (params.query ?? '').trim();

  if (provider === 'pexels') {
    if (!env.pexelsApiKey) {
      return { items: [], fallback: true };
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const endpoint = query
        ? `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`
        : `https://api.pexels.com/v1/curated?page=${page}&per_page=${perPage}`;
      const res = await fetch(endpoint, {
        headers: { Authorization: env.pexelsApiKey },
        signal: controller.signal,
      });
      if (!res.ok) return { items: [], fallback: true };
      return await res.json();
    } catch {
      return { items: [], fallback: true };
    } finally {
      clearTimeout(timer);
    }
  }

  if (!env.unsplashAccessKey) {
    return { items: [], fallback: true };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const endpoint =
      params.mode === 'editorial' || !query
        ? `https://api.unsplash.com/photos?page=${page}&per_page=${perPage}&order_by=popular`
        : `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
            query,
          )}&page=${page}&per_page=${perPage}&orientation=landscape`;

    const res = await fetch(endpoint, {
      headers: {
        Authorization: `Client-ID ${env.unsplashAccessKey}`,
        'Accept-Version': 'v1',
      },
      signal: controller.signal,
    });
    if (!res.ok) return { items: [], fallback: true };
    return await res.json();
  } catch {
    return { items: [], fallback: true };
  } finally {
    clearTimeout(timer);
  }
}

export async function trackUnsplashDownloadOnServer(
  downloadLocation: string,
  env: ApiEnvConfig,
): Promise<{ readonly tracked: boolean }> {
  if (!downloadLocation.startsWith('https://api.unsplash.com/') || !env.unsplashAccessKey) {
    return { tracked: false };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const separator = downloadLocation.includes('?') ? '&' : '?';
    const endpoint = `${downloadLocation}${separator}client_id=${encodeURIComponent(env.unsplashAccessKey)}`;
    const res = await fetch(endpoint, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    return { tracked: res.ok };
  } catch {
    return { tracked: false };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchStickersFromGiphy(
  params: MediaStickersQuery,
  env: ApiEnvConfig,
): Promise<unknown> {
  if (!env.giphyApiKey) {
    return { items: [], fallback: true };
  }

  const query = (params.query ?? '').trim();
  const limit = Math.max(1, Math.min(50, params.limit ?? 24));
  const offset = Math.max(0, params.offset ?? 0);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const endpoint = query
      ? `https://api.giphy.com/v1/gifs/search?api_key=${encodeURIComponent(
          env.giphyApiKey,
        )}&q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&rating=g&lang=pt`
      : `https://api.giphy.com/v1/gifs/trending?api_key=${encodeURIComponent(
          env.giphyApiKey,
        )}&limit=${limit}&offset=${offset}&rating=g`;

    const res = await fetch(endpoint, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) return { items: [], fallback: true };
    return await res.json();
  } catch {
    return { items: [], fallback: true };
  } finally {
    clearTimeout(timer);
  }
}

export function synthesizeHarmonicPalette(seedHex?: string): {
  readonly colors: readonly string[];
  readonly result: ReadonlyArray<readonly [number, number, number]>;
} {
  const baseRgb =
    seedHex && seedHex.startsWith('#')
      ? hexToRgb(seedHex)
      : ([0, 113, 227] as [number, number, number]);
  const [baseH, baseS, baseL] = rgbToHsl(...baseRgb);

  const rgbTriples: ReadonlyArray<readonly [number, number, number]> = [
    baseRgb,
    hslToRgb((baseH + 30) % 360, Math.min(100, baseS + 5), Math.max(12, baseL - 10)),
    hslToRgb((baseH + 60) % 360, Math.min(100, baseS + 10), Math.min(88, baseL + 10)),
    hslToRgb((baseH + 180) % 360, baseS, baseL),
    hslToRgb(baseH, Math.max(10, baseS - 30), 92),
  ];

  const colors = rgbTriples.map(([r, g, b]) => rgbToHex(r, g, b));
  return { colors, result: rgbTriples };
}
