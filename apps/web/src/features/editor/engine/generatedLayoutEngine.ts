import { generateRegularPolygonPoints, generateStarPoints } from '@pencel/editor-core';
import type {
  CanvasLayoutElementDto,
  Dimensions,
  GeneratedLayoutDto,
  LayoutGradientSpec,
  LayoutShadowSpec,
} from '@pencel/shared-types';
import {
  Circle as FabricCircle,
  Ellipse as FabricEllipse,
  Gradient,
  Path as FabricPath,
  Polygon as FabricPolygon,
  Rect as FabricRect,
  Shadow,
  Textbox as FabricTextbox,
  Triangle as FabricTriangle,
  type Canvas as FabricCanvas,
  type FabricObject,
} from 'fabric';
import { BASE_FONT_CATALOG, loadWebFont, type FontOption } from '../services/fontLoaderService.js';
import { searchPublicMedia } from '../services/publicMediaService.js';
import { loadFabricImageSafely } from './imageLoadingUtils.js';

function createFabricGradient(spec: LayoutGradientSpec): Gradient<'linear'> | Gradient<'radial'> {
  const colorStops = spec.stops.map((stop) => ({
    offset: Math.max(0, Math.min(1, stop.offset)),
    color: stop.color,
    ...(stop.opacity !== undefined ? { opacity: stop.opacity } : {}),
  }));

  if (spec.type === 'radial') {
    return new Gradient({
      type: 'radial',
      gradientUnits: 'percentage',
      coords: { x1: 0.5, y1: 0.5, r1: 0, x2: 0.5, y2: 0.5, r2: 0.6 },
      colorStops,
    });
  }

  const angleRad = (((spec.angle ?? 135) - 90) * Math.PI) / 180;
  const dx = Math.cos(angleRad) * 0.5;
  const dy = Math.sin(angleRad) * 0.5;

  return new Gradient({
    type: 'linear',
    gradientUnits: 'percentage',
    coords: {
      x1: 0.5 - dx,
      y1: 0.5 - dy,
      x2: 0.5 + dx,
      y2: 0.5 + dy,
    },
    colorStops,
  });
}

function createFabricShadow(spec?: LayoutShadowSpec): Shadow | undefined {
  if (!spec) return undefined;
  return new Shadow({
    color: spec.color,
    blur: spec.blur,
    offsetX: spec.offsetX ?? 0,
    offsetY: spec.offsetY ?? 0,
  });
}

function resolveCatalogFont(fontFamily?: string): {
  readonly fontCss: string;
  readonly catalogOption?: FontOption;
} {
  if (!fontFamily || !fontFamily.trim()) {
    return { fontCss: 'Inter, -apple-system, sans-serif' };
  }
  const primary = fontFamily.split(',')[0]?.replace(/['"]/g, '').trim() || 'Inter';
  const matched = BASE_FONT_CATALOG.find(
    (opt) =>
      opt.label.toLowerCase() === primary.toLowerCase() ||
      opt.family.toLowerCase().includes(primary.toLowerCase()),
  );
  if (matched) {
    return { fontCss: matched.family, catalogOption: matched };
  }
  return {
    fontCss: `'${primary}', Inter, -apple-system, sans-serif`,
    catalogOption: {
      id: primary.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      label: primary,
      family: `'${primary}', sans-serif`,
      category: 'Sans-Serif',
      isGoogleFont: true,
    },
  };
}

function isHeadlessTestEnv(): boolean {
  return (
    typeof window !== 'undefined' &&
    (window.navigator?.userAgent?.includes('jsdom') ||
      (typeof process !== 'undefined' && Boolean(process.env?.VITEST)))
  );
}

async function preloadLayoutFonts(elements: readonly CanvasLayoutElementDto[]): Promise<void> {
  if (isHeadlessTestEnv()) return;

  const uniqueFonts = new Map<string, FontOption>();
  for (const el of elements) {
    if (el.type !== 'textbox' || !el.fontFamily) continue;
    const { catalogOption } = resolveCatalogFont(el.fontFamily);
    if (catalogOption?.isGoogleFont && !uniqueFonts.has(catalogOption.id)) {
      uniqueFonts.set(catalogOption.id, catalogOption);
    }
  }

  if (uniqueFonts.size === 0) return;

  const loadAll = Promise.all(Array.from(uniqueFonts.values()).map((opt) => loadWebFont(opt)));
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 1800));
  await Promise.race([loadAll.then(() => undefined), timeout]);
}

async function createImageElementObject(
  el: CanvasLayoutElementDto,
  managedObjectUrls: Set<string>,
): Promise<FabricObject> {
  const targetW = Math.max(40, el.width ?? 400);
  const targetH = Math.max(40, el.height ?? 300);

  let resolvedUrl = el.imageUrl;
  if (!resolvedUrl && el.imageQuery && !isHeadlessTestEnv()) {
    try {
      const results = await searchPublicMedia(el.imageQuery, 1);
      resolvedUrl = results[0]?.fullUrl ?? results[0]?.thumbUrl;
    } catch {
      resolvedUrl = undefined;
    }
  }

  if (resolvedUrl) {
    const fi = await loadFabricImageSafely(resolvedUrl, managedObjectUrls);
    if (fi && (fi.width ?? 0) > 0 && (fi.height ?? 0) > 0) {
      const rawW = fi.width || targetW;
      const rawH = fi.height || targetH;
      const scale =
        el.objectFit === 'contain'
          ? Math.min(targetW / rawW, targetH / rawH)
          : Math.max(targetW / rawW, targetH / rawH);

      fi.scale(scale);
      const scaledW = rawW * scale;
      const scaledH = rawH * scale;
      const offsetX = Math.round((targetW - scaledW) / 2);
      const offsetY = Math.round((targetH - scaledH) / 2);

      const radius = el.borderRadius ?? el.rx ?? 0;
      const clipRect = new FabricRect({
        left: el.left,
        top: el.top,
        width: targetW,
        height: targetH,
        rx: radius,
        ry: radius,
        originX: 'left',
        originY: 'top',
        absolutePositioned: true,
      });

      fi.set({
        originX: 'left',
        originY: 'top',
        left: el.left + offsetX,
        top: el.top + offsetY,
        opacity: el.opacity ?? 1,
        angle: el.angle ?? 0,
        clipPath: clipRect,
        name: el.name,
        ...(el.shadow ? { shadow: createFabricShadow(el.shadow) } : {}),
      });
      fi.set('aiImageQuery', el.imageQuery ?? '');
      fi.set('aiImageUrl', resolvedUrl);
      fi.set('aiFrameLeft', el.left);
      fi.set('aiFrameTop', el.top);
      fi.set('aiFrameWidth', targetW);
      fi.set('aiFrameHeight', targetH);
      fi.set('aiBorderRadius', radius);
      fi.setCoords();
      return fi;
    }
  }

  // Graceful elevated placeholder card if photo network fetch is unavailable
  const fallbackFill = el.fillGradient
    ? createFabricGradient(el.fillGradient)
    : (el.fill ?? '#1E2433');
  return new FabricRect({
    originX: 'left',
    originY: 'top',
    left: el.left,
    top: el.top,
    width: targetW,
    height: targetH,
    rx: el.borderRadius ?? el.rx ?? 16,
    ry: el.borderRadius ?? el.ry ?? 16,
    fill: fallbackFill,
    stroke: el.stroke,
    strokeWidth: el.strokeWidth ?? 0,
    opacity: el.opacity ?? 1,
    angle: el.angle ?? 0,
    name: el.name,
    ...(el.shadow ? { shadow: createFabricShadow(el.shadow) } : {}),
  });
}

function buildSyncElementObject(el: CanvasLayoutElementDto): FabricObject | null {
  const fill = el.fillGradient ? createFabricGradient(el.fillGradient) : (el.fill ?? '#000000');
  const shadow = createFabricShadow(el.shadow);
  const common = {
    originX: 'left' as const,
    originY: 'top' as const,
    left: el.left,
    top: el.top,
    opacity: el.opacity ?? 1,
    angle: el.angle ?? 0,
    name: el.name,
    ...(shadow ? { shadow } : {}),
  };

  switch (el.type) {
    case 'rect':
      return new FabricRect({
        ...common,
        width: el.width ?? 100,
        height: el.height ?? 100,
        rx: el.rx ?? 0,
        ry: el.ry ?? el.rx ?? 0,
        fill,
        stroke: el.stroke,
        strokeWidth: el.strokeWidth ?? 0,
        ...(el.strokeDashArray ? { strokeDashArray: [...el.strokeDashArray] } : {}),
      });

    case 'line':
      return new FabricRect({
        ...common,
        width: el.width ?? 200,
        height: Math.max(1, el.height ?? 3),
        rx: el.rx ?? Math.round(Math.max(1, el.height ?? 3) / 2),
        ry: el.ry ?? Math.round(Math.max(1, el.height ?? 3) / 2),
        fill,
      });

    case 'circle':
      return new FabricCircle({
        ...common,
        radius: el.radius ?? Math.round((el.width ?? 100) / 2),
        fill,
        stroke: el.stroke,
        strokeWidth: el.strokeWidth ?? 0,
        ...(el.strokeDashArray ? { strokeDashArray: [...el.strokeDashArray] } : {}),
      });

    case 'ellipse':
      return new FabricEllipse({
        ...common,
        rx: el.rx ?? Math.round((el.width ?? 140) / 2),
        ry: el.ry ?? Math.round((el.height ?? 90) / 2),
        fill,
        stroke: el.stroke,
        strokeWidth: el.strokeWidth ?? 0,
        ...(el.strokeDashArray ? { strokeDashArray: [...el.strokeDashArray] } : {}),
      });

    case 'triangle':
      return new FabricTriangle({
        ...common,
        width: el.width ?? 100,
        height: el.height ?? 100,
        fill,
        stroke: el.stroke,
        strokeWidth: el.strokeWidth ?? 0,
      });

    case 'polygon': {
      const r = el.radius ?? Math.round(Math.min(el.width ?? 120, el.height ?? 120) / 2);
      const sides = Math.max(3, Math.min(16, el.sides ?? 6));
      const pts = el.isStar
        ? generateStarPoints(sides, r, Math.round(r * 0.62))
        : generateRegularPolygonPoints(sides, r);
      const poly = new FabricPolygon(pts, {
        ...common,
        fill,
        stroke: el.stroke,
        strokeWidth: el.strokeWidth ?? 0,
      });
      poly.set('name', el.name);
      return poly;
    }

    case 'path': {
      if (!el.pathData) return null;
      try {
        return new FabricPath(el.pathData, {
          ...common,
          fill: el.fill ?? 'transparent',
          stroke: el.stroke ?? el.fill ?? '#FFFFFF',
          strokeWidth: el.strokeWidth ?? 2,
          ...(el.strokeDashArray ? { strokeDashArray: [...el.strokeDashArray] } : {}),
        });
      } catch {
        return null;
      }
    }

    case 'textbox': {
      const { fontCss } = resolveCatalogFont(el.fontFamily);
      return new FabricTextbox(el.text ?? '', {
        ...common,
        width: el.width ?? 300,
        fontSize: el.fontSize ?? 24,
        fontFamily: fontCss,
        fontWeight: el.fontWeight ?? 'normal',
        fontStyle: el.fontStyle ?? 'normal',
        fill: el.fill ?? '#000000',
        ...(el.stroke ? { stroke: el.stroke } : {}),
        ...(el.strokeWidth ? { strokeWidth: el.strokeWidth } : {}),
        ...(el.textBackgroundColor ? { textBackgroundColor: el.textBackgroundColor } : {}),
        textAlign: el.textAlign ?? 'left',
        lineHeight: el.lineHeight ?? 1.2,
        charSpacing: el.charSpacing ?? 0,
      });
    }

    default:
      return null;
  }
}

/**
 * Materializes an AI-generated creative layout onto the Fabric.js canvas with
 * dynamic Google WebFonts, multi-stop gradients, shadows, vector polygons, and framed photos.
 */
export async function applyGeneratedLayoutToCanvas(
  fabricCanvas: FabricCanvas,
  pageDimensions: Dimensions,
  layout: GeneratedLayoutDto,
  onClearObjects: () => void,
  onCommit: () => void,
  managedObjectUrls: Set<string> = new Set(),
): Promise<void> {
  await preloadLayoutFonts(layout.elements);

  onClearObjects();

  if (layout.backgroundColor) {
    fabricCanvas.backgroundColor = layout.backgroundColor;
  }

  const fabricObjects: FabricObject[] = [];

  if (layout.backgroundGradient) {
    const bgGradRect = new FabricRect({
      originX: 'left',
      originY: 'top',
      left: 0,
      top: 0,
      width: pageDimensions.width,
      height: pageDimensions.height,
      fill: createFabricGradient(layout.backgroundGradient),
      selectable: true,
      name: 'Fundo Gradiente',
    });
    bgGradRect.set('isAiBackgroundGradient', true);
    fabricObjects.push(bgGradRect);
  }

  for (const el of layout.elements) {
    if (el.type === 'image') {
      const imgObj = await createImageElementObject(el, managedObjectUrls);
      fabricObjects.push(imgObj);
      continue;
    }

    const obj = buildSyncElementObject(el);
    if (obj) {
      fabricObjects.push(obj);
    }
  }

  if (fabricObjects.length > 0) {
    fabricCanvas.add(...fabricObjects);
  }

  // Re-measure textboxes after fonts settle
  if (!isHeadlessTestEnv() && typeof document !== 'undefined' && 'fonts' in document) {
    void document.fonts.ready.then(() => {
      for (const obj of fabricObjects) {
        if (obj.type.toLowerCase().includes('text')) {
          obj.dirty = true;
          (obj as FabricTextbox).initDimensions();
        }
      }
      fabricCanvas.requestRenderAll();
    });
  }

  fabricCanvas.requestRenderAll();
  onCommit();
}

export { extractLayoutSnapshotFromCanvas } from './layoutSnapshotEngine.js';
