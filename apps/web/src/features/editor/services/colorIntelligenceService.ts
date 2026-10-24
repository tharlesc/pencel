/**
 * @pencel/web - Color Intelligence Service
 * Provides AI-assisted palette generation (backend proxy + local algorithmic harmonies)
 * and Pickshade-inspired tints, shades, and WCAG accessibility contrast ratios.
 */

import { httpClient } from './httpClient.js';

export interface ColorShadesResult {
  readonly baseHex: string;
  readonly tints: readonly string[]; // Lighter steps towards pure white
  readonly shades: readonly string[]; // Darker steps towards pure black
  readonly complementary: string;
  readonly triadic: readonly [string, string];
  readonly analogous: readonly [string, string];
  readonly contrastOnWhite: number;
  readonly contrastOnBlack: number;
}

export interface CuratedPalette {
  readonly id: string;
  readonly name: string;
  readonly colors: readonly string[];
}

export const DESIGNER_PALETTES: readonly CuratedPalette[] = [
  {
    id: 'apple-studio',
    name: 'Apple Pro Studio',
    colors: ['#0071E3', '#30D158', '#FF9F0A', '#1C1C1E', '#F5F5F7'],
  },
  {
    id: 'deep-ocean',
    name: 'Oceano Profundo',
    colors: ['#0A2540', '#0070F3', '#60A5FA', '#06B6D4', '#E0F2FE'],
  },
  {
    id: 'sunset-glow',
    name: 'Pôr do Sol Radiante',
    colors: ['#7C2D12', '#EA580C', '#F97316', '#FBBF24', '#FEF3C7'],
  },
  {
    id: 'nordic-forest',
    name: 'Floresta Nórdica',
    colors: ['#14532D', '#16A34A', '#4ADE80', '#A7F3D0', '#F0FDF4'],
  },
  {
    id: 'luxury-noir',
    name: 'Noir & Ouro',
    colors: ['#18181B', '#27272A', '#CA8A04', '#EAB308', '#FEF08A'],
  },
  {
    id: 'cyber-neon',
    name: 'Cyberpunk Neon',
    colors: ['#3B0764', '#9333EA', '#C084FC', '#06B6D4', '#22D3EE'],
  },
  {
    id: 'retro-pastel',
    name: 'Pastel Moderno',
    colors: ['#FDA4AF', '#FCD34D', '#A7F3D0', '#BAE6FD', '#DDD6FE'],
  },
];

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  const num = Number.parseInt(
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean,
    16,
  );
  if (Number.isNaN(num)) return [0, 113, 227];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const hex = [clamp(r), clamp(g), clamp(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `#${hex.toUpperCase()}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (h >= 0 && h < 60) {
    rPrime = c;
    gPrime = x;
  } else if (h >= 60 && h < 120) {
    rPrime = x;
    gPrime = c;
  } else if (h >= 120 && h < 180) {
    gPrime = c;
    bPrime = x;
  } else if (h >= 180 && h < 240) {
    gPrime = x;
    bPrime = c;
  } else if (h >= 240 && h < 300) {
    rPrime = x;
    bPrime = c;
  } else {
    rPrime = c;
    bPrime = x;
  }

  return [
    Math.round((rPrime + m) * 255),
    Math.round((gPrime + m) * 255),
    Math.round((bPrime + m) * 255),
  ];
}

/**
 * Calculates relative luminance for WCAG contrast ratio calculations.
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs! + 0.7152 * gs! + 0.0722 * bs!;
}

function calculateContrast(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const lum1 = getRelativeLuminance(...rgb1);
  const lum2 = getRelativeLuminance(...rgb2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return Number(((brightest + 0.05) / (darkest + 0.05)).toFixed(2));
}

/**
 * Generates Pickshade-inspired tints, shades, and harmonious color variants.
 */
export function getColorShadesAndTints(hexColor: string): ColorShadesResult {
  const [r, g, b] = hexToRgb(hexColor);
  const [h, s, l] = rgbToHsl(r, g, b);

  // Tints (moving towards pure white: increasing lightness)
  const tintSteps = [0.15, 0.3, 0.45, 0.6, 0.75, 0.9];
  const tints = tintSteps.map((step) => {
    const newR = Math.round(r + (255 - r) * step);
    const newG = Math.round(g + (255 - g) * step);
    const newB = Math.round(b + (255 - b) * step);
    return rgbToHex(newR, newG, newB);
  });

  // Shades (moving towards black: decreasing lightness)
  const shadeSteps = [0.15, 0.3, 0.45, 0.6, 0.75, 0.9];
  const shades = shadeSteps.map((step) => {
    const newR = Math.round(r * (1 - step));
    const newG = Math.round(g * (1 - step));
    const newB = Math.round(b * (1 - step));
    return rgbToHex(newR, newG, newB);
  });

  // Complementary (180 deg)
  const compHsl = hslToRgb((h + 180) % 360, s, l);
  const complementary = rgbToHex(...compHsl);

  // Triadic (+120, +240)
  const tri1 = hslToRgb((h + 120) % 360, s, l);
  const tri2 = hslToRgb((h + 240) % 360, s, l);
  const triadic: [string, string] = [rgbToHex(...tri1), rgbToHex(...tri2)];

  // Analogous (+30, -30)
  const an1 = hslToRgb((h + 30) % 360, s, l);
  const an2 = hslToRgb((h + 330) % 360, s, l);
  const analogous: [string, string] = [rgbToHex(...an1), rgbToHex(...an2)];

  const contrastOnWhite = calculateContrast([r, g, b], [255, 255, 255]);
  const contrastOnBlack = calculateContrast([r, g, b], [0, 0, 0]);

  return {
    baseHex: rgbToHex(r, g, b),
    tints,
    shades,
    complementary,
    triadic,
    analogous,
    contrastOnWhite,
    contrastOnBlack,
  };
}

/**
 * Requests an intelligent 5-color palette from the `/api/v1/media/palettes` backend proxy
 * with automatic fallback to local harmonic synthesis when offline.
 */
export async function generateColormindPalette(
  modelOrSeed: 'default' | 'ui' | string = 'default',
  optionalSeed?: string,
): Promise<string[]> {
  const isSeedFirst = typeof modelOrSeed === 'string' && modelOrSeed.startsWith('#');
  const model = isSeedFirst ? 'default' : (modelOrSeed as 'default' | 'ui');
  const seedHex = isSeedFirst ? modelOrSeed : optionalSeed;

  const seedRgb = seedHex && seedHex.startsWith('#') ? hexToRgb(seedHex) : null;
  const inputParam = seedRgb ? [seedRgb, 'N', 'N', 'N', 'N'] : undefined;

  const result = await httpClient.post<{
    readonly colors?: readonly string[];
    readonly result?: ReadonlyArray<readonly number[]>;
  }>(
    '/api/v1/media/palettes',
    {
      model,
      seedHex,
      input: inputParam,
    },
    { timeoutMs: 4000 },
  );

  if (result.ok) {
    if (Array.isArray(result.data.colors) && result.data.colors.length >= 5) {
      return result.data.colors.slice(0, 5).map((c) => c.toUpperCase());
    }
    if (Array.isArray(result.data.result) && result.data.result.length >= 5) {
      return result.data.result.slice(0, 5).map((rgb) => {
        const r = rgb[0] ?? 0;
        const g = rgb[1] ?? 0;
        const b = rgb[2] ?? 0;
        return rgbToHex(r, g, b);
      });
    }
  }

  // Fallback: Generate harmonic palette algorithmically
  if (seedHex && seedHex.startsWith('#')) {
    const [baseH, baseS, baseL] = rgbToHsl(...hexToRgb(seedHex));
    const variations = [
      hexToRgb(seedHex),
      hslToRgb((baseH + 30) % 360, Math.min(100, baseS + 5), Math.max(10, baseL - 10)),
      hslToRgb((baseH + 60) % 360, Math.min(100, baseS + 10), Math.min(90, baseL + 10)),
      hslToRgb((baseH + 180) % 360, baseS, baseL),
      hslToRgb(baseH, Math.max(10, baseS - 30), 92),
    ];
    return variations.map((rgb) => rgbToHex(...rgb));
  }

  const baseH = Math.floor(Math.random() * 360);
  const baseS = 65;
  const variations = [
    hslToRgb(baseH, baseS, 18),
    hslToRgb((baseH + 15) % 360, baseS + 10, 42),
    hslToRgb((baseH + 45) % 360, baseS + 15, 60),
    hslToRgb((baseH + 180) % 360, baseS + 20, 55),
    hslToRgb(baseH, 20, 94),
  ];

  return variations.map((rgb) => rgbToHex(...rgb));
}
