import {
  fetchPicsumPhotos,
  fetchUnsplashEditorial,
  getCuratedFallbackPhotos,
  searchNasaMedia,
  searchPexelsPhotos,
  searchUnsplashPhotos,
  searchWikimediaCommons,
  trackUnsplashDownload,
  type PublicPhotoItem,
} from './mediaProvider.js';

export {
  fetchPicsumPhotos,
  fetchUnsplashEditorial,
  getCuratedFallbackPhotos,
  searchNasaMedia,
  searchPexelsPhotos,
  searchUnsplashPhotos,
  searchWikimediaCommons,
  trackUnsplashDownload,
  type PublicPhotoItem,
};

export const searchOpenversePhotos = searchWikimediaCommons;

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

export type MediaCategory = (typeof MEDIA_CATEGORIES)[number] | 'Fotos' | 'Fundos';

const CATEGORY_SEARCH_MAP: Readonly<Record<string, string>> = {
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

function deduplicatePhotos(items: readonly PublicPhotoItem[]): PublicPhotoItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.fullUrl || seen.has(item.fullUrl)) return false;
    seen.add(item.fullUrl);
    return true;
  });
}

/**
 * Universal media search combining Unsplash/Pexels backend proxy, Picsum, NASA, and Wikimedia Commons.
 */
export async function searchPublicMedia(query: string, page = 1): Promise<PublicPhotoItem[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const isSpace = /espaço|space|nasa|galaxy|marte|lua|planeta|cosmos|astronomia/i.test(cleanQuery);

  const unsplashResults = await searchUnsplashPhotos(cleanQuery, page, 24);

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

  return deduplicatePhotos(combined);
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
    return deduplicatePhotos([...unsplashEditorial, ...picsumFeed, ...curated, ...wikiTrending]);
  }

  if (category === 'Espaço') {
    const [unsplashSpace, nasa, wikiSpace] = await Promise.all([
      searchUnsplashPhotos('space galaxy nebula cosmos', page, 16),
      searchNasaMedia('galaxy earth cosmos nebula'),
      searchWikimediaCommons('space astronomy cosmos galaxy', page, 12),
    ]);
    return deduplicatePhotos([...unsplashSpace, ...nasa, ...wikiSpace]);
  }

  const queryTerms = CATEGORY_SEARCH_MAP[category] || category;
  const unsplashResults = await searchUnsplashPhotos(queryTerms, page, 20);

  if (unsplashResults.length > 0) {
    return unsplashResults.map((item) => ({
      ...item,
      category,
    }));
  }

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
    (p) =>
      category === 'Fotos' ||
      category === 'Todos' ||
      !p.category ||
      p.category.toLowerCase().includes(category.toLowerCase()),
  );
}
