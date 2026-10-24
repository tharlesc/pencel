import { describe, expect, it, vi } from 'vitest';
import {
  DESIGNER_PALETTES,
  generateColormindPalette,
  getColorShadesAndTints,
} from '../src/features/editor/services/colorIntelligenceService.js';
import {
  POPULAR_BRANDS,
  POPULAR_CURATED_EMOJIS,
  getBrandIconUrl,
  searchEmojis,
  searchIconifyIcons,
} from '../src/features/editor/services/elementsService.js';
import {
  EXPANDED_FONT_CATALOG,
  loadWebFont,
} from '../src/features/editor/services/fontLoaderService.js';

describe('Color Intelligence Service (Colormind + Pickshade-style shades)', () => {
  it('computes 6 tints and 6 shades from a hex base color', () => {
    const analysis = getColorShadesAndTints('#0071E3');
    expect(analysis.baseHex.toUpperCase()).toBe('#0071E3');
    expect(analysis.tints).toHaveLength(6);
    expect(analysis.shades).toHaveLength(6);
    expect(analysis.complementary).toMatch(/^#[0-9A-F]{6}$/i);
    expect(analysis.triadic).toHaveLength(2);
    expect(analysis.analogous).toHaveLength(2);
    expect(analysis.contrastOnWhite).toBeGreaterThan(0);
    expect(analysis.contrastOnBlack).toBeGreaterThan(0);
  });

  it('handles 3-digit hex strings gracefully', () => {
    const analysis = getColorShadesAndTints('#FFF');
    expect(analysis.tints).toHaveLength(6);
    expect(analysis.shades).toHaveLength(6);
  });

  it('provides curated designer palettes with 5 colors each', () => {
    expect(DESIGNER_PALETTES.length).toBeGreaterThan(0);
    DESIGNER_PALETTES.forEach((palette) => {
      expect(palette.colors).toHaveLength(5);
      palette.colors.forEach((color) => {
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });

  it('generates an intelligent palette via Colormind API or algorithmic fallback', async () => {
    const mockApiResponse = {
      result: [
        [0, 113, 227],
        [48, 209, 88],
        [255, 159, 10],
        [28, 28, 30],
        [245, 245, 247],
      ],
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as unknown as Response);

    const colors = await generateColormindPalette('#0071E3');
    expect(colors).toHaveLength(5);
    expect(colors[0]).toBe('#0071E3');

    fetchSpy.mockRestore();
  });

  it('falls back to algorithmic harmony when Colormind API fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('CORS or offline'));

    const colors = await generateColormindPalette('#FF0000');
    expect(colors).toHaveLength(5);
    expect(colors[0]).toBe('#FF0000');
  });
});

describe('Elements Service (Emojis, Iconify, and Brand Icons)', () => {
  it('searches emojis across all categories', async () => {
    const all = await searchEmojis();
    expect(all.length).toBe(POPULAR_CURATED_EMOJIS.length);

    const smileys = await searchEmojis('Sorridente');
    expect(smileys.length).toBeGreaterThan(0);
    expect(smileys.some((e) => e.char === '😊')).toBe(true);
  });

  it('searches and normalizes Iconify vector icons', async () => {
    const mockIconifyResponse = {
      icons: ['lucide:heart', 'lucide:star'],
      total: 2,
      limit: 2,
      start: 0,
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockIconifyResponse,
    } as unknown as Response);

    const results = await searchIconifyIcons('star');
    expect(fetchSpy).toHaveBeenCalled();
    expect(results).toHaveLength(2);
    expect(results[0]?.name).toBe('heart');
    expect(results[0]?.svgUrl).toContain('api.iconify.design/lucide/heart.svg');

    fetchSpy.mockRestore();
  });

  it('resolves brand icon URL via vector SVG', () => {
    const google = POPULAR_BRANDS.find((b) => b.domain === 'google.com');
    expect(google).toBeDefined();
    if (google) {
      const url = getBrandIconUrl(google.domain);
      expect(url).toContain('api.iconify.design');
      expect(url).toContain('google');
      expect(url).toContain('width=512');
    }
  });
});

describe('Font Loader Service (Typography Expansion)', () => {
  it('defines expanded typography across 5 distinct categories', () => {
    const categories = new Set(EXPANDED_FONT_CATALOG.map((f) => f.category));
    expect(categories.has('Sans-Serif')).toBe(true);
    expect(categories.has('Serif')).toBe(true);
    expect(categories.has('Display')).toBe(true);
    expect(categories.has('Script')).toBe(true);
    expect(categories.has('Monospace')).toBe(true);
  });

  it('loads Google Fonts dynamically without crashing', async () => {
    const font = EXPANDED_FONT_CATALOG.find((f) => f.id === 'poppins');
    expect(font).toBeDefined();
    if (font) {
      const success = await loadWebFont(font);
      expect(success).toBe(true);
    }
  });

  it('returns true immediately for non-Google system fonts', async () => {
    const systemFont = EXPANDED_FONT_CATALOG.find((f) => f.id === 'georgia');
    expect(systemFont).toBeDefined();
    if (systemFont) {
      const success = await loadWebFont(systemFont);
      expect(success).toBe(true);
    }
  });
});
