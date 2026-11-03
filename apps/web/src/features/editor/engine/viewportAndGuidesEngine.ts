import { screenToArtboard, type Point2D } from '@pencel/editor-core';
import type { Dimensions } from '@pencel/shared-types';
import {
  Canvas as FabricCanvas,
  classRegistry,
  FabricObject,
  Path as FabricPath,
  Point as FabricPoint,
  util as fabricUtil,
  type TMat2D,
} from 'fabric';
import { createElementId } from '../../../shared/lib/idUtils.js';
import type { CanvasAdapterConfig } from './adapterTypes.js';
import { exportCanvasDataUrl, exportCanvasSvg } from './historyAndPageEngine.js';

export interface EraserStrokeData {
  readonly path: readonly (readonly (string | number)[])[];
  readonly width: number;
}

export class EraserMask extends FabricObject {
  static override type = 'EraserMask';
  public strokes: EraserStrokeData[] = [];

  constructor(options?: Record<string, unknown>) {
    super({
      left: 0,
      top: 0,
      originX: 'center',
      originY: 'center',
      strokeWidth: 0,
      width: 0,
      height: 0,
      inverted: true,
      absolutePositioned: false,
      ...options,
    });
    if (Array.isArray(options?.strokes)) {
      this.strokes = [...(options.strokes as EraserStrokeData[])];
    }
  }

  public addStroke(path: readonly (readonly (string | number)[])[], width: number): void {
    this.strokes.push({ path, width });
    this.dirty = true;
  }

  override drawObject(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const stroke of this.strokes) {
      ctx.beginPath();
      for (const cmd of stroke.path) {
        const type = cmd[0];
        if (type === 'M') {
          ctx.moveTo(Number(cmd[1]), Number(cmd[2]));
        } else if (type === 'L') {
          ctx.lineTo(Number(cmd[1]), Number(cmd[2]));
        } else if (type === 'Q') {
          ctx.quadraticCurveTo(Number(cmd[1]), Number(cmd[2]), Number(cmd[3]), Number(cmd[4]));
        } else if (type === 'C') {
          ctx.bezierCurveTo(
            Number(cmd[1]),
            Number(cmd[2]),
            Number(cmd[3]),
            Number(cmd[4]),
            Number(cmd[5]),
            Number(cmd[6]),
          );
        } else if (type === 'Z') {
          ctx.closePath();
        }
      }
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = stroke.width || 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
    ctx.restore();
  }

  override toObject(propertiesToInclude?: string[]): Record<string, unknown> {
    return {
      ...super.toObject(propertiesToInclude),
      type: EraserMask.type,
      strokes: this.strokes,
    };
  }

  static override async fromObject(object: Record<string, unknown>): Promise<EraserMask> {
    return new EraserMask(object);
  }
}

classRegistry.setClass(EraserMask, 'EraserMask');

export function transformPathCommandsToLocal(
  pathCommands: readonly (readonly (string | number)[])[],
  targetTransformMatrix: TMat2D,
): (string | number)[][] {
  const inv = fabricUtil.invertTransform(targetTransformMatrix);
  return pathCommands.map((cmd) => {
    const type = cmd[0];
    if (type === 'M' || type === 'L') {
      const p = fabricUtil.transformPoint(new FabricPoint(Number(cmd[1]), Number(cmd[2])), inv);
      return [type, p.x, p.y];
    }
    if (type === 'Q') {
      const cp = fabricUtil.transformPoint(new FabricPoint(Number(cmd[1]), Number(cmd[2])), inv);
      const p = fabricUtil.transformPoint(new FabricPoint(Number(cmd[3]), Number(cmd[4])), inv);
      return [type, cp.x, cp.y, p.x, p.y];
    }
    if (type === 'C') {
      const cp1 = fabricUtil.transformPoint(new FabricPoint(Number(cmd[1]), Number(cmd[2])), inv);
      const cp2 = fabricUtil.transformPoint(new FabricPoint(Number(cmd[3]), Number(cmd[4])), inv);
      const p = fabricUtil.transformPoint(new FabricPoint(Number(cmd[5]), Number(cmd[6])), inv);
      return [type, cp1.x, cp1.y, cp2.x, cp2.y, p.x, p.y];
    }
    return [...cmd];
  });
}

export function createConfiguredFabricCanvas(
  canvasElement: HTMLCanvasElement,
  config: CanvasAdapterConfig,
  bleedMargin: number,
  listenerCtx: InteractiveListenerContext,
): FabricCanvas | null {
  let context2d: RenderingContext | null;
  try {
    context2d = canvasElement.getContext('2d');
  } catch {
    context2d = null;
  }

  if (!context2d) return null;

  FabricObject.ownDefaults.originX = 'left';
  FabricObject.ownDefaults.originY = 'top';
  FabricObject.ownDefaults.borderColor = '#0066CC';
  FabricObject.ownDefaults.cornerColor = '#FBFBFD';
  FabricObject.ownDefaults.cornerStrokeColor = '#0066CC';
  FabricObject.ownDefaults.cornerStyle = 'circle';
  FabricObject.ownDefaults.cornerSize = 10;
  FabricObject.ownDefaults.transparentCorners = false;
  FabricObject.ownDefaults.borderScaleFactor = 1.5;

  const scale = config.displayScale;
  const scaledWidth = Math.max(1, Math.round(config.dimensions.width * scale));
  const scaledHeight = Math.max(1, Math.round(config.dimensions.height * scale));
  const scaledMargin = Math.round(bleedMargin * scale);

  const canvas = new FabricCanvas(canvasElement, {
    width: scaledWidth + 2 * scaledMargin,
    height: scaledHeight + 2 * scaledMargin,
    backgroundColor: 'transparent',
    selection: true,
    preserveObjectStacking: true,
    renderOnAddRemove: true,
    imageSmoothingEnabled: true,
    controlsAboveOverlay: true,
  });

  canvas.setViewportTransform([scale, 0, 0, scale, scaledMargin, scaledMargin]);
  attachCanvasInteractiveListeners(canvas, listenerCtx);
  return canvas;
}

export function renderArtboardBackground(
  fabricCanvas: FabricCanvas,
  pageDimensions: Dimensions,
  backgroundColor: string,
): void {
  const ctx = fabricCanvas.getContext();
  if (!ctx || typeof ctx.save !== 'function') return;

  const v = fabricCanvas.viewportTransform || [1, 0, 0, 1, 0, 0];
  ctx.save();
  ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);
  ctx.fillStyle = backgroundColor || '#FFFFFF';
  ctx.fillRect(0, 0, pageDimensions.width, pageDimensions.height);
  ctx.restore();
}

export function renderArtboardClipAndPasteboardControls(
  fabricCanvas: FabricCanvas,
  pageDimensions: Dimensions,
  currentScale: number,
  bleedMargin: number,
  clipToArtboard: boolean,
): void {
  const ctx = fabricCanvas.getContext();
  if (!ctx || typeof ctx.clearRect !== 'function' || typeof ctx.save !== 'function') return;

  const scale = currentScale || 1;
  const scaledWidth = Math.max(1, Math.round(pageDimensions.width * scale));
  const scaledHeight = Math.max(1, Math.round(pageDimensions.height * scale));
  const scaledMargin = Math.round(bleedMargin * scale);
  const totalW = scaledWidth + 2 * scaledMargin;

  if (!clipToArtboard) return;

  ctx.clearRect(0, 0, totalW, scaledMargin);
  ctx.clearRect(0, scaledMargin + scaledHeight, totalW, scaledMargin);
  ctx.clearRect(0, scaledMargin, scaledMargin, scaledHeight);
  ctx.clearRect(scaledMargin + scaledWidth, scaledMargin, scaledMargin, scaledHeight);

  const active = fabricCanvas.getActiveObject();
  if (active && typeof fabricCanvas.drawControls === 'function') {
    ctx.save();
    fabricCanvas.drawControls(ctx);
    ctx.restore();
  }
}

export function computeScreenPointToArtboard(
  fabricCanvas: FabricCanvas | null,
  currentScale: number,
  bleedMargin: number,
  clientX: number,
  clientY: number,
): Point2D {
  const el = fabricCanvas?.upperCanvasEl ?? fabricCanvas?.getElement();
  const rect = el ? el.getBoundingClientRect() : { left: 0, top: 0 };
  const scale = currentScale || 1;
  const scaledMargin = Math.round(bleedMargin * scale);

  return screenToArtboard(
    { x: clientX, y: clientY },
    {
      artboardOffset: { x: 0, y: 0 },
      viewportZoom: scale,
      viewportPan: { x: scaledMargin, y: scaledMargin },
      canvasScreenRect: { left: rect.left, top: rect.top },
    },
  );
}

export function syncCanvasViewport(
  fabricCanvas: FabricCanvas,
  config: CanvasAdapterConfig,
  bleedMargin: number,
): void {
  const scale = config.displayScale;
  const scaledWidth = Math.max(1, Math.round(config.dimensions.width * scale));
  const scaledHeight = Math.max(1, Math.round(config.dimensions.height * scale));
  const scaledMargin = Math.round(bleedMargin * scale);

  fabricCanvas.setDimensions({
    width: scaledWidth + 2 * scaledMargin,
    height: scaledHeight + 2 * scaledMargin,
  });
  fabricCanvas.setViewportTransform([scale, 0, 0, scale, scaledMargin, scaledMargin]);
  fabricCanvas.backgroundColor = 'transparent';
  fabricCanvas.requestRenderAll();
}

export interface InteractiveListenerContext {
  readonly getPageDimensions: () => Dimensions;
  readonly getDrawingTool: () => 'none' | 'brush' | 'eraser';
  readonly isHistoryLocked: () => boolean;
  readonly onSelectionUpdate: () => void;
  readonly onSelectionCleared: () => void;
  readonly onSaveHistory: () => void;
  readonly onCanvasChange: () => void;
  readonly onBeforeRender?: () => void;
  readonly onAfterRender: () => void;
}

export function attachCanvasInteractiveListeners(
  canvas: FabricCanvas,
  ctx: InteractiveListenerContext,
): void {
  canvas.on('before:render', () => {
    ctx.onBeforeRender?.();
  });

  canvas.on('after:render', () => {
    ctx.onAfterRender();
  });

  canvas.on('selection:created', () => ctx.onSelectionUpdate());
  canvas.on('selection:updated', () => ctx.onSelectionUpdate());
  canvas.on('selection:cleared', () => ctx.onSelectionCleared());
  canvas.on('object:modified', () => {
    ctx.onSelectionUpdate();
    ctx.onSaveHistory();
    ctx.onCanvasChange();
  });
  canvas.on('text:changed', () => {
    ctx.onSelectionUpdate();
    ctx.onCanvasChange();
  });
  canvas.on('object:added', () => {
    if (!ctx.isHistoryLocked()) {
      ctx.onSaveHistory();
      ctx.onCanvasChange();
    }
  });
  canvas.on('object:removed', () => {
    if (!ctx.isHistoryLocked()) {
      ctx.onSaveHistory();
      ctx.onCanvasChange();
    }
  });

  canvas.on('path:created', (e) => {
    const path = (e as { path?: FabricObject }).path;
    if (!path) return;
    if (ctx.getDrawingTool() === 'eraser') {
      const eraserPath = path as FabricPath;
      const eraserBounds = path.getBoundingRect();
      const rawCommands = eraserPath.path;
      const strokeWidth = eraserPath.strokeWidth || 8;

      if (rawCommands && rawCommands.length > 0) {
        for (const obj of canvas.getObjects()) {
          if (obj === path) continue;
          const name = (obj.get('name') as string) || '';
          if (name.startsWith('brush') || name.startsWith('vector-path')) {
            const objBounds = obj.getBoundingRect();
            const overlaps = !(
              eraserBounds.left > objBounds.left + objBounds.width ||
              eraserBounds.left + eraserBounds.width < objBounds.left ||
              eraserBounds.top > objBounds.top + objBounds.height ||
              eraserBounds.top + eraserBounds.height < objBounds.top
            );
            if (overlaps) {
              const localCommands = transformPathCommandsToLocal(
                rawCommands,
                obj.calcTransformMatrix(),
              );
              const effectiveScale = (obj.scaleX + obj.scaleY) / 2 || 1;
              const localWidth = Math.max(1, strokeWidth / effectiveScale);

              let mask = obj.clipPath as EraserMask | undefined;
              if (!mask || !(mask instanceof EraserMask)) {
                mask = new EraserMask();
                obj.clipPath = mask;
              }
              mask.addStroke(localCommands, localWidth);
              obj.objectCaching = true;
              obj.dirty = true;
            }
          }
        }
      }
      canvas.remove(path);
      canvas.requestRenderAll();
    } else {
      path.set({
        name: createElementId('brush'),
      });
    }
    ctx.onSaveHistory();
    ctx.onCanvasChange();
  });

  canvas.on('mouse:down', (e) => {
    const target = e.target;
    if (target && target.get('isGroup')) {
      target.set('_origLeft', target.left || 0);
      target.set('_origTop', target.top || 0);
      const groupName = target.get('name') as string;
      const members = canvas
        .getObjects()
        .filter((o) => o.get('groupName') === groupName && !o.get('isGroup'));
      members.forEach((m) => {
        m.set('_origLeft', m.left || 0);
        m.set('_origTop', m.top || 0);
      });
    }
  });

  canvas.on('object:moving', (e) => {
    const target = e.target;
    if (!target) return;

    if (target.get('isGroup')) {
      const groupName = target.get('name') as string;
      const origLeft = (target.get('_origLeft') as number) ?? (target.left || 0);
      const origTop = (target.get('_origTop') as number) ?? (target.top || 0);
      const dx = (target.left || 0) - origLeft;
      const dy = (target.top || 0) - origTop;

      const members = canvas
        .getObjects()
        .filter((o) => o.get('groupName') === groupName && !o.get('isGroup'));
      members.forEach((m) => {
        const mOrigLeft = (m.get('_origLeft') as number) ?? (m.left || 0);
        const mOrigTop = (m.get('_origTop') as number) ?? (m.top || 0);
        m.set({ left: mOrigLeft + dx, top: mOrigTop + dy });
        m.setCoords();
      });
    }

    const pageDimensions = ctx.getPageDimensions();
    const snapDist = 6;
    const w = (target.width || 0) * (target.scaleX || 1);
    const h = (target.height || 0) * (target.scaleY || 1);
    const artboardW = pageDimensions.width;
    const artboardH = pageDimensions.height;

    const targetCenterX = (target.left || 0) + w / 2;
    const artboardCenterX = artboardW / 2;
    if (Math.abs(targetCenterX - artboardCenterX) < snapDist) {
      target.set('left', Math.round(artboardCenterX - w / 2));
    } else if (Math.abs(target.left || 0) < snapDist) {
      target.set('left', 0);
    } else if (Math.abs((target.left || 0) + w - artboardW) < snapDist) {
      target.set('left', Math.round(artboardW - w));
    }

    const targetCenterY = (target.top || 0) + h / 2;
    const artboardCenterY = artboardH / 2;
    if (Math.abs(targetCenterY - artboardCenterY) < snapDist) {
      target.set('top', Math.round(artboardCenterY - h / 2));
    } else if (Math.abs(target.top || 0) < snapDist) {
      target.set('top', 0);
    } else if (Math.abs((target.top || 0) + h - artboardH) < snapDist) {
      target.set('top', Math.round(artboardH - h));
    }
  });
}

export function computeDynamicBleedMargin(dimensions: Dimensions): number {
  return Math.max(1200, Math.round(Math.max(dimensions.width, dimensions.height) * 1.5));
}

export class ViewportManager {
  public currentScale = 1;
  public pageDimensions: Dimensions = { width: 1080, height: 1080 };
  public backgroundColor = '#FBFBFD';
  public clipToArtboard = true;

  public get bleedMargin(): number {
    return computeDynamicBleedMargin(this.pageDimensions);
  }

  public screenPointToArtboard(
    canvas: FabricCanvas | null,
    clientX: number,
    clientY: number,
  ): Point2D {
    return computeScreenPointToArtboard(
      canvas,
      this.currentScale,
      this.bleedMargin,
      clientX,
      clientY,
    );
  }

  public sync(canvas: FabricCanvas | null, config: CanvasAdapterConfig): void {
    if (!canvas) return;
    this.pageDimensions = config.dimensions;
    this.currentScale = config.displayScale;
    this.backgroundColor = config.backgroundColor;
    syncCanvasViewport(canvas, config, this.bleedMargin);
  }

  public exportDataUrl(
    canvas: FabricCanvas | null,
    format: 'png' | 'jpeg' = 'png',
    quality = 0.95,
    maxDimension?: number,
  ): string {
    if (!canvas) return '';
    return exportCanvasDataUrl(
      canvas,
      this.pageDimensions,
      this.backgroundColor,
      this.currentScale,
      this.bleedMargin,
      format,
      quality,
      maxDimension,
    );
  }

  public exportSvg(canvas: FabricCanvas | null): string {
    return canvas ? exportCanvasSvg(canvas, this.pageDimensions) : '';
  }
}
