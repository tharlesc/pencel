import type { Dimensions } from '@pencel/shared-types';
import {
  ActiveSelection,
  classRegistry,
  Path,
  PencilBrush,
  Shadow,
  type Canvas as FabricCanvas,
  type FabricObject,
  type TSimplePathData,
} from 'fabric';

export interface CanvasBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
  readonly width: number;
  readonly height: number;
  readonly centerX: number;
  readonly middleY: number;
}

export function getObjectCanvasBounds(obj: FabricObject): CanvasBounds {
  obj.setCoords();
  const c = obj.aCoords;
  if (c?.tl && c?.tr && c?.br && c?.bl) {
    const minX = Math.min(c.tl.x, c.tr.x, c.br.x, c.bl.x),
      maxX = Math.max(c.tl.x, c.tr.x, c.br.x, c.bl.x);
    const minY = Math.min(c.tl.y, c.tr.y, c.br.y, c.bl.y),
      maxY = Math.max(c.tl.y, c.tr.y, c.br.y, c.bl.y);
    const width = Math.max(0.1, maxX - minX),
      height = Math.max(0.1, maxY - minY);
    return {
      minX,
      maxX,
      minY,
      maxY,
      width,
      height,
      centerX: minX + width / 2,
      middleY: minY + height / 2,
    };
  }
  const left = obj.left || 0,
    top = obj.top || 0;
  const width = Math.max(0.1, (obj.width || 0) * (obj.scaleX || 1)),
    height = Math.max(0.1, (obj.height || 0) * (obj.scaleY || 1));
  return {
    minX: left,
    maxX: left + width,
    minY: top,
    maxY: top + height,
    width,
    height,
    centerX: left + width / 2,
    middleY: top + height / 2,
  };
}

/**
 * Multi-stage Gaussian falloff stroke renderer calibrated with Photoshop & PhotoCraft.
 * Reproduces:
 * - At 100% hardness (0% suavidade): sharp, crisp contour with rounded caps.
 * - At 0% hardness (100% suavidade): smooth feathered Gaussian halo with dense solid core.
 */
function renderPhotoshopStroke(
  ctx: CanvasRenderingContext2D,
  color: string,
  width: number,
  hardness: number,
  drawPath: (c: CanvasRenderingContext2D) => void,
): void {
  const h = Math.max(0, Math.min(100, hardness)) / 100;
  const s = 1 - h;
  if (s < 0.01) {
    ctx.lineWidth = width;
    drawPath(ctx);
    ctx.stroke();
    return;
  }

  // 1. Soft feather halo (Gaussian offscreen shadow projection)
  const blur = width * s * 0.5;
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = 10000;
  ctx.shadowOffsetY = 0;
  ctx.translate(-10000, 0);
  ctx.lineWidth = Math.max(1, width * (0.55 + 0.45 * (1 - s)));
  drawPath(ctx);
  ctx.stroke();
  ctx.restore();

  // 2. Mid feather reinforcement
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur * 0.4;
  ctx.shadowOffsetX = 10000;
  ctx.shadowOffsetY = 0;
  ctx.translate(-10000, 0);
  ctx.lineWidth = Math.max(1, width * (0.45 + 0.55 * (1 - s)));
  drawPath(ctx);
  ctx.stroke();
  ctx.restore();

  // 3. Dense solid core (maintains deep center identical to PhotoCraft & Photoshop)
  const coreWidth = Math.max(1, width * (0.5 + 0.5 * (1 - s)));
  ctx.save();
  ctx.lineWidth = coreWidth;
  drawPath(ctx);
  ctx.stroke();
  ctx.restore();
}

/**
 * Custom Fabric.js Path reproducing Photoshop brush edge hardness falloff.
 */
export class SoftBrushPath extends Path {
  static override type = 'SoftBrushPath';
  public hardness = 100;

  get softness(): number {
    return 100 - this.hardness;
  }
  set softness(val: number) {
    this.hardness = 100 - val;
  }

  constructor(path: TSimplePathData, options?: Record<string, unknown>) {
    super(path, options);
    if (typeof options?.hardness === 'number') {
      this.hardness = options.hardness;
    } else if (typeof options?.softness === 'number') {
      this.hardness = 100 - options.softness;
    }
  }

  override _renderStroke(ctx: CanvasRenderingContext2D): void {
    if (!this.stroke || this.strokeWidth === 0) return;
    ctx.save();
    if (this.strokeUniform) {
      const scaling = this.getObjectScaling();
      ctx.scale(1 / scaling.x, 1 / scaling.y);
    }
    this._setLineDash(ctx, this.strokeDashArray);
    this._setStrokeStyles(ctx, this);
    renderPhotoshopStroke(ctx, this.stroke as string, this.strokeWidth, this.hardness, () =>
      ctx.stroke(),
    );
    ctx.restore();
  }
}

classRegistry.setClass(SoftBrushPath, 'SoftBrushPath');

export class PhotoshopBrush extends PencilBrush {
  public baseWidth = 8;
  public hardness = 100;
  public smoothness = 50;

  get softness(): number {
    return 100 - this.hardness;
  }
  set softness(val: number) {
    this.hardness = 100 - val;
  }

  override needsFullRender(): boolean {
    return super.needsFullRender() || this.hardness < 99;
  }

  override _render(ctx = this.canvas.contextTop): void {
    const points = this._points;
    if (points.length < 2) return;

    this._saveAndTransform(ctx);

    const drawPath = (renderCtx: CanvasRenderingContext2D): void => {
      renderCtx.beginPath();
      let p1 = points[0]!;
      let p2 = points[1]!;
      if (points.length === 2 && p1.x === p2.x && p1.y === p2.y) {
        const w = this.width / 1e3;
        p1.x -= w;
        p2.x += w;
      }
      renderCtx.moveTo(p1.x, p1.y);
      for (let i = 1; i < points.length; i++) {
        PencilBrush.drawSegment(renderCtx, p1, p2);
        p1 = points[i]!;
        p2 = points[i + 1]!;
      }
      renderCtx.lineTo(p1.x, p1.y);
    };

    ctx.strokeStyle = this.color;
    ctx.lineCap = this.strokeLineCap;
    ctx.lineJoin = this.strokeLineJoin;

    const effectiveWidth = this.baseWidth || this.width || 8;
    renderPhotoshopStroke(ctx, this.color, effectiveWidth, this.hardness, drawPath);
    ctx.restore();
  }

  override createPath(pathData: TSimplePathData): Path {
    const h = Math.max(0, Math.min(100, this.hardness));
    const effectiveWidth = this.baseWidth || this.width || 8;
    if (h >= 99) {
      return new Path(pathData, {
        fill: null,
        stroke: this.color,
        strokeWidth: effectiveWidth,
        strokeLineCap: this.strokeLineCap,
        strokeMiterLimit: this.strokeMiterLimit,
        strokeLineJoin: this.strokeLineJoin,
        strokeDashArray: this.strokeDashArray,
      });
    }

    return new SoftBrushPath(pathData, {
      fill: null,
      stroke: this.color,
      strokeWidth: effectiveWidth,
      strokeLineCap: this.strokeLineCap,
      strokeMiterLimit: this.strokeMiterLimit,
      strokeLineJoin: this.strokeLineJoin,
      strokeDashArray: this.strokeDashArray,
      hardness: h,
    });
  }
}

export function configureDrawingBrush(
  fabricCanvas: FabricCanvas,
  enabled: boolean,
  mode: 'brush' | 'eraser',
  color: string,
  width: number,
  smoothness = 50,
  hardness = 100,
): 'none' | 'brush' | 'eraser' {
  if (!enabled) {
    fabricCanvas.isDrawingMode = false;
    fabricCanvas.freeDrawingCursor = 'default';
    fabricCanvas.requestRenderAll();
    return 'none';
  }

  fabricCanvas.isDrawingMode = true;
  fabricCanvas.freeDrawingCursor = 'none';
  const brush =
    fabricCanvas.freeDrawingBrush instanceof PhotoshopBrush
      ? fabricCanvas.freeDrawingBrush
      : new PhotoshopBrush(fabricCanvas);

  const clampedHardness = Math.max(0, Math.min(100, hardness));
  const clampedSmoothness = Math.max(0, Math.min(100, smoothness));
  const strokeColor = mode === 'eraser' ? 'rgba(0,0,0,0.7)' : color;

  brush.baseWidth = width;
  brush.width = width;
  brush.hardness = clampedHardness;
  brush.smoothness = clampedSmoothness;
  brush.color = strokeColor;
  brush.decimate = 0.4 + (clampedSmoothness / 100) * 8;

  if (clampedHardness < 99) {
    const softness = (100 - clampedHardness) / 100;
    brush.shadow = new Shadow({
      color: strokeColor,
      blur: Math.round(width * softness * 0.85 * 10) / 10,
      offsetX: 0,
      offsetY: 0,
      affectStroke: true,
    });
    brush.width = Math.round(width * (clampedHardness / 100) * 10) / 10;
  } else {
    brush.shadow = null;
  }

  fabricCanvas.freeDrawingBrush = brush;
  return mode;
}

export class DrawingToolManager {
  public tool: 'none' | 'brush' | 'eraser' = 'none';
  public color = '#1D1D1F';
  public width = 8;
  public hardness = 100;
  public smoothness = 50;

  get softness(): number {
    return 100 - this.hardness;
  }
  set softness(v: number) {
    this.hardness = 100 - v;
  }

  public setMode(
    fabricCanvas: FabricCanvas,
    enabled: boolean,
    mode: 'brush' | 'eraser' = 'brush',
    options?: {
      color?: string;
      width?: number;
      smoothness?: number;
      hardness?: number;
      softness?: number;
    },
  ): void {
    if (options?.color) this.color = options.color;
    if (options?.width) this.width = options.width;
    if (options?.smoothness !== undefined) this.smoothness = options.smoothness;
    if (options?.softness !== undefined) this.hardness = 100 - options.softness;
    if (options?.hardness !== undefined) this.hardness = options.hardness;
    this.tool = configureDrawingBrush(
      fabricCanvas,
      enabled,
      mode,
      this.color,
      this.width,
      this.smoothness,
      this.hardness,
    );
  }
}

export function alignSelectedObjects(
  fabricCanvas: FabricCanvas,
  pageDimensions: Dimensions,
  alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom',
  onComplete: () => void,
  target?: 'artboard' | 'selection',
): void {
  const active = fabricCanvas.getActiveObject();
  if (!active) return;

  const { width: artboardW, height: artboardH } = pageDimensions;
  const artboardCenterX = artboardW / 2,
    artboardMiddleY = artboardH / 2;

  if (active.type === 'activeselection') {
    const activeSel = active as ActiveSelection;
    const objects = [...activeSel.getObjects()];
    if (objects.length < 2) return;

    fabricCanvas.discardActiveObject();
    const items = objects.map((obj) => ({ obj, bounds: getObjectCanvasBounds(obj) }));

    const groupMinX = Math.min(...items.map((i) => i.bounds.minX)),
      groupMaxX = Math.max(...items.map((i) => i.bounds.maxX));
    const groupMinY = Math.min(...items.map((i) => i.bounds.minY)),
      groupMaxY = Math.max(...items.map((i) => i.bounds.maxY));
    const groupCenterX = (groupMinX + groupMaxX) / 2,
      groupMiddleY = (groupMinY + groupMaxY) / 2;

    if (target === 'artboard') {
      let deltaX = 0;
      let deltaY = 0;
      switch (alignment) {
        case 'left':
          deltaX = 0 - groupMinX;
          break;
        case 'center':
          deltaX = Math.round(artboardCenterX - groupCenterX);
          break;
        case 'right':
          deltaX = Math.round(artboardW - groupMaxX);
          break;
        case 'top':
          deltaY = 0 - groupMinY;
          break;
        case 'middle':
          deltaY = Math.round(artboardMiddleY - groupMiddleY);
          break;
        case 'bottom':
          deltaY = Math.round(artboardH - groupMaxY);
          break;
      }
      items.forEach(({ obj }) => {
        if (deltaX !== 0) obj.set('left', (obj.left ?? 0) + deltaX);
        if (deltaY !== 0) obj.set('top', (obj.top ?? 0) + deltaY);
        obj.setCoords();
      });
    } else {
      items.forEach(({ obj, bounds }) => {
        switch (alignment) {
          case 'left':
            obj.set('left', (obj.left ?? 0) + (groupMinX - bounds.minX));
            break;
          case 'center':
            obj.set('left', (obj.left ?? 0) + Math.round(groupCenterX - bounds.centerX));
            break;
          case 'right':
            obj.set('left', (obj.left ?? 0) + Math.round(groupMaxX - bounds.maxX));
            break;
          case 'top':
            obj.set('top', (obj.top ?? 0) + (groupMinY - bounds.minY));
            break;
          case 'middle':
            obj.set('top', (obj.top ?? 0) + Math.round(groupMiddleY - bounds.middleY));
            break;
          case 'bottom':
            obj.set('top', (obj.top ?? 0) + Math.round(groupMaxY - bounds.maxY));
            break;
        }
        obj.setCoords();
      });
    }

    const newSelection = new ActiveSelection(objects, { canvas: fabricCanvas });
    fabricCanvas.setActiveObject(newSelection);
  } else {
    const b = getObjectCanvasBounds(active);
    switch (alignment) {
      case 'left':
        active.set('left', (active.left ?? 0) + (0 - b.minX));
        break;
      case 'center':
        active.set('left', (active.left ?? 0) + Math.round(artboardCenterX - b.centerX));
        break;
      case 'right':
        active.set('left', (active.left ?? 0) + Math.round(artboardW - b.maxX));
        break;
      case 'top':
        active.set('top', (active.top ?? 0) + (0 - b.minY));
        break;
      case 'middle':
        active.set('top', (active.top ?? 0) + Math.round(artboardMiddleY - b.middleY));
        break;
      case 'bottom':
        active.set('top', (active.top ?? 0) + Math.round(artboardH - b.maxY));
        break;
    }
    active.setCoords();
  }

  fabricCanvas.requestRenderAll();
  onComplete();
}

export function distributeSelectedObjects(
  fabricCanvas: FabricCanvas,
  direction: 'horizontal' | 'vertical',
  onComplete: () => void,
): void {
  const active = fabricCanvas.getActiveObject();
  if (!active || active.type !== 'activeselection') return;

  const activeSel = active as ActiveSelection;
  const objects = [...activeSel.getObjects()];
  if (objects.length < 3) return;

  fabricCanvas.discardActiveObject();

  if (direction === 'horizontal') {
    objects.sort((a, b) => getObjectCanvasBounds(a).minX - getObjectCanvasBounds(b).minX);
    const boundsList = objects.map((o) => getObjectCanvasBounds(o));
    const first = boundsList[0]!;
    const last = boundsList[boundsList.length - 1]!;
    const totalSpan = last.maxX - first.minX;
    const totalObjWidth = boundsList.reduce((sum, b) => sum + b.width, 0);
    const space = (totalSpan - totalObjWidth) / (objects.length - 1);

    let currentX = first.minX;
    objects.forEach((obj, idx) => {
      const b = boundsList[idx]!;
      const dx = currentX - b.minX;
      obj.set('left', (obj.left ?? 0) + dx);
      obj.setCoords();
      currentX += b.width + space;
    });
  } else {
    objects.sort((a, b) => getObjectCanvasBounds(a).minY - getObjectCanvasBounds(b).minY);
    const boundsList = objects.map((o) => getObjectCanvasBounds(o));
    const first = boundsList[0]!;
    const last = boundsList[boundsList.length - 1]!;
    const totalSpan = last.maxY - first.minY;
    const totalObjHeight = boundsList.reduce((sum, b) => sum + b.height, 0);
    const space = (totalSpan - totalObjHeight) / (objects.length - 1);

    let currentY = first.minY;
    objects.forEach((obj, idx) => {
      const b = boundsList[idx]!;
      const dy = currentY - b.minY;
      obj.set('top', (obj.top ?? 0) + dy);
      obj.setCoords();
      currentY += b.height + space;
    });
  }

  const newSelection = new ActiveSelection(objects, { canvas: fabricCanvas });
  fabricCanvas.setActiveObject(newSelection);
  fabricCanvas.requestRenderAll();
  onComplete();
}
