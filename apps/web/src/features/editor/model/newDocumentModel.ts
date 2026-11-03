/**
 * Model and unit conversion utilities for the New Document / Custom Size dialog,
 * modeled after photocraft.exe (Photoshop architecture).
 */

export type UnitId = 'px' | 'in' | 'cm' | 'mm' | 'pt' | 'pica';

export interface UnitOption {
  readonly id: UnitId;
  readonly label: string;
  readonly perInch: number;
}

export const DOCUMENT_UNITS: readonly UnitOption[] = [
  { id: 'px', label: 'Pixels', perInch: 0 },
  { id: 'in', label: 'Polegadas', perInch: 1 },
  { id: 'cm', label: 'Centímetros', perInch: 2.54 },
  { id: 'mm', label: 'Milímetros', perInch: 25.4 },
  { id: 'pt', label: 'Pontos', perInch: 72 },
  { id: 'pica', label: 'Picas', perInch: 6 },
] as const;

/**
 * Converts pixels to the specified display unit at a given resolution (ppi).
 */
export function pxToUnit(px: number, unit: UnitId, ppi: number): number {
  const opt = DOCUMENT_UNITS.find((u) => u.id === unit);
  if (!opt || opt.perInch <= 0) {
    return Math.round(px);
  }
  const safePpi = Math.max(1, ppi);
  const val = (px / safePpi) * opt.perInch;
  // Format cleanly depending on unit
  if (unit === 'mm' || unit === 'pt') {
    return Math.round(val * 10) / 10;
  }
  return Math.round(val * 100) / 100;
}

/**
 * Converts a value in the specified display unit back to pixels at a given resolution (ppi).
 */
export function unitToPx(value: number, unit: UnitId, ppi: number): number {
  const opt = DOCUMENT_UNITS.find((u) => u.id === unit);
  if (!opt || opt.perInch <= 0) {
    return Math.max(1, Math.round(value));
  }
  const safePpi = Math.max(1, ppi);
  return Math.max(1, Math.round((value / opt.perInch) * safePpi));
}

export interface PresetItem {
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly resolution: number;
  readonly defaultUnit?: UnitId;
}

export interface CategoryItem {
  readonly id: string;
  readonly label: string;
  readonly presets: readonly PresetItem[];
}

export const NEW_DOCUMENT_CATEGORIES: readonly CategoryItem[] = [
  {
    id: 'recent',
    label: 'Recentes',
    presets: [
      {
        name: 'Padrão Pencel Full HD',
        width: 1920,
        height: 1080,
        resolution: 72,
        defaultUnit: 'px',
      },
      { name: 'Post de Instagram', width: 1080, height: 1080, resolution: 72, defaultUnit: 'px' },
      {
        name: 'A4 Impressão 300 DPI',
        width: 2480,
        height: 3508,
        resolution: 300,
        defaultUnit: 'mm',
      },
    ],
  },
  {
    id: 'saved',
    label: 'Salvos',
    presets: [],
  },
  {
    id: 'social',
    label: 'Redes Sociais',
    presets: [
      {
        name: 'Post de Instagram (1:1)',
        width: 1080,
        height: 1080,
        resolution: 72,
        defaultUnit: 'px',
      },
      {
        name: 'Story / Reels / TikTok (9:16)',
        width: 1080,
        height: 1920,
        resolution: 72,
        defaultUnit: 'px',
      },
      {
        name: 'Banner YouTube (16:9)',
        width: 2560,
        height: 1440,
        resolution: 72,
        defaultUnit: 'px',
      },
      {
        name: 'Post Feed LinkedIn / X',
        width: 1200,
        height: 628,
        resolution: 72,
        defaultUnit: 'px',
      },
      { name: 'Capa de Facebook', width: 820, height: 312, resolution: 72, defaultUnit: 'px' },
      { name: 'Thumbnail YouTube', width: 1280, height: 720, resolution: 72, defaultUnit: 'px' },
    ],
  },
  {
    id: 'photo',
    label: 'Foto',
    presets: [
      { name: 'Paisagem, 6 x 4', width: 1800, height: 1200, resolution: 300, defaultUnit: 'in' },
      { name: 'Paisagem, 7 x 5', width: 2100, height: 1500, resolution: 300, defaultUnit: 'in' },
      { name: 'Paisagem, 10 x 8', width: 3000, height: 2400, resolution: 300, defaultUnit: 'in' },
      { name: 'Retrato, 4 x 6', width: 1200, height: 1800, resolution: 300, defaultUnit: 'in' },
      { name: 'Retrato, 5 x 7', width: 1500, height: 2100, resolution: 300, defaultUnit: 'in' },
      { name: 'Quadrado, 5 x 5', width: 1500, height: 1500, resolution: 300, defaultUnit: 'in' },
    ],
  },
  {
    id: 'print',
    label: 'Impressão',
    presets: [
      { name: 'Carta (Letter)', width: 2550, height: 3300, resolution: 300, defaultUnit: 'in' },
      { name: 'Ofício (Legal)', width: 2550, height: 4200, resolution: 300, defaultUnit: 'in' },
      { name: 'Tabloide', width: 3300, height: 5100, resolution: 300, defaultUnit: 'in' },
      { name: 'A4', width: 2480, height: 3508, resolution: 300, defaultUnit: 'mm' },
      { name: 'A3', width: 3508, height: 4961, resolution: 300, defaultUnit: 'mm' },
      { name: 'A5', width: 1748, height: 2480, resolution: 300, defaultUnit: 'mm' },
      { name: 'B3', width: 4169, height: 5906, resolution: 300, defaultUnit: 'mm' },
      { name: 'B4', width: 2953, height: 4169, resolution: 300, defaultUnit: 'mm' },
    ],
  },
  {
    id: 'art',
    label: 'Arte & Ilustração',
    presets: [
      { name: 'Pôster Artístico', width: 5400, height: 7200, resolution: 300, defaultUnit: 'in' },
      { name: 'Cartão Postal', width: 1800, height: 1200, resolution: 300, defaultUnit: 'in' },
      {
        name: 'Página de Quadrinhos (HQ)',
        width: 1988,
        height: 3075,
        resolution: 300,
        defaultUnit: 'in',
      },
      { name: 'Quadrado 12 x 12', width: 3600, height: 3600, resolution: 300, defaultUnit: 'in' },
    ],
  },
  {
    id: 'web',
    label: 'Web',
    presets: [
      { name: 'Web Mais Comum', width: 1366, height: 768, resolution: 72, defaultUnit: 'px' },
      { name: 'Web Mínimo', width: 1024, height: 768, resolution: 72, defaultUnit: 'px' },
      {
        name: 'Web Grande (Full HD)',
        width: 1920,
        height: 1080,
        resolution: 72,
        defaultUnit: 'px',
      },
      { name: 'MacBook Pro 16"', width: 3456, height: 2234, resolution: 72, defaultUnit: 'px' },
      { name: 'iMac 24"', width: 4480, height: 2520, resolution: 72, defaultUnit: 'px' },
    ],
  },
  {
    id: 'mobile',
    label: 'Mobile',
    presets: [
      { name: 'iPhone 16', width: 1179, height: 2556, resolution: 72, defaultUnit: 'px' },
      { name: 'iPhone 16 Pro Max', width: 1320, height: 2868, resolution: 72, defaultUnit: 'px' },
      { name: 'iPad Pro 13"', width: 2064, height: 2752, resolution: 72, defaultUnit: 'px' },
      { name: 'Android 1080p', width: 1080, height: 1920, resolution: 72, defaultUnit: 'px' },
      { name: 'Apple Watch 45mm', width: 396, height: 484, resolution: 72, defaultUnit: 'px' },
    ],
  },
  {
    id: 'film',
    label: 'Filme & Vídeo',
    presets: [
      { name: 'HDTV 1080p', width: 1920, height: 1080, resolution: 72, defaultUnit: 'px' },
      { name: 'HDTV 720p', width: 1280, height: 720, resolution: 72, defaultUnit: 'px' },
      { name: 'UHD 4K', width: 3840, height: 2160, resolution: 72, defaultUnit: 'px' },
      { name: 'DCI 4K', width: 4096, height: 2160, resolution: 72, defaultUnit: 'px' },
      { name: 'UHD 8K', width: 7680, height: 4320, resolution: 72, defaultUnit: 'px' },
    ],
  },
] as const;

export interface SavedDocumentPreset {
  readonly id: string;
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly resolution: number;
  readonly unit: UnitId;
  readonly colorMode: string;
  readonly depth: number;
  readonly background: string;
  readonly customBgColor?: string;
  readonly createdAt: string;
}

export interface RecentDocumentPreset {
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly resolution: number;
  readonly unit: UnitId;
  readonly colorMode: string;
  readonly depth: number;
  readonly background: string;
  readonly customBgColor?: string;
  readonly createdAt: string;
}

export const STORAGE_KEY_SAVED_PRESETS = 'pencel_saved_document_presets';
export const STORAGE_KEY_RECENT_DOCS = 'pencel_recent_document_presets';

export function loadSavedPresets(): readonly SavedDocumentPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_PRESETS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as SavedDocumentPreset[];
    }
  } catch {
    // Ignore storage parse errors
  }
  return [];
}

export function saveSavedPresets(presets: readonly SavedDocumentPreset[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SAVED_PRESETS, JSON.stringify(presets));
  } catch {
    // Ignore storage write errors
  }
}

export function loadRecentPresets(): readonly RecentDocumentPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECENT_DOCS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as RecentDocumentPreset[];
    }
  } catch {
    // Ignore storage parse errors
  }
  return [];
}

export function addRecentPreset(doc: RecentDocumentPreset): void {
  try {
    const recents = loadRecentPresets();
    const filtered = recents.filter((r) => !(r.width === doc.width && r.height === doc.height));
    const updated = [doc, ...filtered].slice(0, 20);
    localStorage.setItem(STORAGE_KEY_RECENT_DOCS, JSON.stringify(updated));
  } catch {
    // Ignore storage write errors
  }
}
