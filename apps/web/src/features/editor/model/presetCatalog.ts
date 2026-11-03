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
    name: 'Super Promoção 50% OFF',
    category: 'Vendas & E-commerce',
    description: 'Design de alto impacto com badge chamativo, tipografia bold e botão de ação.',
    previewBg: '#111113',
    previewAccent: '#FF3B30',
    badgeText: '50% OFF',
    headlineText: 'SUPER PROMOÇÃO',
  },
  {
    id: 'quote-post',
    name: 'Citação Inspiradora',
    category: 'Redes Sociais & Frases',
    description: 'Estilo editorial minimalista com aspas marcantes e tipografia balanceada.',
    previewBg: '#F5F5F7',
    previewAccent: '#0071E3',
    badgeText: 'INSPIRAÇÃO',
    headlineText: 'Design é como funciona.',
  },
  {
    id: 'product-launch',
    name: 'Lançamento de Produto',
    category: 'Marketing & Lançamento',
    description: 'Layout sofisticado com card elevado, tag de novidade e botão de descoberta.',
    previewBg: '#0E0E10',
    previewAccent: '#30D158',
    badgeText: 'NOVIDADE',
    headlineText: 'NOVA COLEÇÃO',
  },
  {
    id: 'event-webinar',
    name: 'Workshop / Live Especial',
    category: 'Eventos & Aulas',
    description: 'Composição profissional com data, horário e elementos gráficos para anúncios.',
    previewBg: '#192841',
    previewAccent: '#0A84FF',
    badgeText: 'AO VIVO',
    headlineText: 'Workshop de Design',
  },
  {
    id: 'open-design-hero',
    name: 'Hero Tech SaaS (Open Design)',
    category: 'Web & UI Design',
    description:
      'Header moderno em glassmorphism com tipografia limpa, badge de versão e call-to-action futurista.',
    previewBg: '#090A0F',
    previewAccent: '#0071E3',
    badgeText: 'OPEN DESIGN',
    headlineText: 'NEXT GEN CLOUD',
  },
  {
    id: 'open-design-carousel',
    name: 'Carrossel Editorial (Open Design)',
    category: 'Redes Sociais & Carrossel',
    description:
      'Composição editorial contínua para Instagram com paginação elegante e contraste suíço.',
    previewBg: '#1C1C1E',
    previewAccent: '#FF9F0A',
    badgeText: '01 / 05',
    headlineText: 'THE FUTURE OF CRAFT',
  },
  {
    id: 'open-design-poster',
    name: 'Pôster Tipográfico Suíço (Open Design)',
    category: 'Design Gráfico & Arte',
    description:
      'Estilo tipográfico internacional de alta precisão com grid geométrico e foco em ritmo visual.',
    previewBg: '#F2F2F7',
    previewAccent: '#FF3B30',
    badgeText: 'SWISS STYLE',
    headlineText: 'BAUHAUS & PROPORTION',
  },
  {
    id: 'open-design-bento',
    name: 'Card Bento Métricas (Open Design)',
    category: 'Marketing & Apresentação',
    description:
      'Grid no estilo Apple Bento Box destacando métricas de crescimento e badges de performance.',
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
    name: 'Workspace Minimalista',
    category: 'Negócios',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=85',
    thumbUrl:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=320&q=75',
    author: 'Unsplash Pro',
  },
  {
    id: 'photo-laptop',
    name: 'Setup Criativo',
    category: 'Tecnologia',
    url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=85',
    thumbUrl:
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=320&q=75',
    author: 'Apple Space',
  },
  {
    id: 'photo-coffee',
    name: 'Café & Inspiração',
    category: 'Lifestyle',
    url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=85',
    thumbUrl:
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=320&q=75',
    author: 'Coffee Lab',
  },
  {
    id: 'photo-architecture',
    name: 'Arquitetura Moderna',
    category: 'Arquitetura',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=85',
    thumbUrl:
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=320&q=75',
    author: 'Studio Design',
  },
  {
    id: 'photo-nature',
    name: 'Paisagem Serenidade',
    category: 'Natureza',
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=85',
    thumbUrl:
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=320&q=75',
    author: 'Nature Calm',
  },
  {
    id: 'photo-portrait',
    name: 'Retrato Expressivo',
    category: 'Pessoas',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85',
    thumbUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=320&q=75',
    author: 'Portrait Studio',
  },
  {
    id: 'photo-code',
    name: 'Código & Engenharia',
    category: 'Tecnologia',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=85',
    thumbUrl:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=320&q=75',
    author: 'Dev Workspace',
  },
  {
    id: 'photo-mountain',
    name: 'Montanhas & Horizonte',
    category: 'Natureza',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85',
    thumbUrl:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=320&q=75',
    author: 'Alps Explorer',
  },
  {
    id: 'photo-urban',
    name: 'Metrópole Noturna',
    category: 'Arquitetura',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=85',
    thumbUrl:
      'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=320&q=75',
    author: 'Tokyo Skyline',
  },
  {
    id: 'photo-art',
    name: 'Pintura Abstrata',
    category: 'Abstrato',
    url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=85',
    thumbUrl:
      'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=320&q=75',
    author: 'Color Wave',
  },
  {
    id: 'photo-team',
    name: 'Colaboração & Equipe',
    category: 'Negócios',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=85',
    thumbUrl:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=320&q=75',
    author: 'Team Collab',
  },
  {
    id: 'photo-plant',
    name: 'Design Botânico',
    category: 'Natureza',
    url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=1200&q=85',
    thumbUrl:
      'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=320&q=75',
    author: 'Green Living',
  },
];

export const CANVA_PALETTE_SWATCHES = [
  { label: 'Branco Estúdio', value: '#FBFBFD' },
  { label: 'Alabastro Suave', value: '#F4F4F6' },
  { label: 'Grafite Escuro', value: '#1D1D1F' },
  { label: 'Carvão Profundo', value: '#121214' },
  { label: 'Azul Estúdio', value: '#0066CC' },
  { label: 'Azul Sistema', value: '#0A84FF' },
  { label: 'Violeta Editorial', value: '#7C3AED' },
  { label: 'Coral Vibrante', value: '#DC2626' },
  { label: 'Âmbar Solar', value: '#D97706' },
  { label: 'Verde Esmeralda', value: '#16A34A' },
  { label: 'Rosa Carmim', value: '#E11D48' },
  { label: 'Terracota', value: '#EA580C' },
] as const;

export const STUDIO_BACKGROUND_SWATCHES = CANVA_PALETTE_SWATCHES;
export type PaletteSwatch = (typeof CANVA_PALETTE_SWATCHES)[number];

export function getFormatPresetsCatalog(): readonly DocumentFormatPreset[] {
  return DOCUMENT_FORMAT_PRESETS;
}
