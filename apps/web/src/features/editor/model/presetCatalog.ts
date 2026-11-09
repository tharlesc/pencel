import { DOCUMENT_FORMAT_PRESETS } from '@pencel/editor-core';
import type { DocumentFormatPreset } from '@pencel/shared-types';

export interface VisualTemplate {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly description: string;
  readonly previewBg: string;
  readonly previewAccent: string;
  readonly badgeText: string;
  readonly headlineText: string;
}

export const CANVA_TEMPLATES: readonly VisualTemplate[] = [
  {
    id: 'flash-sale',
    name: 'Flash Sale 50% OFF',
    category: 'Sales & E-commerce',
    description: 'High-impact design with attention badge, bold typography, and action button.',
    previewBg: '#111113',
    previewAccent: '#FF3B30',
    badgeText: '50% OFF',
    headlineText: 'FLASH SALE',
  },
  {
    id: 'quote-post',
    name: 'Inspiring Quote',
    category: 'Social Media & Quotes',
    description:
      'Minimalist editorial style with prominent quotation marks and balanced typography.',
    previewBg: '#F5F5F7',
    previewAccent: '#0071E3',
    badgeText: 'INSPIRATION',
    headlineText: 'Design is how it works.',
  },
  {
    id: 'product-launch',
    name: 'Product Launch',
    category: 'Marketing & Launches',
    description: 'Sophisticated layout with elevated card, novelty badge, and discovery button.',
    previewBg: '#0E0E10',
    previewAccent: '#30D158',
    badgeText: 'NEW RELEASE',
    headlineText: 'NEW COLLECTION',
  },
  {
    id: 'event-webinar',
    name: 'Live Workshop & Webinar',
    category: 'Events & Education',
    description: 'Professional composition with date, time, and promotional graphic elements.',
    previewBg: '#192841',
    previewAccent: '#0A84FF',
    badgeText: 'LIVE',
    headlineText: 'Design Masterclass',
  },
  {
    id: 'open-design-hero',
    name: 'Tech SaaS Hero (Open Design)',
    category: 'Web & UI Design',
    description:
      'Modern glassmorphic header with clean typography, version badge, and futuristic call-to-action.',
    previewBg: '#090A0F',
    previewAccent: '#0071E3',
    badgeText: 'OPEN DESIGN',
    headlineText: 'NEXT GEN CLOUD',
  },
  {
    id: 'open-design-carousel',
    name: 'Editorial Carousel (Open Design)',
    category: 'Social Media & Carousels',
    description: 'Seamless multi-slide editorial composition for social feeds with Swiss contrast.',
    previewBg: '#1C1C1E',
    previewAccent: '#FF9F0A',
    badgeText: '01 / 05',
    headlineText: 'THE FUTURE OF CRAFT',
  },
  {
    id: 'open-design-poster',
    name: 'Swiss Typographic Poster (Open Design)',
    category: 'Graphic Design & Posters',
    description: 'International typographic style with geometric grid and strict visual rhythm.',
    previewBg: '#F2F2F7',
    previewAccent: '#FF3B30',
    badgeText: 'SWISS STYLE',
    headlineText: 'BAUHAUS & PROPORTION',
  },
  {
    id: 'open-design-bento',
    name: 'Bento Metrics Card (Open Design)',
    category: 'Marketing & Presentation',
    description:
      'Apple-inspired Bento Box grid highlighting key growth metrics and performance badges.',
    previewBg: '#121316',
    previewAccent: '#30D158',
    badgeText: 'METRICS',
    headlineText: '+240% GROWTH',
  },
];

export interface StockPhoto {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly url: string;
  readonly thumbUrl?: string;
  readonly author?: string;
}

export const CURATED_STOCK_PHOTOS: readonly StockPhoto[] = [
  {
    id: 'photo-workspace',
    name: 'Minimalist Workspace',
    category: 'Business',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=85',
    thumbUrl:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=320&q=75',
    author: 'Unsplash Pro',
  },
  {
    id: 'photo-laptop',
    name: 'Creative Setup',
    category: 'Technology',
    url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=85',
    thumbUrl:
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=320&q=75',
    author: 'Apple Space',
  },
  {
    id: 'photo-coffee',
    name: 'Coffee & Inspiration',
    category: 'Lifestyle',
    url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=85',
    thumbUrl:
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=320&q=75',
    author: 'Coffee Lab',
  },
  {
    id: 'photo-architecture',
    name: 'Modern Architecture',
    category: 'Architecture',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=85',
    thumbUrl:
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=320&q=75',
    author: 'Studio Design',
  },
  {
    id: 'photo-nature',
    name: 'Serene Landscape',
    category: 'Nature',
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=85',
    thumbUrl:
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=320&q=75',
    author: 'Nature Calm',
  },
  {
    id: 'photo-portrait',
    name: 'Expressive Portrait',
    category: 'People',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85',
    thumbUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=320&q=75',
    author: 'Portrait Studio',
  },
  {
    id: 'photo-code',
    name: 'Code & Engineering',
    category: 'Technology',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=85',
    thumbUrl:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=320&q=75',
    author: 'Dev Workspace',
  },
  {
    id: 'photo-mountain',
    name: 'Mountains & Horizon',
    category: 'Nature',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85',
    thumbUrl:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=320&q=75',
    author: 'Alps Explorer',
  },
  {
    id: 'photo-urban',
    name: 'Night Metropolis',
    category: 'Architecture',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=85',
    thumbUrl:
      'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=320&q=75',
    author: 'Tokyo Skyline',
  },
  {
    id: 'photo-art',
    name: 'Abstract Canvas',
    category: 'Abstract',
    url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=85',
    thumbUrl:
      'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=320&q=75',
    author: 'Color Wave',
  },
  {
    id: 'photo-team',
    name: 'Team Collaboration',
    category: 'Business',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=85',
    thumbUrl:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=320&q=75',
    author: 'Team Collab',
  },
  {
    id: 'photo-plant',
    name: 'Botanical Harmony',
    category: 'Nature',
    url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=1200&q=85',
    thumbUrl:
      'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=320&q=75',
    author: 'Green Living',
  },
];

export const CANVA_PALETTE_SWATCHES = [
  { label: 'Studio White', value: '#FBFBFD' },
  { label: 'Soft Alabaster', value: '#F4F4F6' },
  { label: 'Dark Graphite', value: '#1D1D1F' },
  { label: 'Deep Charcoal', value: '#121214' },
  { label: 'Studio Blue', value: '#0066CC' },
  { label: 'System Blue', value: '#0A84FF' },
  { label: 'Editorial Violet', value: '#7C3AED' },
  { label: 'Vibrant Coral', value: '#DC2626' },
  { label: 'Solar Amber', value: '#D97706' },
  { label: 'Emerald Green', value: '#16A34A' },
  { label: 'Carmine Rose', value: '#E11D48' },
  { label: 'Terracotta', value: '#EA580C' },
] as const;

export const STUDIO_BACKGROUND_SWATCHES = CANVA_PALETTE_SWATCHES;
export type PaletteSwatch = (typeof CANVA_PALETTE_SWATCHES)[number];

export function getFormatPresetsCatalog(): readonly DocumentFormatPreset[] {
  return DOCUMENT_FORMAT_PRESETS;
}
