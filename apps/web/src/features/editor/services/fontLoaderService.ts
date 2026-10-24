/**
 * @pencel/web - Font Loader Service
 * Expands typography options with Google Fonts and dynamic web-font loading into Canvas.
 */

export interface FontOption {
  readonly id: string;
  readonly label: string;
  readonly family: string;
  readonly category: 'Sans-Serif' | 'Serif' | 'Display' | 'Script' | 'Monospace';
  readonly isGoogleFont?: boolean;
}

export const EXPANDED_FONT_CATALOG: readonly FontOption[] = [
  // Sans-Serif
  {
    id: 'inter',
    label: 'Inter',
    family: 'Inter, -apple-system, sans-serif',
    category: 'Sans-Serif',
  },
  {
    id: 'sf-pro',
    label: 'SF Pro / Sistema',
    family: '-apple-system, BlinkMacSystemFont, sans-serif',
    category: 'Sans-Serif',
  },
  {
    id: 'poppins',
    label: 'Poppins',
    family: "'Poppins', sans-serif",
    category: 'Sans-Serif',
    isGoogleFont: true,
  },
  {
    id: 'montserrat',
    label: 'Montserrat',
    family: "'Montserrat', sans-serif",
    category: 'Sans-Serif',
    isGoogleFont: true,
  },
  {
    id: 'outfit',
    label: 'Outfit',
    family: "'Outfit', sans-serif",
    category: 'Sans-Serif',
    isGoogleFont: true,
  },
  {
    id: 'roboto',
    label: 'Roboto',
    family: "'Roboto', sans-serif",
    category: 'Sans-Serif',
    isGoogleFont: true,
  },
  {
    id: 'plus-jakarta',
    label: 'Plus Jakarta Sans',
    family: "'Plus Jakarta Sans', sans-serif",
    category: 'Sans-Serif',
    isGoogleFont: true,
  },

  // Serif
  {
    id: 'playfair',
    label: 'Playfair Display',
    family: "'Playfair Display', serif",
    category: 'Serif',
    isGoogleFont: true,
  },
  {
    id: 'merriweather',
    label: 'Merriweather',
    family: "'Merriweather', serif",
    category: 'Serif',
    isGoogleFont: true,
  },
  {
    id: 'cinzel',
    label: 'Cinzel (Clássico)',
    family: "'Cinzel', serif",
    category: 'Serif',
    isGoogleFont: true,
  },
  { id: 'georgia', label: 'Georgia', family: 'Georgia, serif', category: 'Serif' },

  // Display & Impact
  {
    id: 'bebas-neue',
    label: 'Bebas Neue',
    family: "'Bebas Neue', sans-serif",
    category: 'Display',
    isGoogleFont: true,
  },
  { id: 'impact', label: 'Impact', family: 'Impact, sans-serif', category: 'Display' },
  {
    id: 'space-grotesk',
    label: 'Space Grotesk',
    family: "'Space Grotesk', sans-serif",
    category: 'Display',
    isGoogleFont: true,
  },
  {
    id: 'syne',
    label: 'Syne (Vanguarda)',
    family: "'Syne', sans-serif",
    category: 'Display',
    isGoogleFont: true,
  },

  // Script & Handwritten
  {
    id: 'caveat',
    label: 'Caveat (Manuscrita)',
    family: "'Caveat', cursive",
    category: 'Script',
    isGoogleFont: true,
  },
  {
    id: 'dancing-script',
    label: 'Dancing Script',
    family: "'Dancing Script', cursive",
    category: 'Script',
    isGoogleFont: true,
  },
  {
    id: 'pacifico',
    label: 'Pacifico',
    family: "'Pacifico', cursive",
    category: 'Script',
    isGoogleFont: true,
  },

  // Monospace
  {
    id: 'jetbrains-mono',
    label: 'JetBrains Mono',
    family: "'JetBrains Mono', monospace",
    category: 'Monospace',
    isGoogleFont: true,
  },
  {
    id: 'fira-code',
    label: 'Fira Code',
    family: "'Fira Code', monospace",
    category: 'Monospace',
    isGoogleFont: true,
  },
  {
    id: 'courier-new',
    label: 'Courier New',
    family: "'Courier New', monospace",
    category: 'Monospace',
  },
];

const loadedFonts = new Set<string>();

/**
 * Dynamically injects Google Font link and resolves once the font is loaded into document.fonts.
 */
export async function loadWebFont(fontOption: FontOption): Promise<boolean> {
  if (!fontOption.isGoogleFont || loadedFonts.has(fontOption.id)) {
    return true;
  }

  try {
    const rawName =
      fontOption.family.split(',')[0]?.replace(/['"]/g, '').trim() || fontOption.label;
    const fontNameUrl = encodeURIComponent(rawName).replace(/%20/g, '+');
    const href = `https://fonts.googleapis.com/css2?family=${fontNameUrl}:wght@400;600;700;900&display=swap`;

    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }

    if ('fonts' in document) {
      await document.fonts.load(`16px "${rawName}"`);
    }

    loadedFonts.add(fontOption.id);
    return true;
  } catch (err) {
    console.debug('WebFont loading handled gracefully:', err);
    return false;
  }
}
