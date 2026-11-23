import { CURATED_AI_FONTS } from './ai.prompts.js';
import type {
  ArtDirectionSummaryDto,
  CanvasLayoutElementDto,
  CanvasLayoutElementType,
  GeneratedLayoutDto,
  LayoutCompositionArchetype,
  LayoutGradientSpec,
  LayoutGradientStop,
  LayoutShadowSpec,
} from './ai.types.js';

const ALLOWED_ELEMENT_TYPES = new Set<CanvasLayoutElementType>([
  'rect',
  'circle',
  'ellipse',
  'triangle',
  'line',
  'polygon',
  'path',
  'textbox',
  'image',
]);

const ALLOWED_ARCHETYPES = new Set<LayoutCompositionArchetype>([
  'auto',
  'poster-impact',
  'swiss-editorial',
  'carousel-cover',
  'product-spotlight',
  'photo-overlay',
  'editorial-split',
  'bold-typo',
  'framed-card',
  'hero-bento',
]);

const CURATED_FONT_MAP = new Map<string, string>(
  CURATED_AI_FONTS.map((font) => [font.toLowerCase(), font]),
);

/**
 * Strips markdown code fences, prose wrappers, and trailing commas from raw LLM JSON output.
 */
export function cleanJsonFromLlm(text: string): string {
  let cleaned = text.trim();
  cleaned = cleaned
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  // Repair trailing commas before closing object/array tokens (common LLM quirk)
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
  return cleaned;
}

/**
 * Validates and normalizes hex color strings (#RGB or #RRGGBB -> #RRGGBB).
 */
export function normalizeHexColor(value: unknown, fallback?: string): string | undefined {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const r = trimmed[1]!;
    const g = trimmed[2]!;
    const b = trimmed[3]!;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  if (/^#[0-9a-fA-F]{8}$/.test(trimmed)) {
    return trimmed.slice(0, 7).toUpperCase();
  }
  return fallback;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = normalizeHexColor(hex, '#121214')!.slice(1);
  return [
    Number.parseInt(clean.slice(0, 2), 16),
    Number.parseInt(clean.slice(2, 4), 16),
    Number.parseInt(clean.slice(4, 6), 16),
  ];
}

function blendHexColors(fgHex: string, bgHex: string, fgAlpha: number): string {
  const [fr, fg, fb] = hexToRgb(fgHex);
  const [br, bg, bb] = hexToRgb(bgHex);
  const a = Math.max(0, Math.min(1, fgAlpha));
  const r = Math.round(fr * a + br * (1 - a));
  const g = Math.round(fg * a + bg * (1 - a));
  const b = Math.round(fb * a + bb * (1 - a));
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

/**
 * Computes WCAG 2.1 contrast ratio between two hex colors (1.0 .. 21.0).
 */
export function calculateContrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexA);
  const lumB = relativeLuminance(hexB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Returns crisp off-white or deep ink maximizing contrast against `surfaceHex`.
 */
export function pickHighContrastTextColor(surfaceHex: string): string {
  const lightCandidate = '#F8FAFC';
  const darkCandidate = '#111318';
  return calculateContrastRatio(lightCandidate, surfaceHex) >=
    calculateContrastRatio(darkCandidate, surfaceHex)
    ? lightCandidate
    : darkCandidate;
}

function normalizeGradient(raw: unknown): LayoutGradientSpec | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const obj = raw as Record<string, unknown>;
  const type = obj.type === 'radial' ? 'radial' : 'linear';
  const rawStops = Array.isArray(obj.stops) ? obj.stops : [];
  const stops: LayoutGradientStop[] = [];

  for (let i = 0; i < rawStops.length; i++) {
    const st = rawStops[i];
    if (!st || typeof st !== 'object') continue;
    const stopObj = st as Record<string, unknown>;
    const color = normalizeHexColor(stopObj.color);
    if (!color) continue;
    const rawOffset = Number(stopObj.offset);
    const offset = Number.isFinite(rawOffset)
      ? Math.max(0, Math.min(1, rawOffset))
      : rawStops.length > 1
        ? i / (rawStops.length - 1)
        : 0;
    const opacity =
      typeof stopObj.opacity === 'number' && Number.isFinite(stopObj.opacity)
        ? Math.max(0, Math.min(1, stopObj.opacity))
        : undefined;
    stops.push({ offset, color, ...(opacity !== undefined ? { opacity } : {}) });
  }

  if (stops.length < 2) return undefined;
  stops.sort((a, b) => a.offset - b.offset);

  const rawAngle = Number(obj.angle);
  const angle = Number.isFinite(rawAngle) ? Math.round(rawAngle) : 135;

  return { type, angle, stops };
}

function normalizeShadow(raw: unknown): LayoutShadowSpec | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const obj = raw as Record<string, unknown>;
  const rawColor = typeof obj.color === 'string' ? obj.color.trim() : '';
  const color =
    normalizeHexColor(rawColor) ??
    (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)$/i.test(rawColor)
      ? rawColor
      : 'rgba(0, 0, 0, 0.28)');
  const blur = Number.isFinite(Number(obj.blur))
    ? Math.max(0, Math.min(120, Math.round(Number(obj.blur))))
    : 20;
  const offsetX = Number.isFinite(Number(obj.offsetX))
    ? Math.max(-80, Math.min(80, Math.round(Number(obj.offsetX))))
    : 0;
  const offsetY = Number.isFinite(Number(obj.offsetY))
    ? Math.max(-80, Math.min(80, Math.round(Number(obj.offsetY))))
    : 8;

  return { color, blur, offsetX, offsetY };
}

function normalizeFontFamily(raw: unknown): string {
  if (typeof raw !== 'string' || !raw.trim()) return 'Inter';
  const primary = raw.split(',')[0]?.replace(/['"]/g, '').trim() ?? '';
  const matched = CURATED_FONT_MAP.get(primary.toLowerCase());
  if (matched) return matched;
  return primary || 'Inter';
}

function normalizeFontWeight(raw: unknown): CanvasLayoutElementDto['fontWeight'] {
  if (raw === 'bold' || raw === 'normal') return raw;
  const num = Number(raw);
  if (Number.isFinite(num)) {
    const snapped = Math.round(num / 100) * 100;
    if (snapped <= 300) return 300;
    if (snapped === 400) return 400;
    if (snapped === 500) return 500;
    if (snapped === 600) return 600;
    if (snapped === 700) return 700;
    if (snapped === 800) return 800;
    return 900;
  }
  return 500;
}

function normalizeElementType(raw: unknown): CanvasLayoutElementType {
  const s = String(raw ?? '')
    .toLowerCase()
    .trim();
  if (s === 'text' || s === 'i-text' || s === 'textbox') return 'textbox';
  if (s === 'photo' || s === 'img' || s === 'image') return 'image';
  if (s === 'star') return 'polygon';
  if (ALLOWED_ELEMENT_TYPES.has(s as CanvasLayoutElementType)) {
    return s as CanvasLayoutElementType;
  }
  return 'rect';
}

function estimateTextboxHeight(el: CanvasLayoutElementDto): number {
  const text = (el.text ?? '').trim();
  if (!text) return el.height ?? 40;
  const fontSize = el.fontSize ?? 24;
  const lineHeight = el.lineHeight ?? 1.25;
  const width = Math.max(80, el.width ?? 300);
  const charsPerLine = Math.max(6, Math.floor(width / (fontSize * 0.56)));

  let lines = 0;
  for (const segment of text.split('\n')) {
    lines += Math.max(1, Math.ceil(segment.length / charsPerLine));
  }
  return Math.round(lines * fontSize * lineHeight);
}

function estimateSurfaceColorAtPoint(
  elements: readonly CanvasLayoutElementDto[],
  targetIndex: number,
  pointX: number,
  pointY: number,
  baseBackground: string,
): string {
  let effectiveBg = baseBackground;

  for (let i = 0; i < targetIndex; i++) {
    const el = elements[i]!;
    if (el.type === 'textbox' || el.type === 'line' || el.type === 'path') continue;

    const w =
      el.type === 'circle'
        ? (el.radius ?? 50) * 2
        : el.type === 'ellipse'
          ? (el.rx ?? (el.width ?? 100) / 2) * 2
          : (el.width ?? 100);
    const h =
      el.type === 'circle'
        ? (el.radius ?? 50) * 2
        : el.type === 'ellipse'
          ? (el.ry ?? (el.height ?? 100) / 2) * 2
          : (el.height ?? 100);

    const inside =
      pointX >= el.left && pointX <= el.left + w && pointY >= el.top && pointY <= el.top + h;
    if (!inside) continue;

    const surfaceHex = el.fillGradient?.stops[0]?.color ?? normalizeHexColor(el.fill);
    if (!surfaceHex) continue;

    const alpha = el.opacity ?? 1;
    effectiveBg = alpha >= 0.98 ? surfaceHex : blendHexColors(surfaceHex, effectiveBg, alpha);
  }

  return effectiveBg;
}

/**
 * Applies WCAG contrast guard, mobile Story safe zones, and overlap clamping to normalized elements.
 */
function polishLayoutElements(
  rawElements: readonly CanvasLayoutElementDto[],
  width: number,
  height: number,
  backgroundColor: string,
): CanvasLayoutElementDto[] {
  const elements = rawElements.map((el) => ({ ...el }));
  const safePadX = Math.max(16, Math.round(width * 0.04));
  const isVerticalStory = width / Math.max(1, height) < 0.72;
  const storySafeTop = isVerticalStory ? Math.round(height * 0.095) : 0;
  const storySafeBottom = isVerticalStory ? Math.round(height * 0.9) : height;

  const isDecorativeWatermark = (el: CanvasLayoutElementDto): boolean =>
    el.type === 'textbox' && (el.opacity ?? 1) <= 0.22;

  // 1. Clamp readable textboxes inside horizontal safe bounds (and Story vertical safe zones)
  for (const el of elements) {
    if (el.type !== 'textbox' || isDecorativeWatermark(el)) continue;
    const boxW = Math.min(width - safePadX * 2, Math.max(80, el.width ?? Math.round(width * 0.7)));
    const clampedLeft = Math.max(safePadX, Math.min(width - safePadX - boxW, el.left));
    el.left = Math.round(clampedLeft);
    el.width = Math.round(boxW);

    if (isVerticalStory) {
      const estH = estimateTextboxHeight(el);
      if (el.top < storySafeTop) {
        el.top = storySafeTop;
      } else if (el.top + estH > storySafeBottom && storySafeBottom - estH >= storySafeTop) {
        el.top = Math.round(storySafeBottom - estH);
      }
    }
  }

  // 2. Gentle vertical anti-collision pass for stacked readable textboxes in the same column
  for (let i = 1; i < elements.length; i++) {
    const current = elements[i]!;
    if (current.type !== 'textbox' || isDecorativeWatermark(current)) continue;

    // Detect if this textbox is a label centered inside an immediately preceding pill/button/seal shape
    const prevEl = elements[i - 1];
    const isPairedButtonLabel =
      prevEl &&
      (prevEl.type === 'rect' || prevEl.type === 'polygon' || prevEl.type === 'circle') &&
      (prevEl.height ?? (prevEl.radius ?? 60) * 2) <= 130 &&
      Math.abs(current.top - prevEl.top) <= 50 &&
      current.left >= prevEl.left - 24 &&
      current.left + (current.width ?? 100) <=
        prevEl.left + (prevEl.width ?? (prevEl.radius ?? 60) * 2) + 24;

    const currentW = current.width ?? 200;

    for (let j = i - 1; j >= 0; j--) {
      const prior = elements[j]!;
      if (prior.type !== 'textbox' || isDecorativeWatermark(prior)) continue;
      const priorW = prior.width ?? 200;

      // Only check textboxes that actually overlap horizontally
      const horizOverlap =
        Math.min(current.left + currentW, prior.left + priorW) - Math.max(current.left, prior.left);
      if (horizOverlap <= Math.min(currentW, priorW) * 0.25) continue;

      const priorBottom = prior.top + estimateTextboxHeight(prior);
      const minGap = 14;
      const effectiveCurrentTop = isPairedButtonLabel && prevEl ? prevEl.top : current.top;

      if (effectiveCurrentTop < priorBottom + minGap && effectiveCurrentTop >= prior.top - 10) {
        const delta = priorBottom + minGap - effectiveCurrentTop;
        const maxBottom = Math.min(
          storySafeBottom,
          height - Math.max(16, Math.round(height * 0.03)),
        );
        const currentEstH =
          isPairedButtonLabel && prevEl ? (prevEl.height ?? 56) : estimateTextboxHeight(current);

        if (effectiveCurrentTop + delta + currentEstH <= maxBottom) {
          current.top = Math.round(current.top + delta);
          if (isPairedButtonLabel && prevEl) {
            prevEl.top = Math.round(prevEl.top + delta);
          }
        }
      }
      break;
    }
  }

  // 3. WCAG contrast verification and auto-repair for every readable textbox
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i]!;
    if (el.type !== 'textbox' || isDecorativeWatermark(el)) continue;

    // Preserve hollow outlined poster lettering (transparent fill + visible stroke)
    if (el.fill === 'transparent' && el.stroke) {
      const centerX = el.left + (el.width ?? 200) / 2;
      const centerY = el.top + Math.min(40, estimateTextboxHeight(el) / 2);
      const underlyingBg = estimateSurfaceColorAtPoint(
        elements,
        i,
        centerX,
        centerY,
        backgroundColor,
      );
      if (calculateContrastRatio(el.stroke, underlyingBg) < 3.0) {
        el.stroke = pickHighContrastTextColor(underlyingBg);
      }
      continue;
    }

    const fillHex = normalizeHexColor(el.fill, '#FFFFFF')!;
    const centerX = el.left + (el.width ?? 200) / 2;
    const centerY = el.top + Math.min(40, estimateTextboxHeight(el) / 2);
    const underlyingBg =
      normalizeHexColor(el.textBackgroundColor) ??
      estimateSurfaceColorAtPoint(elements, i, centerX, centerY, backgroundColor);

    const fontSize = el.fontSize ?? 24;
    const isLarge =
      fontSize >= 28 ||
      (fontSize >= 20 &&
        (el.fontWeight === 'bold' || (typeof el.fontWeight === 'number' && el.fontWeight >= 700)));
    const minRatio = isLarge ? 3.2 : 4.5;

    if (calculateContrastRatio(fillHex, underlyingBg) < minRatio) {
      el.fill = pickHighContrastTextColor(underlyingBg);
    } else {
      el.fill = fillHex;
    }
  }

  return elements;
}

function extractPaletteAndFonts(
  backgroundColor: string,
  backgroundGradient: LayoutGradientSpec | undefined,
  elements: readonly CanvasLayoutElementDto[],
): { readonly palette: readonly string[]; readonly fontsUsed: readonly string[] } {
  const colorSet = new Set<string>([backgroundColor.toUpperCase()]);
  if (backgroundGradient) {
    for (const stop of backgroundGradient.stops) {
      colorSet.add(stop.color.toUpperCase());
    }
  }

  const fontSet = new Set<string>();

  for (const el of elements) {
    if (el.type === 'textbox' && el.fontFamily) {
      fontSet.add(el.fontFamily);
    }
    const fillHex = normalizeHexColor(el.fill);
    if (fillHex) colorSet.add(fillHex);
    if (el.fillGradient) {
      for (const stop of el.fillGradient.stops) {
        colorSet.add(stop.color.toUpperCase());
      }
    }
  }

  return {
    palette: Array.from(colorSet).slice(0, 5),
    fontsUsed: Array.from(fontSet),
  };
}

/**
 * Normalizes, validates, and polishes a single layout JSON payload returned by an LLM.
 */
export function normalizeSingleLayout(
  raw: unknown,
  dimensions?: { readonly width: number; readonly height: number },
  fallbackArchetype?: LayoutCompositionArchetype,
  variationIndex = 0,
  artDirection?: ArtDirectionSummaryDto,
): GeneratedLayoutDto | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const artboardW = dimensions?.width ?? 1080;
  const artboardH = dimensions?.height ?? 1080;

  const rawElements = Array.isArray(obj.elements)
    ? obj.elements
    : Array.isArray(obj.items)
      ? obj.items
      : Array.isArray(obj.components)
        ? obj.components
        : [];

  const elements: CanvasLayoutElementDto[] = [];

  for (let i = 0; i < rawElements.length; i++) {
    const el = rawElements[i];
    if (!el || typeof el !== 'object') continue;
    const item = el as Record<string, unknown>;

    const type = normalizeElementType(item.type);
    const id = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `ai-el-${i + 1}`;
    const name =
      typeof item.name === 'string' && item.name.trim() ? item.name.trim() : `Element ${i + 1}`;

    const left = Number.isFinite(Number(item.left)) ? Math.round(Number(item.left)) : 0;
    const top = Number.isFinite(Number(item.top)) ? Math.round(Number(item.top)) : 0;
    const width =
      Number.isFinite(Number(item.width)) && Number(item.width) > 0
        ? Math.round(Number(item.width))
        : type === 'textbox'
          ? Math.round(artboardW * 0.72)
          : type === 'line'
            ? Math.round(artboardW * 0.25)
            : 200;
    const height =
      Number.isFinite(Number(item.height)) && Number(item.height) > 0
        ? Math.round(Number(item.height))
        : type === 'textbox'
          ? 60
          : type === 'line'
            ? 4
            : 200;

    const stroke = normalizeHexColor(item.stroke);
    const isHollowText =
      type === 'textbox' &&
      typeof item.fill === 'string' &&
      (item.fill.trim().toLowerCase() === 'transparent' ||
        item.fill.trim().toLowerCase() === 'none') &&
      Boolean(stroke);
    const fill = isHollowText ? 'transparent' : normalizeHexColor(item.fill, '#FFFFFF')!;
    const fillGradient = normalizeGradient(item.fillGradient);
    const strokeWidth =
      Number.isFinite(Number(item.strokeWidth)) && Number(item.strokeWidth) > 0
        ? Number(item.strokeWidth)
        : undefined;
    const strokeDashArray = Array.isArray(item.strokeDashArray)
      ? item.strokeDashArray.map(Number).filter((n) => Number.isFinite(n) && n > 0)
      : undefined;
    const opacity =
      typeof item.opacity === 'number' && Number.isFinite(item.opacity)
        ? Math.min(1, Math.max(0.02, item.opacity))
        : 1;
    const angle =
      typeof item.angle === 'number' && Number.isFinite(item.angle) && item.angle !== 0
        ? Math.max(-360, Math.min(360, Math.round(item.angle)))
        : undefined;
    const shadow = normalizeShadow(item.shadow);
    const textBackgroundColor =
      type === 'textbox' ? normalizeHexColor(item.textBackgroundColor) : undefined;

    const baseDto: CanvasLayoutElementDto = {
      id,
      type,
      name,
      left,
      top,
      width,
      height,
      fill,
      opacity,
      ...(fillGradient ? { fillGradient } : {}),
      ...(stroke ? { stroke } : {}),
      ...(strokeWidth !== undefined ? { strokeWidth } : {}),
      ...(strokeDashArray && strokeDashArray.length > 0 ? { strokeDashArray } : {}),
      ...(angle !== undefined ? { angle } : {}),
      ...(shadow ? { shadow } : {}),
      ...(type === 'circle'
        ? {
            radius: Math.max(
              4,
              Math.round(Number(item.radius) > 0 ? Number(item.radius) : width / 2),
            ),
          }
        : {}),
      ...(type === 'ellipse'
        ? {
            rx: Math.max(4, Math.round(Number(item.rx) > 0 ? Number(item.rx) : width / 2)),
            ry: Math.max(4, Math.round(Number(item.ry) > 0 ? Number(item.ry) : height / 2)),
          }
        : {}),
      ...((type === 'rect' || type === 'line') && Number(item.rx) > 0
        ? {
            rx: Math.round(Number(item.rx)),
            ry: Math.round(Number(item.ry) > 0 ? Number(item.ry) : Number(item.rx)),
          }
        : {}),
      ...(type === 'polygon'
        ? {
            sides: Math.max(3, Math.min(16, Math.round(Number(item.sides) || 6))),
            isStar: Boolean(item.isStar) || String(item.type).toLowerCase() === 'star',
            radius: Math.max(
              10,
              Math.round(
                Number(item.radius) > 0 ? Number(item.radius) : Math.min(width, height) / 2,
              ),
            ),
          }
        : {}),
      ...(type === 'path' && typeof item.pathData === 'string' && item.pathData.trim()
        ? { pathData: item.pathData.trim() }
        : {}),
      ...(type === 'image'
        ? {
            ...(typeof item.imageQuery === 'string' && item.imageQuery.trim()
              ? { imageQuery: item.imageQuery.trim() }
              : {}),
            ...(typeof item.imageUrl === 'string' && item.imageUrl.trim()
              ? { imageUrl: item.imageUrl.trim() }
              : {}),
            borderRadius:
              Number.isFinite(Number(item.borderRadius)) && Number(item.borderRadius) > 0
                ? Math.round(Number(item.borderRadius))
                : Number.isFinite(Number(item.rx)) && Number(item.rx) > 0
                  ? Math.round(Number(item.rx))
                  : 0,
            objectFit: item.objectFit === 'contain' ? 'contain' : 'cover',
          }
        : {}),
      ...(type === 'textbox'
        ? {
            text:
              typeof item.text === 'string' && item.text.trim()
                ? item.text.replace(/\u2014/g, '-')
                : 'Headline',
            fontSize: Math.max(10, Math.min(340, Math.round(Number(item.fontSize) || 36))),
            fontWeight: normalizeFontWeight(item.fontWeight),
            fontFamily: normalizeFontFamily(item.fontFamily),
            fontStyle: item.fontStyle === 'italic' ? 'italic' : 'normal',
            textAlign:
              item.textAlign === 'center' ||
              item.textAlign === 'right' ||
              item.textAlign === 'justify'
                ? item.textAlign
                : 'left',
            ...(Number.isFinite(Number(item.lineHeight)) && Number(item.lineHeight) > 0
              ? { lineHeight: Math.max(0.85, Math.min(2.2, Number(item.lineHeight))) }
              : {}),
            ...(Number.isFinite(Number(item.charSpacing))
              ? { charSpacing: Math.max(-100, Math.min(600, Math.round(Number(item.charSpacing)))) }
              : {}),
            ...(textBackgroundColor ? { textBackgroundColor } : {}),
          }
        : {}),
    };

    if (type === 'path' && !baseDto.pathData) continue;
    elements.push(baseDto);
  }

  if (elements.length === 0) return null;

  const backgroundGradient = normalizeGradient(obj.backgroundGradient);
  const bgColor =
    normalizeHexColor(obj.backgroundColor) ??
    normalizeHexColor(obj.background) ??
    backgroundGradient?.stops[0]?.color ??
    '#121214';

  const polishedElements = polishLayoutElements(elements, artboardW, artboardH, bgColor);
  const { palette, fontsUsed } = extractPaletteAndFonts(
    bgColor,
    backgroundGradient,
    polishedElements,
  );

  const rawArchetype =
    typeof obj.archetype === 'string' &&
    ALLOWED_ARCHETYPES.has(obj.archetype as LayoutCompositionArchetype)
      ? (obj.archetype as LayoutCompositionArchetype)
      : fallbackArchetype;

  const rawTitle =
    typeof obj.title === 'string' && obj.title.trim()
      ? obj.title
          .replace(/\u2014/g, '-')
          .trim()
          .slice(0, 80)
      : 'Creative Concept';

  const rawExplanation =
    typeof obj.explanation === 'string' && obj.explanation.trim()
      ? obj.explanation.replace(/\u2014/g, '-').trim()
      : 'Layout synthesized with graphic grid, contrast hierarchy, and coordinated typography.';

  return {
    id: `concept-${Date.now().toString(36)}-${variationIndex + 1}`,
    title: rawTitle,
    backgroundColor: bgColor,
    ...(backgroundGradient ? { backgroundGradient } : {}),
    ...(rawArchetype && rawArchetype !== 'auto' ? { archetype: rawArchetype } : {}),
    palette,
    fontsUsed,
    ...(artDirection ? { artDirection } : {}),
    explanation: rawExplanation,
    elements: polishedElements,
  };
}

/**
 * Normalizes either a single layout or a `{ variations: [...] }` LLM payload into an array of valid layouts.
 */
export function normalizeLlmResponse(
  raw: unknown,
  dimensions?: { readonly width: number; readonly height: number },
  fallbackArchetype?: LayoutCompositionArchetype,
  artDirection?: ArtDirectionSummaryDto,
): GeneratedLayoutDto[] {
  if (!raw || typeof raw !== 'object') return [];
  const obj = raw as Record<string, unknown>;

  if (Array.isArray(obj.variations)) {
    const layouts: GeneratedLayoutDto[] = [];
    for (let i = 0; i < obj.variations.length; i++) {
      const normalized = normalizeSingleLayout(
        obj.variations[i],
        dimensions,
        fallbackArchetype,
        i,
        artDirection,
      );
      if (normalized) layouts.push(normalized);
    }
    if (layouts.length > 0) return layouts;
  }

  const single = normalizeSingleLayout(raw, dimensions, fallbackArchetype, 0, artDirection);
  return single ? [single] : [];
}
