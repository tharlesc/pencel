/**
 * @pencel/editor-core - Ruler & Guide Lines Math & Domain Logic
 *
 * Implements high-precision Photoshop-standard adaptive ruler tick generation,
 * coordinate transformations, and magnetic guide snapping.
 */

export interface GuideLine {
  readonly id: string;
  readonly orientation: 'horizontal' | 'vertical';
  readonly position: number; // in document pixels (0 = artboard start)
  readonly locked?: boolean;
}

export type RulerTickType = 'major' | 'medium' | 'minor';

export interface RulerTick {
  readonly position: number; // screen pixel offset along the ruler
  readonly value: number; // document coordinate in pixels
  readonly type: RulerTickType;
  readonly label?: string;
}

export interface CalculateRulerTicksOptions {
  readonly origin: number; // screen coordinate where document coordinate 0 is located
  readonly zoom: number; // current zoom scale (e.g. 1 = 100%, 0.5 = 50%, 2 = 200%)
  readonly length: number; // total visible ruler length in screen pixels
  readonly minPixelSpacing?: number; // target screen pixel distance between labels (default 50)
  readonly startOffset?: number; // screen offset where ruler starts (e.g. 24px for corner box)
}

/**
 * Standard candidate step sizes for document tick marks.
 */
const NICE_STEPS = [
  1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 50000,
] as const;

/**
 * Chooses the optimal major step interval in document pixels for a given zoom factor.
 */
export function getRulerStep(zoom: number, minPixelSpacing = 50): number {
  const safeZoom = Math.max(0.01, zoom);
  const rawStep = minPixelSpacing / safeZoom;

  for (const step of NICE_STEPS) {
    if (step >= rawStep) {
      return step;
    }
  }

  // If zoomed way out, pick largest multiple of 10000
  return Math.ceil(rawStep / 10000) * 10000;
}

/**
 * Computes all visible tick marks and labels for a ruler axis.
 */
export function calculateRulerTicks({
  origin,
  zoom,
  length,
  minPixelSpacing = 50,
  startOffset = 24,
}: CalculateRulerTicksOptions): readonly RulerTick[] {
  if (zoom <= 0 || length <= startOffset) {
    return [];
  }

  const majorStep = getRulerStep(zoom, minPixelSpacing);
  const mediumStep = majorStep / 2;
  const minorStep = majorStep >= 10 ? majorStep / 10 : majorStep / 2;

  // Document coordinate range visible within the ruler bounds
  const docStart = (startOffset - origin) / zoom;
  const docEnd = (length - origin) / zoom;

  const firstMinor = Math.floor(docStart / minorStep) * minorStep;
  const lastMinor = Math.ceil(docEnd / minorStep) * minorStep;

  const ticks: RulerTick[] = [];
  const epsilon = 0.0001;

  for (let val = firstMinor; val <= lastMinor + epsilon; val += minorStep) {
    const screenPos = origin + val * zoom;
    if (screenPos < startOffset - 1 || screenPos > length + 1) {
      continue;
    }

    const roundedVal = Math.round(val * 100) / 100;
    const isMajor =
      Math.abs(roundedVal % majorStep) < epsilon ||
      Math.abs((roundedVal % majorStep) - majorStep) < epsilon;
    const isMedium =
      !isMajor &&
      (Math.abs(roundedVal % mediumStep) < epsilon ||
        Math.abs((roundedVal % mediumStep) - mediumStep) < epsilon);

    if (isMajor) {
      ticks.push({
        position: Math.round(screenPos),
        value: Math.round(roundedVal),
        type: 'major',
        label: `${Math.round(roundedVal)}`,
      });
    } else if (isMedium) {
      ticks.push({
        position: Math.round(screenPos),
        value: Math.round(roundedVal),
        type: 'medium',
      });
    } else {
      ticks.push({
        position: Math.round(screenPos),
        value: Math.round(roundedVal),
        type: 'minor',
      });
    }
  }

  return ticks;
}

export interface SnapTarget {
  readonly position: number;
  readonly label: string;
}

export interface SnapGuideOptions {
  readonly position: number; // document coordinate being dragged
  readonly orientation: 'horizontal' | 'vertical';
  readonly pageSize: { readonly width: number; readonly height: number };
  readonly existingGuides?: readonly GuideLine[];
  readonly currentGuideId?: string;
  readonly zoom: number;
  readonly thresholdPx?: number; // screen pixel threshold (default 6px)
}

export interface SnapResult {
  readonly position: number;
  readonly isSnapped: boolean;
  readonly snappedTarget?: string;
}

/**
 * Snaps a guide position to artboard edges, centers, or existing guide lines.
 */
export function snapGuidePosition({
  position,
  orientation,
  pageSize,
  existingGuides = [],
  currentGuideId,
  zoom,
  thresholdPx = 6,
}: SnapGuideOptions): SnapResult {
  const thresholdDoc = thresholdPx / Math.max(0.01, zoom);
  const targets: SnapTarget[] = [];

  const maxDimension = orientation === 'horizontal' ? pageSize.height : pageSize.width;

  // Artboard edge & center targets
  targets.push({ position: 0, label: 'Origem da prancheta (0px)' });
  targets.push({ position: Math.round(maxDimension / 2), label: 'Centro da prancheta' });
  targets.push({ position: maxDimension, label: 'Fim da prancheta' });

  // Existing guides of the same orientation
  for (const g of existingGuides) {
    if (g.id !== currentGuideId && g.orientation === orientation) {
      targets.push({ position: g.position, label: `Guia em ${g.position}px` });
    }
  }

  let closestDist = Infinity;
  let bestTarget: SnapTarget | null = null;

  for (const target of targets) {
    const dist = Math.abs(position - target.position);
    if (dist <= thresholdDoc && dist < closestDist) {
      closestDist = dist;
      bestTarget = target;
    }
  }

  if (bestTarget) {
    return {
      position: bestTarget.position,
      isSnapped: true,
      snappedTarget: bestTarget.label,
    };
  }

  return {
    position: Math.round(position),
    isSnapped: false,
  };
}
