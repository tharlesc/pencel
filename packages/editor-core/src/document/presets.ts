import type { DocumentFormatPreset, PresetId } from '@pencel/shared-types';

/**
 * Canonical catalog of format presets for Instagram posts, stories, banners, flyers, and ads.
 */
export const DOCUMENT_FORMAT_PRESETS: readonly DocumentFormatPreset[] = [
  {
    id: 'instagram-post',
    name: 'Post de Instagram',
    category: 'social',
    description: 'Formato quadrado padrão para feed (1:1)',
    dimensions: { width: 1080, height: 1080 },
  },
  {
    id: 'instagram-story',
    name: 'Story / Reels',
    category: 'social',
    description: 'Formato vertical em tela cheia (9:16)',
    dimensions: { width: 1080, height: 1920 },
  },
  {
    id: 'web-banner',
    name: 'Banner Full HD',
    category: 'marketing',
    description: 'Apresentação, capa ou banner digital widescreen (16:9)',
    dimensions: { width: 1920, height: 1080 },
  },
  {
    id: 'event-flyer',
    name: 'Flyer Promocional',
    category: 'print-digital',
    description: 'Folheto digital vertical para divulgação (3:4)',
    dimensions: { width: 1200, height: 1600 },
  },
  {
    id: 'ad-leaderboard',
    name: 'Peça Publicitária Horizontal',
    category: 'marketing',
    description: 'Anúncio display de alta visibilidade para campanhas',
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
