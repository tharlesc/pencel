import { CURATED_STOCK_PHOTOS } from '../model/presetCatalog.js';
import { getCachedMedia, setCachedMedia } from './persistentMediaCache.js';

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

export const MEDIA_CATEGORIES = [
  'Todos',
  'Veículos',
  'Natureza',
  'Pessoas',
  'Tecnologia',
  'Cidades',
  'Animais',
  'Comida',
  'Espaço',
  'Abstrato',
] as const;

export type MediaCategory = (typeof MEDIA_CATEGORIES)[number];

const CATEGORY_SEARCH_MAP: Record<string, string> = {
  Todos: '',
  Fotos: 'aesthetic photography editorial',
  Natureza: 'nature landscape forest ocean',
  Pessoas: 'portrait person face people',
  Fundos: 'aesthetic wallpaper background minimal texture',
  Veículos: 'car vehicle automobile',
  Tecnologia: 'technology computer future',
  Cidades: 'city architecture urban skyline',
  Animais: 'wildlife animal pet',
  Comida: 'food cuisine delicious',
  Espaço: 'space galaxy nebula cosmos',
  Abstrato: 'abstract texture minimal background',
};

// In-memory cache to prevent duplicate network roundtrips within the same execution
const memoryCache = new Map<string, PublicPhotoItem[]>();

/**
 * Access key from environment or fallback configuration.
 */
function getUnsplashAccessKey(): string {
  try {
    const key =
      import.meta.env?.VITE_UNSPLASH_ACCESS_KEY || 'iysnkhfle5Si2-k2QsgJYLHwaKqFYNVAkdsFiZHb9C8';
    return key.trim();
  } catch {
    return 'iysnkhfle5Si2-k2QsgJYLHwaKqFYNVAkdsFiZHb9C8';
  }
}

function getUnsplashAppName(): string {
  try {
    const name = import.meta.env?.VITE_UNSPLASH_APP_NAME || 'pencelstudio';
    return name.trim();
  } catch {
    return 'pencelstudio';
  }
}

interface UnsplashUser {
  readonly name?: string;
  readonly username?: string;
  readonly links?: {
    readonly html?: string;
  };
}

interface UnsplashUrls {
  readonly raw?: string;
  readonly full?: string;
  readonly regular?: string;
  readonly small?: string;
  readonly thumb?: string;
}

interface UnsplashLinks {
  readonly download_location?: string;
}

interface UnsplashRawPhoto {
  readonly id: string;
  readonly width?: number;
  readonly height?: number;
  readonly description?: string | null;
  readonly alt_description?: string | null;
  readonly urls?: UnsplashUrls;
  readonly user?: UnsplashUser;
  readonly links?: UnsplashLinks;
}

interface UnsplashSearchResponse {
  readonly total?: number;
  readonly total_pages?: number;
  readonly results?: UnsplashRawPhoto[];
}

/**
 * Normalizes an Unsplash photo response into a PublicPhotoItem compliant with
 * Unsplash API Production Guidelines (hotlinking, photographer UTM attribution, download tracking).
 */
function normalizeUnsplashPhoto(
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

/**
 * Triggers an event to the Unsplash download endpoint when an image is used.
 * Required by Unsplash API Guidelines.
 */
export async function trackUnsplashDownload(downloadLocation?: string): Promise<void> {
  if (!downloadLocation) return;
  const accessKey = getUnsplashAccessKey();
  if (!accessKey) return;

  try {
    const separator = downloadLocation.includes('?') ? '&' : '?';
    const endpoint = `${downloadLocation}${separator}client_id=${encodeURIComponent(accessKey)}`;
    await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });
  } catch (err) {
    console.debug('Unsplash download tracking ping completed/ignored:', err);
  }
}

/**
 * Direct search on the official Unsplash API using the registered application key.
 * Backed by persistent localStorage cache.
 */
export async function searchUnsplashPhotos(
  query: string,
  page = 1,
  pageSize = 24,
): Promise<PublicPhotoItem[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const accessKey = getUnsplashAccessKey();
  if (!accessKey) return [];

  const cacheKey = `unsplash-search-${cleanQuery.toLowerCase()}-p-${page}-s-${pageSize}`;
  const persistent = getCachedMedia(cacheKey);
  if (persistent && persistent.length > 0) {
    return persistent;
  }
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey) || [];
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const endpoint = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
      cleanQuery,
    )}&page=${page}&per_page=${pageSize}&orientation=landscape`;

    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        'Accept-Version': 'v1',
      },
    });
    clearTimeout(timeoutId);

    if (res.status === 403 || res.status === 429) {
      console.warn(
        'Unsplash hourly rate limit reached (50 req/hr demo). Falling back seamlessly to public open archive.',
      );
      return [];
    }

    if (!res.ok) {
      return [];
    }

    const data = (await res.json()) as UnsplashSearchResponse;
    const rawResults = data.results || [];

    const items = rawResults
      .filter((p) => Boolean(p.urls?.small || p.urls?.regular))
      .map((p) => normalizeUnsplashPhoto(p, cleanQuery));

    memoryCache.set(cacheKey, items);
    setCachedMedia(cacheKey, items);
    return items;
  } catch (err) {
    console.warn('Unsplash search query failed, using fallback:', cleanQuery, err);
    return [];
  }
}

/**
 * Fetches popular editorial photography directly from Unsplash.
 * Backed by persistent localStorage cache.
 */
export async function fetchUnsplashEditorial(page = 1, pageSize = 24): Promise<PublicPhotoItem[]> {
  const accessKey = getUnsplashAccessKey();
  if (!accessKey) return [];

  const cacheKey = `unsplash-editorial-p-${page}-s-${pageSize}`;
  const persistent = getCachedMedia(cacheKey);
  if (persistent && persistent.length > 0) {
    return persistent;
  }
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey) || [];
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const endpoint = `https://api.unsplash.com/photos?page=${page}&per_page=${pageSize}&order_by=popular`;

    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        'Accept-Version': 'v1',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return [];
    }

    const data = (await res.json()) as UnsplashRawPhoto[];
    if (!Array.isArray(data)) return [];

    const items = data
      .filter((p) => Boolean(p.urls?.small || p.urls?.regular))
      .map((p) => normalizeUnsplashPhoto(p, 'Destaques'));

    memoryCache.set(cacheKey, items);
    setCachedMedia(cacheKey, items);
    return items;
  } catch {
    return [];
  }
}

/**
 * Fetch dynamic free stock photos from Lorem Picsum (https://picsum.photos/).
 * Zero rate limits, high resolution, excellent for infinite scroll feeds without consuming API quotas.
 */
export async function fetchPicsumPhotos(page = 1, limit = 24): Promise<PublicPhotoItem[]> {
  const cacheKey = `picsum-page-${page}-limit-${limit}`;
  const persistent = getCachedMedia(cacheKey);
  if (persistent && persistent.length > 0) {
    return persistent;
  }
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey) || [];
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`https://picsum.photos/v2/list?page=${page}&limit=${limit}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return [];
    }

    interface PicsumRawItem {
      id: string;
      author: string;
      width: number;
      height: number;
      url: string;
      download_url: string;
    }

    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) {
      return [];
    }

    const items: PublicPhotoItem[] = (data as PicsumRawItem[]).map((item) => ({
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

    memoryCache.set(cacheKey, items);
    setCachedMedia(cacheKey, items);
    return items;
  } catch (err) {
    console.debug('Picsum fetch fallback/cached:', err);
    return [];
  }
}

interface WikimediaImageInfo {
  url?: string;
  thumburl?: string;
  mime?: string;
}

interface WikimediaPage {
  pageid?: number;
  title: string;
  imageinfo?: WikimediaImageInfo[];
}

interface WikimediaResponse {
  query?: {
    pages?: Record<string, WikimediaPage>;
  };
}

/**
 * Search Wikimedia Commons (official Wikimedia open API).
 * Fast fallback CDN thumbnails with zero rate limits.
 */
export async function searchWikimediaCommons(
  query: string,
  page = 1,
  pageSize = 30,
): Promise<PublicPhotoItem[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const cacheKey = `wiki-q-${cleanQuery.toLowerCase()}-p-${page}-s-${pageSize}`;
  const persistent = getCachedMedia(cacheKey);
  if (persistent && persistent.length > 0) {
    return persistent;
  }
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey) || [];
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const offset = (page - 1) * pageSize;
    const endpoint = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      cleanQuery,
    )}&gsrnamespace=6&gsrlimit=${pageSize}&gsroffset=${offset}&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=500&format=json&origin=*`;

    const res = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Wikimedia HTTP error: ${res.status}`);
    }

    const data = (await res.json()) as WikimediaResponse;
    const pages = Object.values(data.query?.pages || {});

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

    memoryCache.set(cacheKey, items);
    setCachedMedia(cacheKey, items);
    return items;
  } catch (err) {
    console.warn('Wikimedia query failed, falling back:', cleanQuery, err);
    return [];
  }
}

export const searchOpenversePhotos = searchWikimediaCommons;

/**
 * Search NASA Public Media Library.
 */
export async function searchNasaMedia(query: string): Promise<PublicPhotoItem[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const cacheKey = `nasa-${cleanQuery.toLowerCase()}`;
  const persistent = getCachedMedia(cacheKey);
  if (persistent && persistent.length > 0) {
    return persistent;
  }
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey) || [];
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(
      `https://images-api.nasa.gov/search?q=${encodeURIComponent(cleanQuery)}&media_type=image`,
      { signal: controller.signal },
    );
    clearTimeout(timeoutId);

    if (!res.ok) return [];

    interface NasaRawItem {
      data?: Array<{ nasa_id: string; title: string; description?: string; photographer?: string }>;
      links?: Array<{ href: string; rel: string }>;
    }

    interface NasaResponse {
      collection?: {
        items?: NasaRawItem[];
      };
    }

    const json = (await res.json()) as NasaResponse;
    const rawItems = json.collection?.items?.slice(0, 24) || [];

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

    memoryCache.set(cacheKey, items);
    setCachedMedia(cacheKey, items);
    return items;
  } catch {
    return [];
  }
}

/**
 * Local curated stock photos from presetCatalog.
 */
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

/**
 * Universal media search combining Unsplash API, Picsum, NASA, and Wikimedia Commons.
 * Prioritizes high-resolution photographic results from Unsplash with automatic multi-provider fallback.
 */
export async function searchPublicMedia(query: string, page = 1): Promise<PublicPhotoItem[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const isSpace = /espaço|space|nasa|galaxy|marte|lua|planeta|cosmos|astronomia/i.test(cleanQuery);

  // 1. Try Unsplash API directly with registered credentials (cached persistently)
  const unsplashResults = await searchUnsplashPhotos(cleanQuery, page, 24);

  // 2. Query open archives if Unsplash is rate limited or returned sparse results
  const [wikiResults, nasaResults, picsumResults] = await Promise.all([
    unsplashResults.length < 12
      ? searchWikimediaCommons(cleanQuery, page, 20)
      : Promise.resolve([]),
    isSpace ? searchNasaMedia(cleanQuery) : Promise.resolve([]),
    unsplashResults.length === 0 ? fetchPicsumPhotos(page, 16) : Promise.resolve([]),
  ]);

  const combined = [...unsplashResults, ...nasaResults, ...wikiResults, ...picsumResults];

  if (combined.length === 0 && page === 1) {
    return getCuratedFallbackPhotos().filter(
      (p) =>
        p.title.toLowerCase().includes(cleanQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(cleanQuery.toLowerCase()),
    );
  }

  const seen = new Set<string>();
  return combined.filter((item) => {
    if (!item.fullUrl || seen.has(item.fullUrl)) return false;
    seen.add(item.fullUrl);
    return true;
  });
}

/**
 * Fetch photos tailored to a selected category theme with Unsplash priority and infinite scroll support.
 */
export async function fetchMediaByCategory(category: string, page = 1): Promise<PublicPhotoItem[]> {
  if (category === 'Todos') {
    const [unsplashEditorial, picsumFeed, wikiTrending] = await Promise.all([
      fetchUnsplashEditorial(page, 20),
      fetchPicsumPhotos(page, 16),
      searchWikimediaCommons('nature architecture landscape photography', page, 12),
    ]);

    const curated = page === 1 ? getCuratedFallbackPhotos() : [];
    const combined = [...unsplashEditorial, ...picsumFeed, ...curated, ...wikiTrending];
    const seen = new Set<string>();
    return combined.filter((i) => {
      if (seen.has(i.fullUrl)) return false;
      seen.add(i.fullUrl);
      return true;
    });
  }

  if (category === 'Espaço') {
    const [unsplashSpace, nasa, wikiSpace] = await Promise.all([
      searchUnsplashPhotos('space galaxy nebula cosmos', page, 16),
      searchNasaMedia('galaxy earth cosmos nebula'),
      searchWikimediaCommons('space astronomy cosmos galaxy', page, 12),
    ]);
    const combined = [...unsplashSpace, ...nasa, ...wikiSpace];
    const seen = new Set<string>();
    return combined.filter((i) => {
      if (seen.has(i.fullUrl)) return false;
      seen.add(i.fullUrl);
      return true;
    });
  }

  const queryTerms = CATEGORY_SEARCH_MAP[category] || category;
  const unsplashResults = await searchUnsplashPhotos(queryTerms, page, 20);

  if (unsplashResults.length > 0) {
    return unsplashResults.map((item) => ({
      ...item,
      category,
    }));
  }

  // Fallback to Picsum + Wikimedia Commons if Unsplash rate limited or empty
  const [wikiResults, picsumResults] = await Promise.all([
    searchWikimediaCommons(queryTerms, page, 16),
    fetchPicsumPhotos(page, 12),
  ]);

  const fallbackCombined = [...wikiResults, ...picsumResults];
  if (fallbackCombined.length > 0) {
    return fallbackCombined.map((item) => ({
      ...item,
      category,
    }));
  }

  return getCuratedFallbackPhotos().filter(
    (p) => !p.category || p.category.toLowerCase().includes(category.toLowerCase()),
  );
}
