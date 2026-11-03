/**
 * @pencel/web - Font Loader Service
 * Expands typography options with Google Fonts Developer API and dynamic web-font loading into Canvas.
 */

import { httpClient } from './httpClient.js';

export interface FontVariantOption {
  readonly id: string;
  readonly label: string;
  readonly weight: string;
  readonly style: 'normal' | 'italic';
}

export interface FontOption {
  readonly id: string;
  readonly label: string;
  readonly family: string;
  readonly category: 'Sans-Serif' | 'Serif' | 'Display' | 'Script' | 'Monospace';
  readonly isGoogleFont?: boolean;
  readonly variants?: readonly FontVariantOption[];
}

export const DEFAULT_FONT_VARIANTS: readonly FontVariantOption[] = [
  { id: '300', label: 'Light', weight: '300', style: 'normal' },
  { id: 'regular', label: 'Regular', weight: '400', style: 'normal' },
  { id: '500', label: 'Medium', weight: '500', style: 'normal' },
  { id: '600', label: 'SemiBold', weight: '600', style: 'normal' },
  { id: '700', label: 'Bold', weight: '700', style: 'normal' },
  { id: '800', label: 'ExtraBold', weight: '800', style: 'normal' },
  { id: 'italic', label: 'Italic', weight: '400', style: 'italic' },
  { id: '700italic', label: 'Bold Italic', weight: '700', style: 'italic' },
];

export function parseGoogleFontVariants(
  rawVariants: readonly string[],
): readonly FontVariantOption[] {
  if (!rawVariants || rawVariants.length === 0) {
    return DEFAULT_FONT_VARIANTS;
  }

  const result: FontVariantOption[] = [];
  for (const v of rawVariants) {
    const isItalic = v.includes('italic');
    const numPart = v.replace('italic', '').replace('regular', '400') || '400';
    const weightNum = Number.parseInt(numPart, 10);
    const weight = Number.isNaN(weightNum) ? '400' : String(weightNum);

    let weightLabel = 'Regular';
    switch (weight) {
      case '100':
        weightLabel = 'Thin';
        break;
      case '200':
        weightLabel = 'ExtraLight';
        break;
      case '300':
        weightLabel = 'Light';
        break;
      case '400':
        weightLabel = 'Regular';
        break;
      case '500':
        weightLabel = 'Medium';
        break;
      case '600':
        weightLabel = 'SemiBold';
        break;
      case '700':
        weightLabel = 'Bold';
        break;
      case '800':
        weightLabel = 'ExtraBold';
        break;
      case '900':
        weightLabel = 'Black';
        break;
    }

    const label = isItalic ? `${weightLabel} Italic` : weightLabel;
    result.push({
      id: v,
      label,
      weight,
      style: isItalic ? 'italic' : 'normal',
    });
  }

  return result.length > 0 ? result : DEFAULT_FONT_VARIANTS;
}

export const BASE_FONT_CATALOG: readonly FontOption[] = [
  // Sans-Serif
  {
    id: 'inter',
    label: 'Inter',
    family: 'Inter, -apple-system, sans-serif',
    category: 'Sans-Serif',
    isGoogleFont: true,
    variants: DEFAULT_FONT_VARIANTS,
  },
  {
    id: 'sf-pro',
    label: 'SF Pro / Sistema',
    family: '-apple-system, BlinkMacSystemFont, sans-serif',
    category: 'Sans-Serif',
    variants: [
      { id: '300', label: 'Light', weight: '300', style: 'normal' },
      { id: 'regular', label: 'Regular', weight: '400', style: 'normal' },
      { id: '500', label: 'Medium', weight: '500', style: 'normal' },
      { id: '600', label: 'SemiBold', weight: '600', style: 'normal' },
      { id: '700', label: 'Bold', weight: '700', style: 'normal' },
      { id: '800', label: 'ExtraBold', weight: '800', style: 'normal' },
    ],
  },
  {
    id: 'poppins',
    label: 'Poppins',
    family: "'Poppins', sans-serif",
    category: 'Sans-Serif',
    isGoogleFont: true,
    variants: DEFAULT_FONT_VARIANTS,
  },
  {
    id: 'montserrat',
    label: 'Montserrat',
    family: "'Montserrat', sans-serif",
    category: 'Sans-Serif',
    isGoogleFont: true,
    variants: DEFAULT_FONT_VARIANTS,
  },
  {
    id: 'outfit',
    label: 'Outfit',
    family: "'Outfit', sans-serif",
    category: 'Sans-Serif',
    isGoogleFont: true,
    variants: DEFAULT_FONT_VARIANTS,
  },
  {
    id: 'roboto',
    label: 'Roboto',
    family: "'Roboto', sans-serif",
    category: 'Sans-Serif',
    isGoogleFont: true,
    variants: DEFAULT_FONT_VARIANTS,
  },
  {
    id: 'plus-jakarta',
    label: 'Plus Jakarta Sans',
    family: "'Plus Jakarta Sans', sans-serif",
    category: 'Sans-Serif',
    isGoogleFont: true,
    variants: DEFAULT_FONT_VARIANTS,
  },

  // Serif
  {
    id: 'playfair',
    label: 'Playfair Display',
    family: "'Playfair Display', serif",
    category: 'Serif',
    isGoogleFont: true,
    variants: DEFAULT_FONT_VARIANTS,
  },
  {
    id: 'merriweather',
    label: 'Merriweather',
    family: "'Merriweather', serif",
    category: 'Serif',
    isGoogleFont: true,
    variants: DEFAULT_FONT_VARIANTS,
  },
  {
    id: 'cinzel',
    label: 'Cinzel (Clássico)',
    family: "'Cinzel', serif",
    category: 'Serif',
    isGoogleFont: true,
    variants: DEFAULT_FONT_VARIANTS,
  },
  {
    id: 'georgia',
    label: 'Georgia',
    family: 'Georgia, serif',
    category: 'Serif',
    variants: [
      { id: 'regular', label: 'Regular', weight: '400', style: 'normal' },
      { id: '700', label: 'Bold', weight: '700', style: 'normal' },
      { id: 'italic', label: 'Italic', weight: '400', style: 'italic' },
    ],
  },

  // Display & Impact
  {
    id: 'bebas-neue',
    label: 'Bebas Neue',
    family: "'Bebas Neue', sans-serif",
    category: 'Display',
    isGoogleFont: true,
    variants: [{ id: 'regular', label: 'Regular', weight: '400', style: 'normal' }],
  },
  {
    id: 'impact',
    label: 'Impact',
    family: 'Impact, sans-serif',
    category: 'Display',
    variants: [{ id: 'regular', label: 'Regular', weight: '400', style: 'normal' }],
  },
  {
    id: 'space-grotesk',
    label: 'Space Grotesk',
    family: "'Space Grotesk', sans-serif",
    category: 'Display',
    isGoogleFont: true,
    variants: DEFAULT_FONT_VARIANTS,
  },
  {
    id: 'syne',
    label: 'Syne (Vanguarda)',
    family: "'Syne', sans-serif",
    category: 'Display',
    isGoogleFont: true,
    variants: DEFAULT_FONT_VARIANTS,
  },

  // Script & Handwritten
  {
    id: 'caveat',
    label: 'Caveat (Manuscrita)',
    family: "'Caveat', cursive",
    category: 'Script',
    isGoogleFont: true,
    variants: DEFAULT_FONT_VARIANTS,
  },
  {
    id: 'dancing-script',
    label: 'Dancing Script',
    family: "'Dancing Script', cursive",
    category: 'Script',
    isGoogleFont: true,
    variants: DEFAULT_FONT_VARIANTS,
  },
  {
    id: 'pacifico',
    label: 'Pacifico',
    family: "'Pacifico', cursive",
    category: 'Script',
    isGoogleFont: true,
    variants: [{ id: 'regular', label: 'Regular', weight: '400', style: 'normal' }],
  },

  // Monospace
  {
    id: 'jetbrains-mono',
    label: 'JetBrains Mono',
    family: "'JetBrains Mono', monospace",
    category: 'Monospace',
    isGoogleFont: true,
    variants: DEFAULT_FONT_VARIANTS,
  },
  {
    id: 'fira-code',
    label: 'Fira Code',
    family: "'Fira Code', monospace",
    category: 'Monospace',
    isGoogleFont: true,
    variants: DEFAULT_FONT_VARIANTS,
  },
  {
    id: 'courier-new',
    label: 'Courier New',
    family: "'Courier New', monospace",
    category: 'Monospace',
    variants: [
      { id: 'regular', label: 'Regular', weight: '400', style: 'normal' },
      { id: '700', label: 'Bold', weight: '700', style: 'normal' },
    ],
  },
];

export const EXPANDED_FONT_CATALOG: FontOption[] = [...BASE_FONT_CATALOG];

let dynamicFontsLoaded = false;

interface RawGoogleFontItem {
  readonly family: string;
  readonly category: string;
  readonly variants?: readonly string[];
}

interface RawGoogleFontsResponse {
  readonly items?: readonly RawGoogleFontItem[];
}

export async function fetchDynamicGoogleFontsCatalog(): Promise<readonly FontOption[]> {
  if (dynamicFontsLoaded) {
    return EXPANDED_FONT_CATALOG;
  }

  try {
    const res = await httpClient.get<RawGoogleFontsResponse>('/api/v1/media/fonts?sort=popularity');
    if (res.ok && res.data.items && Array.isArray(res.data.items)) {
      const existingIds = new Set(EXPANDED_FONT_CATALOG.map((f) => f.family.toLowerCase()));

      for (const item of res.data.items) {
        if (!item.family || existingIds.has(item.family.toLowerCase())) continue;

        let category: FontOption['category'] = 'Sans-Serif';
        const rawCat = (item.category || '').toLowerCase();
        if (rawCat.includes('serif')) category = 'Serif';
        else if (rawCat.includes('display')) category = 'Display';
        else if (rawCat.includes('handwriting')) category = 'Script';
        else if (rawCat.includes('monospace')) category = 'Monospace';

        const variants = parseGoogleFontVariants(item.variants ?? []);
        const id = item.family.toLowerCase().replace(/[^a-z0-9]/g, '-');

        EXPANDED_FONT_CATALOG.push({
          id,
          label: item.family,
          family: `'${item.family}', sans-serif`,
          category,
          isGoogleFont: true,
          variants,
        });
        existingIds.add(item.family.toLowerCase());
      }
      dynamicFontsLoaded = true;
    }
  } catch (err) {
    console.debug('Dynamic Google Fonts fetch skipped:', err);
  }

  return EXPANDED_FONT_CATALOG;
}

const loadedFontKeys = new Set<string>();

/**
 * Dynamically injects Google Font link and resolves once the font is loaded into document.fonts.
 */
export async function loadWebFont(
  fontOption: FontOption,
  variant?: FontVariantOption,
): Promise<boolean> {
  const targetWeight = variant?.weight || '400';
  const targetStyle = variant?.style || 'normal';
  const cacheKey = `${fontOption.id}_${targetWeight}_${targetStyle}`;

  if (!fontOption.isGoogleFont || loadedFontKeys.has(cacheKey)) {
    return true;
  }

  try {
    const rawName =
      fontOption.family.split(',')[0]?.replace(/['"]/g, '').trim() || fontOption.label;
    const fontNameUrl = encodeURIComponent(rawName).replace(/%20/g, '+');

    const href = `https://fonts.googleapis.com/css2?family=${fontNameUrl}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&display=swap`;

    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }

    if ('fonts' in document) {
      await document.fonts.load(`${targetStyle} ${targetWeight} 16px "${rawName}"`);
    }

    loadedFontKeys.add(cacheKey);
    return true;
  } catch (err) {
    console.debug('WebFont loading handled gracefully:', err);
    return false;
  }
}
