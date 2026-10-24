import type { Dimensions } from '@pencel/shared-types';
import type { Canvas as FabricCanvas } from 'fabric';

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

export function exportCanvasDataUrl(
  fabricCanvas: FabricCanvas,
  pageDimensions: Dimensions,
  backgroundColor: string,
  currentScale: number,
  bleedMargin: number,
  format: 'png' | 'jpeg',
  quality: number,
): string {
  const scale = currentScale || 1;
  const scaledMargin = Math.round(bleedMargin * scale);
  const scaledWidth = Math.round(pageDimensions.width * scale);
  const scaledHeight = Math.round(pageDimensions.height * scale);

  const offCanvas = document.createElement('canvas');
  offCanvas.width = pageDimensions.width;
  offCanvas.height = pageDimensions.height;
  const ctx = offCanvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = backgroundColor || '#FBFBFD';
  ctx.fillRect(0, 0, pageDimensions.width, pageDimensions.height);

  const src = fabricCanvas.lowerCanvasEl || fabricCanvas.getElement();
  if (src) {
    ctx.drawImage(
      src,
      scaledMargin,
      scaledMargin,
      scaledWidth,
      scaledHeight,
      0,
      0,
      pageDimensions.width,
      pageDimensions.height,
    );
  }

  return offCanvas.toDataURL(format === 'jpeg' ? 'image/jpeg' : 'image/png', quality);
}
