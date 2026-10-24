import { beforeEach, describe, expect, it, vi } from 'vitest';
import { searchGiphyStills } from '../src/features/editor/services/giphyService.js';

describe('GIPHY Stills Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('fetches trending static gifs and prefers original_still or 480w_still', async () => {
    const mockPayload = {
      data: [
        {
          id: 'test-gif-1',
          title: 'Happy Dance GIF',
          images: {
            original_still: {
              url: 'https://media.giphy.com/media/test1/giphy_s.gif',
              width: '400',
              height: '300',
            },
            fixed_height_still: {
              url: 'https://media.giphy.com/media/test1/200_s.gif',
            },
          },
        },
      ],
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockPayload,
    } as Response);

    const results = await searchGiphyStills('');
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe('test-gif-1');
    expect(results[0]?.title).toBe('Happy Dance');
    expect(results[0]?.staticUrl).toBe('https://media.giphy.com/media/test1/giphy_s.gif');
    expect(results[0]?.width).toBe(400);
    expect(results[0]?.height).toBe(300);
  });

  it('serves results from persistent cache on secondary call without network fetch', async () => {
    const mockPayload = {
      data: [
        {
          id: 'cached-gif',
          title: 'Cached Sticker GIF',
          images: {
            '480w_still': {
              url: 'https://media.giphy.com/media/cached/480w_s.jpg',
            },
          },
        },
      ],
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockPayload,
    } as Response);

    const first = await searchGiphyStills('sparkles');
    expect(first).toHaveLength(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Second call should hit localStorage cache
    const second = await searchGiphyStills('sparkles');
    expect(second).toHaveLength(1);
    expect(second[0]?.staticUrl).toBe('https://media.giphy.com/media/cached/480w_s.jpg');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('handles network failure gracefully returning empty array', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    const results = await searchGiphyStills('nonexistent_query_fail');
    expect(results).toEqual([]);
  });
});
