/**
 * @pencel/editor-core - Coordinate System, Affine Transformations & Unit/DPI Math
 *
 * Implements the formal 5-space transformation pipeline:
 * Local Space -> Artboard Space -> Document Space -> Viewport Space -> Screen Space -> Device Space
 *
 * Matrix representation (2D Affine Transform):
 * [ a, c, tx ]
 * [ b, d, ty ]
 * [ 0, 0, 1  ]
 * stored as tuple: [a, b, c, d, tx, ty]
 */

export interface Point2D {
  readonly x: number;
  readonly y: number;
}

export interface Rect2D {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export type Matrix2D = readonly [
  a: number,
  b: number,
  c: number,
  d: number,
  tx: number,
  ty: number,
];

export type MeasurementUnit = 'px' | 'mm' | 'cm' | 'in';

export interface ObjectTransform2D {
  readonly x: number;
  readonly y: number;
  readonly scaleX?: number;
  readonly scaleY?: number;
  readonly rotationDegrees?: number;
  readonly originOffsetX?: number;
  readonly originOffsetY?: number;
}

export interface CoordinatePipelineConfig {
  readonly artboardOffset: Point2D;
  readonly viewportZoom: number;
  readonly viewportPan: Point2D;
  readonly canvasScreenRect: {
    readonly left: number;
    readonly top: number;
  };
  readonly devicePixelRatio?: number;
}

export const IDENTITY_MATRIX_2D: Matrix2D = [1, 0, 0, 1, 0, 0];

export const MIN_ZOOM = 0.02;
export const MAX_ZOOM = 8.0;

/**
 * Creates a 2D translation matrix.
 */
export function createTranslationMatrix(tx: number, ty: number): Matrix2D {
  return [1, 0, 0, 1, tx, ty];
}

/**
 * Creates a 2D scaling matrix.
 */
export function createScaleMatrix(sx: number, sy = sx): Matrix2D {
  return [sx, 0, 0, sy, 0, 0];
}

/**
 * Creates a 2D rotation matrix from degrees.
 */
export function createRotationMatrix(angleDegrees: number): Matrix2D {
  const rad = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return [cos, sin, -sin, cos, 0, 0];
}

/**
 * Multiplies two 2D affine matrices: M = m1 * m2.
 */
export function multiplyMatrix2D(m1: Matrix2D, m2: Matrix2D): Matrix2D {
  const [a1, b1, c1, d1, tx1, ty1] = m1;
  const [a2, b2, c2, d2, tx2, ty2] = m2;

  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * tx2 + c1 * ty2 + tx1,
    b1 * tx2 + d1 * ty2 + ty1,
  ];
}

/**
 * Computes the inverse of a 2D affine matrix: M^-1.
 * Returns IDENTITY_MATRIX_2D if the matrix is singular (det ~ 0).
 */
export function invertMatrix2D(m: Matrix2D): Matrix2D {
  const [a, b, c, d, tx, ty] = m;
  const det = a * d - b * c;

  if (Math.abs(det) < 1e-12) {
    return IDENTITY_MATRIX_2D;
  }

  const invDet = 1 / det;
  const na = d * invDet;
  const nb = -b * invDet;
  const nc = -c * invDet;
  const nd = a * invDet;
  const ntx = (c * ty - d * tx) * invDet;
  const nty = (b * tx - a * ty) * invDet;

  return [na, nb, nc, nd, ntx, nty];
}

/**
 * Applies a 2D affine matrix to a point: P' = M * P.
 */
export function transformPoint2D(point: Point2D, m: Matrix2D): Point2D {
  const [a, b, c, d, tx, ty] = m;
  return {
    x: a * point.x + c * point.y + tx,
    y: b * point.x + d * point.y + ty,
  };
}

/**
 * Composes an object's local-to-artboard transformation matrix (M_object):
 * T(x, y) * R(rotation) * S(scaleX, scaleY) * T(-originOffsetX, -originOffsetY)
 */
export function composeObjectMatrix(transform: ObjectTransform2D): Matrix2D {
  const sx = transform.scaleX ?? 1;
  const sy = transform.scaleY ?? 1;
  const rot = transform.rotationDegrees ?? 0;
  const ox = transform.originOffsetX ?? 0;
  const oy = transform.originOffsetY ?? 0;

  const tPos = createTranslationMatrix(transform.x, transform.y);
  const rMat = createRotationMatrix(rot);
  const sMat = createScaleMatrix(sx, sy);
  const tOrigin = createTranslationMatrix(-ox, -oy);

  return multiplyMatrix2D(multiplyMatrix2D(multiplyMatrix2D(tPos, rMat), sMat), tOrigin);
}

/**
 * Computes the axis-aligned bounding box (AABB) of a rectangle after applying matrix M.
 */
export function transformRectBounds(rect: Rect2D, m: Matrix2D): Rect2D {
  const corners: readonly Point2D[] = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height },
  ];

  const transformed = corners.map((c) => transformPoint2D(c, m));
  const xs = transformed.map((p) => p.x);
  const ys = transformed.map((p) => p.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Builds the composite Viewport Matrix (M_viewport * M_artboard):
 * Maps a point in Artboard Space (0..W, 0..H) to Viewport Canvas Space (CSS pixels relative to canvas top-left).
 */
export function composeArtboardToViewportMatrix(
  config: Pick<CoordinatePipelineConfig, 'artboardOffset' | 'viewportZoom' | 'viewportPan'>,
): Matrix2D {
  const zoom = config.viewportZoom > 0 ? config.viewportZoom : 1;
  const mPan = createTranslationMatrix(config.viewportPan.x, config.viewportPan.y);
  const mScale = createScaleMatrix(zoom, zoom);
  const mArtboard = createTranslationMatrix(config.artboardOffset.x, config.artboardOffset.y);

  return multiplyMatrix2D(multiplyMatrix2D(mPan, mScale), mArtboard);
}

/**
 * Converts a point from Object Local Space to Artboard Space.
 */
export function localToArtboard(localPoint: Point2D, objectMatrix: Matrix2D): Point2D {
  return transformPoint2D(localPoint, objectMatrix);
}

/**
 * Converts a point from Artboard Space to Object Local Space using M_object^-1.
 */
export function artboardToLocal(artboardPoint: Point2D, objectMatrix: Matrix2D): Point2D {
  return transformPoint2D(artboardPoint, invertMatrix2D(objectMatrix));
}

/**
 * Converts a point from Artboard Space to Viewport Space.
 */
export function artboardToViewport(
  artboardPoint: Point2D,
  config: Pick<CoordinatePipelineConfig, 'artboardOffset' | 'viewportZoom' | 'viewportPan'>,
): Point2D {
  const m = composeArtboardToViewportMatrix(config);
  return transformPoint2D(artboardPoint, m);
}

/**
 * Converts a point from Viewport Space to Artboard Space using the exact inverse matrix.
 */
export function viewportToArtboard(
  viewportPoint: Point2D,
  config: Pick<CoordinatePipelineConfig, 'artboardOffset' | 'viewportZoom' | 'viewportPan'>,
): Point2D {
  const mInv = invertMatrix2D(composeArtboardToViewportMatrix(config));
  return transformPoint2D(viewportPoint, mInv);
}

/**
 * Converts a DOM Screen Space point (e.g. clientX, clientY) to Artboard Space:
 * P_artboard = M_artboard^-1 * M_viewport^-1 * (P_screen - offset_canvas)
 */
export function screenToArtboard(screenPoint: Point2D, config: CoordinatePipelineConfig): Point2D {
  const viewportPoint: Point2D = {
    x: screenPoint.x - config.canvasScreenRect.left,
    y: screenPoint.y - config.canvasScreenRect.top,
  };
  return viewportToArtboard(viewportPoint, config);
}

/**
 * Converts an Artboard Space point to DOM Screen Space (clientX, clientY).
 */
export function artboardToScreen(
  artboardPoint: Point2D,
  config: CoordinatePipelineConfig,
): Point2D {
  const vp = artboardToViewport(artboardPoint, config);
  return {
    x: vp.x + config.canvasScreenRect.left,
    y: vp.y + config.canvasScreenRect.top,
  };
}

/**
 * Converts CSS Screen Space coordinates to physical Device Space (Retina/HiDPI buffer).
 */
export function screenToDevice(screenPoint: Point2D, devicePixelRatio = 1): Point2D {
  const dpr = devicePixelRatio > 0 ? devicePixelRatio : 1;
  return {
    x: screenPoint.x * dpr,
    y: screenPoint.y * dpr,
  };
}

/**
 * Converts physical Device Space coordinates back to CSS Screen Space.
 */
export function deviceToScreen(devicePoint: Point2D, devicePixelRatio = 1): Point2D {
  const dpr = devicePixelRatio > 0 ? devicePixelRatio : 1;
  return {
    x: devicePoint.x / dpr,
    y: devicePoint.y / dpr,
  };
}

/**
 * Converts a physical or logical measurement into pixels at the given DPI.
 * Formulas:
 * - px: value
 * - in: value * DPI
 * - cm: (value / 2.54) * DPI
 * - mm: (value / 25.4) * DPI
 */
export function unitToPixels(value: number, unit: MeasurementUnit, dpi = 72): number {
  const safeDpi = dpi > 0 ? dpi : 72;
  switch (unit) {
    case 'px':
      return value;
    case 'in':
      return value * safeDpi;
    case 'cm':
      return (value / 2.54) * safeDpi;
    case 'mm':
      return (value / 25.4) * safeDpi;
  }
}

/**
 * Converts a pixel measurement back into the target physical or logical unit at the given DPI.
 */
export function pixelsToUnit(pixels: number, unit: MeasurementUnit, dpi = 72): number {
  const safeDpi = dpi > 0 ? dpi : 72;
  switch (unit) {
    case 'px':
      return pixels;
    case 'in':
      return pixels / safeDpi;
    case 'cm':
      return (pixels / safeDpi) * 2.54;
    case 'mm':
      return (pixels / safeDpi) * 25.4;
  }
}

/**
 * Converts a value directly between two units at the specified DPI.
 */
export function convertBetweenUnits(
  value: number,
  fromUnit: MeasurementUnit,
  toUnit: MeasurementUnit,
  dpi = 72,
): number {
  if (fromUnit === toUnit) return value;
  const px = unitToPixels(value, fromUnit, dpi);
  return pixelsToUnit(px, toUnit, dpi);
}

/**
 * Clamps a zoom scale factor within safe studio limits.
 */
export function clampZoom(zoom: number, min = MIN_ZOOM, max = MAX_ZOOM): number {
  if (!Number.isFinite(zoom)) return 1;
  return Math.max(min, Math.min(max, zoom));
}

/**
 * Calculates the ideal zoom factor so an artboard fits comfortably inside the viewport.
 * Formula:
 * scale_fit = min((W_viewport - padding) / W_artboard, (H_viewport - padding) / H_artboard)
 */
export function calculateZoomToFit(
  artboard: { readonly width: number; readonly height: number },
  viewport: { readonly width: number; readonly height: number },
  padding = 96,
): number {
  if (artboard.width <= 0 || artboard.height <= 0) return 1;
  const availW = Math.max(64, viewport.width - padding);
  const availH = Math.max(64, viewport.height - padding);
  const scaleX = availW / artboard.width;
  const scaleY = availH / artboard.height;
  return clampZoom(Math.min(scaleX, scaleY));
}

/**
 * Calculates the zoom factor and pan offset to frame a specific selection bounding box in the viewport.
 */
export function calculateZoomToSelection(
  selectionBounds: Rect2D,
  viewport: { readonly width: number; readonly height: number },
  padding = 96,
): { readonly zoom: number; readonly centerX: number; readonly centerY: number } {
  const safeW = Math.max(16, selectionBounds.width);
  const safeH = Math.max(16, selectionBounds.height);
  const zoom = calculateZoomToFit({ width: safeW, height: safeH }, viewport, padding);
  return {
    zoom,
    centerX: selectionBounds.x + selectionBounds.width / 2,
    centerY: selectionBounds.y + selectionBounds.height / 2,
  };
}

/**
 * Computes the updated pan offset when zooming around a fixed focal point in Viewport Space,
 * ensuring the document point under the cursor stays stationary during wheel/pinch zoom.
 */
export function zoomAroundPoint(
  currentZoom: number,
  nextZoom: number,
  focalPoint: Point2D,
  currentPan: Point2D,
): Point2D {
  const safeCurrent = currentZoom > 0 ? currentZoom : 1;
  const clampedNext = clampZoom(nextZoom);
  const ratio = clampedNext / safeCurrent;

  return {
    x: focalPoint.x - (focalPoint.x - currentPan.x) * ratio,
    y: focalPoint.y - (focalPoint.y - currentPan.y) * ratio,
  };
}

/**
 * Checks whether a 2D point lies inside or on the boundary of a rectangle.
 */
export function isPointInRect(point: Point2D, rect: Rect2D): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Checks whether two axis-aligned rectangles overlap.
 */
export function doRectsIntersect(a: Rect2D, b: Rect2D): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

/**
 * Computes the geometric intersection of two rectangles (e.g. clipping an object's bounds to the artboard).
 * Returns null if the rectangles do not intersect.
 */
export function intersectRects(a: Rect2D, b: Rect2D): Rect2D | null {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);

  if (x2 <= x1 || y2 <= y1) {
    return null;
  }

  return {
    x: x1,
    y: y1,
    width: x2 - x1,
    height: y2 - y1,
  };
}

/**
 * Determines whether an object's bounding box extends outside the artboard boundaries [0, 0, W, H].
 */
export function isObjectBleedingOutsideArtboard(
  objectBounds: Rect2D,
  artboard: { readonly width: number; readonly height: number },
): boolean {
  return (
    objectBounds.x < 0 ||
    objectBounds.y < 0 ||
    objectBounds.x + objectBounds.width > artboard.width ||
    objectBounds.y + objectBounds.height > artboard.height
  );
}
