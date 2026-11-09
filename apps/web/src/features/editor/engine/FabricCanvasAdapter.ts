import type { BooleanPathOperation, Point2D } from '@pencel/editor-core';
import type { Canvas as FabricCanvas } from 'fabric';
import {
  extractSelectedProperties,
  type AddShapeOptions,
  type AddTextOptions,
  type CanvasAdapterConfig,
  type CanvasEventCallbacks,
  type LayerItem,
  type SelectedObjectProperties,
  type SelectedObjectType,
} from './adapterTypes.js';
import * as alignDraw from './alignmentAndDrawingEngine.js';
import {
  applyCameraRawToActiveImage,
  getActiveImageCameraRaw,
  type CameraRawAdjustments,
} from './cameraRawEngine.js';
import { CanvasLayerFacade } from './canvasLayerFacade.js';
import * as histPage from './historyAndPageEngine.js';
import * as imgTpl from './imageAndTemplateEngine.js';
import * as penEngine from './penToolEngine.js';
import * as shapeText from './shapeAndTextEngine.js';
import * as subjectMask from './subjectAndMaskEngine.js';
import * as viewport from './viewportAndGuidesEngine.js';
import {
  applyVectorizedSvgToCanvas,
  getActiveImageForVectorize,
  type TargetImageMetadata,
  type VectorizeApplyMode,
} from './vectorTraceEngine.js';
import { applyGeneratedLayoutToCanvas } from './generatedLayoutEngine.js';
import type { GeneratedLayoutDto } from '../services/aiLayoutService.js';

export type EditorToolMode = 'select' | 'directSelect' | 'pen' | 'brush' | 'eraser';
export type {
  CanvasAdapterConfig,
  CanvasEventCallbacks,
  LayerItem,
  SelectedObjectProperties,
  SelectedObjectType,
  TargetImageMetadata,
  VectorizeApplyMode,
};

/**
 * Isolated facade wrapping Fabric.js (`fabric.Canvas`) and delegating to responsibility modules.
 */
export class FabricCanvasAdapter {
  private fabricCanvas: FabricCanvas | null = null;
  private isMounted = false;
  private readonly viewport = new viewport.ViewportManager();
  private callbacks: CanvasEventCallbacks | null = null;
  private managedObjectUrls = new Set<string>();
  private readonly history = new histPage.CanvasHistoryManager();
  private readonly drawingMgr = new alignDraw.DrawingToolManager();
  private readonly vectorCtrl = new penEngine.VectorInteractiveController();
  private readonly pages = new histPage.CanvasPageStore();

  private readonly onSelUpdate = (): void => this.handleSelectionUpdate();
  private readonly onSelClear = (): void => this.handleSelectionCleared();
  private readonly onCommit = (): void => this.commitChange();
  private readonly onCommitSel = (): void => this.commitChangeWithSelection();

  public readonly layers = new CanvasLayerFacade({
    getCanvas: () => this.fabricCanvas,
    getDimensions: () => this.viewport.pageDimensions,
    onCommit: this.onCommit,
    onCommitSel: this.onCommitSel,
    onSelClear: this.onSelClear,
    onSelUpdate: this.onSelUpdate,
    onCanvasChange: () => this.callbacks?.onCanvasChange(),
  });

  public mount(
    canvasElement: HTMLCanvasElement,
    config: CanvasAdapterConfig,
    callbacks?: CanvasEventCallbacks,
  ): boolean {
    if (this.isMounted) this.dispose();
    this.callbacks = callbacks ?? null;
    this.viewport.pageDimensions = config.dimensions;
    this.viewport.currentScale = config.displayScale;
    this.viewport.backgroundColor = config.backgroundColor;

    const canvas = viewport.createConfiguredFabricCanvas(
      canvasElement,
      config,
      this.viewport.bleedMargin,
      {
        getPageDimensions: () => this.viewport.pageDimensions,
        getDrawingTool: () => this.drawingMgr.tool,
        isHistoryLocked: () => this.history.isLocked(),
        onSelectionUpdate: () => this.handleSelectionUpdate(),
        onSelectionCleared: () => this.handleSelectionCleared(),
        onSaveHistory: () => this.history.save(this.fabricCanvas),
        onCanvasChange: () => this.callbacks?.onCanvasChange(),
        onBeforeRender: () => {
          if (
            this.fabricCanvas &&
            (!this.viewport.isExporting || !this.viewport.exportSuppressBackground)
          ) {
            viewport.renderArtboardBackground(
              this.fabricCanvas,
              this.viewport.pageDimensions,
              this.viewport.backgroundColor,
            );
          }
        },
        onAfterRender: () => {
          if (this.fabricCanvas && !this.viewport.isExporting) {
            viewport.renderArtboardClipAndPasteboardControls(
              this.fabricCanvas,
              this.viewport.pageDimensions,
              this.viewport.currentScale,
              this.viewport.bleedMargin,
              this.viewport.clipToArtboard,
            );
            this.vectorCtrl.renderOverlay(this.fabricCanvas.getContext(), this.fabricCanvas);
          }
        },
      },
    );

    if (!canvas) return (this.isMounted = false);
    this.fabricCanvas = canvas;
    const getPt = (opt: unknown): Point2D =>
      (opt as { scenePoint?: Point2D }).scenePoint ??
      canvas.getScenePoint((opt as { e: MouseEvent }).e);
    canvas.on('mouse:down', (opt) => {
      if (this.vectorCtrl.toolMode === 'pen') canvas.discardActiveObject();
      this.vectorCtrl.handleMouseDown(canvas, getPt(opt), (closed) => this.finishPenPath(closed));
    });
    canvas.on('mouse:move', (opt) => this.vectorCtrl.handleMouseMove(canvas, getPt(opt)));
    canvas.on('mouse:up', () => this.vectorCtrl.handleMouseUp(canvas, this.onCommit));
    canvas.on('mouse:dblclick', () => {
      this.vectorCtrl.handleDoubleClick(canvas, (closed) => this.finishPenPath(closed));
    });
    this.isMounted = true;
    this.history.save(this.fabricCanvas);
    return true;
  }

  public readonly isClipToArtboard = (): boolean => this.viewport.clipToArtboard;

  public setClipToArtboard(enabled: boolean): void {
    this.viewport.clipToArtboard = enabled;
    this.fabricCanvas?.requestRenderAll();
  }

  public screenPointToArtboard(clientX: number, clientY: number): Point2D {
    return this.viewport.screenPointToArtboard(this.fabricCanvas, clientX, clientY);
  }

  public syncViewport(config: CanvasAdapterConfig): void {
    if (this.fabricCanvas && this.isMounted) this.viewport.sync(this.fabricCanvas, config);
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

  public addText(options: AddTextOptions): void {
    if (this.fabricCanvas)
      shapeText.addTextToCanvas(
        this.fabricCanvas,
        this.viewport.pageDimensions,
        options,
        this.onSelUpdate,
      );
  }

  public addShape(options: AddShapeOptions): void {
    if (this.fabricCanvas)
      shapeText.addShapeToCanvas(
        this.fabricCanvas,
        this.viewport.pageDimensions,
        options,
        this.onSelUpdate,
      );
  }

  public addImage(
    url: string,
    altText = 'Imagem',
    fallbackUrl?: string,
    position?: { x?: number; y?: number; left?: number; top?: number },
  ): Promise<void> {
    return this.addImageFromUrl(url, altText, fallbackUrl, position);
  }

  public async addImageFromUrl(
    url: string,
    altText = 'Imagem',
    fallbackUrl?: string,
    position?: { x?: number; y?: number; left?: number; top?: number },
  ): Promise<void> {
    if (this.fabricCanvas && url)
      await imgTpl.addImageFromUrlToCanvas(
        this.fabricCanvas,
        this.viewport.pageDimensions,
        this.managedObjectUrls,
        url,
        altText,
        this.onCommitSel,
        fallbackUrl,
        position,
      );
  }

  public applyTemplate(templateId: string): void {
    if (this.fabricCanvas)
      imgTpl.applyCuratedTemplateToCanvas(
        this.fabricCanvas,
        this.viewport.pageDimensions,
        templateId,
        () => this.clearObjects(),
        this.onCommit,
      );
  }

  public applyGeneratedLayout(layout: GeneratedLayoutDto): void {
    if (this.fabricCanvas)
      applyGeneratedLayoutToCanvas(
        this.fabricCanvas,
        this.viewport.pageDimensions,
        layout,
        () => this.clearObjects(),
        this.onCommit,
      );
  }

  public updateSelectedProperties(props: Partial<SelectedObjectProperties>): void {
    if (this.fabricCanvas)
      shapeText.updateSelectedObjectProperties(this.fabricCanvas, props, this.onCommitSel);
  }

  public deleteSelected(): void {
    if (this.fabricCanvas) shapeText.deleteSelectedObjects(this.fabricCanvas, this.onSelClear);
  }

  public async duplicateSelected(): Promise<void> {
    if (!this.fabricCanvas) return;
    await shapeText.duplicateActiveObject(this.fabricCanvas, () => {
      this.handleSelectionUpdate();
      this.history.save(this.fabricCanvas);
    });
  }

  public async copySelected(): Promise<boolean> {
    return this.fabricCanvas ? shapeText.copyActiveObject(this.fabricCanvas) : false;
  }

  public async pasteCopied(): Promise<boolean> {
    if (!this.fabricCanvas) return false;
    return shapeText.pasteActiveObject(this.fabricCanvas, () => {
      this.handleSelectionUpdate();
      this.history.save(this.fabricCanvas);
    });
  }

  public hasInternalClipboard(): boolean {
    return shapeText.hasInternalClipboardObject();
  }

  public async selectSubject(
    mode: 'select' | 'removeBg' = 'select',
  ): Promise<{ success: boolean; message: string }> {
    if (!this.fabricCanvas) return { success: false, message: 'Canvas não inicializado' };
    return subjectMask.selectSubjectOnCanvas(
      this.fabricCanvas,
      mode,
      () => this.history.save(this.fabricCanvas),
      this.onSelUpdate,
    );
  }

  public readonly getActiveImageForVectorize = (): TargetImageMetadata | null =>
    this.fabricCanvas ? getActiveImageForVectorize(this.fabricCanvas) : null;

  public async applyVectorizedSvg(
    target: TargetImageMetadata,
    svgString: string,
    mode: VectorizeApplyMode,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.fabricCanvas) return { success: false, error: 'Canvas não inicializado' };
    return applyVectorizedSvgToCanvas(this.fabricCanvas, target, svgString, mode, this.onCommitSel);
  }

  public readonly bringForward = (): void => this.layers.bringForward();
  public readonly sendBackward = (): void => this.layers.sendBackward();
  public clearObjects(): void {
    if (this.fabricCanvas) shapeText.clearCanvasObjects(this.fabricCanvas, this.onSelClear);
  }
  public readonly getLayers = (): readonly LayerItem[] => this.layers.getLayers();

  public toggleLayerMask(
    layerName?: string,
    shape: 'circle' | 'rounded' | 'ellipse' = 'circle',
  ): void {
    if (this.fabricCanvas)
      subjectMask.toggleLayerMaskOnCanvas(this.fabricCanvas, layerName, shape, this.onCommitSel);
  }

  public invertLayerMask(layerName?: string): void {
    if (this.fabricCanvas)
      subjectMask.invertLayerMaskOnCanvas(this.fabricCanvas, layerName, this.onCommitSel);
  }

  public removeLayerMask(layerName?: string): void {
    if (this.fabricCanvas)
      subjectMask.removeLayerMaskOnCanvas(this.fabricCanvas, layerName, this.onCommitSel);
  }

  public applyCropToSelected(mode: '1:1' | '4:3' | '16:9' | 'inset' | 'reset' = 'inset'): void {
    if (this.fabricCanvas)
      subjectMask.applyCropToSelectedOnCanvas(
        this.fabricCanvas,
        mode,
        () => this.removeLayerMask(),
        this.onCommitSel,
      );
  }

  public performBooleanOperation(operation: BooleanPathOperation): void {
    if (this.fabricCanvas)
      shapeText.performBooleanOperationOnCanvas(this.fabricCanvas, operation, this.onCommitSel);
  }

  public readonly selectObjectByName = (name: string): void => this.layers.selectByName(name);
  public readonly selectObjectsByNames = (names: readonly string[]): void =>
    this.layers.selectByNames(names);
  public readonly getDrawingTool = (): 'none' | 'brush' | 'eraser' => this.drawingMgr.tool;
  public readonly getToolMode = (): EditorToolMode => this.vectorCtrl.toolMode;

  public setToolMode(mode: EditorToolMode): void {
    this.vectorCtrl.toolMode = mode;
    if (!this.fabricCanvas) return;
    if (mode === 'brush' || mode === 'eraser') {
      this.discardActiveObject();
      this.fabricCanvas.selection = false;
      this.fabricCanvas.skipTargetFind = true;
      this.setDrawingMode(true, mode);
    } else {
      this.setDrawingMode(false);
      this.fabricCanvas.selection = mode === 'select';
      this.fabricCanvas.skipTargetFind = mode === 'pen';
      this.fabricCanvas.defaultCursor = mode === 'pen' ? 'crosshair' : 'default';
      if (mode === 'pen') {
        this.vectorCtrl.penState = penEngine.createInitialPenState();
        this.discardActiveObject();
      }
      this.fabricCanvas.requestRenderAll();
    }
  }

  public finishPenPath(isClosed = true): void {
    if (!this.fabricCanvas) return;
    penEngine.commitPenPathToCanvas(
      this.fabricCanvas,
      this.vectorCtrl.penState,
      isClosed,
      { stroke: this.drawingMgr.color, strokeWidth: this.drawingMgr.width },
      this.onCommitSel,
    );
  }

  public getBrushColor = (): string => this.drawingMgr.color;
  public getBrushWidth = (): number => this.drawingMgr.width;
  public getBrushHardness = (): number => this.drawingMgr.hardness;
  public getBrushSoftness = (): number => this.drawingMgr.softness;
  public getBrushSmoothness = (): number => this.drawingMgr.smoothness;

  public setDrawingMode(
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
    if (this.fabricCanvas) this.drawingMgr.setMode(this.fabricCanvas, enabled, mode, options);
  }

  public alignSelected(
    alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom',
    target?: 'artboard' | 'selection',
  ): void {
    if (!this.fabricCanvas) return;
    alignDraw.alignSelectedObjects(
      this.fabricCanvas,
      this.viewport.pageDimensions,
      alignment,
      this.onCommitSel,
      target,
    );
  }

  public distributeSelected(direction: 'horizontal' | 'vertical'): void {
    if (!this.fabricCanvas) return;
    alignDraw.distributeSelectedObjects(this.fabricCanvas, direction, this.onCommitSel);
  }

  public switchPage(newPageId: string, initialConfig?: CanvasAdapterConfig): void {
    if (!this.fabricCanvas) return;
    this.pages.switchPage(
      this.fabricCanvas,
      newPageId,
      initialConfig,
      (j: string) => this.loadJsonState(j),
      () => this.clearObjects(),
      (c: CanvasAdapterConfig) => this.syncViewport(c),
    );
  }

  public readonly removePageState = (id: string): void => this.pages.removePage(id);
  public readonly duplicatePageState = (src: string, dst: string): void =>
    this.pages.duplicatePage(src, dst);
  public readonly canUndo = (): boolean => this.history.canUndo();
  public readonly canRedo = (): boolean => this.history.canRedo();
  public async undo(): Promise<void> {
    if (this.fabricCanvas) await this.history.undo(this.fabricCanvas, this.onCommitSel);
  }
  public async redo(): Promise<void> {
    if (this.fabricCanvas) await this.history.redo(this.fabricCanvas, this.onCommitSel);
  }
  public applyCameraRaw(adjustments: CameraRawAdjustments): void {
    if (this.fabricCanvas)
      applyCameraRawToActiveImage(this.fabricCanvas, adjustments, this.onCommit);
  }
  public readonly getCameraRaw = (): CameraRawAdjustments | null =>
    this.fabricCanvas ? getActiveImageCameraRaw(this.fabricCanvas) : null;

  public async loadJsonState(json: string): Promise<void> {
    if (this.fabricCanvas) await this.history.loadJson(this.fabricCanvas, json, this.onCommitSel);
  }

  public exportDataUrl(
    format: 'png' | 'jpeg' = 'png',
    quality = 0.95,
    maxDimension?: number,
    scaleFactor = 1,
    transparentBackground = false,
  ): string {
    return this.viewport.exportDataUrl(
      this.fabricCanvas,
      format,
      quality,
      maxDimension,
      scaleFactor,
      transparentBackground,
    );
  }

  public readonly exportSvg = (): string => this.viewport.exportSvg(this.fabricCanvas);
  public readonly getFabricCanvas = (): FabricCanvas | null => this.fabricCanvas;

  public dispose(): void {
    if (this.fabricCanvas) {
      void this.fabricCanvas.dispose();
      this.fabricCanvas = null;
    }
    this.managedObjectUrls.forEach((u) => URL.revokeObjectURL(u));
    this.managedObjectUrls.clear();
    this.history.reset();
    this.isMounted = false;
  }
}
