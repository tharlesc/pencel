import type { Dimensions } from '@pencel/shared-types';
import type { SupportedLocale } from '../../../../../shared/i18n/index.js';
import type {
  CreativePieceType,
  LayoutCompositionArchetype,
  LayoutStyleTheme,
} from '../../../services/aiLayoutService.js';

export type StyleOption = Extract<
  LayoutStyleTheme,
  'tech' | 'promo' | 'minimal' | 'elegant' | 'vibrant' | 'editorial' | 'organic'
>;

export interface LocalizedStyle {
  readonly id: StyleOption;
  readonly label: string;
  readonly desc: string;
  readonly swatches: readonly [string, string, string];
}

export const STYLE_OPTIONS_BY_LOCALE: Record<SupportedLocale, readonly LocalizedStyle[]> = {
  en: [
    {
      id: 'tech',
      label: 'Tech & Dark',
      desc: 'Graphite depth & optical blue',
      swatches: ['#0B0D13', '#151922', '#0A84FF'],
    },
    {
      id: 'promo',
      label: 'Promotion',
      desc: 'Bold conversion & urgency',
      swatches: ['#121214', '#FF3B30', '#FFD60A'],
    },
    {
      id: 'minimal',
      label: 'Minimalist',
      desc: 'Swiss grid & clean space',
      swatches: ['#F5F5F7', '#FBFBFD', '#1D1D1F'],
    },
    {
      id: 'editorial',
      label: 'Editorial',
      desc: 'Magazine serif & warm ink',
      swatches: ['#F6F2EA', '#C84B31', '#17171A'],
    },
    {
      id: 'elegant',
      label: 'Elegant',
      desc: 'Midnight tone & gold craft',
      swatches: ['#16161D', '#D4AF37', '#FAF7F0'],
    },
    {
      id: 'vibrant',
      label: 'Vibrant',
      desc: 'Expressive color & energy',
      swatches: ['#0D0E15', '#BF5AF2', '#30D158'],
    },
    {
      id: 'organic',
      label: 'Organic',
      desc: 'Botanical earth & calm tone',
      swatches: ['#F3F1EC', '#1E4D3B', '#C96F4B'],
    },
  ],
  pt: [
    {
      id: 'tech',
      label: 'Tech & Dark',
      desc: 'Grafite profundo e azul óptico',
      swatches: ['#0B0D13', '#151922', '#0A84FF'],
    },
    {
      id: 'promo',
      label: 'Promoção',
      desc: 'Conversão alta e destaque',
      swatches: ['#121214', '#FF3B30', '#FFD60A'],
    },
    {
      id: 'minimal',
      label: 'Minimalista',
      desc: 'Grid suíço e espaço limpo',
      swatches: ['#F5F5F7', '#FBFBFD', '#1D1D1F'],
    },
    {
      id: 'editorial',
      label: 'Editorial',
      desc: 'Serifa de revista e papel quente',
      swatches: ['#F6F2EA', '#C84B31', '#17171A'],
    },
    {
      id: 'elegant',
      label: 'Elegante',
      desc: 'Tons nobres e dourado sutil',
      swatches: ['#16161D', '#D4AF37', '#FAF7F0'],
    },
    {
      id: 'vibrant',
      label: 'Vibrante',
      desc: 'Cores dinâmicas e presença',
      swatches: ['#0D0E15', '#BF5AF2', '#30D158'],
    },
    {
      id: 'organic',
      label: 'Orgânico',
      desc: 'Tons naturais e calma botânica',
      swatches: ['#F3F1EC', '#1E4D3B', '#C96F4B'],
    },
  ],
  es: [
    {
      id: 'tech',
      label: 'Tech y Oscuro',
      desc: 'Grafito profundo y azul óptico',
      swatches: ['#0B0D13', '#151922', '#0A84FF'],
    },
    {
      id: 'promo',
      label: 'Promoción',
      desc: 'Conversión alta y urgencia',
      swatches: ['#121214', '#FF3B30', '#FFD60A'],
    },
    {
      id: 'minimal',
      label: 'Minimalista',
      desc: 'Grid suizo y espacio limpio',
      swatches: ['#F5F5F7', '#FBFBFD', '#1D1D1F'],
    },
    {
      id: 'editorial',
      label: 'Editorial',
      desc: 'Serifa de revista y papel cálido',
      swatches: ['#F6F2EA', '#C84B31', '#17171A'],
    },
    {
      id: 'elegant',
      label: 'Elegante',
      desc: 'Tonos nobles y prestigio',
      swatches: ['#16161D', '#D4AF37', '#FAF7F0'],
    },
    {
      id: 'vibrant',
      label: 'Vibrante',
      desc: 'Colores dinámicos y presencia',
      swatches: ['#0D0E15', '#BF5AF2', '#30D158'],
    },
    {
      id: 'organic',
      label: 'Orgánico',
      desc: 'Tonos botánicos y equilibrio',
      swatches: ['#F3F1EC', '#1E4D3B', '#C96F4B'],
    },
  ],
};

export interface LocalizedPieceType {
  readonly id: CreativePieceType;
  readonly label: string;
}

export const PIECE_TYPE_OPTIONS_BY_LOCALE: Record<SupportedLocale, readonly LocalizedPieceType[]> =
  {
    en: [
      { id: 'auto', label: 'Auto' },
      { id: 'social-post', label: 'Social Post' },
      { id: 'carousel-slide', label: 'Carousel' },
      { id: 'story-poster', label: 'Story / Poster' },
      { id: 'promo-flyer', label: 'Promo' },
      { id: 'editorial-quote', label: 'Editorial' },
      { id: 'product-showcase', label: 'Product / Food' },
      { id: 'web-banner', label: 'Web Banner' },
    ],
    pt: [
      { id: 'auto', label: 'Auto' },
      { id: 'social-post', label: 'Post Social' },
      { id: 'carousel-slide', label: 'Carrossel' },
      { id: 'story-poster', label: 'Story / Cartaz' },
      { id: 'promo-flyer', label: 'Oferta' },
      { id: 'editorial-quote', label: 'Editorial' },
      { id: 'product-showcase', label: 'Produto / Food' },
      { id: 'web-banner', label: 'Banner Web' },
    ],
    es: [
      { id: 'auto', label: 'Auto' },
      { id: 'social-post', label: 'Post Social' },
      { id: 'carousel-slide', label: 'Carrusel' },
      { id: 'story-poster', label: 'Story / Póster' },
      { id: 'promo-flyer', label: 'Oferta' },
      { id: 'editorial-quote', label: 'Editorial' },
      { id: 'product-showcase', label: 'Producto / Food' },
      { id: 'web-banner', label: 'Banner Web' },
    ],
  };

export interface LocalizedArchetype {
  readonly id: LayoutCompositionArchetype;
  readonly label: string;
}

export const ARCHETYPE_OPTIONS_BY_LOCALE: Record<SupportedLocale, readonly LocalizedArchetype[]> = {
  en: [
    { id: 'auto', label: 'Auto' },
    { id: 'poster-impact', label: 'Poster' },
    { id: 'swiss-editorial', label: 'Swiss' },
    { id: 'carousel-cover', label: 'Carousel' },
    { id: 'product-spotlight', label: 'Product' },
    { id: 'photo-overlay', label: 'Photo' },
  ],
  pt: [
    { id: 'auto', label: 'Auto' },
    { id: 'poster-impact', label: 'Cartaz' },
    { id: 'swiss-editorial', label: 'Suíço' },
    { id: 'carousel-cover', label: 'Carrossel' },
    { id: 'product-spotlight', label: 'Produto' },
    { id: 'photo-overlay', label: 'Foto' },
  ],
  es: [
    { id: 'auto', label: 'Auto' },
    { id: 'poster-impact', label: 'Póster' },
    { id: 'swiss-editorial', label: 'Suizo' },
    { id: 'carousel-cover', label: 'Carrusel' },
    { id: 'product-spotlight', label: 'Producto' },
    { id: 'photo-overlay', label: 'Foto' },
  ],
};

export interface QuickPrompt {
  readonly label: string;
  readonly prompt: string;
  readonly style: StyleOption;
  readonly pieceType?: CreativePieceType;
  readonly archetype?: LayoutCompositionArchetype;
  readonly includeImagery?: boolean;
}

export const QUICK_PROMPTS_BY_LOCALE: Record<SupportedLocale, readonly QuickPrompt[]> = {
  en: [
    {
      label: 'Artisan Burger',
      prompt:
        'Instagram post for an artisan smash burger with warm appetizing colors, bold headline, and delivery callout',
      style: 'promo',
      pieceType: 'product-showcase',
      archetype: 'product-spotlight',
      includeImagery: true,
    },
    {
      label: 'Carousel 5 Tips',
      prompt:
        'Instagram carousel cover: 5 graphic design principles to make social media posts look crafted by a senior studio',
      style: 'editorial',
      pieceType: 'carousel-slide',
      archetype: 'carousel-cover',
    },
    {
      label: 'Flash Sale',
      prompt: 'Flash sale banner with 50% discount on all items for a limited time only',
      style: 'promo',
      pieceType: 'promo-flyer',
      archetype: 'poster-impact',
    },
    {
      label: 'Cultural Poster',
      prompt:
        'Contemporary graphic poster for a Saturday night vinyl jazz and design session at Galeria Central, 20h',
      style: 'vibrant',
      pieceType: 'story-poster',
      archetype: 'poster-impact',
    },
    {
      label: 'Swiss Quote',
      prompt:
        'Minimalist Swiss editorial post with active negative space about subtracting the obvious and adding meaning',
      style: 'minimal',
      pieceType: 'editorial-quote',
      archetype: 'swiss-editorial',
    },
    {
      label: 'Artisan Coffee',
      prompt:
        'Social media spotlight for a specialty coffee house featuring single-origin espresso and weekend brunch',
      style: 'organic',
      pieceType: 'product-showcase',
      archetype: 'product-spotlight',
      includeImagery: true,
    },
  ],
  pt: [
    {
      label: 'Burger Artesanal',
      prompt:
        'Post para Instagram de hambúrguer smash artesanal com cores quentes apetitosas, título marcante e pedido no delivery',
      style: 'promo',
      pieceType: 'product-showcase',
      archetype: 'product-spotlight',
      includeImagery: true,
    },
    {
      label: 'Carrossel 5 Dicas',
      prompt:
        'Capa de carrossel para Instagram: 5 princípios de design gráfico para criar posts profissionais com cara de estúdio',
      style: 'editorial',
      pieceType: 'carousel-slide',
      archetype: 'carousel-cover',
    },
    {
      label: 'Oferta Flash',
      prompt: 'Cartaz promocional de liquidação relâmpago com 50% OFF neste fim de semana',
      style: 'promo',
      pieceType: 'promo-flyer',
      archetype: 'poster-impact',
    },
    {
      label: 'Cartaz Cultural',
      prompt:
        'Cartaz gráfico contemporâneo para noite de jazz em vinil e encontro criativo na Galeria Central, sábado às 20h',
      style: 'vibrant',
      pieceType: 'story-poster',
      archetype: 'poster-impact',
    },
    {
      label: 'Frase Suíça',
      prompt:
        'Post editorial minimalista em grid suíço sobre subtrair o óbvio e acrescentar significado no design',
      style: 'minimal',
      pieceType: 'editorial-quote',
      archetype: 'swiss-editorial',
    },
    {
      label: 'Café Especial',
      prompt:
        'Post sensorial para cafeteria artesanal destacando espresso de torra fresca e brunch de domingo',
      style: 'organic',
      pieceType: 'product-showcase',
      archetype: 'product-spotlight',
      includeImagery: true,
    },
  ],
  es: [
    {
      label: 'Burger Artesanal',
      prompt:
        'Post para Instagram de hamburguesa smash artesanal con tonos cálidos apetitosos, titular potente y delivery',
      style: 'promo',
      pieceType: 'product-showcase',
      archetype: 'product-spotlight',
      includeImagery: true,
    },
    {
      label: 'Carrusel 5 Claves',
      prompt:
        'Portada de carrusel para Instagram: 5 principios de diseño gráfico para crear posts de nivel profesional',
      style: 'editorial',
      pieceType: 'carousel-slide',
      archetype: 'carousel-cover',
    },
    {
      label: 'Oferta Flash',
      prompt: 'Póster promocional de liquidación con 50% OFF solo este fin de semana',
      style: 'promo',
      pieceType: 'promo-flyer',
      archetype: 'poster-impact',
    },
    {
      label: 'Póster Cultural',
      prompt:
        'Póster gráfico contemporáneo para noche de jazz en vinilo y encuentro creativo en Galería Central, sábado 20h',
      style: 'vibrant',
      pieceType: 'story-poster',
      archetype: 'poster-impact',
    },
    {
      label: 'Cita Suiza',
      prompt:
        'Post editorial minimalista en grid suizo sobre restar lo obvio y añadir significado en el diseño',
      style: 'minimal',
      pieceType: 'editorial-quote',
      archetype: 'swiss-editorial',
    },
    {
      label: 'Café Especial',
      prompt:
        'Post sensorial para cafetería artesanal destacando espresso de tueste fresco y brunch de domingo',
      style: 'organic',
      pieceType: 'product-showcase',
      archetype: 'product-spotlight',
      includeImagery: true,
    },
  ],
};

export function formatArtboardRatioLabel(dimensions: Dimensions): string {
  const { width, height } = dimensions;
  const ratio = width / Math.max(1, height);
  let tag = 'Custom';
  if (Math.abs(ratio - 1) < 0.05) tag = '1:1';
  else if (Math.abs(ratio - 9 / 16) < 0.05) tag = '9:16';
  else if (Math.abs(ratio - 16 / 9) < 0.05) tag = '16:9';
  else if (Math.abs(ratio - 4 / 5) < 0.05) tag = '4:5';
  else if (Math.abs(ratio - 4 / 3) < 0.05) tag = '4:3';
  else if (ratio > 2) tag = 'Banner';
  return `${width}×${height} · ${tag}`;
}
