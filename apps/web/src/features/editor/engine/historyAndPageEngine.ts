import type { Dimensions } from '@pencel/shared-types';
import type { Canvas as FabricCanvas } from 'fabric';
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
  currentScale: number,
  bleedMargin: number,
  format: 'png' | 'jpeg',
  quality: number,
  maxDimension?: number,
): string {
  const scale = currentScale || 1;
  const scaledMargin = Math.round(bleedMargin * scale);
  const scaledWidth = Math.max(1, Math.round(pageDimensions.width * scale));
  const scaledHeight = Math.max(1, Math.round(pageDimensions.height * scale));

  let outW = pageDimensions.width;
  let outH = pageDimensions.height;

  if (maxDimension && maxDimension > 0) {
    const aspect = pageDimensions.width / Math.max(1, pageDimensions.height);
    if (aspect >= 1) {
      outW = Math.min(maxDimension, pageDimensions.width);
      outH = Math.max(1, Math.round(outW / aspect));
    } else {
      outH = Math.min(maxDimension, pageDimensions.height);
      outW = Math.max(1, Math.round(outH * aspect));
    }
  }

  const offCanvas = document.createElement('canvas');
  offCanvas.width = outW;
  offCanvas.height = outH;
  const ctx = offCanvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = backgroundColor || '#FFFFFF';
  ctx.fillRect(0, 0, outW, outH);

  const src = fabricCanvas.lowerCanvasEl || fabricCanvas.getElement();
  if (src) {
    const canvasLogicalWidth = fabricCanvas.width || scaledWidth + 2 * scaledMargin || 1;
    const canvasLogicalHeight = fabricCanvas.height || scaledHeight + 2 * scaledMargin || 1;
    const pixelRatioX = (src.width || 1) / canvasLogicalWidth;
    const pixelRatioY = (src.height || 1) / canvasLogicalHeight;

    const sx = Math.round(scaledMargin * pixelRatioX);
    const sy = Math.round(scaledMargin * pixelRatioY);
    const sw = Math.round(scaledWidth * pixelRatioX);
    const sh = Math.round(scaledHeight * pixelRatioY);

    ctx.drawImage(src, sx, sy, sw, sh, 0, 0, outW, outH);
  }

  return offCanvas.toDataURL(format === 'jpeg' ? 'image/jpeg' : 'image/png', quality);
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
