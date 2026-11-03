import { describe, expect, it } from 'vitest';
import {
  IDENTITY_MATRIX_2D,
  artboardToLocal,
  artboardToScreen,
  calculateZoomToFit,
  calculateZoomToSelection,
  clampZoom,
  composeObjectMatrix,
  convertBetweenUnits,
  createRotationMatrix,
  createScaleMatrix,
  createSelectionMask,
  createTranslationMatrix,
  deviceToScreen,
  doRectsIntersect,
  evaluateLayerMaskAlpha,
  expandContractSelectionMask,
  featherSelectionMask,
  generateRegularPolygonPoints,
  generateStarPoints,
  getSelectionMaskValue,
  intersectConvexPolygons,
  intersectRects,
  invertMatrix2D,
  invertSelectionMask,
  isObjectBleedingOutsideArtboard,
  isPointInRect,
  localToArtboard,
  multiplyMatrix2D,
  pixelsToUnit,
  polygonRingsToSvgPath,
  screenToArtboard,
  screenToDevice,
  selectEllipseRegion,
  selectRectRegion,
  transformPoint2D,
  transformRectBounds,
  unitToPixels,
  viewportToArtboard,
  zoomAroundPoint,
  type CoordinatePipelineConfig,
} from '../src/index.js';

describe('@pencel/editor-core geometric & coordinate system engine (Parte X)', () => {
  const TOLERANCE = 6; // 1e-6 floating-point precision

  it('converts accurately between Local, Artboard, Viewport, Screen, and Device spaces', () => {
    const config: CoordinatePipelineConfig = {
      artboardOffset: { x: 800, y: 800 },
      viewportZoom: 0.75,
      viewportPan: { x: 120, y: 60 },
      canvasScreenRect: { left: 68, top: 52 },
      devicePixelRatio: 2,
    };

    const objectMatrix = composeObjectMatrix({
      x: 200,
      y: 150,
      scaleX: 2,
      scaleY: 1.5,
      rotationDegrees: 0,
    });

    const localPt = { x: 50, y: 40 };
    const artboardPt = localToArtboard(localPt, objectMatrix);
    expect(artboardPt.x).toBeCloseTo(300, TOLERANCE);
    expect(artboardPt.y).toBeCloseTo(210, TOLERANCE);

    const screenPt = artboardToScreen(artboardPt, config);
    // viewportX = 120 + (800 + 300) * 0.75 = 120 + 825 = 945 -> screenX = 945 + 68 = 1013
    // viewportY = 60 + (800 + 210) * 0.75 = 60 + 757.5 = 817.5 -> screenY = 817.5 + 52 = 869.5
    expect(screenPt.x).toBeCloseTo(1013, TOLERANCE);
    expect(screenPt.y).toBeCloseTo(869.5, TOLERANCE);

    // Round-trip back from Screen -> Artboard -> Local
    const recoveredArtboard = screenToArtboard(screenPt, config);
    expect(recoveredArtboard.x).toBeCloseTo(artboardPt.x, TOLERANCE);
    expect(recoveredArtboard.y).toBeCloseTo(artboardPt.y, TOLERANCE);

    const recoveredLocal = artboardToLocal(recoveredArtboard, objectMatrix);
    expect(recoveredLocal.x).toBeCloseTo(localPt.x, TOLERANCE);
    expect(recoveredLocal.y).toBeCloseTo(localPt.y, TOLERANCE);

    // Device space HiDPI conversion
    const devicePt = screenToDevice(screenPt, 2);
    expect(devicePt.x).toBeCloseTo(2026, TOLERANCE);
    expect(devicePt.y).toBeCloseTo(1739, TOLERANCE);
    const backToScreen = deviceToScreen(devicePt, 2);
    expect(backToScreen.x).toBeCloseTo(screenPt.x, TOLERANCE);
    expect(backToScreen.y).toBeCloseTo(screenPt.y, TOLERANCE);
  });

  it('computes exact inverse affine matrices including rotation, scale, and translation', () => {
    const m = multiplyMatrix2D(
      createTranslationMatrix(340, -120),
      multiplyMatrix2D(createRotationMatrix(37), createScaleMatrix(1.8, 0.65)),
    );
    const mInv = invertMatrix2D(m);
    const product = multiplyMatrix2D(m, mInv);

    expect(product[0]).toBeCloseTo(IDENTITY_MATRIX_2D[0], TOLERANCE);
    expect(product[1]).toBeCloseTo(IDENTITY_MATRIX_2D[1], TOLERANCE);
    expect(product[2]).toBeCloseTo(IDENTITY_MATRIX_2D[2], TOLERANCE);
    expect(product[3]).toBeCloseTo(IDENTITY_MATRIX_2D[3], TOLERANCE);
    expect(product[4]).toBeCloseTo(IDENTITY_MATRIX_2D[4], TOLERANCE);
    expect(product[5]).toBeCloseTo(IDENTITY_MATRIX_2D[5], TOLERANCE);

    const originalPt = { x: -42.5, y: 118.25 };
    const transformed = transformPoint2D(originalPt, m);
    const restored = transformPoint2D(transformed, mInv);
    expect(restored.x).toBeCloseTo(originalPt.x, TOLERANCE);
    expect(restored.y).toBeCloseTo(originalPt.y, TOLERANCE);
  });

  it('converts physical and logical units (px, mm, cm, in) across DPIs accurately', () => {
    // A4 width: 210mm at 300 DPI -> (210 / 25.4) * 300 = 2480.31496 px
    const a4WidthPx = unitToPixels(210, 'mm', 300);
    expect(a4WidthPx).toBeCloseTo(2480.314961, 4);

    // Round-trip back to mm
    expect(pixelsToUnit(a4WidthPx, 'mm', 300)).toBeCloseTo(210, TOLERANCE);

    // 8.5 inches at 150 DPI -> 1275 px
    expect(unitToPixels(8.5, 'in', 150)).toBeCloseTo(1275, TOLERANCE);
    expect(pixelsToUnit(1275, 'in', 150)).toBeCloseTo(8.5, TOLERANCE);

    // cm <-> mm conversion
    expect(convertBetweenUnits(2.54, 'cm', 'in', 300)).toBeCloseTo(1, TOLERANCE);
    expect(convertBetweenUnits(10, 'cm', 'mm', 72)).toBeCloseTo(100, TOLERANCE);
  });

  it('computes zoom-to-fit, zoom-to-selection, and stationary-focal-point zoom', () => {
    const zoomFit = calculateZoomToFit(
      { width: 1080, height: 1080 },
      { width: 1200, height: 800 },
      80,
    );
    // Available height = 720 -> 720 / 1080 = 0.666667
    expect(zoomFit).toBeCloseTo(720 / 1080, TOLERANCE);

    const selZoom = calculateZoomToSelection(
      { x: 100, y: 200, width: 400, height: 200 },
      { width: 1000, height: 800 },
      100,
    );
    expect(selZoom.centerX).toBe(300);
    expect(selZoom.centerY).toBe(300);
    expect(selZoom.zoom).toBeCloseTo(900 / 400, TOLERANCE);

    // Stationary focal point during zoom
    const focal = { x: 500, y: 400 };
    const currentPan = { x: 100, y: 80 };
    const currentZoom = 1;
    const nextZoom = 2;
    const nextPan = zoomAroundPoint(currentZoom, nextZoom, focal, currentPan);

    const ptBefore = viewportToArtboard(focal, {
      artboardOffset: { x: 0, y: 0 },
      viewportZoom: currentZoom,
      viewportPan: currentPan,
    });
    const ptAfter = viewportToArtboard(focal, {
      artboardOffset: { x: 0, y: 0 },
      viewportZoom: nextZoom,
      viewportPan: nextPan,
    });
    expect(ptAfter.x).toBeCloseTo(ptBefore.x, TOLERANCE);
    expect(ptAfter.y).toBeCloseTo(ptBefore.y, TOLERANCE);
    expect(clampZoom(999)).toBe(8);
    expect(clampZoom(0.001)).toBe(0.02);
  });

  it('calculates rotated bounding boxes, hit testing, artboard bleed, and clipping intersection', () => {
    // 100x100 square rotated 90 degrees around origin (0,0)
    const rot90 = createRotationMatrix(90);
    const bounds = transformRectBounds({ x: 0, y: 0, width: 100, height: 50 }, rot90);
    expect(bounds.x).toBeCloseTo(-50, TOLERANCE);
    expect(bounds.y).toBeCloseTo(0, TOLERANCE);
    expect(bounds.width).toBeCloseTo(50, TOLERANCE);
    expect(bounds.height).toBeCloseTo(100, TOLERANCE);

    const artboardRect = { x: 0, y: 0, width: 1080, height: 1080 };
    const bleedingObj = { x: 900, y: 500, width: 300, height: 200 };
    expect(isObjectBleedingOutsideArtboard(bleedingObj, { width: 1080, height: 1080 })).toBe(true);
    expect(doRectsIntersect(artboardRect, bleedingObj)).toBe(true);

    const clipped = intersectRects(artboardRect, bleedingObj);
    expect(clipped).toEqual({ x: 900, y: 500, width: 180, height: 200 });

    expect(isPointInRect({ x: 950, y: 550 }, clipped!)).toBe(true);
    expect(isPointInRect({ x: 1150, y: 550 }, artboardRect)).toBe(false);
  });

  it('evaluates pixel selection coverage masks S(x,y) in [0,1] and non-destructive layer masks', () => {
    let mask = createSelectionMask(20, 20, 0);
    mask = selectRectRegion(mask, { x: 5, y: 5, width: 10, height: 10 }, 'replace');
    expect(getSelectionMaskValue(mask, 10, 10)).toBe(1);
    expect(getSelectionMaskValue(mask, 2, 2)).toBe(0);

    // Subtract inner rect
    mask = selectRectRegion(mask, { x: 8, y: 8, width: 4, height: 4 }, 'subtract');
    expect(getSelectionMaskValue(mask, 9, 9)).toBe(0);
    expect(getSelectionMaskValue(mask, 6, 6)).toBe(1);

    // Invert selection
    const inverted = invertSelectionMask(mask);
    expect(getSelectionMaskValue(inverted, 2, 2)).toBe(1);
    expect(getSelectionMaskValue(inverted, 6, 6)).toBe(0);

    // Feather selection produces partial coverage 0 < S(x,y) < 1 along border
    const feathered = featherSelectionMask(mask, 2);
    const borderVal = getSelectionMaskValue(feathered, 5, 10);
    expect(borderVal).toBeGreaterThan(0);
    expect(borderVal).toBeLessThan(1);

    // Expand selection
    const expanded = expandContractSelectionMask(mask, 2);
    expect(getSelectionMaskValue(expanded, 4, 10)).toBe(1);

    // Elliptical selection
    const ellipseMask = selectEllipseRegion(createSelectionMask(20, 20, 0), 10, 10, 5, 5);
    expect(getSelectionMaskValue(ellipseMask, 10, 10)).toBe(1);
    expect(getSelectionMaskValue(ellipseMask, 0, 0)).toBe(0);

    // Layer mask composition alpha_result = alpha_original * M(x,y)
    expect(evaluateLayerMaskAlpha(0.8, 1.0)).toBeCloseTo(0.8, TOLERANCE);
    expect(evaluateLayerMaskAlpha(0.8, 0.0)).toBeCloseTo(0.0, TOLERANCE);
    expect(evaluateLayerMaskAlpha(0.8, 0.5)).toBeCloseTo(0.4, TOLERANCE);
    expect(evaluateLayerMaskAlpha(0.8, 0.25, { inverted: true })).toBeCloseTo(0.6, TOLERANCE);
    expect(evaluateLayerMaskAlpha(0.8, 0.0, { enabled: false })).toBeCloseTo(0.8, TOLERANCE);
  });

  it('generates parametric polygons, stars, and computes convex boolean intersections', () => {
    const hex = generateRegularPolygonPoints(6, 50);
    expect(hex).toHaveLength(6);

    const star = generateStarPoints(5, 60, 25);
    expect(star).toHaveLength(10);

    const sqA = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    const sqB = [
      { x: 50, y: 50 },
      { x: 150, y: 50 },
      { x: 150, y: 150 },
      { x: 50, y: 150 },
    ];
    const intersection = intersectConvexPolygons(sqA, sqB);
    expect(intersection.length).toBeGreaterThanOrEqual(4);
    const svgPath = polygonRingsToSvgPath([intersection]);
    expect(svgPath).toContain('M ');
    expect(svgPath).toContain('Z');
  });
});
