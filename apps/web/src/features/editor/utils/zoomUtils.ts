import type { Dimensions } from '@pencel/shared-types';

export const MIN_ZOOM = 0.02;
export const MAX_ZOOM = 3.0;
export const ZOOM_STEP = 0.1;

export function clampZoom(zoom: number, minZoom = MIN_ZOOM, maxZoom = MAX_ZOOM): number {
  const clamped = Math.max(minZoom, Math.min(maxZoom, zoom));
  return Math.round(clamped * 100) / 100;
}

export function formatZoomPercentage(zoom: number): string {
  return `${Math.round(zoom * 100)}%`;
}

/**
 * Calculates a comfortable initial zoom factor so large documents (e.g., 1080x1920)
 * fit cleanly inside a typical desktop workspace viewport.
 */
export function computeRecommendedZoom(dimensions: Dimensions): number {
  const maxStageWidth = 640;
  const maxStageHeight = 440;
  const ratioX = maxStageWidth / dimensions.width;
  const ratioY = maxStageHeight / dimensions.height;
  return clampZoom(Math.min(ratioX, ratioY, 1));
}
