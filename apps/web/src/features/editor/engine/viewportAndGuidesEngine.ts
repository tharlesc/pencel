import {
  isObjectBleedingOutsideArtboard,
  screenToArtboard,
  type Point2D,
} from '@pencel/editor-core';
import type { Dimensions } from '@pencel/shared-types';
import { Canvas as FabricCanvas, FabricObject } from 'fabric';
import { createElementId } from '../../../shared/lib/idUtils.js';
import type { CanvasAdapterConfig } from './adapterTypes.js';

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

  const objects = fabricCanvas.getObjects();
  for (const obj of objects) {
    if (obj.visible === false) continue;
    const left = obj.left ?? 0;
    const top = obj.top ?? 0;
    const w = (obj.width ?? 0) * (obj.scaleX ?? 1);
    const h = (obj.height ?? 0) * (obj.scaleY ?? 1);

    if (
      isObjectBleedingOutsideArtboard({ x: left, y: top, width: w, height: h }, pageDimensions) &&
      typeof ctx.strokeRect === 'function'
    ) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 102, 204, 0.38)';
      ctx.lineWidth = 1;
      if (typeof ctx.setLineDash === 'function') {
        ctx.setLineDash([4, 4]);
      }
      ctx.strokeRect(scaledMargin + left * scale, scaledMargin + top * scale, w * scale, h * scale);
      ctx.restore();
    }
  }

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
  readonly onAfterRender: () => void;
}

export function attachCanvasInteractiveListeners(
  canvas: FabricCanvas,
  ctx: InteractiveListenerContext,
): void {
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
      path.set({
        globalCompositeOperation: 'destination-out',
        name: createElementId('eraser'),
      });
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
