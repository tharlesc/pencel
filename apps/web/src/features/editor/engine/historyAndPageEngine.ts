import type { Dimensions } from '@pencel/shared-types';
import type { Canvas as FabricCanvas, TMat2D } from 'fabric';
import type { CanvasAdapterConfig } from './adapterTypes.js';

export class CanvasHistoryState {
  public stack: string[] = [];
  public index = -1;
  public locked = false;
  private readonly maxStates = 30;

  public reset(): void {
    this.stack = [];
    this.index = -1;
    this.locked = false;
  }

  public save(fabricCanvas: FabricCanvas | null): void {
    if (!fabricCanvas || this.locked) return;
    try {
      const json = JSON.stringify(fabricCanvas.toJSON());
      if (this.index < this.stack.length - 1) {
        this.stack = this.stack.slice(0, this.index + 1);
      }
      this.stack.push(json);
      if (this.stack.length > this.maxStates) {
        this.stack.shift();
      }
      this.index = this.stack.length - 1;
    } catch {
      // Ignored in headless/test environments
    }
  }

  public canUndo(): boolean {
    return this.index > 0;
  }

  public canRedo(): boolean {
    return this.index < this.stack.length - 1;
  }

  public async loadState(
    fabricCanvas: FabricCanvas,
    json: string,
    onLoaded: () => void,
  ): Promise<void> {
    this.locked = true;
    try {
      await fabricCanvas.loadFromJSON(JSON.parse(json));
      fabricCanvas.requestRenderAll();
      onLoaded();
    } finally {
      this.locked = false;
    }
  }
}

export class CanvasHistoryManager {
  public readonly history = new CanvasHistoryState();

  public reset(): void {
    this.history.reset();
  }

  public save(canvas: FabricCanvas | null): void {
    this.history.save(canvas);
  }

  public isLocked(): boolean {
    return this.history.locked;
  }

  public canUndo(): boolean {
    return this.history.canUndo();
  }

  public canRedo(): boolean {
    return this.history.canRedo();
  }

  public async undo(canvas: FabricCanvas, onLoaded: () => void): Promise<void> {
    if (!this.canUndo()) return;
    const target = this.history.stack[--this.history.index];
    if (target) await this.history.loadState(canvas, target, onLoaded);
  }

  public async redo(canvas: FabricCanvas, onLoaded: () => void): Promise<void> {
    if (!this.canRedo()) return;
    const target = this.history.stack[++this.history.index];
    if (target) await this.history.loadState(canvas, target, onLoaded);
  }

  public async loadJson(canvas: FabricCanvas, json: string, onLoaded: () => void): Promise<void> {
    await this.history.loadState(canvas, json, onLoaded);
  }
}

export function exportCanvasDataUrl(
  fabricCanvas: FabricCanvas,
  pageDimensions: Dimensions,
  backgroundColor: string,
  _currentScale: number,
  _bleedMargin: number,
  format: 'png' | 'jpeg',
  quality: number,
  maxDimension?: number,
  scaleFactor = 1,
  transparentBackground = false,
): string {
  const mult = scaleFactor > 0 ? scaleFactor : 1;
  let outW = Math.round(pageDimensions.width * mult);
  let outH = Math.round(pageDimensions.height * mult);

  if (maxDimension && maxDimension > 0) {
    const aspect = pageDimensions.width / Math.max(1, pageDimensions.height);
    if (aspect >= 1) {
      outW = Math.min(maxDimension, outW);
      outH = Math.max(1, Math.round(outW / aspect));
    } else {
      outH = Math.min(maxDimension, outH);
      outW = Math.max(1, Math.round(outH * aspect));
    }
  }

  const exportZoom = outW / Math.max(1, pageDimensions.width);

  // Preserve original interactive canvas configuration
  const origTransform = fabricCanvas.viewportTransform
    ? ([...fabricCanvas.viewportTransform] as unknown as TMat2D)
    : null;
  const origW = fabricCanvas.getWidth();
  const origH = fabricCanvas.getHeight();
  const activeObj = fabricCanvas.getActiveObject();

  if (activeObj) {
    fabricCanvas.discardActiveObject();
  }

  // Set canvas dimensions and zoom directly to the target resolution
  fabricCanvas.setDimensions({ width: outW, height: outH });
  fabricCanvas.setViewportTransform([exportZoom, 0, 0, exportZoom, 0, 0]);

  // Synchronously render the scene at full output resolution
  fabricCanvas.renderAll();

  let dataUrl = '';
  const isTransparent = transparentBackground && format === 'png';

  if (isTransparent) {
    dataUrl = fabricCanvas.toDataURL({
      format: 'png',
      quality,
      multiplier: 1,
    });
  } else {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = outW;
    offCanvas.height = outH;
    const ctx = offCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = backgroundColor || '#FFFFFF';
      ctx.fillRect(0, 0, outW, outH);
      const lower = fabricCanvas.lowerCanvasEl || fabricCanvas.getElement();
      if (lower) {
        ctx.drawImage(lower, 0, 0, outW, outH);
      }
      dataUrl = offCanvas.toDataURL(format === 'jpeg' ? 'image/jpeg' : 'image/png', quality);
    }
  }

  // Restore interactive canvas state
  if (origTransform) {
    fabricCanvas.setDimensions({ width: origW, height: origH });
    fabricCanvas.setViewportTransform(origTransform);
  }
  if (activeObj) {
    fabricCanvas.setActiveObject(activeObj);
  }
  fabricCanvas.requestRenderAll();

  return dataUrl;
}

export function exportCanvasSvg(fabricCanvas: FabricCanvas, dimensions: Dimensions): string {
  return fabricCanvas.toSVG({
    width: `${dimensions.width}px`,
    height: `${dimensions.height}px`,
  });
}

export class CanvasPageStore {
  public states = new Map<string, string>();
  public activePageId = 'page-1';

  public switchPage(
    fabricCanvas: FabricCanvas,
    newPageId: string,
    initialConfig: CanvasAdapterConfig | undefined,
    loadJsonState: (json: string) => Promise<void>,
    clearObjects: () => void,
    syncViewport: (config: CanvasAdapterConfig) => void,
  ): void {
    if (this.activePageId === newPageId) return;
    try {
      this.states.set(this.activePageId, JSON.stringify(fabricCanvas.toJSON()));
    } catch {
      // Ignore
    }
    this.activePageId = newPageId;
    const savedState = this.states.get(newPageId);
    if (savedState) {
      void loadJsonState(savedState);
    } else {
      clearObjects();
      if (initialConfig) syncViewport(initialConfig);
    }
  }

  public removePage(pageId: string): void {
    this.states.delete(pageId);
  }

  public duplicatePage(sourcePageId: string, targetPageId: string): void {
    const state = this.states.get(sourcePageId);
    if (state) this.states.set(targetPageId, state);
  }
}
