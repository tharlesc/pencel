/**
 * @pencel/editor-core - Pixel Selection Coverage Mask, Non-Destructive Layer Mask & Vector Boolean Geometry
 *
 * Implements:
 * 1. Pixel Selection coverage field S(x, y) in [0, 1] (Parte VI)
 * 2. Non-destructive Layer Mask alpha composition: alpha_result = alpha_original * M(x, y) (Parte VII)
 * 3. Parametric Vector Polygon & Boolean Path Geometry (Parte V)
 */

import type { Point2D, Rect2D } from './coordinateSystem.js';

export type SelectionCombineMode = 'replace' | 'add' | 'subtract' | 'intersect';

export type BooleanPathOperation = 'union' | 'intersect' | 'subtract' | 'exclude';

export interface SelectionMaskBuffer {
  readonly width: number;
  readonly height: number;
  readonly data: Float32Array;
}

/**
 * Clamps a scalar coverage or alpha value to [0, 1].
 */
export function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

/**
 * Combines an existing coverage value S_old in [0,1] with a new coverage S_new in [0,1].
 */
export function combineCoverageValues(
  oldValue: number,
  newValue: number,
  mode: SelectionCombineMode,
): number {
  const a = clampUnit(oldValue);
  const b = clampUnit(newValue);
  switch (mode) {
    case 'replace':
      return b;
    case 'add':
      return Math.min(1, a + b);
    case 'subtract':
      return Math.max(0, a - b);
    case 'intersect':
      return Math.min(a, b);
  }
}

/**
 * Creates a 2D pixel selection coverage mask S(x, y) in [0, 1].
 */
export function createSelectionMask(
  width: number,
  height: number,
  initialCoverage = 0,
): SelectionMaskBuffer {
  const safeW = Math.max(1, Math.round(width));
  const safeH = Math.max(1, Math.round(height));
  const data = new Float32Array(safeW * safeH);
  const fillVal = clampUnit(initialCoverage);
  if (fillVal > 0) {
    data.fill(fillVal);
  }
  return { width: safeW, height: safeH, data };
}

/**
 * Evaluates S(x, y) at integer pixel coordinates. Out-of-bounds returns 0.
 */
export function getSelectionMaskValue(mask: SelectionMaskBuffer, x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  if (ix < 0 || ix >= mask.width || iy < 0 || iy >= mask.height) {
    return 0;
  }
  return mask.data[iy * mask.width + ix] ?? 0;
}

/**
 * Applies a rectangular marquee selection to the coverage mask S(x, y).
 */
export function selectRectRegion(
  mask: SelectionMaskBuffer,
  rect: Rect2D,
  mode: SelectionCombineMode = 'replace',
): SelectionMaskBuffer {
  const out = new Float32Array(mask.data.length);
  const xMin = Math.floor(rect.x);
  const yMin = Math.floor(rect.y);
  const xMax = Math.ceil(rect.x + rect.width);
  const yMax = Math.ceil(rect.y + rect.height);

  for (let y = 0; y < mask.height; y++) {
    const rowOffset = y * mask.width;
    const inY = y >= yMin && y < yMax;
    for (let x = 0; x < mask.width; x++) {
      const idx = rowOffset + x;
      const inRect = inY && x >= xMin && x < xMax ? 1 : 0;
      out[idx] = combineCoverageValues(mask.data[idx] ?? 0, inRect, mode);
    }
  }

  return { width: mask.width, height: mask.height, data: out };
}

/**
 * Applies an elliptical marquee selection to the coverage mask S(x, y) with anti-aliased boundary.
 */
export function selectEllipseRegion(
  mask: SelectionMaskBuffer,
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  mode: SelectionCombineMode = 'replace',
): SelectionMaskBuffer {
  const out = new Float32Array(mask.data.length);
  const rx = Math.max(0.5, radiusX);
  const ry = Math.max(0.5, radiusY);

  for (let y = 0; y < mask.height; y++) {
    const rowOffset = y * mask.width;
    const dy = (y + 0.5 - centerY) / ry;
    for (let x = 0; x < mask.width; x++) {
      const idx = rowOffset + x;
      const dx = (x + 0.5 - centerX) / rx;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const coverage = dist <= 1 ? 1 : 0;
      out[idx] = combineCoverageValues(mask.data[idx] ?? 0, coverage, mode);
    }
  }

  return { width: mask.width, height: mask.height, data: out };
}

/**
 * Inverts a pixel selection mask: S'(x, y) = 1 - S(x, y).
 */
export function invertSelectionMask(mask: SelectionMaskBuffer): SelectionMaskBuffer {
  const out = new Float32Array(mask.data.length);
  for (let i = 0; i < mask.data.length; i++) {
    out[i] = 1 - (mask.data[i] ?? 0);
  }
  return { width: mask.width, height: mask.height, data: out };
}

/**
 * Feathers (softens) the selection mask edges using a separable 2D box filter of the given radius.
 */
export function featherSelectionMask(
  mask: SelectionMaskBuffer,
  radiusPx: number,
): SelectionMaskBuffer {
  const r = Math.max(0, Math.round(radiusPx));
  if (r === 0) {
    return { width: mask.width, height: mask.height, data: new Float32Array(mask.data) };
  }

  const { width, height } = mask;
  const temp = new Float32Array(width * height);
  const out = new Float32Array(width * height);
  const kernelSize = 2 * r + 1;

  // Horizontal pass
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let k = -r; k <= r; k++) {
        const sx = Math.max(0, Math.min(width - 1, x + k));
        sum += mask.data[rowOffset + sx] ?? 0;
      }
      temp[rowOffset + x] = sum / kernelSize;
    }
  }

  // Vertical pass
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let k = -r; k <= r; k++) {
        const sy = Math.max(0, Math.min(height - 1, y + k));
        sum += temp[sy * width + x] ?? 0;
      }
      out[rowOffset + x] = clampUnit(sum / kernelSize);
    }
  }

  return { width, height, data: out };
}

/**
 * Expands (deltaPx > 0, morphological dilation) or contracts (deltaPx < 0, morphological erosion)
 * a selection mask by the given radius in pixels.
 */
export function expandContractSelectionMask(
  mask: SelectionMaskBuffer,
  deltaPx: number,
): SelectionMaskBuffer {
  const r = Math.round(Math.abs(deltaPx));
  if (r === 0) {
    return { width: mask.width, height: mask.height, data: new Float32Array(mask.data) };
  }

  const isExpand = deltaPx > 0;
  const { width, height } = mask;
  const out = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let best = isExpand ? 0 : 1;
      for (let dy = -r; dy <= r; dy++) {
        const ny = y + dy;
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy > r * r) continue;
          const nx = x + dx;
          const val =
            nx >= 0 && nx < width && ny >= 0 && ny < height ? (mask.data[ny * width + nx] ?? 0) : 0;
          if (isExpand) {
            if (val > best) best = val;
          } else {
            if (val < best) best = val;
          }
        }
      }
      out[y * width + x] = best;
    }
  }

  return { width, height, data: out };
}

/**
 * Evaluates the non-destructive Layer Mask composition law (Parte VII):
 * alpha_result = alpha_original * M(x, y)
 *
 * - M(x, y) = 1 -> 100% visible
 * - M(x, y) = 0 -> 100% hidden (transparent)
 * - 0 < M(x, y) < 1 -> partial translucency
 */
export function evaluateLayerMaskAlpha(
  originalAlpha: number,
  maskValue: number,
  options?: { readonly enabled?: boolean; readonly inverted?: boolean },
): number {
  const aOrig = clampUnit(originalAlpha);
  if (options?.enabled === false) {
    return aOrig;
  }
  const rawM = clampUnit(maskValue);
  const effectiveM = options?.inverted ? 1 - rawM : rawM;
  return aOrig * effectiveM;
}

/**
 * Generates vertices of a regular convex polygon centered at (0, 0).
 */
export function generateRegularPolygonPoints(
  sides: number,
  radius: number,
  rotationRadians = -Math.PI / 2,
): Point2D[] {
  const n = Math.max(3, Math.round(sides));
  const r = Math.max(1, radius);
  const points: Point2D[] = [];
  for (let i = 0; i < n; i++) {
    const theta = rotationRadians + (2 * Math.PI * i) / n;
    points.push({
      x: Math.cos(theta) * r,
      y: Math.sin(theta) * r,
    });
  }
  return points;
}

/**
 * Generates alternating outer/inner vertices of a parametric star centered at (0, 0).
 */
export function generateStarPoints(
  pointsCount: number,
  outerRadius: number,
  innerRadius: number,
  rotationRadians = -Math.PI / 2,
): Point2D[] {
  const n = Math.max(3, Math.round(pointsCount));
  const rOut = Math.max(1, outerRadius);
  const rIn = Math.max(0.5, innerRadius);
  const vertices: Point2D[] = [];

  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? rOut : rIn;
    const theta = rotationRadians + (Math.PI * i) / n;
    vertices.push({
      x: Math.cos(theta) * r,
      y: Math.sin(theta) * r,
    });
  }
  return vertices;
}

/**
 * Clips a subject polygon against a convex clip polygon using the Sutherland-Hodgman algorithm.
 */
export function intersectConvexPolygons(
  subjectPolygon: readonly Point2D[],
  clipPolygon: readonly Point2D[],
): Point2D[] {
  if (subjectPolygon.length < 3 || clipPolygon.length < 3) return [];

  let outputList: Point2D[] = [...subjectPolygon];

  const isInside = (p: Point2D, cp1: Point2D, cp2: Point2D): boolean => {
    return (cp2.x - cp1.x) * (p.y - cp1.y) >= (cp2.y - cp1.y) * (p.x - cp1.x);
  };

  const computeIntersection = (cp1: Point2D, cp2: Point2D, s: Point2D, e: Point2D): Point2D => {
    const dc = { x: cp1.x - cp2.x, y: cp1.y - cp2.y };
    const dp = { x: s.x - e.x, y: s.y - e.y };
    const n1 = cp1.x * cp2.y - cp1.y * cp2.x;
    const n2 = s.x * e.y - s.y * e.x;
    const denom = dc.x * dp.y - dc.y * dp.x;
    if (Math.abs(denom) < 1e-10) return s;
    return {
      x: (n1 * dp.x - n2 * dc.x) / denom,
      y: (n1 * dp.y - n2 * dc.y) / denom,
    };
  };

  for (let i = 0; i < clipPolygon.length; i++) {
    const cp1 = clipPolygon[i]!;
    const cp2 = clipPolygon[(i + 1) % clipPolygon.length]!;
    const inputList = outputList;
    outputList = [];

    if (inputList.length === 0) break;

    let s = inputList[inputList.length - 1]!;
    for (const e of inputList) {
      if (isInside(e, cp1, cp2)) {
        if (!isInside(s, cp1, cp2)) {
          outputList.push(computeIntersection(cp1, cp2, s, e));
        }
        outputList.push(e);
      } else if (isInside(s, cp1, cp2)) {
        outputList.push(computeIntersection(cp1, cp2, s, e));
      }
      s = e;
    }
  }

  return outputList;
}

/**
 * Converts one or more closed polygon vertex rings into an SVG Path data string.
 */
export function polygonRingsToSvgPath(rings: ReadonlyArray<readonly Point2D[]>): string {
  const segments: string[] = [];
  for (const ring of rings) {
    if (ring.length < 3) continue;
    const first = ring[0]!;
    const parts = [`M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`];
    for (let i = 1; i < ring.length; i++) {
      const pt = ring[i]!;
      parts.push(`L ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`);
    }
    parts.push('Z');
    segments.push(parts.join(' '));
  }
  return segments.join(' ');
}
