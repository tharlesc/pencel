/**
 * @pencel/web - Elements Service
 * Integrates vector icons (Iconify API) and emojis (Unicode categories).
 */

import { httpClient } from './httpClient.js';

export interface VectorIconItem {
  readonly id: string;
  readonly name: string;
  readonly prefix: string;
  readonly svgUrl: string;
}

export interface EmojiItem {
  readonly id: string;
  readonly char: string;
  readonly name: string;
  readonly category: string;
}

export interface BrandLogoItem {
  readonly name: string;
  readonly domain: string;
}

export const POPULAR_BRANDS: readonly BrandLogoItem[] = [
  { name: 'Apple', domain: 'apple.com' },
  { name: 'Google', domain: 'google.com' },
  { name: 'GitHub', domain: 'github.com' },
  { name: 'Spotify', domain: 'spotify.com' },
  { name: 'YouTube', domain: 'youtube.com' },
  { name: 'Instagram', domain: 'instagram.com' },
  { name: 'WhatsApp', domain: 'whatsapp.com' },
  { name: 'X / Twitter', domain: 'x.com' },
  { name: 'Figma', domain: 'figma.com' },
  { name: 'Discord', domain: 'discord.com' },
];

export const POPULAR_CURATED_ICONS: readonly VectorIconItem[] = [
  {
    id: 'lucide-star',
    name: 'Estrela',
    prefix: 'lucide',
    svgUrl: 'https://api.iconify.design/lucide/star.svg?width=512&height=512&color=%230071E3',
  },
  {
    id: 'lucide-heart',
    name: 'Coração',
    prefix: 'lucide',
    svgUrl: 'https://api.iconify.design/lucide/heart.svg?width=512&height=512&color=%23FF3B30',
  },
  {
    id: 'lucide-sparkles',
    name: 'Brilho',
    prefix: 'lucide',
    svgUrl: 'https://api.iconify.design/lucide/sparkles.svg?width=512&height=512&color=%23FFCC00',
  },
  {
    id: 'lucide-zap',
    name: 'Raio',
    prefix: 'lucide',
    svgUrl: 'https://api.iconify.design/lucide/zap.svg?width=512&height=512&color=%23FF9500',
  },
  {
    id: 'lucide-flame',
    name: 'Fogo',
    prefix: 'lucide',
    svgUrl: 'https://api.iconify.design/lucide/flame.svg?width=512&height=512&color=%23FF453A',
  },
  {
    id: 'lucide-shield-check',
    name: 'Verificado',
    prefix: 'lucide',
    svgUrl:
      'https://api.iconify.design/lucide/shield-check.svg?width=512&height=512&color=%2330D158',
  },
  {
    id: 'lucide-rocket',
    name: 'Foguete',
    prefix: 'lucide',
    svgUrl: 'https://api.iconify.design/lucide/rocket.svg?width=512&height=512&color=%23AF52DE',
  },
  {
    id: 'lucide-trophy',
    name: 'Troféu',
    prefix: 'lucide',
    svgUrl: 'https://api.iconify.design/lucide/trophy.svg?width=512&height=512&color=%23FFD60A',
  },
  {
    id: 'lucide-badge-percent',
    name: 'Desconto',
    prefix: 'lucide',
    svgUrl:
      'https://api.iconify.design/lucide/badge-percent.svg?width=512&height=512&color=%23FF2D55',
  },
  {
    id: 'lucide-shopping-cart',
    name: 'Carrinho',
    prefix: 'lucide',
    svgUrl:
      'https://api.iconify.design/lucide/shopping-cart.svg?width=512&height=512&color=%230071E3',
  },
  {
    id: 'lucide-check-circle',
    name: 'Sucesso',
    prefix: 'lucide',
    svgUrl:
      'https://api.iconify.design/lucide/check-circle.svg?width=512&height=512&color=%2334C759',
  },
  {
    id: 'lucide-crown',
    name: 'Coroa',
    prefix: 'lucide',
    svgUrl: 'https://api.iconify.design/lucide/crown.svg?width=512&height=512&color=%23FFB340',
  },
];

export const POPULAR_CURATED_EMOJIS: readonly EmojiItem[] = [
  // Expressões & Reações
  { id: 'e-fire', char: '🔥', name: 'Fogo / Em alta', category: 'Destaques' },
  { id: 'e-sparkles', char: '✨', name: 'Brilhos', category: 'Destaques' },
  { id: 'e-rocket', char: '🚀', name: 'Foguete', category: 'Destaques' },
  { id: 'e-star2', char: '🌟', name: 'Estrela brilhante', category: 'Destaques' },
  { id: 'e-heart', char: '❤️', name: 'Coração Vermelho', category: 'Destaques' },
  { id: 'e-crown', char: '👑', name: 'Coroa', category: 'Destaques' },
  { id: 'e-trophy', char: '🏆', name: 'Troféu', category: 'Destaques' },
  { id: 'e-target', char: '🎯', name: 'Alvo', category: 'Destaques' },
  { id: 'e-100', char: '💯', name: 'Nota 100', category: 'Destaques' },
  { id: 'e-party', char: '🎉', name: 'Festa', category: 'Destaques' },
  { id: 'e-bulb', char: '💡', name: 'Ideia', category: 'Destaques' },
  { id: 'e-money', char: '💰', name: 'Saco de Dinheiro', category: 'Destaques' },
  // Rostos
  { id: 'e-smile', char: '😊', name: 'Sorridente', category: 'Rostos' },
  { id: 'e-sunglasses', char: '😎', name: 'Óculos escuros', category: 'Rostos' },
  { id: 'e-star-eyes', char: '🤩', name: 'Olhos de estrela', category: 'Rostos' },
  { id: 'e-heart-eyes', char: '😍', name: 'Apaixonado', category: 'Rostos' },
  { id: 'e-wink', char: '😉', name: 'Piscadela', category: 'Rostos' },
  { id: 'e-laugh', char: '😂', name: 'Gargalhada', category: 'Rostos' },
  { id: 'e-mind-blown', char: '🤯', name: 'Surpreso', category: 'Rostos' },
  { id: 'e-thinking', char: '🤔', name: 'Pensativo', category: 'Rostos' },
  { id: 'e-celebrate', char: '🥳', name: 'Comemorando', category: 'Rostos' },
  { id: 'e-angel', char: '😇', name: 'Inocente', category: 'Rostos' },
  // Símbolos & Setas
  { id: 'e-check', char: '✅', name: 'Check Verde', category: 'Símbolos' },
  { id: 'e-cross', char: '❌', name: 'Cruz Vermelha', category: 'Símbolos' },
  { id: 'e-warning', char: '⚠️', name: 'Aviso', category: 'Símbolos' },
  { id: 'e-bell', char: '🔔', name: 'Sino / Notificação', category: 'Símbolos' },
  { id: 'e-pin', char: '📍', name: 'Marcador de Local', category: 'Símbolos' },
  { id: 'e-arrow-right', char: '➡️', name: 'Seta Direita', category: 'Símbolos' },
  { id: 'e-lightning', char: '⚡', name: 'Alta Tensão', category: 'Símbolos' },
  { id: 'e-gem', char: '💎', name: 'Diamante', category: 'Símbolos' },
  { id: 'e-gift', char: '🎁', name: 'Presente', category: 'Objetos' },
  { id: 'e-camera', char: '📸', name: 'Câmera', category: 'Objetos' },
  { id: 'e-palette', char: '🎨', name: 'Paleta de Arte', category: 'Objetos' },
  { id: 'e-music', char: '🎵', name: 'Nota Musical', category: 'Objetos' },
  { id: 'e-megaphone', char: '📢', name: 'Megafone', category: 'Objetos' },
  { id: 'e-shopping', char: '🛍️', name: 'Sacolas de Compra', category: 'Objetos' },
  { id: 'e-globe', char: '🌍', name: 'Globo', category: 'Natureza' },
  { id: 'e-sun', char: '☀️', name: 'Sol', category: 'Natureza' },
  { id: 'e-moon', char: '🌙', name: 'Lua', category: 'Natureza' },
  { id: 'e-rainbow', char: '🌈', name: 'Arco-íris', category: 'Natureza' },
  { id: 'e-leaf', char: '🌿', name: 'Folha', category: 'Natureza' },
  { id: 'e-wave', char: '👋', name: 'Aceno', category: 'Gestos' },
  { id: 'e-clap', char: '👏', name: 'Aplausos', category: 'Gestos' },
  { id: 'e-thumbsup', char: '👍', name: 'Joinha', category: 'Gestos' },
  { id: 'e-muscle', char: '💪', name: 'Força', category: 'Gestos' },
  { id: 'e-hands', char: '🙌', name: 'Mãos para cima', category: 'Gestos' },
  { id: 'e-ok', char: '👌', name: 'Perfeito', category: 'Gestos' },
  { id: 'e-peace', char: '✌️', name: 'Paz', category: 'Gestos' },
];

const CURATED_ICON_TOPICS = ['design', 'star', 'badge', 'arrow', 'media', 'sparkle', 'shape'];

/**
 * Searches vector icons via Iconify Open API (https://iconify.design/docs/api/) with offset pagination.
 * Returns normalized items ready to be embedded on canvas as SVG graphics.
 */
export async function searchIconifyIcons(
  query: string,
  limit = 24,
  offset = 0,
): Promise<VectorIconItem[]> {
  const clean = query.trim().toLowerCase();

  // When query is empty and offset is 0, return curated starter icons immediately + fetch more on scroll
  if (!clean && offset === 0) {
    return [...POPULAR_CURATED_ICONS];
  }

  const effectiveQuery =
    clean || CURATED_ICON_TOPICS[Math.floor(offset / limit) % CURATED_ICON_TOPICS.length] || 'star';
  const effectiveStart = clean ? offset : Math.max(0, offset - POPULAR_CURATED_ICONS.length);

  const result = await httpClient.get<{ readonly icons?: readonly string[] }>(
    `https://api.iconify.design/search?query=${encodeURIComponent(effectiveQuery)}&limit=${limit}&start=${effectiveStart}`,
    { timeoutMs: 5000 },
  );

  if (result.ok) {
    const icons = result.data.icons;
    if (Array.isArray(icons) && icons.length > 0) {
      return icons.map((fullId) => {
        const parts = fullId.split(':');
        const prefix = parts[0] || 'lucide';
        const name = parts[1] || parts[0] || 'icon';
        return {
          id: fullId,
          name,
          prefix,
          svgUrl: `https://api.iconify.design/${prefix}/${name}.svg?width=512&height=512&color=%231D1D1F`,
        };
      });
    }
    if (Array.isArray(icons) && icons.length === 0) {
      return [];
    }
  }

  if (offset > 0) {
    return [];
  }

  return POPULAR_CURATED_ICONS.filter(
    (item) => item.name.toLowerCase().includes(clean) || item.id.toLowerCase().includes(clean),
  );
}

/**
 * Searches emojis from local library with optional incremental slice pagination.
 */
export async function searchEmojis(query = '', limit?: number, offset = 0): Promise<EmojiItem[]> {
  const clean = (query ?? '').trim().toLowerCase();
  const filtered = !clean
    ? POPULAR_CURATED_EMOJIS
    : POPULAR_CURATED_EMOJIS.filter(
        (e) =>
          e.name.toLowerCase().includes(clean) ||
          e.category.toLowerCase().includes(clean) ||
          e.char.includes(clean),
      );

  if (limit === undefined) {
    return filtered.slice(offset);
  }
  return filtered.slice(offset, offset + limit);
}

const BRAND_VECTOR_MAP: Record<string, string> = {
  'apple.com':
    'https://api.iconify.design/simple-icons/apple.svg?width=512&height=512&color=%231D1D1F',
  apple: 'https://api.iconify.design/simple-icons/apple.svg?width=512&height=512&color=%231D1D1F',
  'google.com': 'https://api.iconify.design/logos/google-icon.svg?width=512&height=512',
  google: 'https://api.iconify.design/logos/google-icon.svg?width=512&height=512',
  'github.com': 'https://api.iconify.design/logos/github-icon.svg?width=512&height=512',
  github: 'https://api.iconify.design/logos/github-icon.svg?width=512&height=512',
  'spotify.com': 'https://api.iconify.design/logos/spotify-icon.svg?width=512&height=512',
  spotify: 'https://api.iconify.design/logos/spotify-icon.svg?width=512&height=512',
  'youtube.com': 'https://api.iconify.design/logos/youtube-icon.svg?width=512&height=512',
  youtube: 'https://api.iconify.design/logos/youtube-icon.svg?width=512&height=512',
  'instagram.com': 'https://api.iconify.design/logos/instagram-icon.svg?width=512&height=512',
  instagram: 'https://api.iconify.design/logos/instagram-icon.svg?width=512&height=512',
  'whatsapp.com': 'https://api.iconify.design/logos/whatsapp-icon.svg?width=512&height=512',
  whatsapp: 'https://api.iconify.design/logos/whatsapp-icon.svg?width=512&height=512',
  'x.com': 'https://api.iconify.design/simple-icons/x.svg?width=512&height=512&color=%231D1D1F',
  x: 'https://api.iconify.design/simple-icons/x.svg?width=512&height=512&color=%231D1D1F',
  twitter: 'https://api.iconify.design/simple-icons/x.svg?width=512&height=512&color=%231D1D1F',
  'figma.com': 'https://api.iconify.design/logos/figma.svg?width=512&height=512',
  figma: 'https://api.iconify.design/logos/figma.svg?width=512&height=512',
  'discord.com': 'https://api.iconify.design/logos/discord-icon.svg?width=512&height=512',
  discord: 'https://api.iconify.design/logos/discord-icon.svg?width=512&height=512',
  'notion.so': 'https://api.iconify.design/logos/notion-icon.svg?width=512&height=512',
  notion: 'https://api.iconify.design/logos/notion-icon.svg?width=512&height=512',
  'slack.com': 'https://api.iconify.design/logos/slack-icon.svg?width=512&height=512',
  slack: 'https://api.iconify.design/logos/slack-icon.svg?width=512&height=512',
};

/**
 * Generates crisp, high-resolution vector SVG URL for brand logos via Iconify.
 */
export function getBrandIconUrl(domainOrBrand: string): string {
  const clean = domainOrBrand
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');
  const matched = BRAND_VECTOR_MAP[clean] || BRAND_VECTOR_MAP[clean.replace(/\.com$/, '')];
  if (matched) return matched;
  const brandName = clean.split('.')[0] || clean;
  return `https://api.iconify.design/simple-icons/${encodeURIComponent(brandName)}.svg?width=512&height=512`;
}
