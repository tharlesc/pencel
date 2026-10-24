import { searchGiphyStickers, type GiphyItem } from './mediaProvider.js';

export type { GiphyItem };

/**
 * Searches GIPHY static stickers and graphics through the unified mediaProvider & backend proxy.
 */
export async function searchGiphyStills(
  query: string,
  limit = 24,
  offset = 0,
): Promise<readonly GiphyItem[]> {
  return searchGiphyStickers(query, limit, offset);
}
