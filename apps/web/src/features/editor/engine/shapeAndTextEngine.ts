import {
  generateRegularPolygonPoints,
  generateStarPoints,
  intersectConvexPolygons,
  polygonRingsToSvgPath,
  type BooleanPathOperation,
  type Point2D,
  type ShapeVariant,
} from '@pencel/editor-core';
import type { Dimensions } from '@pencel/shared-types';
import {
  ActiveSelection,
  Circle as FabricCircle,
  Ellipse as FabricEllipse,
  IText as FabricIText,
  Path as FabricPath,
  Polygon as FabricPolygon,
  Rect as FabricRect,
  Textbox as FabricTextbox,
  Triangle as FabricTriangle,
  Point,
  util,
  type Canvas as FabricCanvas,
  type FabricObject,
} from 'fabric';
import { createElementId } from '../../../shared/lib/idUtils.js';
import type { SelectedObjectProperties } from './adapterTypes.js';

export function addTextToCanvas(
  fabricCanvas: FabricCanvas,
  pageDimensions: Dimensions,
  options: {
    text: string;
    fontSize?: number;
    fontWeight?: string | number;
    fontFamily?: string;
    fill?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    charSpacing?: number;
    lineHeight?: number;
    boxMode?: 'point' | 'area';
  },
  onSelect: () => void,
): void {
  const canvasWidth = pageDimensions.width;
  const canvasHeight = pageDimensions.height;
  const isPointText = options.boxMode === 'point';

  const commonProps = {
    originX: 'left' as const,
    originY: 'top' as const,
    left: Math.round(canvasWidth / 2 - 180),
    top: Math.round(canvasHeight / 2 - 30),
    width: 360,
    fontSize: options.fontSize ?? 36,
    fontWeight: options.fontWeight ?? 'bold',
    fontFamily: options.fontFamily ?? 'Inter, -apple-system, sans-serif',
    fill: options.fill ?? '#1D1D1F',
    textAlign: options.textAlign ?? 'center',
    charSpacing: options.charSpacing ?? 0,
    lineHeight: options.lineHeight ?? 1.16,
    name: createElementId('text'),
  };

  const textObj = isPointText
    ? new FabricIText(options.text, commonProps)
    : new FabricTextbox(options.text, commonProps);

  textObj.set('boxMode', isPointText ? 'point' : 'area');

  fabricCanvas.add(textObj);
  fabricCanvas.setActiveObject(textObj);
  fabricCanvas.requestRenderAll();
  onSelect();
}

export function addShapeToCanvas(
  fabricCanvas: FabricCanvas,
  pageDimensions: Dimensions,
  options: {
    shapeVariant: ShapeVariant;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  },
  onSelect: () => void,
): void {
  const canvasWidth = pageDimensions.width;
  const canvasHeight = pageDimensions.height;
  const fill = options.fill ?? '#0071E3';
  const stroke = options.stroke ?? 'transparent';
  const strokeWidth = options.strokeWidth ?? 0;

  let shapeObj: FabricObject;
  const id = createElementId('shape');

  switch (options.shapeVariant) {
    case 'circle':
      shapeObj = new FabricCircle({
        originX: 'left',
        originY: 'top',
        radius: 90,
        fill,
        stroke,
        strokeWidth,
        left: Math.round(canvasWidth / 2 - 90),
        top: Math.round(canvasHeight / 2 - 90),
        name: id,
      });
      break;
    case 'ellipse':
      shapeObj = new FabricEllipse({
        originX: 'left',
        originY: 'top',
        rx: 110,
        ry: 70,
        fill,
        stroke,
        strokeWidth,
        left: Math.round(canvasWidth / 2 - 110),
        top: Math.round(canvasHeight / 2 - 70),
        name: id,
      });
      break;
    case 'triangle':
      shapeObj = new FabricTriangle({
        originX: 'left',
        originY: 'top',
        width: 180,
        height: 160,
        fill,
        stroke,
        strokeWidth,
        left: Math.round(canvasWidth / 2 - 90),
        top: Math.round(canvasHeight / 2 - 80),
        name: id,
      });
      break;
    case 'polygon': {
      const hexPoints = generateRegularPolygonPoints(6, 90);
      shapeObj = new FabricPolygon(hexPoints, {
        originX: 'left',
        originY: 'top',
        fill,
        stroke,
        strokeWidth,
        left: Math.round(canvasWidth / 2 - 90),
        top: Math.round(canvasHeight / 2 - 90),
      });
      shapeObj.set('name', id);
      break;
    }
    case 'star': {
      const starPoints = generateStarPoints(5, 96, 42);
      shapeObj = new FabricPolygon(starPoints, {
        originX: 'left',
        originY: 'top',
        fill,
        stroke,
        strokeWidth,
        left: Math.round(canvasWidth / 2 - 96),
        top: Math.round(canvasHeight / 2 - 96),
      });
      shapeObj.set('name', id);
      break;
    }
    case 'pill':
      shapeObj = new FabricRect({
        originX: 'left',
        originY: 'top',
        width: 240,
        height: 72,
        rx: 36,
        ry: 36,
        fill,
        stroke,
        strokeWidth,
        left: Math.round(canvasWidth / 2 - 120),
        top: Math.round(canvasHeight / 2 - 36),
        name: id,
      });
      break;
    case 'line':
      shapeObj = new FabricRect({
        originX: 'left',
        originY: 'top',
        width: 300,
        height: 6,
        rx: 3,
        ry: 3,
        fill,
        left: Math.round(canvasWidth / 2 - 150),
        top: Math.round(canvasHeight / 2 - 3),
        name: id,
      });
      break;
    case 'rounded-rectangle':
      shapeObj = new FabricRect({
        originX: 'left',
        originY: 'top',
        width: 180,
        height: 180,
        rx: 28,
        ry: 28,
        fill,
        stroke,
        strokeWidth,
        left: Math.round(canvasWidth / 2 - 90),
        top: Math.round(canvasHeight / 2 - 90),
        name: id,
      });
      break;
    case 'rectangle':
    default:
      shapeObj = new FabricRect({
        originX: 'left',
        originY: 'top',
        width: 180,
        height: 180,
        rx: 0,
        ry: 0,
        fill,
        stroke,
        strokeWidth,
        left: Math.round(canvasWidth / 2 - 90),
        top: Math.round(canvasHeight / 2 - 90),
        name: id,
      });
      break;
  }

  fabricCanvas.add(shapeObj);
  fabricCanvas.setActiveObject(shapeObj);
  fabricCanvas.requestRenderAll();
  onSelect();
}

export function performBooleanOperationOnCanvas(
  fabricCanvas: FabricCanvas,
  operation: BooleanPathOperation,
  onComplete: () => void,
): void {
  const active = fabricCanvas.getActiveObject();
  if (!active || active.type !== 'activeselection') {
    return;
  }

  const candidates: FabricObject[] = [...(active as ActiveSelection).getObjects()];
  fabricCanvas.discardActiveObject();

  if (candidates.length < 2) return;
  const objA = candidates[0]!;
  const objB = candidates[1]!;

  const toWorldPolygon = (obj: FabricObject): Point2D[] => {
    const matrix = obj.calcTransformMatrix();
    const t = obj.type.toLowerCase();

    if (t === 'polygon' && 'points' in obj && Array.isArray((obj as FabricPolygon).points)) {
      const poly = obj as FabricPolygon;
      const offsetX = poly.pathOffset?.x ?? 0;
      const offsetY = poly.pathOffset?.y ?? 0;
      return poly.points.map((pt) => {
        const local = new Point(pt.x - offsetX, pt.y - offsetY);
        const transformed = util.transformPoint(local, matrix);
        return { x: transformed.x, y: transformed.y };
      });
    }

    if (t === 'triangle') {
      const w = obj.width ?? 100;
      const h = obj.height ?? 100;
      const localPts = [new Point(0, -h / 2), new Point(w / 2, h / 2), new Point(-w / 2, h / 2)];
      return localPts.map((lp) => {
        const transformed = util.transformPoint(lp, matrix);
        return { x: transformed.x, y: transformed.y };
      });
    }

    if (t === 'circle' || t === 'ellipse') {
      const rx = (obj.width ?? 100) / 2;
      const ry = (obj.height ?? 100) / 2;
      const pts: Point2D[] = [];
      for (let i = 0; i < 32; i++) {
        const theta = (2 * Math.PI * i) / 32;
        const local = new Point(Math.cos(theta) * rx, Math.sin(theta) * ry);
        const transformed = util.transformPoint(local, matrix);
        pts.push({ x: transformed.x, y: transformed.y });
      }
      return pts;
    }

    const w = (obj.width ?? 100) / 2;
    const h = (obj.height ?? 100) / 2;
    const corners = [new Point(-w, -h), new Point(w, -h), new Point(w, h), new Point(-w, h)];
    return corners.map((c) => {
      const transformed = util.transformPoint(c, matrix);
      return { x: transformed.x, y: transformed.y };
    });
  };

  const ringA = toWorldPolygon(objA);
  const ringB = toWorldPolygon(objB);

  let svgPathData: string;
  let fillRule: 'nonzero' | 'evenodd' = 'nonzero';

  if (operation === 'intersect') {
    const clipped = intersectConvexPolygons(ringA, ringB);
    svgPathData =
      clipped.length >= 3 ? polygonRingsToSvgPath([clipped]) : polygonRingsToSvgPath([ringA]);
  } else if (operation === 'subtract') {
    const revB = [...ringB].reverse();
    svgPathData = polygonRingsToSvgPath([ringA, revB]);
    fillRule = 'evenodd';
  } else if (operation === 'exclude') {
    svgPathData = polygonRingsToSvgPath([ringA, ringB]);
    fillRule = 'evenodd';
  } else {
    svgPathData = polygonRingsToSvgPath([ringA, ringB]);
    fillRule = 'nonzero';
  }

  if (!svgPathData) return;

  const fill = typeof objA.fill === 'string' ? objA.fill : '#0066CC';
  const stroke = typeof objA.stroke === 'string' ? objA.stroke : 'transparent';
  const strokeWidth = typeof objA.strokeWidth === 'number' ? objA.strokeWidth : 0;

  const booleanPath = new FabricPath(svgPathData, {
    fill,
    stroke,
    strokeWidth,
    fillRule,
    name: createElementId(`bool-${operation}`),
  });

  fabricCanvas.remove(objA);
  fabricCanvas.remove(objB);
  fabricCanvas.add(booleanPath);
  fabricCanvas.setActiveObject(booleanPath);
  fabricCanvas.requestRenderAll();
  onComplete();
}

export function updateSelectedObjectProperties(
  fabricCanvas: FabricCanvas,
  props: Partial<SelectedObjectProperties>,
  onComplete: () => void,
): void {
  const active = fabricCanvas.getActiveObject();
  if (!active) return;

  if (props.fill !== undefined) active.set('fill', props.fill);
  if (props.stroke !== undefined) active.set('stroke', props.stroke);
  if (props.strokeWidth !== undefined) active.set('strokeWidth', props.strokeWidth);
  if (props.strokeDashArray !== undefined)
    active.set('strokeDashArray', props.strokeDashArray ? [...props.strokeDashArray] : null);
  if (props.strokeLineCap !== undefined) active.set('strokeLineCap', props.strokeLineCap);
  if (props.strokeLineJoin !== undefined) active.set('strokeLineJoin', props.strokeLineJoin);
  if (props.opacity !== undefined) active.set('opacity', props.opacity);
  if (props.blendMode !== undefined) {
    active.set('globalCompositeOperation', props.blendMode);
    active.dirty = true;
    if (
      'getObjects' in active &&
      typeof (active as { getObjects?: () => unknown[] }).getObjects === 'function'
    ) {
      const children = (active as { getObjects: () => FabricObject[] }).getObjects();
      children.forEach((child) => {
        child.set('globalCompositeOperation', props.blendMode);
        child.dirty = true;
      });
    }
  }

  const textObj = active as FabricTextbox;
  if (active.type.toLowerCase().includes('text')) {
    if (props.fontSize !== undefined) textObj.set('fontSize', props.fontSize);
    if (props.fontFamily !== undefined) textObj.set('fontFamily', props.fontFamily);
    if (props.fontWeight !== undefined) textObj.set('fontWeight', props.fontWeight);
    if (props.fontStyle !== undefined) textObj.set('fontStyle', props.fontStyle);
    if (props.underline !== undefined) textObj.set('underline', props.underline);
    if (props.textAlign !== undefined) textObj.set('textAlign', props.textAlign);
    if (props.charSpacing !== undefined) textObj.set('charSpacing', props.charSpacing);
    if (props.lineHeight !== undefined) textObj.set('lineHeight', props.lineHeight);
  }

  fabricCanvas.requestRenderAll();
  onComplete();
}

export async function duplicateActiveObject(
  fabricCanvas: FabricCanvas,
  onComplete: () => void,
): Promise<void> {
  const active = fabricCanvas.getActiveObject();
  if (!active) return;

  try {
    const cloned = await active.clone();
    cloned.set({
      left: (active.left || 0) + 24,
      top: (active.top || 0) + 24,
      name: `${(active.get('name') as string) || 'obj'}-copy`,
    });
    fabricCanvas.add(cloned);
    fabricCanvas.setActiveObject(cloned);
    fabricCanvas.requestRenderAll();
    onComplete();
  } catch (err) {
    console.warn('Could not duplicate selected object:', err);
  }
}

export function deleteSelectedObjects(fabricCanvas: FabricCanvas, onCleared: () => void): void {
  const active = fabricCanvas.getActiveObjects();
  if (!active || active.length === 0) return;
  active.forEach((obj) => fabricCanvas.remove(obj));
  fabricCanvas.discardActiveObject();
  fabricCanvas.requestRenderAll();
  onCleared();
}

export function clearCanvasObjects(fabricCanvas: FabricCanvas, onCleared: () => void): void {
  [...fabricCanvas.getObjects()].forEach((o) => fabricCanvas.remove(o));
  fabricCanvas.discardActiveObject();
  fabricCanvas.requestRenderAll();
  onCleared();
}
