import { CURATED_STOCK_PHOTOS } from '../model/presetCatalog.js';
import { httpClient } from './httpClient.js';
import { getPersistentCache, setPersistentCache } from './persistentMediaCache.js';

export type MediaProviderSource = 'unsplash' | 'pexels' | 'giphy' | 'picsum' | 'wikimedia' | 'nasa';

export interface PublicPhotoItem {
  readonly id: string;
  readonly title: string;
  readonly author: string;
  readonly authorUrl?: string;
  readonly downloadLocation?: string;
  readonly thumbUrl: string;
  readonly fullUrl: string;
  readonly source:
    | 'Unsplash'
    | 'Pexels'
    | 'Wikimedia Commons'
    | 'Openverse CC'
    | 'Picsum (Unsplash)'
    | 'Lorem Picsum'
    | 'Unsplash Curated'
    | 'NASA Open Media'
    | 'Upload';
  readonly category?: string;
  readonly width?: number;
  readonly height?: number;
}

export interface GiphyItem {
  readonly id: string;
  readonly title: string;
  readonly staticUrl: string;
  readonly previewUrl: string;
  readonly width: number;
  readonly height: number;
}

interface UnsplashRawPhoto {
  readonly id: string;
  readonly width?: number;
  readonly height?: number;
  readonly description?: string | null;
  readonly alt_description?: string | null;
  readonly urls?: {
    readonly raw?: string;
    readonly full?: string;
    readonly regular?: string;
    readonly small?: string;
    readonly thumb?: string;
  };
  readonly user?: {
    readonly name?: string;
    readonly username?: string;
    readonly links?: {
      readonly html?: string;
    };
  };
  readonly links?: {
    readonly download_location?: string;
  };
}

interface PexelsRawPhoto {
  readonly id: number | string;
  readonly width?: number;
  readonly height?: number;
  readonly alt?: string;
  readonly photographer?: string;
  readonly photographer_url?: string;
  readonly src?: {
    readonly original?: string;
    readonly large2x?: string;
    readonly large?: string;
    readonly medium?: string;
    readonly small?: string;
  };
}

interface GiphyRawItem {
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
}

function getUnsplashAppName(): string {
  try {
    const name = import.meta.env?.VITE_UNSPLASH_APP_NAME || 'pencelstudio';
    return name.trim();
  } catch {
    return 'pencelstudio';
  }
}

export function normalizeUnsplashPhoto(
  raw: UnsplashRawPhoto,
  fallbackCategory = 'Fotografia',
): PublicPhotoItem {
  const appName = getUnsplashAppName();
  const authorName = raw.user?.name || raw.user?.username || 'Fotógrafo Unsplash';
  const authorProfile = raw.user?.links?.html
    ? `${raw.user.links.html}?utm_source=${appName}&utm_medium=referral`
    : `https://unsplash.com?utm_source=${appName}&utm_medium=referral`;

  const title = raw.description || raw.alt_description || `Foto por ${authorName}`;
  const thumbUrl = raw.urls?.small || raw.urls?.thumb || raw.urls?.regular || '';
  const fullUrl = raw.urls?.regular || raw.urls?.full || raw.urls?.small || '';

  return {
    id: `unsplash-${raw.id}`,
    title,
    author: authorName,
    authorUrl: authorProfile,
    downloadLocation: raw.links?.download_location,
    thumbUrl,
    fullUrl,
    source: 'Unsplash',
    category: fallbackCategory,
    width: raw.width,
    height: raw.height,
  };
}

export function normalizePexelsPhoto(
  raw: PexelsRawPhoto,
  fallbackCategory = 'Fotografia',
): PublicPhotoItem {
  const authorName = raw.photographer || 'Fotógrafo Pexels';
  const thumbUrl = raw.src?.medium || raw.src?.small || raw.src?.large || '';
  const fullUrl = raw.src?.large2x || raw.src?.large || raw.src?.original || thumbUrl;

  return {
    id: `pexels-${raw.id}`,
    title: raw.alt || `Foto por ${authorName}`,
    author: authorName,
    authorUrl: raw.photographer_url || 'https://www.pexels.com',
    thumbUrl,
    fullUrl,
    source: 'Pexels',
    category: fallbackCategory,
    width: raw.width,
    height: raw.height,
  };
}

export function normalizeGiphyItem(item: GiphyRawItem): GiphyItem | null {
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

export function getCuratedFallbackPhotos(): PublicPhotoItem[] {
  return CURATED_STOCK_PHOTOS.map((p) => ({
    id: p.id,
    title: p.name,
    author: p.author || 'Unsplash Curated',
    authorUrl: `https://unsplash.com?utm_source=${getUnsplashAppName()}&utm_medium=referral`,
    thumbUrl: p.thumbUrl || p.url,
    fullUrl: p.url,
    source: 'Unsplash Curated',
    category: p.category,
  }));
}

export async function trackUnsplashDownload(downloadLocation?: string): Promise<void> {
  if (!downloadLocation) return;
  await httpClient.post('/api/v1/media/download', { downloadLocation }, { timeoutMs: 4000 });
}

export async function searchUnsplashPhotos(
  query: string,
  page = 1,
  pageSize = 24,
): Promise<PublicPhotoItem[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const cacheKey = `unsplash-search-${cleanQuery.toLowerCase()}-p-${page}-s-${pageSize}`;
  const cached = getPersistentCache<PublicPhotoItem[]>(cacheKey);
  if (cached && cached.length > 0) {
    return cached;
  }

  const endpoint = `/api/v1/media/photos?provider=unsplash&query=${encodeURIComponent(
    cleanQuery,
  )}&page=${page}&perPage=${pageSize}`;

  const result = await httpClient.get<{
    readonly items?: PublicPhotoItem[];
    readonly results?: UnsplashRawPhoto[];
  }>(endpoint, { timeoutMs: 7000 });

  if (!result.ok) {
    return [];
  }

  let items: PublicPhotoItem[] = [];
  if (Array.isArray(result.data)) {
    items = (result.data as UnsplashRawPhoto[])
      .filter((p) => Boolean(p.urls?.small || p.urls?.regular))
      .map((p) => normalizeUnsplashPhoto(p, cleanQuery));
  } else if (Array.isArray(result.data.items)) {
    items = result.data.items;
  } else if (Array.isArray(result.data.results)) {
    items = result.data.results
      .filter((p) => Boolean(p.urls?.small || p.urls?.regular))
      .map((p) => normalizeUnsplashPhoto(p, cleanQuery));
  }

  if (items.length > 0) {
    setPersistentCache(cacheKey, items);
  }
  return items;
}

export async function searchPexelsPhotos(
  query: string,
  page = 1,
  pageSize = 24,
): Promise<PublicPhotoItem[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const cacheKey = `pexels-search-${cleanQuery.toLowerCase()}-p-${page}-s-${pageSize}`;
  const cached = getPersistentCache<PublicPhotoItem[]>(cacheKey);
  if (cached && cached.length > 0) {
    return cached;
  }

  const endpoint = `/api/v1/media/photos?provider=pexels&query=${encodeURIComponent(
    cleanQuery,
  )}&page=${page}&perPage=${pageSize}`;

  const result = await httpClient.get<{
    readonly items?: PublicPhotoItem[];
    readonly photos?: PexelsRawPhoto[];
  }>(endpoint, { timeoutMs: 7000 });

  if (!result.ok) {
    return [];
  }

  let items: PublicPhotoItem[] = [];
  if (Array.isArray(result.data.items)) {
    items = result.data.items;
  } else if (Array.isArray(result.data.photos)) {
    items = result.data.photos.map((p) => normalizePexelsPhoto(p, cleanQuery));
  }

  if (items.length > 0) {
    setPersistentCache(cacheKey, items);
  }
  return items;
}

export async function fetchUnsplashEditorial(page = 1, pageSize = 24): Promise<PublicPhotoItem[]> {
  const cacheKey = `unsplash-editorial-p-${page}-s-${pageSize}`;
  const cached = getPersistentCache<PublicPhotoItem[]>(cacheKey);
  if (cached && cached.length > 0) {
    return cached;
  }

  const endpoint = `/api/v1/media/photos?provider=unsplash&mode=editorial&page=${page}&perPage=${pageSize}`;
  const result = await httpClient.get<
    | UnsplashRawPhoto[]
    | { readonly items?: PublicPhotoItem[]; readonly results?: UnsplashRawPhoto[] }
  >(endpoint, { timeoutMs: 7000 });

  if (!result.ok) {
    return [];
  }

  let items: PublicPhotoItem[] = [];
  if (Array.isArray(result.data)) {
    items = result.data
      .filter((p) => Boolean(p.urls?.small || p.urls?.regular))
      .map((p) => normalizeUnsplashPhoto(p, 'Destaques'));
  } else if (Array.isArray(result.data.items)) {
    items = result.data.items;
  } else if (Array.isArray(result.data.results)) {
    items = result.data.results
      .filter((p) => Boolean(p.urls?.small || p.urls?.regular))
      .map((p) => normalizeUnsplashPhoto(p, 'Destaques'));
  }

  if (items.length > 0) {
    setPersistentCache(cacheKey, items);
  }
  return items;
}

export async function fetchPicsumPhotos(page = 1, limit = 24): Promise<PublicPhotoItem[]> {
  const cacheKey = `picsum-page-${page}-limit-${limit}`;
  const cached = getPersistentCache<PublicPhotoItem[]>(cacheKey);
  if (cached && cached.length > 0) {
    return cached;
  }

  interface PicsumRawItem {
    readonly id: string;
    readonly author: string;
    readonly width: number;
    readonly height: number;
    readonly url: string;
    readonly download_url: string;
  }

  const result = await httpClient.get<PicsumRawItem[]>(
    `https://picsum.photos/v2/list?page=${page}&limit=${limit}`,
    { timeoutMs: 6000 },
  );

  if (!result.ok || !Array.isArray(result.data)) {
    return [];
  }

  const items: PublicPhotoItem[] = result.data.map((item) => ({
    id: `picsum-${item.id}`,
    title: `Foto por ${item.author}`,
    author: item.author,
    authorUrl: item.url,
    thumbUrl: `https://picsum.photos/id/${item.id}/400/300`,
    fullUrl: `https://picsum.photos/id/${item.id}/1600/1200`,
    source: 'Lorem Picsum',
    category: 'Fotografia',
    width: item.width,
    height: item.height,
  }));

  if (items.length > 0) {
    setPersistentCache(cacheKey, items);
  }
  return items;
}

export async function searchWikimediaCommons(
  query: string,
  page = 1,
  pageSize = 30,
): Promise<PublicPhotoItem[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const cacheKey = `wiki-q-${cleanQuery.toLowerCase()}-p-${page}-s-${pageSize}`;
  const cached = getPersistentCache<PublicPhotoItem[]>(cacheKey);
  if (cached && cached.length > 0) {
    return cached;
  }

  const offset = (page - 1) * pageSize;
  const endpoint = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
    cleanQuery,
  )}&gsrnamespace=6&gsrlimit=${pageSize}&gsroffset=${offset}&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=500&format=json&origin=*`;

  interface WikimediaPage {
    readonly pageid?: number;
    readonly title: string;
    readonly imageinfo?: ReadonlyArray<{
      readonly url?: string;
      readonly thumburl?: string;
    }>;
  }

  const result = await httpClient.get<{
    readonly query?: { readonly pages?: Readonly<Record<string, WikimediaPage>> };
  }>(endpoint, { timeoutMs: 7000 });

  if (!result.ok) {
    return [];
  }

  const pages = Object.values(result.data.query?.pages ?? {});
  const items: PublicPhotoItem[] = pages
    .filter((p) => Boolean(p.imageinfo?.[0]?.url || p.imageinfo?.[0]?.thumburl))
    .map((p) => {
      const info = p.imageinfo![0]!;
      const cleanTitle = p.title
        .replace(/^File:/i, '')
        .replace(/\.(jpe?g|png|webp|svg)$/i, '')
        .replace(/[_-]/g, ' ')
        .trim();

      return {
        id: `wiki-${p.pageid || cleanTitle}`,
        title: cleanTitle || `Foto (${cleanQuery})`,
        author: 'Wikimedia Commons',
        thumbUrl: info.thumburl || info.url || '',
        fullUrl:
          info.url && !/\.(tif|tiff|webm|ogv)$/i.test(info.url) ? info.url : info.thumburl || '',
        source: 'Wikimedia Commons',
        category: cleanQuery,
      };
    });

  if (items.length > 0) {
    setPersistentCache(cacheKey, items);
  }
  return items;
}

export async function searchNasaMedia(query: string): Promise<PublicPhotoItem[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const cacheKey = `nasa-${cleanQuery.toLowerCase()}`;
  const cached = getPersistentCache<PublicPhotoItem[]>(cacheKey);
  if (cached && cached.length > 0) {
    return cached;
  }

  interface NasaRawItem {
    readonly data?: ReadonlyArray<{
      readonly nasa_id: string;
      readonly title: string;
      readonly description?: string;
      readonly photographer?: string;
    }>;
    readonly links?: ReadonlyArray<{ readonly href: string; readonly rel: string }>;
  }

  const result = await httpClient.get<{
    readonly collection?: { readonly items?: ReadonlyArray<NasaRawItem> };
  }>(`https://images-api.nasa.gov/search?q=${encodeURIComponent(cleanQuery)}&media_type=image`, {
    timeoutMs: 6000,
  });

  if (!result.ok) {
    return [];
  }

  const rawItems = result.data.collection?.items?.slice(0, 24) ?? [];
  const items: PublicPhotoItem[] = rawItems
    .filter((item) => item.data?.[0] && item.links?.[0]?.href)
    .map((item) => {
      const d = item.data![0]!;
      const link = item.links![0]!.href;
      const thumbUrl = link;
      const fullUrl = link.replace('~thumb.', '~medium.').replace('~thumb.jpg', '~medium.jpg');

      return {
        id: `nasa-${d.nasa_id}`,
        title: d.title || 'Foto NASA',
        author: d.photographer || 'NASA Open Archive',
        thumbUrl,
        fullUrl,
        source: 'NASA Open Media',
        category: 'Espaço',
      };
    });

  if (items.length > 0) {
    setPersistentCache(cacheKey, items);
  }
  return items;
}

const createSvgStickerUrl = (svgContent: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">${svgContent}</svg>`,
  )}`;

export const CURATED_FALLBACK_STICKERS: readonly GiphyItem[] = [
  {
    id: 'curated-sticker-sparkles',
    title: 'Estrela Mágica / Sparkles',
    staticUrl: createSvgStickerUrl(
      '<path fill="#FFD60A" d="M64 4l9.2 38.6L112 52l-38.8 9.4L64 100l-9.2-38.6L16 52l38.8-9.4z"/><path fill="#FF9F0A" d="M96 76l4.6 19.3L120 100l-19.4 4.7L96 124l-4.6-19.3L72 100l19.4-4.7z"/><circle cx="28" cy="24" r="8" fill="#30D158"/>',
    ),
    previewUrl: createSvgStickerUrl(
      '<path fill="#FFD60A" d="M64 4l9.2 38.6L112 52l-38.8 9.4L64 100l-9.2-38.6L16 52l38.8-9.4z"/><path fill="#FF9F0A" d="M96 76l4.6 19.3L120 100l-19.4 4.7L96 124l-4.6-19.3L72 100l19.4-4.7z"/><circle cx="28" cy="24" r="8" fill="#30D158"/>',
    ),
    width: 128,
    height: 128,
  },
  {
    id: 'curated-sticker-fire',
    title: 'Fogo em Chamas / Fire',
    staticUrl: createSvgStickerUrl(
      '<path fill="#FF453A" d="M64 8c-6 18-28 32-28 60 0 24.3 19.7 44 44 44s44-19.7 44-44c0-26-22-42-26-60-2 16-10 26-18 26-8 0-12-14-16-26z"/><path fill="#FF9F0A" d="M64 42c-4 12-18 22-18 40 0 16.6 13.4 30 30 30s30-13.4 30-30c0-18-15-28-18-40-2 10-7 18-12 18s-9-10-12-18z"/><path fill="#FFD60A" d="M64 74c-2 6-9 11-9 20 0 8.3 6.7 15 15 15s15-6.7 15-15c0-9-7-14-9-20-1 5-4 9-6 9s-5-5-6-9z"/>',
    ),
    previewUrl: createSvgStickerUrl(
      '<path fill="#FF453A" d="M64 8c-6 18-28 32-28 60 0 24.3 19.7 44 44 44s44-19.7 44-44c0-26-22-42-26-60-2 16-10 26-18 26-8 0-12-14-16-26z"/><path fill="#FF9F0A" d="M64 42c-4 12-18 22-18 40 0 16.6 13.4 30 30 30s30-13.4 30-30c0-18-15-28-18-40-2 10-7 18-12 18s-9-10-12-18z"/><path fill="#FFD60A" d="M64 74c-2 6-9 11-9 20 0 8.3 6.7 15 15 15s15-6.7 15-15c0-9-7-14-9-20-1 5-4 9-6 9s-5-5-6-9z"/>',
    ),
    width: 128,
    height: 128,
  },
  {
    id: 'curated-sticker-rocket',
    title: 'Foguete Decolando / Rocket',
    staticUrl: createSvgStickerUrl(
      '<path fill="#E5E5EA" d="M64 12c20 20 28 48 28 68l-28-8-28 8c0-20 8-48 28-68z"/><path fill="#0071E3" d="M36 72L16 94l12 6 8-12 28-8z"/><path fill="#0071E3" d="M92 72l20 22-12 6-8-12-28-8z"/><circle cx="64" cy="48" r="10" fill="#64D2FF"/><path fill="#FF453A" d="M54 90l10 26 10-26-10-6z"/><path fill="#FFD60A" d="M58 90l6 16 6-16-6-4z"/>',
    ),
    previewUrl: createSvgStickerUrl(
      '<path fill="#E5E5EA" d="M64 12c20 20 28 48 28 68l-28-8-28 8c0-20 8-48 28-68z"/><path fill="#0071E3" d="M36 72L16 94l12 6 8-12 28-8z"/><path fill="#0071E3" d="M92 72l20 22-12 6-8-12-28-8z"/><circle cx="64" cy="48" r="10" fill="#64D2FF"/><path fill="#FF453A" d="M54 90l10 26 10-26-10-6z"/><path fill="#FFD60A" d="M58 90l6 16 6-16-6-4z"/>',
    ),
    width: 128,
    height: 128,
  },
  {
    id: 'curated-sticker-heart',
    title: 'Coração Vermelho / Heart',
    staticUrl: createSvgStickerUrl(
      '<path fill="#FF2D55" d="M64 116s-44-27.4-44-60c0-17.7 14.3-32 32-32 10.7 0 20.3 5.3 26.2 13.5 1.4 1.9 2.2 3.1 3.8 3.1 1.6 0 2.4-1.2 3.8-3.1C91.7 29.3 101.3 24 112 24c17.7 0 32 14.3 32 32 0 32.6-44 60-44 60l-36-3z"/>',
    ),
    previewUrl: createSvgStickerUrl(
      '<path fill="#FF2D55" d="M64 116s-44-27.4-44-60c0-17.7 14.3-32 32-32 10.7 0 20.3 5.3 26.2 13.5 1.4 1.9 2.2 3.1 3.8 3.1 1.6 0 2.4-1.2 3.8-3.1C91.7 29.3 101.3 24 112 24c17.7 0 32 14.3 32 32 0 32.6-44 60-44 60l-36-3z"/>',
    ),
    width: 128,
    height: 128,
  },
  {
    id: 'curated-sticker-trophy',
    title: 'Troféu Campeão / Trophy',
    staticUrl: createSvgStickerUrl(
      '<path fill="#FFD60A" d="M36 20h56v40c0 15.5-12.5 28-28 28s-28-12.5-28-28V20z"/><path fill="#FF9F0A" d="M64 88v18H48v10h32v-10H64V88z"/><path fill="#FFD60A" d="M36 26H20c0 14 10 24 20 24v-8c-5 0-8-6-8-12h4v-4zm56 0h16c0 14-10 24-20 24v-8c5 0 8-6 8-12h-4v-4z"/><polygon points="64,36 67,45 76,45 69,51 71,60 64,54 57,60 59,51 52,45 61,45" fill="#FFFFFF"/>',
    ),
    previewUrl: createSvgStickerUrl(
      '<path fill="#FFD60A" d="M36 20h56v40c0 15.5-12.5 28-28 28s-28-12.5-28-28V20z"/><path fill="#FF9F0A" d="M64 88v18H48v10h32v-10H64V88z"/><path fill="#FFD60A" d="M36 26H20c0 14 10 24 20 24v-8c-5 0-8-6-8-12h4v-4zm56 0h16c0 14-10 24-20 24v-8c5 0 8-6 8-12h-4v-4z"/><polygon points="64,36 67,45 76,45 69,51 71,60 64,54 57,60 59,51 52,45 61,45" fill="#FFFFFF"/>',
    ),
    width: 128,
    height: 128,
  },
  {
    id: 'curated-sticker-party',
    title: 'Celebração e Festa / Party',
    staticUrl: createSvgStickerUrl(
      '<path fill="#BF5AF2" d="M24 104l16-64 48 48-64 16z"/><circle cx="84" cy="32" r="6" fill="#FF375F"/><circle cx="98" cy="48" r="5" fill="#FFD60A"/><circle cx="72" cy="18" r="4" fill="#30D158"/><circle cx="106" cy="24" r="5" fill="#64D2FF"/>',
    ),
    previewUrl: createSvgStickerUrl(
      '<path fill="#BF5AF2" d="M24 104l16-64 48 48-64 16z"/><circle cx="84" cy="32" r="6" fill="#FF375F"/><circle cx="98" cy="48" r="5" fill="#FFD60A"/><circle cx="72" cy="18" r="4" fill="#30D158"/><circle cx="106" cy="24" r="5" fill="#64D2FF"/>',
    ),
    width: 128,
    height: 128,
  },
  {
    id: 'curated-sticker-crown',
    title: 'Coroa Dourada / Crown',
    staticUrl: createSvgStickerUrl(
      '<path fill="#FFD60A" d="M20 92l10-56 22 24 12-32 12 32 22-24 10 56H20z"/><circle cx="20" cy="36" r="6" fill="#FF375F"/><circle cx="64" cy="24" r="6" fill="#0071E3"/><circle cx="108" cy="36" r="6" fill="#30D158"/><rect x="20" y="96" width="88" height="12" rx="4" fill="#FF9F0A"/>',
    ),
    previewUrl: createSvgStickerUrl(
      '<path fill="#FFD60A" d="M20 92l10-56 22 24 12-32 12 32 22-24 10 56H20z"/><circle cx="20" cy="36" r="6" fill="#FF375F"/><circle cx="64" cy="24" r="6" fill="#0071E3"/><circle cx="108" cy="36" r="6" fill="#30D158"/><rect x="20" y="96" width="88" height="12" rx="4" fill="#FF9F0A"/>',
    ),
    width: 128,
    height: 128,
  },
  {
    id: 'curated-sticker-diamond',
    title: 'Diamante / Gem',
    staticUrl: createSvgStickerUrl(
      '<polygon points="40,24 88,24 112,52 64,108 16,52" fill="#64D2FF"/><polygon points="40,24 64,52 88,24" fill="#0A84FF"/><polygon points="16,52 64,52 64,108" fill="#0071E3"/>',
    ),
    previewUrl: createSvgStickerUrl(
      '<polygon points="40,24 88,24 112,52 64,108 16,52" fill="#64D2FF"/><polygon points="40,24 64,52 88,24" fill="#0A84FF"/><polygon points="16,52 64,52 64,108" fill="#0071E3"/>',
    ),
    width: 128,
    height: 128,
  },
  {
    id: 'curated-sticker-thumbsup',
    title: 'Joinha / Thumbs Up',
    staticUrl: createSvgStickerUrl(
      '<path fill="#FFD60A" d="M48 48V28c0-8.8-7.2-16-16-16-3.3 0-6 2.7-6 6v30h-8c-5.5 0-10 4.5-10 10v40c0 5.5 4.5 10 10 10h56c7.4 0 13.8-5 15.5-12.2l6.8-29.2c1.4-6-1.7-12.1-7.4-14.6-2.2-1-4.7-1.4-7.2-1.4H68c4.4-4.4 8-11.4 8-18.6V48H48z"/>',
    ),
    previewUrl: createSvgStickerUrl(
      '<path fill="#FFD60A" d="M48 48V28c0-8.8-7.2-16-16-16-3.3 0-6 2.7-6 6v30h-8c-5.5 0-10 4.5-10 10v40c0 5.5 4.5 10 10 10h56c7.4 0 13.8-5 15.5-12.2l6.8-29.2c1.4-6-1.7-12.1-7.4-14.6-2.2-1-4.7-1.4-7.2-1.4H68c4.4-4.4 8-11.4 8-18.6V48H48z"/>',
    ),
    width: 128,
    height: 128,
  },
  {
    id: 'curated-sticker-lightning',
    title: 'Raio de Energia / Lightning',
    staticUrl: createSvgStickerUrl(
      '<polygon points="72,8 24,72 60,72 48,120 104,52 68,52" fill="#FFD60A" stroke="#FF9F0A" stroke-width="4"/>',
    ),
    previewUrl: createSvgStickerUrl(
      '<polygon points="72,8 24,72 60,72 48,120 104,52 68,52" fill="#FFD60A" stroke="#FF9F0A" stroke-width="4"/>',
    ),
    width: 128,
    height: 128,
  },
  {
    id: 'curated-sticker-verified',
    title: 'Selo Verificado / Verified Badge',
    staticUrl: createSvgStickerUrl(
      '<path fill="#0071E3" d="M64 12l10 8 13-3 5 12 13 4-1 13 9 9-7 11 4 13-12 5-3 13-13-1-8 10-10-8-13 3-5-12-13-4 1-13-9-9 7-11-4-13 12-5 3-13 13 1z"/><path fill="#FFFFFF" d="M54 62l-10-10-6 6 16 16 34-34-6-6z"/>',
    ),
    previewUrl: createSvgStickerUrl(
      '<path fill="#0071E3" d="M64 12l10 8 13-3 5 12 13 4-1 13 9 9-7 11 4 13-12 5-3 13-13-1-8 10-10-8-13 3-5-12-13-4 1-13-9-9 7-11-4-13 12-5 3-13 13 1z"/><path fill="#FFFFFF" d="M54 62l-10-10-6 6 16 16 34-34-6-6z"/>',
    ),
    width: 128,
    height: 128,
  },
  {
    id: 'curated-sticker-palette',
    title: 'Paleta do Artista / Palette',
    staticUrl: createSvgStickerUrl(
      '<path fill="#D1D1D6" d="M64 16C37.5 16 16 37.5 16 64c0 14.3 6.3 27.2 16.3 36 3.7 3.3 8.7 5.2 13.7 5.2h6.5c7.2 0 13-5.8 13-13 0-3.3-1.2-6.3-3.2-8.6-2.5-2.8-4-6.5-4-10.6 0-8.8 7.2-16 16-16h8.7c18.4 0 33.3-14.9 33.3-33.3C116.3 32.3 92.8 16 64 16z"/><circle cx="40" cy="44" r="8" fill="#FF375F"/><circle cx="64" cy="34" r="8" fill="#FFD60A"/><circle cx="88" cy="44" r="8" fill="#30D158"/><circle cx="94" cy="70" r="8" fill="#0071E3"/>',
    ),
    previewUrl: createSvgStickerUrl(
      '<path fill="#D1D1D6" d="M64 16C37.5 16 16 37.5 16 64c0 14.3 6.3 27.2 16.3 36 3.7 3.3 8.7 5.2 13.7 5.2h6.5c7.2 0 13-5.8 13-13 0-3.3-1.2-6.3-3.2-8.6-2.5-2.8-4-6.5-4-10.6 0-8.8 7.2-16 16-16h8.7c18.4 0 33.3-14.9 33.3-33.3C116.3 32.3 92.8 16 64 16z"/><circle cx="40" cy="44" r="8" fill="#FF375F"/><circle cx="64" cy="34" r="8" fill="#FFD60A"/><circle cx="88" cy="44" r="8" fill="#30D158"/><circle cx="94" cy="70" r="8" fill="#0071E3"/>',
    ),
    width: 128,
    height: 128,
  },
];

export function getCuratedFallbackStickers(query = ''): readonly GiphyItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return CURATED_FALLBACK_STICKERS;
  return CURATED_FALLBACK_STICKERS.filter((s) => s.title.toLowerCase().includes(q));
}

export async function searchGiphyStickers(
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

  const endpoint = `/api/v1/media/stickers?query=${encodeURIComponent(
    trimmed,
  )}&limit=${limit}&offset=${offset}`;

  const result = await httpClient.get<{
    readonly items?: readonly GiphyItem[];
    readonly data?: readonly GiphyRawItem[];
  }>(endpoint, { timeoutMs: 6000 });

  if (!result.ok) {
    return getCuratedFallbackStickers(trimmed);
  }

  let items: GiphyItem[] = [];
  if (Array.isArray(result.data.items)) {
    items = [...result.data.items];
  } else if (Array.isArray(result.data.data)) {
    for (const raw of result.data.data) {
      const normalized = normalizeGiphyItem(raw);
      if (normalized) {
        items.push(normalized);
      }
    }
  }

  if (items.length === 0) {
    items = [...getCuratedFallbackStickers(trimmed)];
  }

  if (items.length > 0) {
    setPersistentCache(cacheKey, items);
  }

  return items;
}

export const mediaProvider = {
  searchUnsplashPhotos,
  searchPexelsPhotos,
  fetchUnsplashEditorial,
  fetchPicsumPhotos,
  searchWikimediaCommons,
  searchNasaMedia,
  searchGiphyStickers,
  trackUnsplashDownload,
  getCuratedFallbackPhotos,
  getCuratedFallbackStickers,
  CURATED_FALLBACK_STICKERS,
};
