import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearExpiredMediaCache,
  getCachedMedia,
  setCachedMedia,
} from '../src/features/editor/services/persistentMediaCache.js';
import {
  fetchPicsumPhotos,
  searchUnsplashPhotos,
  type PublicPhotoItem,
} from '../src/features/editor/services/publicMediaService.js';

describe('Persistent Media Cache & Picsum Photos Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('stores and retrieves cached media items with TTL', () => {
    const mockItems: PublicPhotoItem[] = [
      {
        id: 'test-1',
        title: 'Montanha Neve',
        thumbUrl: 'https://images.unsplash.com/thumb-1',
        fullUrl: 'https://images.unsplash.com/full-1',
        source: 'Unsplash',
        author: 'Fotógrafo 1',
      },
    ];

    setCachedMedia('query:montanha:page:1', mockItems);
    const cached = getCachedMedia('query:montanha:page:1');

    expect(cached).not.toBeNull();
    expect(cached).toHaveLength(1);
    expect(cached?.[0]?.title).toBe('Montanha Neve');
  });

  it('returns null for non-existent cache keys', () => {
    const result = getCachedMedia('non-existent-key');
    expect(result).toBeNull();
  });

  it('clears expired cache items without throwing', () => {
    expect(() => clearExpiredMediaCache()).not.toThrow();
  });

  it('fetches and normalizes Picsum Photos', async () => {
    const mockPicsum = [
      {
        id: '10',
        author: 'Paul Jarvis',
        width: 2500,
        height: 1667,
        url: 'https://unsplash.com/photos/6J--NXulQCs',
        download_url: 'https://picsum.photos/id/10/2500/1667',
      },
      {
        id: '11',
        author: 'Paul Jarvis',
        width: 2500,
        height: 1667,
        url: 'https://unsplash.com/photos/AwfgflLGaVQ',
        download_url: 'https://picsum.photos/id/11/2500/1667',
      },
    ];

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockPicsum,
    } as unknown as Response);

    const items = await fetchPicsumPhotos(1, 10);
    expect(fetchSpy).toHaveBeenCalled();
    expect(items).toHaveLength(2);
    expect(items[0]?.source).toBe('Lorem Picsum');
    expect(items[0]?.author).toBe('Paul Jarvis');
    expect(items[0]?.thumbUrl).toContain('picsum.photos/id/10/400/300');
    expect(items[0]?.fullUrl).toContain('picsum.photos/id/10/1600/1200');
  });

  it('handles Picsum network failures gracefully with empty fallback', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    const items = await fetchPicsumPhotos(99, 10);
    expect(Array.isArray(items)).toBe(true);
    expect(items).toHaveLength(0);
  });

  it('serves cached results in searchUnsplashPhotos when available', async () => {
    const mockItems: PublicPhotoItem[] = [
      {
        id: 'cached-1',
        title: 'Item em Cache',
        author: 'Autor de Teste',
        thumbUrl: 'https://cached.thumb.jpg',
        fullUrl: 'https://cached.full.jpg',
        source: 'Unsplash',
      },
    ];

    setCachedMedia('unsplash-search-veículos-p-1-s-24', mockItems);

    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const results = await searchUnsplashPhotos('veículos', 1, 24);

    expect(results).toEqual(mockItems);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
