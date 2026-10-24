import { getPersistentCache, setPersistentCache } from './persistentMediaCache.js';

export interface GiphyItem {
  readonly id: string;
  readonly title: string;
  readonly staticUrl: string;
  readonly previewUrl: string;
  readonly width: number;
  readonly height: number;
}

const GIPHY_API_KEY = 'lf4tqj4BCNTO1YiDCOJp7rLXRHXYpSdh';
const GIPHY_BASE_URL = 'https://api.giphy.com/v1/gifs';

interface GiphyApiResponse {
  readonly data?: ReadonlyArray<{
    readonly id: string;
    readonly title?: string;
    readonly images?: {
      readonly original_still?: {
        readonly url: string;
        readonly width?: string;
        readonly height?: string;
      };
      readonly '480w_still'?: {
        readonly url: string;
        readonly width?: string;
        readonly height?: string;
      };
      readonly fixed_height_still?: {
        readonly url: string;
        readonly width?: string;
        readonly height?: string;
      };
      readonly downsized_still?: {
        readonly url: string;
        readonly width?: string;
        readonly height?: string;
      };
      readonly fixed_height_small_still?: {
        readonly url: string;
        readonly width?: string;
        readonly height?: string;
      };
    };
  }>;
}

/**
 * Normalizes a raw Giphy response item into a crisp static graphic/sticker representation.
 * Prioritizes high-resolution stills for canvas performance and sharp vector-like rendering.
 */
function normalizeGiphyItem(item: NonNullable<GiphyApiResponse['data']>[number]): GiphyItem | null {
  const images = item.images;
  if (!images) return null;

  const staticUrl =
    images.original_still?.url ||
    images['480w_still']?.url ||
    images.fixed_height_still?.url ||
    images.downsized_still?.url;

  if (!staticUrl) return null;

  const previewUrl =
    images.fixed_height_still?.url ||
    images.fixed_height_small_still?.url ||
    images.downsized_still?.url ||
    staticUrl;

  const width = Number.parseInt(images.original_still?.width || '300', 10);
  const height = Number.parseInt(images.original_still?.height || '300', 10);

  return {
    id: item.id,
    title: item.title?.replace(/GIF\s*$/i, '').trim() || 'Giphy Sticker',
    staticUrl,
    previewUrl,
    width: Number.isFinite(width) ? width : 300,
    height: Number.isFinite(height) ? height : 300,
  };
}

/**
 * Searches GIPHY for static stickers and graphics with 24h local persistence.
 */
export async function searchGiphyStills(
  query: string,
  limit = 24,
  offset = 0,
): Promise<readonly GiphyItem[]> {
  const trimmed = query.trim().toLowerCase();
  const cacheKey = `giphy_${trimmed || 'trending'}_lim${limit}_off${offset}`;

  const cached = getPersistentCache<readonly GiphyItem[]>(cacheKey);
  if (cached && cached.length > 0) {
    return cached;
  }

  try {
    const endpoint = trimmed
      ? `${GIPHY_BASE_URL}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(
          trimmed,
        )}&limit=${limit}&offset=${offset}&rating=g&lang=pt`
      : `${GIPHY_BASE_URL}/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&offset=${offset}&rating=g`;

    const res = await fetch(endpoint, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      console.warn(`Giphy API responded with status ${res.status}`);
      return [];
    }

    const json = (await res.json()) as GiphyApiResponse;
    if (!json.data || !Array.isArray(json.data)) {
      return [];
    }

    const items: GiphyItem[] = [];
    for (const raw of json.data) {
      const normalized = normalizeGiphyItem(raw);
      if (normalized) {
        items.push(normalized);
      }
    }

    if (items.length > 0) {
      setPersistentCache(cacheKey, items);
    }

    return items;
  } catch (err) {
    console.warn('Giphy request failed:', err);
    return [];
  }
}
