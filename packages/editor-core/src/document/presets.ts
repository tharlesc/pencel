import type { DocumentFormatPreset, PresetId } from '@pencel/shared-types';

/**
 * Canonical catalog of format presets for Instagram posts, stories, banners, flyers, and ads.
 */
export const DOCUMENT_FORMAT_PRESETS: readonly DocumentFormatPreset[] = [
  {
    id: 'instagram-post',
    name: 'Instagram Post',
    category: 'social',
    description: 'Standard square format for feed (1:1)',
    dimensions: { width: 1080, height: 1080 },
  },
  {
    id: 'instagram-story',
    name: 'Story / Reels',
    category: 'social',
    description: 'Full-screen vertical format (9:16)',
    dimensions: { width: 1080, height: 1920 },
  },
  {
    id: 'web-banner',
    name: 'Full HD Banner',
    category: 'marketing',
    description: 'Widescreen presentation, cover, or digital banner (16:9)',
    dimensions: { width: 1920, height: 1080 },
  },
  {
    id: 'event-flyer',
    name: 'Promotional Flyer',
    category: 'print-digital',
    description: 'Vertical digital leaflet for marketing (3:4)',
    dimensions: { width: 1200, height: 1600 },
  },
  {
    id: 'ad-leaderboard',
    name: 'Horizontal Display Ad',
    category: 'marketing',
    description: 'High-visibility digital campaign banner',
    dimensions: { width: 1200, height: 628 },
  },
] as const;

/**
 * Retrieves a format preset by its identifier, falling back to `instagram-post`.
 */
export function getDocumentPresetById(presetId: PresetId): DocumentFormatPreset {
  const found = DOCUMENT_FORMAT_PRESETS.find((preset) => preset.id === presetId);
  if (found) {
    return found;
  }
  return DOCUMENT_FORMAT_PRESETS[0]!;
}
