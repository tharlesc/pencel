import type { BooleanPathOperation, Point2D, ShapeVariant } from '@pencel/editor-core';
import type { Dimensions } from '@pencel/shared-types';
import type { Canvas as FabricCanvas } from 'fabric';
import {
  extractSelectedProperties,
  type CanvasAdapterConfig,
  type CanvasEventCallbacks,
  type LayerItem,
  type SelectedObjectProperties,
  type SelectedObjectType,
} from './adapterTypes.js';
import * as alignDraw from './alignmentAndDrawingEngine.js';
import { CanvasHistoryState, exportCanvasDataUrl } from './historyAndPageEngine.js';
import * as imgTpl from './imageAndTemplateEngine.js';
import * as layerGroup from './layerAndGroupEngine.js';
import * as shapeText from './shapeAndTextEngine.js';
import * as subjectMask from './subjectAndMaskEngine.js';
import * as viewport from './viewportAndGuidesEngine.js';

export type {
  CanvasAdapterConfig,
  CanvasEventCallbacks,
  LayerItem,
  SelectedObjectProperties,
  SelectedObjectType,
};

/**
 * Isolated facade wrapping Fabric.js (`fabric.Canvas`) and delegating to responsibility modules.
 */
export class FabricCanvasAdapter {
  private fabricCanvas: FabricCanvas | null = null;
  private isMounted = false;
  private currentScale = 1;
  private pageDimensions: Dimensions = { width: 1080, height: 1080 };
  private backgroundColor = '#FBFBFD';
  private readonly bleedMargin = 800;
  private clipToArtboard = true;
  private callbacks: CanvasEventCallbacks | null = null;
  private managedObjectUrls = new Set<string>();
  private readonly history = new CanvasHistoryState();
  private currentDrawingTool: 'none' | 'brush' | 'eraser' = 'none';
  private brushColor = '#1D1D1F';
  private brushWidth = 4;
  private pageStates = new Map<string, string>();
  private activePageId = 'page-1';

  private readonly onSelUpdate = (): void => this.handleSelectionUpdate();
  private readonly onSelClear = (): void => this.handleSelectionCleared();
  private readonly onCommit = (): void => this.commitChange();
  private readonly onCommitSel = (): void => this.commitChangeWithSelection();
  private readonly onSaveHist = (): void => this.history.save(this.fabricCanvas);
  private readonly onCanvasChg = (): void => this.callbacks?.onCanvasChange();

  public mount(
    canvasElement: HTMLCanvasElement,
    config: CanvasAdapterConfig,
    callbacks?: CanvasEventCallbacks,
  ): boolean {
    if (this.isMounted) this.dispose();

    this.callbacks = callbacks ?? null;
    this.pageDimensions = config.dimensions;
    this.currentScale = config.displayScale;
    this.backgroundColor = config.backgroundColor;

    const canvas = viewport.createConfiguredFabricCanvas(canvasElement, config, this.bleedMargin, {
      getPageDimensions: () => this.pageDimensions,
      getDrawingTool: () => this.currentDrawingTool,
      isHistoryLocked: () => this.history.locked,
      onSelectionUpdate: this.onSelUpdate,
      onSelectionCleared: this.onSelClear,
      onSaveHistory: this.onSaveHist,
      onCanvasChange: this.onCanvasChg,
      onAfterRender: () => {
        if (this.fabricCanvas) {
          viewport.renderArtboardClipAndPasteboardControls(
            this.fabricCanvas,
            this.pageDimensions,
            this.currentScale,
            this.bleedMargin,
            this.clipToArtboard,
          );
        }
      },
    });

    if (!canvas) {
      this.isMounted = false;
      return false;
    }

    this.fabricCanvas = canvas;
    this.isMounted = true;
    this.history.save(this.fabricCanvas);
    return true;
  }

  public isClipToArtboard(): boolean {
    return this.clipToArtboard;
  }

  public setClipToArtboard(enabled: boolean): void {
    this.clipToArtboard = enabled;
    this.fabricCanvas?.requestRenderAll();
  }

  public screenPointToArtboard(clientX: number, clientY: number): Point2D {
    return viewport.computeScreenPointToArtboard(
      this.fabricCanvas,
      this.currentScale,
      this.bleedMargin,
      clientX,
      clientY,
    );
  }

  public syncViewport(config: CanvasAdapterConfig): void {
    if (!this.fabricCanvas || !this.isMounted) return;
    this.pageDimensions = config.dimensions;
    this.currentScale = config.displayScale;
    this.backgroundColor = config.backgroundColor;
    viewport.syncCanvasViewport(this.fabricCanvas, config, this.bleedMargin);
  }

  public discardActiveObject(): void {
    if (!this.fabricCanvas) return;
    this.fabricCanvas.discardActiveObject();
    this.fabricCanvas.requestRenderAll();
    this.handleSelectionCleared();
  }

  private handleSelectionUpdate(): void {
    if (!this.fabricCanvas) return;
    const active = this.fabricCanvas.getActiveObject();
    this.callbacks?.onSelectionChange(active ? extractSelectedProperties(active) : null);
  }

  private handleSelectionCleared(): void {
    this.callbacks?.onSelectionChange(null);
  }

  private commitChangeWithSelection(): void {
    this.handleSelectionUpdate();
    this.history.save(this.fabricCanvas);
    this.callbacks?.onCanvasChange();
  }

  private commitChange(): void {
    this.history.save(this.fabricCanvas);
    this.callbacks?.onCanvasChange();
  }

  public addText(options: {
    text: string;
    fontSize?: number;
    fontWeight?: string | number;
    fontFamily?: string;
    fill?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    charSpacing?: number;
    lineHeight?: number;
    boxMode?: 'point' | 'area';
  }): void {
    if (!this.fabricCanvas) return;
    shapeText.addTextToCanvas(this.fabricCanvas, this.pageDimensions, options, this.onSelUpdate);
  }

  public addShape(options: {
    shapeVariant: ShapeVariant;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  }): void {
    if (!this.fabricCanvas) return;
    shapeText.addShapeToCanvas(this.fabricCanvas, this.pageDimensions, options, this.onSelUpdate);
  }

  public async addImageFromUrl(url: string, altText = 'Imagem'): Promise<void> {
    if (!this.fabricCanvas || !url) return;
    await imgTpl.addImageFromUrlToCanvas(
      this.fabricCanvas,
      this.pageDimensions,
      this.managedObjectUrls,
      url,
      altText,
      this.onSelUpdate,
    );
  }

  public applyTemplate(templateId: string): void {
    if (!this.fabricCanvas) return;
    imgTpl.applyCuratedTemplateToCanvas(
      this.fabricCanvas,
      this.pageDimensions,
      templateId,
      () => this.clearObjects(),
      this.onCommit,
    );
  }

  public updateSelectedProperties(props: Partial<SelectedObjectProperties>): void {
    if (!this.fabricCanvas) return;
    shapeText.updateSelectedObjectProperties(this.fabricCanvas, props, this.onCommitSel);
  }

  public deleteSelected(): void {
    if (!this.fabricCanvas) return;
    const active = this.fabricCanvas.getActiveObjects();
    if (!active || active.length === 0) return;
    active.forEach((obj) => this.fabricCanvas?.remove(obj));
    this.fabricCanvas.discardActiveObject();
    this.fabricCanvas.requestRenderAll();
    this.handleSelectionCleared();
  }

  public async duplicateSelected(): Promise<void> {
    if (!this.fabricCanvas) return;
    await shapeText.duplicateActiveObject(this.fabricCanvas, () => {
      this.handleSelectionUpdate();
      this.history.save(this.fabricCanvas);
    });
  }

  public async selectSubject(
    mode: 'select' | 'removeBg' = 'select',
  ): Promise<{ success: boolean; message: string }> {
    if (!this.fabricCanvas) return { success: false, message: 'Canvas não inicializado' };
    return subjectMask.selectSubjectOnCanvas(
      this.fabricCanvas,
      mode,
      this.onSaveHist,
      this.onSelUpdate,
    );
  }

  public bringForward(): void {
    const active = this.fabricCanvas?.getActiveObject();
    if (this.fabricCanvas && active) {
      this.fabricCanvas.bringObjectForward(active);
      this.fabricCanvas.requestRenderAll();
      this.callbacks?.onCanvasChange();
    }
  }

  public sendBackward(): void {
    const active = this.fabricCanvas?.getActiveObject();
    if (this.fabricCanvas && active) {
      this.fabricCanvas.sendObjectBackwards(active);
      this.fabricCanvas.requestRenderAll();
      this.callbacks?.onCanvasChange();
    }
  }

  public clearObjects(): void {
    if (!this.fabricCanvas) return;
    [...this.fabricCanvas.getObjects()].forEach((o) => this.fabricCanvas?.remove(o));
    this.fabricCanvas.discardActiveObject();
    this.fabricCanvas.requestRenderAll();
    this.handleSelectionCleared();
  }

  public getLayers(): readonly LayerItem[] {
    return this.fabricCanvas ? layerGroup.getCanvasLayers(this.fabricCanvas) : [];
  }

  public toggleLayerMask(
    layerName?: string,
    shape: 'circle' | 'rounded' | 'ellipse' = 'circle',
  ): void {
    if (!this.fabricCanvas) return;
    subjectMask.toggleLayerMaskOnCanvas(this.fabricCanvas, layerName, shape, this.onCommitSel);
  }

  public invertLayerMask(layerName?: string): void {
    if (!this.fabricCanvas) return;
    subjectMask.invertLayerMaskOnCanvas(this.fabricCanvas, layerName, this.onCommitSel);
  }

  public removeLayerMask(layerName?: string): void {
    if (!this.fabricCanvas) return;
    subjectMask.removeLayerMaskOnCanvas(this.fabricCanvas, layerName, this.onCommitSel);
  }

  public applyCropToSelected(mode: '1:1' | '4:3' | '16:9' | 'inset' | 'reset' = 'inset'): void {
    if (!this.fabricCanvas) return;
    subjectMask.applyCropToSelectedOnCanvas(
      this.fabricCanvas,
      mode,
      () => this.removeLayerMask(),
      this.onCommitSel,
    );
  }

  public performBooleanOperation(operation: BooleanPathOperation): void {
    if (!this.fabricCanvas) return;
    shapeText.performBooleanOperationOnCanvas(this.fabricCanvas, operation, this.onCommitSel);
  }

  public selectObjectByName(name: string): void {
    if (!this.fabricCanvas) return;
    layerGroup.selectObjectByNameOnCanvas(
      this.fabricCanvas,
      name,
      this.onSelUpdate,
      this.onCanvasChg,
    );
  }

  public selectObjectsByNames(names: readonly string[]): void {
    if (!this.fabricCanvas) return;
    layerGroup.selectObjectsByNamesOnCanvas(
      this.fabricCanvas,
      names,
      this.onSelUpdate,
      this.onSelClear,
      this.onCanvasChg,
    );
  }

  public getDrawingTool(): 'none' | 'brush' | 'eraser' {
    return this.currentDrawingTool;
  }

  public setDrawingMode(
    enabled: boolean,
    mode: 'brush' | 'eraser' = 'brush',
    options?: { color?: string; width?: number },
  ): void {
    if (!this.fabricCanvas) return;
    if (options?.color) this.brushColor = options.color;
    if (options?.width) this.brushWidth = options.width;
    this.currentDrawingTool = alignDraw.configureDrawingBrush(
      this.fabricCanvas,
      enabled,
      mode,
      this.brushColor,
      this.brushWidth,
    );
  }

  public alignSelected(alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'): void {
    if (!this.fabricCanvas) return;
    alignDraw.alignSelectedObjects(
      this.fabricCanvas,
      this.pageDimensions,
      alignment,
      this.onCommitSel,
    );
  }

  public distributeSelected(direction: 'horizontal' | 'vertical'): void {
    if (!this.fabricCanvas) return;
    alignDraw.distributeSelectedObjects(this.fabricCanvas, direction, this.onCommitSel);
  }

  public switchPage(newPageId: string, initialConfig?: CanvasAdapterConfig): void {
    if (!this.fabricCanvas || this.activePageId === newPageId) return;
    try {
      this.pageStates.set(this.activePageId, JSON.stringify(this.fabricCanvas.toJSON()));
    } catch {
      // Ignore JSON serialization in tests
    }
    this.activePageId = newPageId;
    const savedState = this.pageStates.get(newPageId);
    if (savedState) {
      void this.loadJsonState(savedState);
    } else {
      this.clearObjects();
      if (initialConfig) this.syncViewport(initialConfig);
    }
  }

  public removePageState(pageId: string): void {
    this.pageStates.delete(pageId);
  }

  public duplicatePageState(sourcePageId: string, targetPageId: string): void {
    const state = this.pageStates.get(sourcePageId);
    if (state) this.pageStates.set(targetPageId, state);
  }

  public toggleLayerVisibility(name: string): void {
    if (!this.fabricCanvas) return;
    layerGroup.toggleLayerVisibilityOnCanvas(
      this.fabricCanvas,
      name,
      this.onSelClear,
      this.onCommit,
    );
  }

  public toggleLayerLock(name: string): void {
    if (!this.fabricCanvas) return;
    layerGroup.toggleLayerLockOnCanvas(this.fabricCanvas, name, this.onCommit);
  }

  public setLayerOpacity(name: string, opacity: number): void {
    if (!this.fabricCanvas) return;
    layerGroup.setLayerOpacityOnCanvas(this.fabricCanvas, name, opacity, this.onCommit);
  }

  public setLayerBlendMode(name: string, blendMode: string): void {
    if (!this.fabricCanvas) return;
    layerGroup.setLayerBlendModeOnCanvas(this.fabricCanvas, name, blendMode, this.onCommit);
  }

  public renameLayer(oldName: string, newName: string): void {
    if (!this.fabricCanvas) return;
    layerGroup.renameLayerOnCanvas(this.fabricCanvas, oldName, newName, this.onCommit);
  }

  public reorderLayer(name: string, direction: 'up' | 'down'): void {
    if (!this.fabricCanvas) return;
    layerGroup.reorderLayerOnCanvas(this.fabricCanvas, name, direction, this.onCommit);
  }

  public reorderLayerToIndex(name: string, targetVisualIndex: number): void {
    if (!this.fabricCanvas) return;
    layerGroup.reorderLayerToIndexOnCanvas(
      this.fabricCanvas,
      name,
      targetVisualIndex,
      this.onCommit,
    );
  }

  public createGroup(name?: string): void {
    if (!this.fabricCanvas) return;
    layerGroup.createGroupOnCanvas(this.fabricCanvas, this.pageDimensions, name, this.onCommitSel);
  }

  public ungroupSelected(): void {
    if (!this.fabricCanvas) return;
    layerGroup.ungroupSelectedOnCanvas(this.fabricCanvas, this.onCommitSel);
  }

  public addCleanLayer(name?: string): void {
    if (!this.fabricCanvas) return;
    layerGroup.addCleanLayerToCanvas(
      this.fabricCanvas,
      this.pageDimensions,
      name,
      this.onCommitSel,
    );
  }

  public deleteLayerByName(name: string): void {
    if (!this.fabricCanvas) return;
    layerGroup.deleteLayerByNameOnCanvas(this.fabricCanvas, name, this.onSelClear, this.onCommit);
  }

  public canUndo(): boolean {
    return this.history.canUndo();
  }

  public canRedo(): boolean {
    return this.history.canRedo();
  }

  public async undo(): Promise<void> {
    if (!this.canUndo() || !this.fabricCanvas) return;
    this.history.index -= 1;
    const targetState = this.history.stack[this.history.index];
    if (targetState) await this.loadJsonState(targetState);
  }

  public async redo(): Promise<void> {
    if (!this.canRedo() || !this.fabricCanvas) return;
    this.history.index += 1;
    const targetState = this.history.stack[this.history.index];
    if (targetState) await this.loadJsonState(targetState);
  }

  private async loadJsonState(json: string): Promise<void> {
    if (!this.fabricCanvas) return;
    await this.history.loadState(this.fabricCanvas, json, () => {
      this.handleSelectionUpdate();
      this.callbacks?.onCanvasChange();
    });
  }

  public exportDataUrl(format: 'png' | 'jpeg' = 'png', quality = 0.95): string {
    if (!this.fabricCanvas) return '';
    return exportCanvasDataUrl(
      this.fabricCanvas,
      this.pageDimensions,
      this.backgroundColor,
      this.currentScale,
      this.bleedMargin,
      format,
      quality,
    );
  }

  public dispose(): void {
    if (this.fabricCanvas) {
      void this.fabricCanvas.dispose();
      this.fabricCanvas = null;
    }
    for (const objectUrl of this.managedObjectUrls) {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {
        // Ignore in test environments
      }
    }
    this.managedObjectUrls.clear();
    this.history.reset();
    this.isMounted = false;
  }
}
