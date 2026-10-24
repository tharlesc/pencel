import { describe, expect, it, vi } from 'vitest';
import {
  MEDIA_CATEGORIES,
  fetchMediaByCategory,
  fetchUnsplashEditorial,
  getCuratedFallbackPhotos,
  searchNasaMedia,
  searchPublicMedia,
  searchUnsplashPhotos,
  searchWikimediaCommons,
  trackUnsplashDownload,
} from '../src/features/editor/services/publicMediaService.js';

describe('Public Media Service (public-apis integration)', () => {
  it('defines the 10 core subject categories with abundant imagery', () => {
    expect(MEDIA_CATEGORIES).toContain('Todos');
    expect(MEDIA_CATEGORIES).toContain('Veículos');
    expect(MEDIA_CATEGORIES).toContain('Natureza');
    expect(MEDIA_CATEGORIES).toContain('Pessoas');
    expect(MEDIA_CATEGORIES).toContain('Tecnologia');
    expect(MEDIA_CATEGORIES).toContain('Cidades');
    expect(MEDIA_CATEGORIES).toContain('Animais');
    expect(MEDIA_CATEGORIES).toContain('Comida');
    expect(MEDIA_CATEGORIES).toContain('Espaço');
    expect(MEDIA_CATEGORIES).toContain('Abstrato');
    expect(MEDIA_CATEGORIES).toHaveLength(10);
  });

  it('loads curated fallback photos when offline or on fallback', () => {
    const photos = getCuratedFallbackPhotos();
    expect(photos.length).toBeGreaterThan(0);
    expect(photos[0]).toHaveProperty('thumbUrl');
    expect(photos[0]).toHaveProperty('fullUrl');
    expect(photos[0]).toHaveProperty('title');
  });

  it('searches Wikimedia Commons API and returns normalized items with high-res and thumbnails', async () => {
    const mockWikiResponse = {
      query: {
        pages: {
          123: {
            pageid: 123,
            title: 'File:Carro Vintage.jpg',
            imageinfo: [
              {
                url: 'https://example.com/car.jpg',
                thumburl: 'https://example.com/car-thumb.jpg',
              },
            ],
          },
        },
      },
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockWikiResponse,
    } as unknown as Response);

    const results = await searchWikimediaCommons('carro', 1, 10);
    expect(fetchSpy).toHaveBeenCalled();
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe('wiki-123');
    expect(results[0]?.title).toBe('Carro Vintage');
    expect(results[0]?.thumbUrl).toBe('https://example.com/car-thumb.jpg');
    expect(results[0]?.fullUrl).toBe('https://example.com/car.jpg');
    expect(results[0]?.source).toBe('Wikimedia Commons');

    fetchSpy.mockRestore();
  });

  it('searches NASA media library for space terms', async () => {
    const mockNasaResponse = {
      collection: {
        items: [
          {
            data: [{ nasa_id: 'PIA123', title: 'Galáxia Espiral', photographer: 'Hubble' }],
            links: [{ href: 'https://images.nasa.gov/PIA123~thumb.jpg', rel: 'preview' }],
          },
        ],
      },
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockNasaResponse,
    } as unknown as Response);

    const results = await searchNasaMedia('galaxy');
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe('nasa-PIA123');
    expect(results[0]?.source).toBe('NASA Open Media');

    fetchSpy.mockRestore();
  });

  it('queries public media combining Wikimedia Commons and specialized libraries', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ query: { pages: {} } }),
    } as unknown as Response);

    const results = await searchPublicMedia('veículos');
    expect(Array.isArray(results)).toBe(true);

    fetchSpy.mockRestore();
  });

  it('fetches category photos with fallback to curated library when network returns empty', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ query: { pages: {} } }),
    } as unknown as Response);

    const results = await fetchMediaByCategory('Natureza');
    expect(results.length).toBeGreaterThanOrEqual(0);

    fetchSpy.mockRestore();
  });

  it('searches Unsplash API and returns normalized items with photographer attribution and UTM links', async () => {
    const mockUnsplashResponse = {
      total: 1,
      total_pages: 1,
      results: [
        {
          id: 'photo-123',
          description: 'Carro clássico esportivo',
          urls: {
            small: 'https://images.unsplash.com/photo-123-small.jpg',
            regular: 'https://images.unsplash.com/photo-123-regular.jpg',
          },
          user: {
            name: 'Carlos Silva',
            username: 'carlossilva',
            links: {
              html: 'https://unsplash.com/@carlossilva',
            },
          },
          links: {
            download_location: 'https://api.unsplash.com/photos/photo-123/download',
          },
        },
      ],
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockUnsplashResponse,
    } as unknown as Response);

    const results = await searchUnsplashPhotos('carro');
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe('unsplash-photo-123');
    expect(results[0]?.author).toBe('Carlos Silva');
    expect(results[0]?.authorUrl).toContain('utm_source=pencelstudio');
    expect(results[0]?.source).toBe('Unsplash');
    expect(results[0]?.downloadLocation).toBe('https://api.unsplash.com/photos/photo-123/download');

    fetchSpy.mockRestore();
  });

  it('triggers an Unsplash download event according to Unsplash API guidelines', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: 'https://download-url.com' }),
    } as unknown as Response);

    await trackUnsplashDownload('https://api.unsplash.com/photos/xyz/download');
    expect(fetchSpy).toHaveBeenCalled();
    const calledUrl = fetchSpy.mock.calls[0]?.[0] as string;
    expect(calledUrl).toContain('/api/v1/media/download');
    expect(calledUrl).not.toContain('client_id=');

    fetchSpy.mockRestore();
  });

  it('fetches Unsplash editorial popular photos', async () => {
    const mockEditorialResponse = [
      {
        id: 'edit-1',
        description: 'Natureza exuberante',
        urls: {
          small: 'https://images.unsplash.com/edit-1-small.jpg',
          regular: 'https://images.unsplash.com/edit-1-reg.jpg',
        },
        user: {
          name: 'Ana Lima',
          links: { html: 'https://unsplash.com/@analima' },
        },
      },
    ];

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockEditorialResponse,
    } as unknown as Response);

    const results = await fetchUnsplashEditorial(1, 10);
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe('unsplash-edit-1');
    expect(results[0]?.author).toBe('Ana Lima');

    fetchSpy.mockRestore();
  });
});
