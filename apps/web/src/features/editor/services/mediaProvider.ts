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
  if (Array.isArray(result.data.items)) {
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
        fullUrl: info.url || info.thumburl || '',
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
    return [];
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
};
