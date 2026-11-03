import type { Dimensions } from '@pencel/shared-types';
import type { Canvas as FabricCanvas } from 'fabric';
import type { LayerItem } from './adapterTypes.js';
import * as layerGroup from './layerAndGroupEngine.js';

export interface LayerFacadeContext {
  getCanvas: () => FabricCanvas | null;
  getDimensions: () => Dimensions;
  onCommit: () => void;
  onCommitSel: () => void;
  onSelClear: () => void;
  onSelUpdate: () => void;
  onCanvasChange: () => void;
}

export class CanvasLayerFacade {
  constructor(private readonly ctx: LayerFacadeContext) {}

  public getLayers(): readonly LayerItem[] {
    const canvas = this.ctx.getCanvas();
    return canvas ? layerGroup.getCanvasLayers(canvas) : [];
  }

  public bringForward(): void {
    const canvas = this.ctx.getCanvas();
    if (canvas) layerGroup.bringLayerForward(canvas, this.ctx.onCanvasChange);
  }

  public sendBackward(): void {
    const canvas = this.ctx.getCanvas();
    if (canvas) layerGroup.sendLayerBackward(canvas, this.ctx.onCanvasChange);
  }

  public toggleVisibility(name: string): void {
    const canvas = this.ctx.getCanvas();
    if (canvas)
      layerGroup.toggleLayerVisibilityOnCanvas(
        canvas,
        name,
        this.ctx.onSelClear,
        this.ctx.onCommit,
      );
  }

  public toggleLock(name: string): void {
    const canvas = this.ctx.getCanvas();
    if (canvas) layerGroup.toggleLayerLockOnCanvas(canvas, name, this.ctx.onCommit);
  }

  public setOpacity(name: string, opacity: number): void {
    const canvas = this.ctx.getCanvas();
    if (canvas) layerGroup.setLayerOpacityOnCanvas(canvas, name, opacity, this.ctx.onCommit);
  }

  public setBlendMode(name: string, blendMode: string): void {
    const canvas = this.ctx.getCanvas();
    if (canvas) layerGroup.setLayerBlendModeOnCanvas(canvas, name, blendMode, this.ctx.onCommit);
  }

  public rename(oldName: string, newName: string): void {
    const canvas = this.ctx.getCanvas();
    if (canvas) layerGroup.renameLayerOnCanvas(canvas, oldName, newName, this.ctx.onCommit);
  }

  public reorder(name: string, direction: 'up' | 'down'): void {
    const canvas = this.ctx.getCanvas();
    if (canvas) layerGroup.reorderLayerOnCanvas(canvas, name, direction, this.ctx.onCommit);
  }

  public reorderToIndex(name: string, targetVisualIndex: number): void {
    const canvas = this.ctx.getCanvas();
    if (canvas)
      layerGroup.reorderLayerToIndexOnCanvas(canvas, name, targetVisualIndex, this.ctx.onCommit);
  }

  public createGroup(name?: string): void {
    const canvas = this.ctx.getCanvas();
    if (canvas)
      layerGroup.createGroupOnCanvas(canvas, this.ctx.getDimensions(), name, this.ctx.onCommitSel);
  }

  public ungroupSelected(): void {
    const canvas = this.ctx.getCanvas();
    if (canvas) layerGroup.ungroupSelectedOnCanvas(canvas, this.ctx.onCommitSel);
  }

  public addCleanLayer(name?: string): void {
    const canvas = this.ctx.getCanvas();
    if (canvas)
      layerGroup.addCleanLayerToCanvas(
        canvas,
        this.ctx.getDimensions(),
        name,
        this.ctx.onCommitSel,
      );
  }

  public assignToGroup(layerName: string, groupName: string | null): void {
    const canvas = this.ctx.getCanvas();
    if (canvas)
      layerGroup.assignLayerToGroupOnCanvas(canvas, layerName, groupName, this.ctx.onCommitSel);
  }

  public deleteByName(name: string): void {
    const canvas = this.ctx.getCanvas();
    if (canvas)
      layerGroup.deleteLayerByNameOnCanvas(canvas, name, this.ctx.onSelClear, this.ctx.onCommit);
  }

  public selectByName(name: string): void {
    const canvas = this.ctx.getCanvas();
    if (canvas)
      layerGroup.selectObjectByNameOnCanvas(
        canvas,
        name,
        this.ctx.onSelUpdate,
        this.ctx.onCanvasChange,
      );
  }

  public selectByNames(names: readonly string[]): void {
    const canvas = this.ctx.getCanvas();
    if (canvas)
      layerGroup.selectObjectsByNamesOnCanvas(
        canvas,
        names,
        this.ctx.onSelUpdate,
        this.ctx.onSelClear,
        this.ctx.onCanvasChange,
      );
  }
}
