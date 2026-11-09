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
  // --- Sans-Serif ---
  {
    id: 'inter',
    label: 'Inter',
    family: "'Inter', -apple-system, sans-serif",
    category: 'Sans-Serif',
    isGoogleFont: true,
    variants: DEFAULT_FONT_VARIANTS,
  },
  {
    id: 'sf-pro',
    label: 'SF Pro / Sistema',
    family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
  {
    id: 'open-sans',
    label: 'Open Sans',
    family: "'Open Sans', sans-serif",
    category: 'Sans-Serif',
    isGoogleFont: true,
    variants: DEFAULT_FONT_VARIANTS,
  },
  {
    id: 'lato',
    label: 'Lato',
    family: "'Lato', sans-serif",
    category: 'Sans-Serif',
    isGoogleFont: true,
    variants: DEFAULT_FONT_VARIANTS,
  },
  {
    id: 'raleway',
    label: 'Raleway',
    family: "'Raleway', sans-serif",
    category: 'Sans-Serif',
    isGoogleFont: true,
    variants: DEFAULT_FONT_VARIANTS,
  },
  {
    id: 'dm-sans',
    label: 'DM Sans',
    family: "'DM Sans', sans-serif",
    category: 'Sans-Serif',
    isGoogleFont: true,
    variants: DEFAULT_FONT_VARIANTS,
  },
  {
    id: 'work-sans',
    label: 'Work Sans',
    family: "'Work Sans', sans-serif",
    category: 'Sans-Serif',
    isGoogleFont: true,
    variants: DEFAULT_FONT_VARIANTS,
  },

  // --- Serif ---
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
    variants: [
      { id: '300', label: 'Light', weight: '300', style: 'normal' },
      { id: 'regular', label: 'Regular', weight: '400', style: 'normal' },
      { id: '700', label: 'Bold', weight: '700', style: 'normal' },
      { id: '900', label: 'Black', weight: '900', style: 'normal' },
      { id: 'italic', label: 'Italic', weight: '400', style: 'italic' },
      { id: '700italic', label: 'Bold Italic', weight: '700', style: 'italic' },
    ],
  },
  {
    id: 'cinzel',
    label: 'Cinzel (Clássico)',
    family: "'Cinzel', serif",
    category: 'Serif',
    isGoogleFont: true,
    variants: [
      { id: 'regular', label: 'Regular', weight: '400', style: 'normal' },
      { id: '500', label: 'Medium', weight: '500', style: 'normal' },
      { id: '600', label: 'SemiBold', weight: '600', style: 'normal' },
      { id: '700', label: 'Bold', weight: '700', style: 'normal' },
      { id: '800', label: 'ExtraBold', weight: '800', style: 'normal' },
      { id: '900', label: 'Black', weight: '900', style: 'normal' },
    ],
  },
  {
    id: 'lora',
    label: 'Lora',
    family: "'Lora', serif",
    category: 'Serif',
    isGoogleFont: true,
    variants: DEFAULT_FONT_VARIANTS,
  },
  {
    id: 'cormorant-garamond',
    label: 'Cormorant Garamond',
    family: "'Cormorant Garamond', serif",
    category: 'Serif',
    isGoogleFont: true,
    variants: DEFAULT_FONT_VARIANTS,
  },
  {
    id: 'eb-garamond',
    label: 'EB Garamond',
    family: "'EB Garamond', serif",
    category: 'Serif',
    isGoogleFont: true,
    variants: DEFAULT_FONT_VARIANTS,
  },
  {
    id: 'georgia',
    label: 'Georgia',
    family: "Georgia, 'Times New Roman', serif",
    category: 'Serif',
    variants: [
      { id: 'regular', label: 'Regular', weight: '400', style: 'normal' },
      { id: '700', label: 'Bold', weight: '700', style: 'normal' },
      { id: 'italic', label: 'Italic', weight: '400', style: 'italic' },
      { id: '700italic', label: 'Bold Italic', weight: '700', style: 'italic' },
    ],
  },

  // --- Display & Impact ---
  {
    id: 'bebas-neue',
    label: 'Bebas Neue',
    family: "'Bebas Neue', sans-serif",
    category: 'Display',
    isGoogleFont: true,
    variants: [{ id: 'regular', label: 'Regular', weight: '400', style: 'normal' }],
  },
  {
    id: 'space-grotesk',
    label: 'Space Grotesk',
    family: "'Space Grotesk', sans-serif",
    category: 'Display',
    isGoogleFont: true,
    variants: [
      { id: '300', label: 'Light', weight: '300', style: 'normal' },
      { id: 'regular', label: 'Regular', weight: '400', style: 'normal' },
      { id: '500', label: 'Medium', weight: '500', style: 'normal' },
      { id: '600', label: 'SemiBold', weight: '600', style: 'normal' },
      { id: '700', label: 'Bold', weight: '700', style: 'normal' },
    ],
  },
  {
    id: 'syne',
    label: 'Syne (Vanguarda)',
    family: "'Syne', sans-serif",
    category: 'Display',
    isGoogleFont: true,
    variants: [
      { id: 'regular', label: 'Regular', weight: '400', style: 'normal' },
      { id: '500', label: 'Medium', weight: '500', style: 'normal' },
      { id: '600', label: 'SemiBold', weight: '600', style: 'normal' },
      { id: '700', label: 'Bold', weight: '700', style: 'normal' },
      { id: '800', label: 'ExtraBold', weight: '800', style: 'normal' },
    ],
  },
  {
    id: 'anton',
    label: 'Anton',
    family: "'Anton', sans-serif",
    category: 'Display',
    isGoogleFont: true,
    variants: [{ id: 'regular', label: 'Regular', weight: '400', style: 'normal' }],
  },
  {
    id: 'righteous',
    label: 'Righteous',
    family: "'Righteous', cursive",
    category: 'Display',
    isGoogleFont: true,
    variants: [{ id: 'regular', label: 'Regular', weight: '400', style: 'normal' }],
  },
  {
    id: 'oswald',
    label: 'Oswald',
    family: "'Oswald', sans-serif",
    category: 'Display',
    isGoogleFont: true,
    variants: [
      { id: '300', label: 'Light', weight: '300', style: 'normal' },
      { id: 'regular', label: 'Regular', weight: '400', style: 'normal' },
      { id: '500', label: 'Medium', weight: '500', style: 'normal' },
      { id: '600', label: 'SemiBold', weight: '600', style: 'normal' },
      { id: '700', label: 'Bold', weight: '700', style: 'normal' },
    ],
  },
  {
    id: 'impact',
    label: 'Impact',
    family: "Impact, 'Arial Black', sans-serif",
    category: 'Display',
    variants: [{ id: 'regular', label: 'Regular', weight: '400', style: 'normal' }],
  },

  // --- Script & Handwritten ---
  {
    id: 'caveat',
    label: 'Caveat (Manuscrita)',
    family: "'Caveat', cursive",
    category: 'Script',
    isGoogleFont: true,
    variants: [
      { id: 'regular', label: 'Regular', weight: '400', style: 'normal' },
      { id: '500', label: 'Medium', weight: '500', style: 'normal' },
      { id: '600', label: 'SemiBold', weight: '600', style: 'normal' },
      { id: '700', label: 'Bold', weight: '700', style: 'normal' },
    ],
  },
  {
    id: 'dancing-script',
    label: 'Dancing Script',
    family: "'Dancing Script', cursive",
    category: 'Script',
    isGoogleFont: true,
    variants: [
      { id: 'regular', label: 'Regular', weight: '400', style: 'normal' },
      { id: '500', label: 'Medium', weight: '500', style: 'normal' },
      { id: '600', label: 'SemiBold', weight: '600', style: 'normal' },
      { id: '700', label: 'Bold', weight: '700', style: 'normal' },
    ],
  },
  {
    id: 'pacifico',
    label: 'Pacifico',
    family: "'Pacifico', cursive",
    category: 'Script',
    isGoogleFont: true,
    variants: [{ id: 'regular', label: 'Regular', weight: '400', style: 'normal' }],
  },
  {
    id: 'great-vibes',
    label: 'Great Vibes',
    family: "'Great Vibes', cursive",
    category: 'Script',
    isGoogleFont: true,
    variants: [{ id: 'regular', label: 'Regular', weight: '400', style: 'normal' }],
  },
  {
    id: 'sacramento',
    label: 'Sacramento',
    family: "'Sacramento', cursive",
    category: 'Script',
    isGoogleFont: true,
    variants: [{ id: 'regular', label: 'Regular', weight: '400', style: 'normal' }],
  },
  {
    id: 'satisfy',
    label: 'Satisfy',
    family: "'Satisfy', cursive",
    category: 'Script',
    isGoogleFont: true,
    variants: [{ id: 'regular', label: 'Regular', weight: '400', style: 'normal' }],
  },

  // --- Monospace ---
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
    variants: [
      { id: '300', label: 'Light', weight: '300', style: 'normal' },
      { id: 'regular', label: 'Regular', weight: '400', style: 'normal' },
      { id: '500', label: 'Medium', weight: '500', style: 'normal' },
      { id: '600', label: 'SemiBold', weight: '600', style: 'normal' },
      { id: '700', label: 'Bold', weight: '700', style: 'normal' },
    ],
  },
  {
    id: 'source-code-pro',
    label: 'Source Code Pro',
    family: "'Source Code Pro', monospace",
    category: 'Monospace',
    isGoogleFont: true,
    variants: DEFAULT_FONT_VARIANTS,
  },
  {
    id: 'space-mono',
    label: 'Space Mono',
    family: "'Space Mono', monospace",
    category: 'Monospace',
    isGoogleFont: true,
    variants: [
      { id: 'regular', label: 'Regular', weight: '400', style: 'normal' },
      { id: '700', label: 'Bold', weight: '700', style: 'normal' },
      { id: 'italic', label: 'Italic', weight: '400', style: 'italic' },
      { id: '700italic', label: 'Bold Italic', weight: '700', style: 'italic' },
    ],
  },
  {
    id: 'courier-new',
    label: 'Courier New',
    family: "'Courier New', Courier, monospace",
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
    const res = await httpClient.get<RawGoogleFontsResponse>(
      '/api/v1/media/fonts?sort=popularity',
      {
        timeoutMs: 2000,
        retries: 0,
      },
    );
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
 * Builds valid Google Fonts v2 CSS URL without requesting invalid or non-existent weights.
 */
export function buildGoogleFontUrl(fontOption: FontOption, variant?: FontVariantOption): string {
  const rawName = fontOption.family.split(',')[0]?.replace(/['"]/g, '').trim() || fontOption.label;
  const encodedName = encodeURIComponent(rawName).replace(/%20/g, '+');

  if (variant) {
    const isItalic = variant.style === 'italic';
    const weight = variant.weight || '400';
    if (isItalic) {
      return `https://fonts.googleapis.com/css2?family=${encodedName}:ital,wght@1,${weight}&display=swap`;
    }
    return `https://fonts.googleapis.com/css2?family=${encodedName}:wght@${weight}&display=swap`;
  }

  const variants =
    fontOption.variants && fontOption.variants.length > 0
      ? fontOption.variants
      : DEFAULT_FONT_VARIANTS;
  const weights = Array.from(new Set(variants.map((v) => v.weight))).sort(
    (a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10),
  );
  const hasItalic = variants.some((v) => v.style === 'italic');

  if (weights.length === 1 && weights[0] === '400' && !hasItalic) {
    return `https://fonts.googleapis.com/css2?family=${encodedName}&display=swap`;
  }

  if (!hasItalic) {
    return `https://fonts.googleapis.com/css2?family=${encodedName}:wght@${weights.join(';')}&display=swap`;
  }

  const segments: string[] = [];
  for (const w of weights) {
    if (variants.some((v) => v.weight === w && v.style === 'normal')) {
      segments.push(`0,${w}`);
    }
  }
  for (const w of weights) {
    if (variants.some((v) => v.weight === w && v.style === 'italic')) {
      segments.push(`1,${w}`);
    }
  }

  return `https://fonts.googleapis.com/css2?family=${encodedName}:ital,wght@${segments.join(';')}&display=swap`;
}

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
    const href = buildGoogleFontUrl(fontOption, variant);

    if (typeof document !== 'undefined') {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }

      if ('fonts' in document) {
        await document.fonts.load(`${targetStyle} ${targetWeight} 16px "${rawName}"`);
      }
    }

    loadedFontKeys.add(cacheKey);
    return true;
  } catch (err) {
    console.debug('WebFont loading handled gracefully:', err);
    return false;
  }
}
