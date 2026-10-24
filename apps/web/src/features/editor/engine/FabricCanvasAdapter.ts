import {
  generateRegularPolygonPoints,
  generateStarPoints,
  intersectConvexPolygons,
  isObjectBleedingOutsideArtboard,
  polygonRingsToSvgPath,
  screenToArtboard,
  type BooleanPathOperation,
  type Point2D,
  type ShapeVariant,
} from '@pencel/editor-core';
import type { Dimensions } from '@pencel/shared-types';
import {
  ActiveSelection,
  Canvas as FabricCanvas,
  Circle as FabricCircle,
  Ellipse as FabricEllipse,
  FabricImage,
  FabricObject,
  Group as FabricGroup,
  IText as FabricIText,
  Path as FabricPath,
  PencilBrush,
  Polygon as FabricPolygon,
  Rect as FabricRect,
  Textbox as FabricTextbox,
  Triangle as FabricTriangle,
  loadSVGFromString,
  loadSVGFromURL,
  util,
} from 'fabric';
import { httpClient } from '../services/httpClient.js';
import { removeImageBackgroundViaApi } from '../services/imageProcessingService.js';

export interface CanvasAdapterConfig {
  readonly dimensions: Dimensions;
  readonly displayScale: number;
  readonly backgroundColor: string;
}

export type SelectedObjectType =
  | 'textbox'
  | 'rect'
  | 'circle'
  | 'triangle'
  | 'polygon'
  | 'path'
  | 'image'
  | 'group'
  | 'activeselection'
  | 'unknown';

export interface SelectedObjectProperties {
  readonly id: string;
  readonly type: SelectedObjectType;
  readonly count?: number;
  readonly text?: string;
  readonly boxMode?: 'point' | 'area';
  readonly fill?: string;
  readonly stroke?: string;
  readonly strokeWidth?: number;
  readonly opacity: number;
  readonly fontSize?: number;
  readonly fontFamily?: string;
  readonly fontWeight?: string | number;
  readonly fontStyle?: string;
  readonly underline?: boolean;
  readonly textAlign?: 'left' | 'center' | 'right' | 'justify';
  readonly charSpacing?: number;
  readonly lineHeight?: number;
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly angle: number;
  readonly hasMask?: boolean;
  readonly maskEnabled?: boolean;
  readonly maskInverted?: boolean;
  readonly isCropped?: boolean;
}

export interface LayerItem {
  readonly id: string;
  readonly name: string;
  readonly text?: string;
  readonly previewUrl?: string;
  readonly type: SelectedObjectType;
  readonly isSelected: boolean;
  readonly visible: boolean;
  readonly locked: boolean;
  readonly opacity: number;
  readonly blendMode: string;
  readonly isGroup?: boolean;
  readonly groupName?: string;
  readonly effects?: readonly string[];
  readonly hasMask?: boolean;
  readonly maskEnabled?: boolean;
  readonly maskInverted?: boolean;
}

export interface CanvasEventCallbacks {
  readonly onSelectionChange: (selectedProps: SelectedObjectProperties | null) => void;
  readonly onCanvasChange: () => void;
}

/**
 * Isolated adapter wrapping Fabric.js (`fabric.Canvas`).
 * Implements normalized Cartesian coordinate spaces, artboard clipping with unclipped pasteboard
 * selection handles, reliable multi-stage image decoding, typography, vector boolean geometry,
 * non-destructive crop, and layer masks.
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

  // History stack for Transactional Undo / Redo
  private historyStack: string[] = [];
  private historyIndex = -1;
  private isHistoryLocked = false;
  private maxHistoryStates = 30;

  // Freehand Brush & Eraser states
  private currentDrawingTool: 'none' | 'brush' | 'eraser' = 'none';
  private brushColor = '#1D1D1F';
  private brushWidth = 4;

  // Multi-artboard page memory states
  private pageStates = new Map<string, string>();
  private activePageId = 'page-1';

  public mount(
    canvasElement: HTMLCanvasElement,
    config: CanvasAdapterConfig,
    callbacks?: CanvasEventCallbacks,
  ): boolean {
    if (this.isMounted) {
      this.dispose();
    }

    this.callbacks = callbacks ?? null;
    this.pageDimensions = config.dimensions;
    this.currentScale = config.displayScale;
    this.backgroundColor = config.backgroundColor;

    // Verify 2D rendering context availability
    let context2d: RenderingContext | null;
    try {
      context2d = canvasElement.getContext('2d');
    } catch {
      context2d = null;
    }

    if (!context2d) {
      this.isMounted = false;
      return false;
    }

    // Normalize Fabric v7 default origin from 'center' to top-left Cartesian ('left', 'top')
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
    const scaledMargin = Math.round(this.bleedMargin * scale);

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

    // Artboard Clipping vs. Unclipped Selection Handles (Parte I, §4)
    canvas.on('after:render', () => {
      this.renderArtboardClipAndPasteboardControls();
    });

    // Event listeners for selection and transactional modifications
    canvas.on('selection:created', () => this.handleSelectionUpdate());
    canvas.on('selection:updated', () => this.handleSelectionUpdate());
    canvas.on('selection:cleared', () => this.handleSelectionCleared());
    canvas.on('object:modified', () => {
      this.handleSelectionUpdate();
      this.saveHistoryState();
      this.callbacks?.onCanvasChange();
    });
    canvas.on('text:changed', () => {
      this.handleSelectionUpdate();
      this.callbacks?.onCanvasChange();
    });
    canvas.on('object:added', () => {
      if (!this.isHistoryLocked) {
        this.saveHistoryState();
        this.callbacks?.onCanvasChange();
      }
    });
    canvas.on('object:removed', () => {
      if (!this.isHistoryLocked) {
        this.saveHistoryState();
        this.callbacks?.onCanvasChange();
      }
    });

    // Drawing brush and eraser stroke path creation
    canvas.on('path:created', (e) => {
      const path = (e as { path?: FabricObject }).path;
      if (!path) return;
      if (this.currentDrawingTool === 'eraser') {
        path.set({
          globalCompositeOperation: 'destination-out',
          name: `eraser-${Date.now()}`,
        });
      } else {
        path.set({
          name: `brush-${Date.now()}`,
        });
      }
      this.saveHistoryState();
      this.callbacks?.onCanvasChange();
    });

    // Group drag sync: when moving a group frame, move member layers together
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

      // Smart snapping to Artboard Center and Edges (only when close to artboard edges, never clamping pasteboard freedom!)
      const snapDist = 6;
      const w = (target.width || 0) * (target.scaleX || 1);
      const h = (target.height || 0) * (target.scaleY || 1);
      const artboardW = this.pageDimensions.width;
      const artboardH = this.pageDimensions.height;

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

    this.fabricCanvas = canvas;
    this.isMounted = true;

    // Initial state in history
    this.saveHistoryState();
    return true;
  }

  /**
   * Separates Artboard Content Clipping from Pasteboard Manipulation & Selection Handles (Parte I, §4):
   * 1. When clipToArtboard is enabled, clears overflow pixels in the 4 pasteboard margin strips outside [0, 0, W, H].
   * 2. Draws a subtle dashed wireframe ghost outline for any object extending into the pasteboard so it is never lost.
   * 3. Redraws active object transformation handles (`drawControls`) ABOVE the pasteboard clip so handles remain 100% visible outside the artboard.
   */
  private renderArtboardClipAndPasteboardControls(): void {
    if (!this.fabricCanvas) return;
    const ctx = this.fabricCanvas.getContext();
    if (!ctx || typeof ctx.clearRect !== 'function' || typeof ctx.save !== 'function') return;

    const scale = this.currentScale || 1;
    const scaledWidth = Math.max(1, Math.round(this.pageDimensions.width * scale));
    const scaledHeight = Math.max(1, Math.round(this.pageDimensions.height * scale));
    const scaledMargin = Math.round(this.bleedMargin * scale);
    const totalW = scaledWidth + 2 * scaledMargin;

    if (this.clipToArtboard) {
      // 1. Mask/clear object artwork bleeding outside the artboard into the 4 pasteboard strips
      ctx.clearRect(0, 0, totalW, scaledMargin);
      ctx.clearRect(0, scaledMargin + scaledHeight, totalW, scaledMargin);
      ctx.clearRect(0, scaledMargin, scaledMargin, scaledHeight);
      ctx.clearRect(scaledMargin + scaledWidth, scaledMargin, scaledMargin, scaledHeight);

      // 2. Render subtle wireframe ghost outlines for objects extending outside the artboard
      const objects = this.fabricCanvas.getObjects();
      for (const obj of objects) {
        if (obj.visible === false) continue;
        const left = obj.left ?? 0;
        const top = obj.top ?? 0;
        const w = (obj.width ?? 0) * (obj.scaleX ?? 1);
        const h = (obj.height ?? 0) * (obj.scaleY ?? 1);

        if (
          isObjectBleedingOutsideArtboard(
            { x: left, y: top, width: w, height: h },
            this.pageDimensions,
          ) &&
          typeof ctx.strokeRect === 'function'
        ) {
          ctx.save();
          ctx.strokeStyle = 'rgba(0, 102, 204, 0.38)';
          ctx.lineWidth = 1;
          if (typeof ctx.setLineDash === 'function') {
            ctx.setLineDash([4, 4]);
          }
          ctx.strokeRect(
            scaledMargin + left * scale,
            scaledMargin + top * scale,
            w * scale,
            h * scale,
          );
          ctx.restore();
        }
      }

      // 3. Redraw active selection bounding box and transformation handles ABOVE the pasteboard clip
      const active = this.fabricCanvas.getActiveObject();
      if (active && typeof this.fabricCanvas.drawControls === 'function') {
        ctx.save();
        this.fabricCanvas.drawControls(ctx);
        ctx.restore();
      }
    }
  }

  public isClipToArtboard(): boolean {
    return this.clipToArtboard;
  }

  public setClipToArtboard(enabled: boolean): void {
    this.clipToArtboard = enabled;
    this.fabricCanvas?.requestRenderAll();
  }

  /**
   * Converts DOM screen coordinates (clientX, clientY) into normalized Artboard Space coordinates.
   */
  public screenPointToArtboard(clientX: number, clientY: number): Point2D {
    const el = this.fabricCanvas?.upperCanvasEl ?? this.fabricCanvas?.getElement();
    const rect = el ? el.getBoundingClientRect() : { left: 0, top: 0 };
    const scale = this.currentScale || 1;
    const scaledMargin = Math.round(this.bleedMargin * scale);

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

  public syncViewport(config: CanvasAdapterConfig): void {
    if (!this.fabricCanvas || !this.isMounted) {
      return;
    }

    this.pageDimensions = config.dimensions;
    this.currentScale = config.displayScale;
    this.backgroundColor = config.backgroundColor;

    const scale = config.displayScale;
    const scaledWidth = Math.max(1, Math.round(config.dimensions.width * scale));
    const scaledHeight = Math.max(1, Math.round(config.dimensions.height * scale));
    const scaledMargin = Math.round(this.bleedMargin * scale);

    this.fabricCanvas.setDimensions({
      width: scaledWidth + 2 * scaledMargin,
      height: scaledHeight + 2 * scaledMargin,
    });
    this.fabricCanvas.setViewportTransform([scale, 0, 0, scale, scaledMargin, scaledMargin]);
    this.fabricCanvas.backgroundColor = 'transparent';

    this.fabricCanvas.requestRenderAll();
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
    if (!active) {
      this.callbacks?.onSelectionChange(null);
      return;
    }

    const type = this.normalizeObjectType(active.type);
    const textObj = active as FabricTextbox;
    const isMulti = active.type === 'activeselection';
    const multiCount = isMulti ? (active as ActiveSelection).getObjects().length : undefined;
    const boxMode =
      active instanceof FabricIText && !(active instanceof FabricTextbox)
        ? 'point'
        : active instanceof FabricTextbox
          ? 'area'
          : undefined;

    const props: SelectedObjectProperties = {
      id:
        (active.get('name') as string) ||
        (isMulti ? `multi-selection-${Date.now()}` : `obj-${Date.now()}`),
      type,
      count: multiCount,
      text: typeof textObj.text === 'string' ? textObj.text : undefined,
      boxMode,
      fill: typeof active.fill === 'string' ? active.fill : '#18181B',
      stroke: typeof active.stroke === 'string' ? active.stroke : undefined,
      strokeWidth: typeof active.strokeWidth === 'number' ? active.strokeWidth : undefined,
      opacity: active.opacity ?? 1,
      fontSize: typeof textObj.fontSize === 'number' ? textObj.fontSize : undefined,
      fontFamily: typeof textObj.fontFamily === 'string' ? textObj.fontFamily : undefined,
      fontWeight: textObj.fontWeight,
      fontStyle: textObj.fontStyle,
      underline: Boolean(textObj.underline),
      textAlign: textObj.textAlign as 'left' | 'center' | 'right' | 'justify' | undefined,
      charSpacing: typeof textObj.charSpacing === 'number' ? textObj.charSpacing : 0,
      lineHeight: typeof textObj.lineHeight === 'number' ? textObj.lineHeight : 1.16,
      left: Math.round(active.left || 0),
      top: Math.round(active.top || 0),
      width: Math.round((active.width || 0) * (active.scaleX || 1)),
      height: Math.round((active.height || 0) * (active.scaleY || 1)),
      angle: Math.round(active.angle || 0),
      hasMask: Boolean(active.get('hasMask')),
      maskEnabled: active.get('maskEnabled') !== false,
      maskInverted: Boolean(active.get('maskInverted')),
      isCropped: Boolean(active.get('isCropped')),
    };

    this.callbacks?.onSelectionChange(props);
  }

  private handleSelectionCleared(): void {
    this.callbacks?.onSelectionChange(null);
  }

  private normalizeObjectType(rawType: string): SelectedObjectType {
    const t = rawType.toLowerCase();
    if (t.includes('text')) return 'textbox';
    if (t === 'rect') return 'rect';
    if (t === 'circle' || t === 'ellipse') return 'circle';
    if (t === 'triangle') return 'triangle';
    if (t === 'polygon') return 'polygon';
    if (t === 'path') return 'path';
    if (t.includes('image')) return 'image';
    if (t === 'activeselection') return 'activeselection';
    if (t === 'group') return 'group';
    return 'unknown';
  }

  // --- Element Creation APIs (Text, Vector Shapes, Reliable Image Pipeline) ---

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

    const canvasWidth = this.pageDimensions.width;
    const canvasHeight = this.pageDimensions.height;
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
      name: `text-${Date.now()}`,
    };

    const textObj = isPointText
      ? new FabricIText(options.text, commonProps)
      : new FabricTextbox(options.text, commonProps);

    textObj.set('boxMode', isPointText ? 'point' : 'area');

    this.fabricCanvas.add(textObj);
    this.fabricCanvas.setActiveObject(textObj);
    this.fabricCanvas.requestRenderAll();
    this.handleSelectionUpdate();
  }

  public addShape(options: {
    shapeVariant: ShapeVariant;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  }): void {
    if (!this.fabricCanvas) return;

    const canvasWidth = this.pageDimensions.width;
    const canvasHeight = this.pageDimensions.height;
    const fill = options.fill ?? '#0071E3';
    const stroke = options.stroke ?? 'transparent';
    const strokeWidth = options.strokeWidth ?? 0;

    let shapeObj: FabricObject;
    const id = `shape-${Date.now()}`;

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

    this.fabricCanvas.add(shapeObj);
    this.fabricCanvas.setActiveObject(shapeObj);
    this.fabricCanvas.requestRenderAll();
    this.handleSelectionUpdate();
  }

  /**
   * Reliable Multi-Stage Image & Vector Insertion Pipeline (Parte I, §5):
   * Gallery -> Asset Resolution -> SVG/Raster Decode -> CORS Fallback -> Normalized Document Placement -> Render
   */
  public async addImageFromUrl(url: string, altText = 'Imagem'): Promise<void> {
    if (!this.fabricCanvas || !url) return;

    const placeAndSelectObject = (
      obj: FabricObject,
      prefix: string,
      targetMaxRatio = 0.55,
    ): void => {
      if (!this.fabricCanvas) return;
      const artboardW = this.pageDimensions.width;
      const artboardH = this.pageDimensions.height;
      const maxDim = Math.min(artboardW, artboardH) * targetMaxRatio;

      const rawW = Math.max(1, obj.width || 256);
      const rawH = Math.max(1, obj.height || 256);
      const scale = Math.min(maxDim / rawW, maxDim / rawH, 1.5);

      obj.scale(scale);
      const scaledW = rawW * scale;
      const scaledH = rawH * scale;

      obj.set({
        originX: 'left',
        originY: 'top',
        left: Math.round((artboardW - scaledW) / 2),
        top: Math.round((artboardH - scaledH) / 2),
        name: `${prefix}-${Date.now()}`,
        altText,
        naturalWidth: rawW,
        naturalHeight: rawH,
      });
      obj.setCoords();

      this.fabricCanvas.add(obj);
      this.fabricCanvas.setActiveObject(obj);
      this.fabricCanvas.requestRenderAll();
      this.handleSelectionUpdate();
    };

    try {
      const isSvg = url.toLowerCase().includes('.svg') || url.startsWith('data:image/svg+xml');

      if (isSvg) {
        let normalizedSvgText: string | null = null;
        try {
          if (url.startsWith('data:image/svg+xml')) {
            normalizedSvgText = decodeURIComponent(url.replace(/^data:image\/svg\+xml;[^,]*,/, ''));
          } else {
            const resp = await httpClient.getText(url);
            if (resp.ok) {
              normalizedSvgText = resp.data;
            }
          }

          if (normalizedSvgText && normalizedSvgText.includes('<svg')) {
            // Replace currentColor with studio ink so monochrome icons never render invisible
            normalizedSvgText = normalizedSvgText.replace(/currentColor/g, '#18181B');
            if (!/\bwidth=/.test(normalizedSvgText)) {
              normalizedSvgText = normalizedSvgText.replace(
                '<svg',
                '<svg width="512" height="512"',
              );
            }

            try {
              const svgOutput = await loadSVGFromString(normalizedSvgText);
              const validObjects = (svgOutput.objects || []).filter(
                (o): o is FabricObject => o !== null,
              );
              if (validObjects.length > 0) {
                const groupedSvg = util.groupSVGElements(validObjects, svgOutput.options);
                if ((groupedSvg.width ?? 0) > 0 && (groupedSvg.height ?? 0) > 0) {
                  placeAndSelectObject(groupedSvg, 'svg', 0.38);
                  return;
                }
              }
            } catch {
              // Proceed to data-uri rasterized SVG fallback
            }

            const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(normalizedSvgText)}`;
            const svgImg = await FabricImage.fromURL(svgDataUrl);
            if ((svgImg.width ?? 0) > 0) {
              placeAndSelectObject(svgImg, 'svg', 0.38);
              return;
            }
          } else {
            const svgOutput = await loadSVGFromURL(url, undefined, { crossOrigin: 'anonymous' });
            const validObjects = (svgOutput.objects || []).filter(
              (o): o is FabricObject => o !== null,
            );
            if (validObjects.length > 0) {
              const groupedSvg = util.groupSVGElements(validObjects, svgOutput.options);
              placeAndSelectObject(groupedSvg, 'svg', 0.38);
              return;
            }
          }
        } catch (svgErr) {
          console.warn('SVG vector parse fallback triggered:', svgErr);
        }
      }

      // Stage 1: Direct CORS-anonymous FabricImage load
      let img: FabricImage | null = null;
      try {
        img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
      } catch {
        img = null;
      }

      // Stage 2: Blob ObjectURL fetch fallback (bypasses redirect CORS header quirks)
      if (!img || !img.width || !img.height) {
        try {
          const response = await httpClient.getBlob(url);
          if (response.ok) {
            const blobUrl = URL.createObjectURL(response.data);
            this.managedObjectUrls.add(blobUrl);
            img = await FabricImage.fromURL(blobUrl);
          }
        } catch {
          // Proceed to Stage 3
        }
      }

      // Stage 3: Unconstrained HTMLImageElement load without crossOrigin attribute
      if (!img || !img.width || !img.height) {
        img = await FabricImage.fromURL(url);
      }

      placeAndSelectObject(img, 'img', 0.55);
    } catch (err) {
      console.warn('Could not load image onto canvas:', err);
    }
  }

  // --- Canva Curated Templates ---

  public applyTemplate(templateId: string): void {
    if (!this.fabricCanvas) return;

    this.clearObjects();
    const w = this.pageDimensions.width;
    const h = this.pageDimensions.height;

    switch (templateId) {
      case 'flash-sale': {
        this.fabricCanvas.backgroundColor = '#111113';

        // Accent header pill
        const pill = new FabricRect({
          width: 220,
          height: 48,
          rx: 24,
          ry: 24,
          fill: '#FF3B30',
          left: Math.round(w / 2 - 110),
          top: Math.round(h * 0.18),
          name: 'Badge Promo',
        });

        const pillText = new FabricTextbox('EDIÇÃO LIMITADA', {
          fontSize: 18,
          fontWeight: 'bold',
          fill: '#FBFBFD',
          width: 200,
          textAlign: 'center',
          left: Math.round(w / 2 - 100),
          top: Math.round(h * 0.18 + 14),
          name: 'Texto Badge',
        });

        const title = new FabricTextbox('COLEÇÃO 26', {
          fontSize: Math.round(w * 0.13),
          fontWeight: '900',
          fill: '#FFD60A',
          width: Math.round(w * 0.8),
          textAlign: 'center',
          left: Math.round(w * 0.1),
          top: Math.round(h * 0.28),
          name: 'Título Destaque',
        });

        const subtitle = new FabricTextbox('DESIGN ESSENCIAL E ATEMPORAL\nDISPONÍVEL NO ESTÚDIO', {
          fontSize: Math.round(w * 0.04),
          fontWeight: '600',
          fill: '#F5F5F7',
          width: Math.round(w * 0.75),
          textAlign: 'center',
          left: Math.round(w * 0.125),
          top: Math.round(h * 0.52),
          name: 'Subtítulo Promo',
        });

        const ctaBtn = new FabricRect({
          width: 320,
          height: 64,
          rx: 32,
          ry: 32,
          fill: '#0A84FF',
          left: Math.round(w / 2 - 160),
          top: Math.round(h * 0.72),
          name: 'Botão CTA',
        });

        const ctaText = new FabricTextbox('EXPLORAR AGORA', {
          fontSize: 22,
          fontWeight: 'bold',
          fill: '#FBFBFD',
          width: 300,
          textAlign: 'center',
          left: Math.round(w / 2 - 150),
          top: Math.round(h * 0.72 + 20),
          name: 'Texto CTA',
        });

        this.fabricCanvas.add(pill, pillText, title, subtitle, ctaBtn, ctaText);
        break;
      }

      case 'quote-post': {
        this.fabricCanvas.backgroundColor = '#F5F5F7';

        const quoteMark = new FabricTextbox('“', {
          fontSize: Math.round(w * 0.25),
          fontWeight: 'bold',
          fill: '#0071E3',
          width: 140,
          textAlign: 'center',
          left: Math.round(w / 2 - 70),
          top: Math.round(h * 0.12),
          name: 'Aspas',
        });

        const quoteText = new FabricTextbox(
          'O design não é apenas o que parece e o que se sente. O design é como funciona.',
          {
            fontSize: Math.round(w * 0.05),
            fontWeight: '600',
            fill: '#1D1D1F',
            width: Math.round(w * 0.76),
            textAlign: 'center',
            lineHeight: 1.35,
            left: Math.round(w * 0.12),
            top: Math.round(h * 0.38),
            name: 'Frase Citação',
          },
        );

        const author = new FabricTextbox('- Steve Jobs', {
          fontSize: Math.round(w * 0.035),
          fontWeight: 'bold',
          fill: '#6E6E73',
          width: Math.round(w * 0.6),
          textAlign: 'center',
          left: Math.round(w * 0.2),
          top: Math.round(h * 0.72),
          name: 'Autor Citação',
        });

        this.fabricCanvas.add(quoteMark, quoteText, author);
        break;
      }

      case 'product-launch': {
        this.fabricCanvas.backgroundColor = '#0E0E10';

        const backdropCard = new FabricRect({
          width: Math.round(w * 0.84),
          height: Math.round(h * 0.68),
          rx: 24,
          ry: 24,
          fill: '#1C1C1E',
          stroke: '#3A3A3C',
          strokeWidth: 2,
          left: Math.round(w * 0.08),
          top: Math.round(h * 0.16),
          name: 'Card de Fundo',
        });

        const tag = new FabricTextbox('NOVIDADE', {
          fontSize: 16,
          fontWeight: '800',
          fill: '#30D158',
          width: 200,
          textAlign: 'center',
          left: Math.round(w / 2 - 100),
          top: Math.round(h * 0.22),
          name: 'Tag Novidade',
        });

        const headline = new FabricTextbox('NOVA COLEÇÃO\nPREMIUM', {
          fontSize: Math.round(w * 0.08),
          fontWeight: 'bold',
          fill: '#FBFBFD',
          width: Math.round(w * 0.75),
          textAlign: 'center',
          lineHeight: 1.2,
          left: Math.round(w * 0.125),
          top: Math.round(h * 0.3),
          name: 'Título Coleção',
        });

        const desc = new FabricTextbox('Feito para quem valoriza minimalismo e excelência.', {
          fontSize: Math.round(w * 0.035),
          fontWeight: 'normal',
          fill: '#8E8E93',
          width: Math.round(w * 0.68),
          textAlign: 'center',
          left: Math.round(w * 0.16),
          top: Math.round(h * 0.54),
          name: 'Descrição Produto',
        });

        const action = new FabricRect({
          width: 260,
          height: 56,
          rx: 28,
          ry: 28,
          fill: '#FBFBFD',
          left: Math.round(w / 2 - 130),
          top: Math.round(h * 0.66),
          name: 'Botão Conhecer',
        });

        const actionLabel = new FabricTextbox('CONHECER', {
          fontSize: 18,
          fontWeight: 'bold',
          fill: '#18181B',
          width: 240,
          textAlign: 'center',
          left: Math.round(w / 2 - 120),
          top: Math.round(h * 0.66 + 18),
          name: 'Texto Conhecer',
        });

        this.fabricCanvas.add(backdropCard, tag, headline, desc, action, actionLabel);
        break;
      }

      case 'event-webinar':
      default: {
        this.fabricCanvas.backgroundColor = '#192841';

        const shapeAccent = new FabricCircle({
          radius: Math.round(w * 0.35),
          fill: '#0A84FF',
          opacity: 0.25,
          left: Math.round(w * 0.4),
          top: Math.round(-h * 0.1),
          name: 'Circulo Accent',
        });

        const eventTag = new FabricTextbox('AO VIVO • WORKSHOP', {
          fontSize: 16,
          fontWeight: 'bold',
          fill: '#64D2FF',
          width: Math.round(w * 0.7),
          textAlign: 'left',
          left: Math.round(w * 0.12),
          top: Math.round(h * 0.2),
          name: 'Badge Evento',
        });

        const eventTitle = new FabricTextbox('Como Criar Designs\nProfissionais na Web', {
          fontSize: Math.round(w * 0.075),
          fontWeight: 'bold',
          fill: '#FBFBFD',
          width: Math.round(w * 0.76),
          textAlign: 'left',
          lineHeight: 1.25,
          left: Math.round(w * 0.12),
          top: Math.round(h * 0.28),
          name: 'Título Evento',
        });

        const eventDate = new FabricTextbox('Quinta-feira, 20h • Inscrições Gratuitas', {
          fontSize: Math.round(w * 0.038),
          fontWeight: '500',
          fill: '#BF5AF2',
          width: Math.round(w * 0.76),
          textAlign: 'left',
          left: Math.round(w * 0.12),
          top: Math.round(h * 0.58),
          name: 'Data Evento',
        });

        this.fabricCanvas.add(shapeAccent, eventTag, eventTitle, eventDate);
        break;
      }
    }

    this.fabricCanvas.requestRenderAll();
    this.saveHistoryState();
    this.callbacks?.onCanvasChange();
  }

  // --- Contextual Formatting APIs ---

  public updateSelectedProperties(props: Partial<SelectedObjectProperties>): void {
    if (!this.fabricCanvas) return;
    const active = this.fabricCanvas.getActiveObject();
    if (!active) return;

    if (props.fill !== undefined) {
      active.set('fill', props.fill);
    }
    if (props.stroke !== undefined) {
      active.set('stroke', props.stroke);
    }
    if (props.strokeWidth !== undefined) {
      active.set('strokeWidth', props.strokeWidth);
    }
    if (props.opacity !== undefined) {
      active.set('opacity', props.opacity);
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

    this.fabricCanvas.requestRenderAll();
    this.handleSelectionUpdate();
    this.saveHistoryState();
    this.callbacks?.onCanvasChange();
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
    const active = this.fabricCanvas.getActiveObject();
    if (!active) return;

    try {
      const cloned = await active.clone();
      cloned.set({
        left: (active.left || 0) + 24,
        top: (active.top || 0) + 24,
        name: `${(active.get('name') as string) || 'obj'}-copy`,
      });
      this.fabricCanvas.add(cloned);
      this.fabricCanvas.setActiveObject(cloned);
      this.fabricCanvas.requestRenderAll();
      this.handleSelectionUpdate();
      this.saveHistoryState();
    } catch (err) {
      console.warn('Could not duplicate selected object:', err);
    }
  }

  /**
   * PhotoCraft / Photoshop-style "Select Subject" & Background Removal mechanics.
   * 1. Attempts PhotoCraft AI segmentation via backend API if available.
   * 2. Falls back to edge-connected flood-fill segmentation client-side (protecting face & subject interior).
   */
  public async selectSubject(
    mode: 'select' | 'removeBg' = 'select',
  ): Promise<{ success: boolean; message: string }> {
    if (!this.fabricCanvas) return { success: false, message: 'Canvas não inicializado' };

    let active = this.fabricCanvas.getActiveObject();

    // If active is not an image, find the topmost image on the canvas
    if (!active || active.type !== 'image') {
      const objects = this.fabricCanvas.getObjects();
      const imageObj = [...objects].reverse().find((obj) => obj.type === 'image');
      if (imageObj) {
        this.fabricCanvas.setActiveObject(imageObj);
        active = imageObj;
      }
    }

    if (!active || active.type !== 'image') {
      return {
        success: false,
        message: 'Selecione uma imagem na prancheta para usar Selecionar Assunto.',
      };
    }

    const fabricImg = active as FabricImage;
    const imgEl = fabricImg.getElement() as HTMLImageElement;
    if (!imgEl) {
      return { success: false, message: 'Elemento da imagem indisponível.' };
    }

    try {
      const offCanvas = document.createElement('canvas');
      const w = imgEl.naturalWidth || imgEl.width || 800;
      const h = imgEl.naturalHeight || imgEl.height || 600;
      offCanvas.width = w;
      offCanvas.height = h;

      const ctx = offCanvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return { success: false, message: 'Contexto de renderização 2D indisponível.' };

      ctx.drawImage(imgEl, 0, 0, w, h);
      const originalDataUrl = offCanvas.toDataURL('image/png');

      // 1. Try PhotoCraft AI Segmentation via backend API if available
      if (mode === 'removeBg') {
        try {
          const json = await removeImageBackgroundViaApi(originalDataUrl);
          if (json?.success && json.imageBase64) {
            const newImg = await FabricImage.fromURL(json.imageBase64, {
              crossOrigin: 'anonymous',
            });
            newImg.set({
              left: fabricImg.left,
              top: fabricImg.top,
              scaleX: fabricImg.scaleX,
              scaleY: fabricImg.scaleY,
              angle: fabricImg.angle,
              name: `${(fabricImg.get('name') as string) || 'Imagem'} (Recorte IA)`,
            });

            const currentIdx = this.fabricCanvas.getObjects().indexOf(fabricImg);
            this.fabricCanvas.remove(fabricImg);
            if (currentIdx >= 0) {
              this.fabricCanvas.insertAt(currentIdx, newImg);
            } else {
              this.fabricCanvas.add(newImg);
            }

            this.fabricCanvas.setActiveObject(newImg);
            this.fabricCanvas.requestRenderAll();
            this.saveHistoryState();
            this.handleSelectionUpdate();

            return { success: true, message: 'Fundo removido com sucesso via IA PhotoCraft!' };
          }
        } catch {
          // Backend API offline or timed out; proceed seamlessly to client-side flood-fill
        }
      }

      // 2. Client-side Edge-Connected Flood-Fill Segmentation
      // Protects interior pixels (face, eyes, skin, clothing) from being punctured.
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      const visited = new Uint8Array(w * h);
      const queue: number[] = [];
      const seedSamples: Array<[number, number, number]> = [];

      // Sample along top edge (y = 0)
      for (let x = 0; x < w; x += 2) {
        const p = 0 * w + x;
        const idx = p * 4;
        seedSamples.push([data[idx]!, data[idx + 1]!, data[idx + 2]!]);
        visited[p] = 1;
        queue.push(p);
      }

      // Sample along upper sides (top 35% of height)
      const upperH = Math.floor(h * 0.35);
      for (let y = 1; y < upperH; y += 2) {
        const pL = y * w + 0;
        const idxL = pL * 4;
        seedSamples.push([data[idxL]!, data[idxL + 1]!, data[idxL + 2]!]);
        visited[pL] = 1;
        queue.push(pL);

        const pR = y * w + (w - 1);
        const idxR = pR * 4;
        seedSamples.push([data[idxR]!, data[idxR + 1]!, data[idxR + 2]!]);
        visited[pR] = 1;
        queue.push(pR);
      }

      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      for (const s of seedSamples) {
        sumR += s[0];
        sumG += s[1];
        sumB += s[2];
      }
      const seedCount = seedSamples.length || 1;
      const avgSeedR = sumR / seedCount;
      const avgSeedG = sumG / seedCount;
      const avgSeedB = sumB / seedCount;

      const localTol = 24;
      const globalTol = 68;

      let head = 0;
      while (head < queue.length) {
        const p = queue[head++];
        if (p === undefined) break;

        const px = p % w;
        const py = Math.floor(p / w);

        const curIdx = p * 4;
        const curR = data[curIdx]!;
        const curG = data[curIdx + 1]!;
        const curB = data[curIdx + 2]!;

        const neighbors: number[] = [];
        if (px > 0) neighbors.push(p - 1);
        if (px < w - 1) neighbors.push(p + 1);
        if (py > 0) neighbors.push(p - w);
        if (py < h - 1) neighbors.push(p + w);

        for (const n of neighbors) {
          if (visited[n] === 0) {
            const nIdx = n * 4;
            const nr = data[nIdx]!;
            const ng = data[nIdx + 1]!;
            const nb = data[nIdx + 2]!;

            const localDiff = Math.abs(nr - curR) + Math.abs(ng - curG) + Math.abs(nb - curB);
            const globalDiff =
              Math.abs(nr - avgSeedR) + Math.abs(ng - avgSeedG) + Math.abs(nb - avgSeedB);

            if (localDiff <= localTol && globalDiff <= globalTol) {
              visited[n] = 1;
              queue.push(n);
            }
          }
        }
      }

      let minX = w;
      let maxX = 0;
      let minY = h;
      let maxY = 0;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const p = y * w + x;
          const idx = p * 4;

          if (visited[p] === 1) {
            // Background pixel
            if (mode === 'removeBg') {
              // Anti-aliased edge check: touches any subject pixel?
              let touchesSubject = false;
              if (x > 0 && visited[p - 1] === 0) touchesSubject = true;
              else if (x < w - 1 && visited[p + 1] === 0) touchesSubject = true;
              else if (y > 0 && visited[p - w] === 0) touchesSubject = true;
              else if (y < h - 1 && visited[p + w] === 0) touchesSubject = true;

              data[idx + 3] = touchesSubject ? 110 : 0;
            }
          } else {
            // Unvisited = Foreground Subject (Face, body, clothing completely preserved)
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (mode === 'removeBg') {
        ctx.putImageData(imgData, 0, 0);
        const transparentDataUrl = offCanvas.toDataURL('image/png');

        const newImg = await FabricImage.fromURL(transparentDataUrl, { crossOrigin: 'anonymous' });
        newImg.set({
          left: fabricImg.left,
          top: fabricImg.top,
          scaleX: fabricImg.scaleX,
          scaleY: fabricImg.scaleY,
          angle: fabricImg.angle,
          name: `${(fabricImg.get('name') as string) || 'Imagem'} (Recorte)`,
        });

        const currentIdx = this.fabricCanvas.getObjects().indexOf(fabricImg);
        this.fabricCanvas.remove(fabricImg);
        if (currentIdx >= 0) {
          this.fabricCanvas.insertAt(currentIdx, newImg);
        } else {
          this.fabricCanvas.add(newImg);
        }

        this.fabricCanvas.setActiveObject(newImg);
        this.fabricCanvas.requestRenderAll();
        this.saveHistoryState();
        this.handleSelectionUpdate();

        return { success: true, message: 'Fundo removido com sucesso!' };
      } else {
        // mode === 'select'
        this.fabricCanvas.setActiveObject(fabricImg);
        this.fabricCanvas.requestRenderAll();
        this.handleSelectionUpdate();

        const detectedW = Math.max(0, maxX - minX);
        const detectedH = Math.max(0, maxY - minY);
        return {
          success: true,
          message: `Assunto detectado (${detectedW} × ${detectedH} px)!`,
        };
      }
    } catch (err) {
      console.error('Falha ao executar Selecionar Assunto:', err);
      return {
        success: false,
        message: 'Falha ao ler pixels da imagem (pode estar com proteção de domínio CORS).',
      };
    }
  }

  public bringForward(): void {
    if (!this.fabricCanvas) return;
    const active = this.fabricCanvas.getActiveObject();
    if (active) {
      this.fabricCanvas.bringObjectForward(active);
      this.fabricCanvas.requestRenderAll();
      this.callbacks?.onCanvasChange();
    }
  }

  public sendBackward(): void {
    if (!this.fabricCanvas) return;
    const active = this.fabricCanvas.getActiveObject();
    if (active) {
      this.fabricCanvas.sendObjectBackwards(active);
      this.fabricCanvas.requestRenderAll();
      this.callbacks?.onCanvasChange();
    }
  }

  public clearObjects(): void {
    if (!this.fabricCanvas) return;
    const objs = [...this.fabricCanvas.getObjects()];
    objs.forEach((o) => this.fabricCanvas?.remove(o));
    this.fabricCanvas.discardActiveObject();
    this.fabricCanvas.requestRenderAll();
    this.handleSelectionCleared();
  }

  public getLayers(): readonly LayerItem[] {
    if (!this.fabricCanvas) return [];
    const active = this.fabricCanvas.getActiveObject();
    const activeObjects = this.fabricCanvas.getActiveObjects();

    return this.fabricCanvas
      .getObjects()
      .map((obj, index) => {
        const isGroup = Boolean(obj.get('isGroup')) || obj.type === 'group';
        const type = isGroup ? 'group' : this.normalizeObjectType(obj.type);
        const textContent =
          obj instanceof FabricTextbox || obj instanceof FabricIText ? obj.text : undefined;
        let previewUrl: string | undefined;
        if (obj instanceof FabricImage) {
          const imgEl = obj.getElement() as HTMLImageElement | undefined;
          previewUrl = imgEl?.src || (obj.getSrc ? obj.getSrc() : undefined);
        }

        const name =
          (obj.get('name') as string) ||
          (textContent
            ? textContent.slice(0, 24) || 'Texto'
            : isGroup
              ? `Grupo ${index + 1}`
              : `${type} ${index + 1}`);
        const isLocked = Boolean(obj.get('lockMovementX'));
        const visible = obj.visible !== false;
        const opacity = obj.opacity ?? 1;
        const blendMode = (obj.get('globalCompositeOperation') as string) || 'source-over';
        const groupName = obj.get('groupName') as string | undefined;
        const isSelected = obj === active || activeObjects.includes(obj);
        const hasMask = Boolean(obj.get('hasMask'));
        const maskEnabled = obj.get('maskEnabled') !== false;
        const maskInverted = Boolean(obj.get('maskInverted'));

        return {
          id: name,
          name,
          text: textContent,
          previewUrl,
          type,
          isSelected,
          visible,
          locked: isLocked,
          opacity,
          blendMode,
          isGroup,
          groupName: isGroup ? undefined : groupName,
          hasMask,
          maskEnabled,
          maskInverted,
        };
      })
      .reverse();
  }

  /**
   * Non-destructive Layer Mask Engine (Parte VII):
   * Attaches, toggles, inverts, or removes a non-destructive visibility mask on a layer.
   */
  public toggleLayerMask(
    layerName?: string,
    shape: 'circle' | 'rounded' | 'ellipse' = 'circle',
  ): void {
    if (!this.fabricCanvas) return;
    const target = layerName
      ? this.fabricCanvas.getObjects().find((obj) => obj.get('name') === layerName)
      : this.fabricCanvas.getActiveObject();
    if (!target) return;

    const currentlyHasMask = Boolean(target.get('hasMask'));
    if (currentlyHasMask) {
      // Toggle enabled/disabled non-destructively
      const currentlyEnabled = target.get('maskEnabled') !== false;
      if (currentlyEnabled) {
        target.set('_savedMaskClipPath', target.clipPath);
        target.clipPath = undefined;
        target.set('maskEnabled', false);
      } else {
        const saved = target.get('_savedMaskClipPath') as FabricObject | undefined;
        if (saved) {
          target.clipPath = saved;
        }
        target.set('maskEnabled', true);
      }
    } else {
      const objW = Math.max(20, target.width || 200);
      const objH = Math.max(20, target.height || 200);
      let maskObj: FabricObject;

      if (shape === 'rounded') {
        maskObj = new FabricRect({
          originX: 'center',
          originY: 'center',
          left: 0,
          top: 0,
          width: objW * 0.86,
          height: objH * 0.86,
          rx: Math.min(objW, objH) * 0.16,
          ry: Math.min(objW, objH) * 0.16,
        });
      } else if (shape === 'ellipse') {
        maskObj = new FabricEllipse({
          originX: 'center',
          originY: 'center',
          left: 0,
          top: 0,
          rx: objW * 0.44,
          ry: objH * 0.36,
        });
      } else {
        const r = Math.min(objW, objH) * 0.44;
        maskObj = new FabricCircle({
          originX: 'center',
          originY: 'center',
          left: 0,
          top: 0,
          radius: r,
        });
      }

      target.clipPath = maskObj;
      target.set({
        hasMask: true,
        maskEnabled: true,
        maskInverted: false,
        dirty: true,
      });
    }

    target.set('dirty', true);
    this.fabricCanvas.requestRenderAll();
    this.handleSelectionUpdate();
    this.saveHistoryState();
    this.callbacks?.onCanvasChange();
  }

  public invertLayerMask(layerName?: string): void {
    if (!this.fabricCanvas) return;
    const target = layerName
      ? this.fabricCanvas.getObjects().find((obj) => obj.get('name') === layerName)
      : this.fabricCanvas.getActiveObject();
    if (!target || !target.clipPath) return;

    const nextInverted = !target.clipPath.inverted;
    target.clipPath.inverted = nextInverted;
    target.set({
      maskInverted: nextInverted,
      dirty: true,
    });

    this.fabricCanvas.requestRenderAll();
    this.handleSelectionUpdate();
    this.saveHistoryState();
    this.callbacks?.onCanvasChange();
  }

  public removeLayerMask(layerName?: string): void {
    if (!this.fabricCanvas) return;
    const target = layerName
      ? this.fabricCanvas.getObjects().find((obj) => obj.get('name') === layerName)
      : this.fabricCanvas.getActiveObject();
    if (!target) return;

    target.clipPath = undefined;
    target.set({
      _savedMaskClipPath: undefined,
      hasMask: false,
      maskEnabled: false,
      maskInverted: false,
      isCropped: false,
      dirty: true,
    });

    this.fabricCanvas.requestRenderAll();
    this.handleSelectionUpdate();
    this.saveHistoryState();
    this.callbacks?.onCanvasChange();
  }

  /**
   * Non-destructive Object Crop / Clipping Engine (Parte VI):
   * Applies an aspect-ratio or inset crop clipPath to the selected image/element without destroying pixels.
   */
  public applyCropToSelected(mode: '1:1' | '4:3' | '16:9' | 'inset' | 'reset' = 'inset'): void {
    if (!this.fabricCanvas) return;
    const active = this.fabricCanvas.getActiveObject();
    if (!active) return;

    if (mode === 'reset') {
      this.removeLayerMask();
      return;
    }

    const objW = Math.max(20, active.width || 200);
    const objH = Math.max(20, active.height || 200);
    let cropW = objW * 0.82;
    let cropH = objH * 0.82;

    if (mode === '1:1') {
      const side = Math.min(objW, objH) * 0.88;
      cropW = side;
      cropH = side;
    } else if (mode === '4:3') {
      cropW = Math.min(objW * 0.9, objH * (4 / 3) * 0.9);
      cropH = cropW * (3 / 4);
    } else if (mode === '16:9') {
      cropW = Math.min(objW * 0.92, objH * (16 / 9) * 0.92);
      cropH = cropW * (9 / 16);
    }

    const cropClip = new FabricRect({
      originX: 'center',
      originY: 'center',
      left: 0,
      top: 0,
      width: Math.round(cropW),
      height: Math.round(cropH),
      rx: 0,
      ry: 0,
    });

    active.clipPath = cropClip;
    active.set({
      isCropped: true,
      hasMask: true,
      maskEnabled: true,
      maskInverted: false,
      dirty: true,
    });

    this.fabricCanvas.requestRenderAll();
    this.handleSelectionUpdate();
    this.saveHistoryState();
    this.callbacks?.onCanvasChange();
  }

  /**
   * Vector Boolean Path Operations Engine (Parte V):
   * Combines 2 selected shapes (or the 2 topmost shapes) via union, intersect, subtract, or exclude.
   */
  public performBooleanOperation(operation: BooleanPathOperation): void {
    if (!this.fabricCanvas) return;

    let candidates: FabricObject[] = [];
    const active = this.fabricCanvas.getActiveObject();

    if (active && active.type === 'activeselection') {
      candidates = [...(active as ActiveSelection).getObjects()];
      this.fabricCanvas.discardActiveObject();
    } else {
      const allShapes = this.fabricCanvas
        .getObjects()
        .filter((o) => !o.get('isGroup') && !o.type.toLowerCase().includes('text'));
      if (active && allShapes.includes(active)) {
        const others = allShapes.filter((o) => o !== active);
        const partner = others[others.length - 1];
        if (partner) {
          candidates = [partner, active];
        }
      } else if (allShapes.length >= 2) {
        candidates = allShapes.slice(-2);
      }
    }

    if (candidates.length < 2) return;
    const objA = candidates[0]!;
    const objB = candidates[1]!;

    const toWorldPolygon = (obj: FabricObject): Point2D[] => {
      const b = obj.getBoundingRect();
      const t = obj.type.toLowerCase();
      if (t === 'circle' || t === 'ellipse') {
        const cx = b.left + b.width / 2;
        const cy = b.top + b.height / 2;
        const rx = b.width / 2;
        const ry = b.height / 2;
        const pts: Point2D[] = [];
        for (let i = 0; i < 24; i++) {
          const theta = (2 * Math.PI * i) / 24;
          pts.push({ x: cx + Math.cos(theta) * rx, y: cy + Math.sin(theta) * ry });
        }
        return pts;
      }
      if (t === 'triangle') {
        return [
          { x: b.left + b.width / 2, y: b.top },
          { x: b.left + b.width, y: b.top + b.height },
          { x: b.left, y: b.top + b.height },
        ];
      }
      return [
        { x: b.left, y: b.top },
        { x: b.left + b.width, y: b.top },
        { x: b.left + b.width, y: b.top + b.height },
        { x: b.left, y: b.top + b.height },
      ];
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
      // union
      svgPathData = polygonRingsToSvgPath([ringA, ringB]);
      fillRule = 'nonzero';
    }

    if (!svgPathData) return;

    const fill = typeof objA.fill === 'string' ? objA.fill : '#0066CC';
    const stroke = typeof objA.stroke === 'string' ? objA.stroke : 'transparent';
    const strokeWidth = typeof objA.strokeWidth === 'number' ? objA.strokeWidth : 0;

    const minX = Math.min(...[...ringA, ...ringB].map((p) => p.x));
    const minY = Math.min(...[...ringA, ...ringB].map((p) => p.y));

    const booleanPath = new FabricPath(svgPathData, {
      originX: 'left',
      originY: 'top',
      left: Math.round(minX),
      top: Math.round(minY),
      fill,
      stroke,
      strokeWidth,
      fillRule,
      name: `bool-${operation}-${Date.now()}`,
    });

    this.fabricCanvas.remove(objA);
    this.fabricCanvas.remove(objB);
    this.fabricCanvas.add(booleanPath);
    this.fabricCanvas.setActiveObject(booleanPath);
    this.fabricCanvas.requestRenderAll();
    this.handleSelectionUpdate();
    this.saveHistoryState();
    this.callbacks?.onCanvasChange();
  }

  public selectObjectByName(name: string): void {
    if (!this.fabricCanvas) return;
    try {
      this.fabricCanvas.discardActiveObject();
      const target = this.fabricCanvas
        .getObjects()
        .find((obj) => (obj.get('name') as string) === name);

      if (target) {
        this.fabricCanvas.setActiveObject(target);
        this.fabricCanvas.requestRenderAll();
        this.handleSelectionUpdate();
      }
      this.callbacks?.onCanvasChange();
    } catch (err) {
      console.warn('Erro ao selecionar camada:', err);
    }
  }

  public selectObjectsByNames(names: readonly string[]): void {
    if (!this.fabricCanvas) return;
    try {
      this.fabricCanvas.discardActiveObject();
      if (names.length === 0) {
        this.fabricCanvas.requestRenderAll();
        this.handleSelectionCleared();
        return;
      }

      const nameSet = new Set(names);
      const targets = this.fabricCanvas
        .getObjects()
        .filter((obj) => nameSet.has(obj.get('name') as string));

      if (targets.length === 0) {
        this.fabricCanvas.requestRenderAll();
        this.handleSelectionCleared();
      } else if (targets.length === 1) {
        this.fabricCanvas.setActiveObject(targets[0]!);
        this.fabricCanvas.requestRenderAll();
        this.handleSelectionUpdate();
      } else {
        const selection = new ActiveSelection(targets, { canvas: this.fabricCanvas });
        this.fabricCanvas.setActiveObject(selection);
        this.fabricCanvas.requestRenderAll();
        this.handleSelectionUpdate();
      }
      this.callbacks?.onCanvasChange();
    } catch (err) {
      console.warn('Erro ao selecionar múltiplos objetos:', err);
    }
  }

  /**
   * Photoshop-style freehand drawing brush & eraser mechanics.
   * Eraser mode uses 'destination-out' compositing to subtract pixels/strokes from layers.
   */
  public getDrawingTool(): 'none' | 'brush' | 'eraser' {
    return this.currentDrawingTool;
  }

  public setDrawingMode(
    enabled: boolean,
    mode: 'brush' | 'eraser' = 'brush',
    options?: { color?: string; width?: number },
  ): void {
    if (!this.fabricCanvas) return;

    if (!enabled) {
      this.currentDrawingTool = 'none';
      this.fabricCanvas.isDrawingMode = false;
      this.fabricCanvas.requestRenderAll();
      return;
    }

    this.currentDrawingTool = mode;
    this.fabricCanvas.isDrawingMode = true;

    if (options?.color) this.brushColor = options.color;
    if (options?.width) this.brushWidth = options.width;

    const brush = new PencilBrush(this.fabricCanvas);
    brush.width = this.brushWidth;
    brush.color = mode === 'eraser' ? 'rgba(0,0,0,1)' : this.brushColor;
    this.fabricCanvas.freeDrawingBrush = brush;
  }

  /**
   * Photoshop-style object alignment:
   * - Element to Artboard (when 1 object is selected)
   * - Element to Element (when multiple objects / ActiveSelection are selected)
   */
  public alignSelected(alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'): void {
    if (!this.fabricCanvas) return;
    const active = this.fabricCanvas.getActiveObject();
    if (!active) return;

    const artboardW = this.pageDimensions.width;
    const artboardH = this.pageDimensions.height;

    if (active.type === 'activeselection') {
      const activeSel = active as ActiveSelection;
      const objects = [...activeSel.getObjects()];
      if (objects.length < 2) return;

      // Extract bounds before discarding selection
      const selBounds = activeSel.getBoundingRect();

      // In Fabric.js, objects inside ActiveSelection have relative coordinates.
      // To reliably align them, discard the active selection to revert them to absolute canvas coords.
      this.fabricCanvas.discardActiveObject();

      switch (alignment) {
        case 'left':
          objects.forEach((obj) => {
            const objBounds = obj.getBoundingRect();
            obj.set('left', (obj.left || 0) - (objBounds.left - selBounds.left));
            obj.setCoords();
          });
          break;
        case 'center':
          objects.forEach((obj) => {
            const objBounds = obj.getBoundingRect();
            const targetCenter = selBounds.left + selBounds.width / 2;
            const currentCenter = objBounds.left + objBounds.width / 2;
            obj.set('left', (obj.left || 0) + (targetCenter - currentCenter));
            obj.setCoords();
          });
          break;
        case 'right':
          objects.forEach((obj) => {
            const objBounds = obj.getBoundingRect();
            const targetRight = selBounds.left + selBounds.width;
            const currentRight = objBounds.left + objBounds.width;
            obj.set('left', (obj.left || 0) + (targetRight - currentRight));
            obj.setCoords();
          });
          break;
        case 'top':
          objects.forEach((obj) => {
            const objBounds = obj.getBoundingRect();
            obj.set('top', (obj.top || 0) - (objBounds.top - selBounds.top));
            obj.setCoords();
          });
          break;
        case 'middle':
          objects.forEach((obj) => {
            const objBounds = obj.getBoundingRect();
            const targetMiddle = selBounds.top + selBounds.height / 2;
            const currentMiddle = objBounds.top + objBounds.height / 2;
            obj.set('top', (obj.top || 0) + (targetMiddle - currentMiddle));
            obj.setCoords();
          });
          break;
        case 'bottom':
          objects.forEach((obj) => {
            const objBounds = obj.getBoundingRect();
            const targetBottom = selBounds.top + selBounds.height;
            const currentBottom = objBounds.top + objBounds.height;
            obj.set('top', (obj.top || 0) + (targetBottom - currentBottom));
            obj.setCoords();
          });
          break;
      }

      // Re-create the active selection around aligned objects
      const newSelection = new ActiveSelection(objects, { canvas: this.fabricCanvas });
      this.fabricCanvas.setActiveObject(newSelection);
    } else {
      const objW = (active.width || 0) * (active.scaleX || 1);
      const objH = (active.height || 0) * (active.scaleY || 1);

      switch (alignment) {
        case 'left':
          active.set('left', 0);
          break;
        case 'center':
          active.set('left', Math.round((artboardW - objW) / 2));
          break;
        case 'right':
          active.set('left', Math.round(artboardW - objW));
          break;
        case 'top':
          active.set('top', 0);
          break;
        case 'middle':
          active.set('top', Math.round((artboardH - objH) / 2));
          break;
        case 'bottom':
          active.set('top', Math.round(artboardH - objH));
          break;
      }
      active.setCoords();
    }

    this.fabricCanvas.requestRenderAll();
    this.handleSelectionUpdate();
    this.saveHistoryState();
    this.callbacks?.onCanvasChange();
  }

  public distributeSelected(direction: 'horizontal' | 'vertical'): void {
    if (!this.fabricCanvas) return;
    const active = this.fabricCanvas.getActiveObject();
    if (!active || active.type !== 'activeselection') return;

    const activeSel = active as ActiveSelection;
    const objects = [...activeSel.getObjects()];
    if (objects.length < 3) return;

    this.fabricCanvas.discardActiveObject();

    if (direction === 'horizontal') {
      objects.sort((a, b) => a.getBoundingRect().left - b.getBoundingRect().left);
      const first = objects[0]!.getBoundingRect();
      const last = objects[objects.length - 1]!.getBoundingRect();
      const totalSpan = last.left + last.width - first.left;
      const totalObjWidth = objects.reduce((sum, o) => sum + o.getBoundingRect().width, 0);
      const space = (totalSpan - totalObjWidth) / (objects.length - 1);

      let currentX = first.left;
      objects.forEach((obj) => {
        const b = obj.getBoundingRect();
        const dx = currentX - b.left;
        obj.set('left', (obj.left || 0) + dx);
        obj.setCoords();
        currentX += b.width + space;
      });
    } else {
      objects.sort((a, b) => a.getBoundingRect().top - b.getBoundingRect().top);
      const first = objects[0]!.getBoundingRect();
      const last = objects[objects.length - 1]!.getBoundingRect();
      const totalSpan = last.top + last.height - first.top;
      const totalObjHeight = objects.reduce((sum, o) => sum + o.getBoundingRect().height, 0);
      const space = (totalSpan - totalObjHeight) / (objects.length - 1);

      let currentY = first.top;
      objects.forEach((obj) => {
        const b = obj.getBoundingRect();
        const dy = currentY - b.top;
        obj.set('top', (obj.top || 0) + dy);
        obj.setCoords();
        currentY += b.height + space;
      });
    }

    const newSelection = new ActiveSelection(objects, { canvas: this.fabricCanvas });
    this.fabricCanvas.setActiveObject(newSelection);
    this.fabricCanvas.requestRenderAll();
    this.handleSelectionUpdate();
    this.saveHistoryState();
    this.callbacks?.onCanvasChange();
  }

  /**
   * Multi-artboard page switching: preserves canvas objects per page.
   */
  public switchPage(newPageId: string, initialConfig?: CanvasAdapterConfig): void {
    if (!this.fabricCanvas) return;
    if (this.activePageId === newPageId) return;

    try {
      const currentJson = JSON.stringify(this.fabricCanvas.toJSON());
      this.pageStates.set(this.activePageId, currentJson);
    } catch {
      // Ignore JSON serialization in tests
    }

    this.activePageId = newPageId;

    const savedState = this.pageStates.get(newPageId);
    if (savedState) {
      void this.loadJsonState(savedState);
    } else {
      this.clearObjects();
      if (initialConfig) {
        this.syncViewport(initialConfig);
      }
    }
  }

  public removePageState(pageId: string): void {
    this.pageStates.delete(pageId);
  }

  public duplicatePageState(sourcePageId: string, targetPageId: string): void {
    const state = this.pageStates.get(sourcePageId);
    if (state) {
      this.pageStates.set(targetPageId, state);
    }
  }

  public toggleLayerVisibility(name: string): void {
    if (!this.fabricCanvas) return;
    const target = this.fabricCanvas.getObjects().find((obj) => obj.get('name') === name);
    if (!target) return;

    const nextVisible = target.visible === false;
    target.set('visible', nextVisible);

    if (target.get('isGroup')) {
      const members = this.fabricCanvas
        .getObjects()
        .filter((o) => o.get('groupName') === name && !o.get('isGroup'));
      members.forEach((m) => m.set('visible', nextVisible));
    }

    if (!nextVisible && this.fabricCanvas.getActiveObject() === target) {
      this.fabricCanvas.discardActiveObject();
      this.handleSelectionCleared();
    }
    this.fabricCanvas.requestRenderAll();
    this.saveHistoryState();
    this.callbacks?.onCanvasChange();
  }

  public toggleLayerLock(name: string): void {
    if (!this.fabricCanvas) return;
    const target = this.fabricCanvas.getObjects().find((obj) => obj.get('name') === name);
    if (!target) return;

    const currentlyLocked = Boolean(target.get('lockMovementX'));
    const nextLocked = !currentlyLocked;

    target.set({
      lockMovementX: nextLocked,
      lockMovementY: nextLocked,
      lockRotation: nextLocked,
      lockScalingX: nextLocked,
      lockScalingY: nextLocked,
      hasControls: !nextLocked,
    });

    if (target.get('isGroup')) {
      const members = this.fabricCanvas
        .getObjects()
        .filter((o) => o.get('groupName') === name && !o.get('isGroup'));
      members.forEach((m) =>
        m.set({
          lockMovementX: nextLocked,
          lockMovementY: nextLocked,
          lockRotation: nextLocked,
          lockScalingX: nextLocked,
          lockScalingY: nextLocked,
          hasControls: !nextLocked,
        }),
      );
    }

    this.fabricCanvas.requestRenderAll();
    this.saveHistoryState();
    this.callbacks?.onCanvasChange();
  }

  public setLayerOpacity(name: string, opacity: number): void {
    if (!this.fabricCanvas) return;
    const target = this.fabricCanvas.getObjects().find((obj) => obj.get('name') === name);
    if (!target) return;

    target.set('opacity', Math.max(0, Math.min(1, opacity)));
    this.fabricCanvas.requestRenderAll();
    this.saveHistoryState();
    this.callbacks?.onCanvasChange();
  }

  public setLayerBlendMode(name: string, blendMode: string): void {
    if (!this.fabricCanvas) return;
    const target = this.fabricCanvas.getObjects().find((obj) => obj.get('name') === name);
    if (!target) return;

    target.set('globalCompositeOperation', blendMode);
    this.fabricCanvas.requestRenderAll();
    this.saveHistoryState();
    this.callbacks?.onCanvasChange();
  }

  public renameLayer(oldName: string, newName: string): void {
    if (!this.fabricCanvas || !newName.trim()) return;
    const target = this.fabricCanvas.getObjects().find((obj) => obj.get('name') === oldName);
    if (!target) return;

    const trimmed = newName.trim();
    target.set('name', trimmed);
    if (target instanceof FabricTextbox) {
      target.set('text', trimmed);
    }
    this.fabricCanvas.requestRenderAll();
    this.saveHistoryState();
    this.callbacks?.onCanvasChange();
  }

  public reorderLayer(name: string, direction: 'up' | 'down'): void {
    if (!this.fabricCanvas) return;
    const target = this.fabricCanvas.getObjects().find((obj) => obj.get('name') === name);
    if (!target) return;

    if (direction === 'up') {
      // In Photoshop UI, moving "up" means bringing forward in visual stack
      this.fabricCanvas.bringObjectForward(target);
    } else {
      this.fabricCanvas.sendObjectBackwards(target);
    }

    this.fabricCanvas.requestRenderAll();
    this.saveHistoryState();
    this.callbacks?.onCanvasChange();
  }

  public reorderLayerToIndex(name: string, targetVisualIndex: number): void {
    if (!this.fabricCanvas) return;
    const objects = this.fabricCanvas.getObjects();
    const target = objects.find((obj) => obj.get('name') === name);
    if (!target) return;

    // Convert from visual index (where 0 is top of layers list) to Fabric stack index (0 is bottom of canvas)
    const targetZIndex = Math.max(
      0,
      Math.min(objects.length - 1, objects.length - 1 - targetVisualIndex),
    );
    this.fabricCanvas.moveObjectTo(target, targetZIndex);
    this.fabricCanvas.requestRenderAll();
    this.saveHistoryState();
    this.callbacks?.onCanvasChange();
  }

  public createGroup(name?: string): void {
    if (!this.fabricCanvas) return;
    try {
      const activeObjs = [...this.fabricCanvas.getActiveObjects()];
      const groupCount =
        this.fabricCanvas.getObjects().filter((o) => o.type === 'group' || o.get('isGroup'))
          .length + 1;
      const groupName = name || `Grupo ${groupCount}`;

      if (activeObjs.length > 1) {
        // Photoshop True Grouping: Convert multiple selected elements into a real FabricGroup
        this.fabricCanvas.discardActiveObject();
        activeObjs.forEach((o) => this.fabricCanvas?.remove(o));

        const group = new FabricGroup(activeObjs, {
          subTargetCheck: true,
          interactive: true,
        });
        group.set('name', groupName);
        group.set('isGroup', true);
        group.set('groupName', groupName);

        this.fabricCanvas.add(group);
        this.fabricCanvas.setActiveObject(group);
      } else {
        // Create an empty folder frame if no multiple objects selected
        let left = Math.round(this.pageDimensions.width * 0.15);
        let top = Math.round(this.pageDimensions.height * 0.15);
        let width = Math.round(this.pageDimensions.width * 0.7);
        let height = Math.round(this.pageDimensions.height * 0.4);

        if (activeObjs.length === 1 && activeObjs[0]) {
          const single = activeObjs[0];
          left = single.left || left;
          top = single.top || top;
          width = (single.width || 100) * (single.scaleX || 1);
          height = (single.height || 100) * (single.scaleY || 1);
          this.fabricCanvas.discardActiveObject();
          this.fabricCanvas.remove(single);
          const group = new FabricGroup([single], {
            subTargetCheck: true,
            interactive: true,
          });
          group.set('name', groupName);
          group.set('isGroup', true);
          group.set('groupName', groupName);
          this.fabricCanvas.add(group);
          this.fabricCanvas.setActiveObject(group);
        } else {
          const group = new FabricGroup([], {
            left,
            top,
            width,
            height,
            subTargetCheck: true,
            interactive: true,
          });
          group.set('name', groupName);
          group.set('isGroup', true);
          group.set('groupName', groupName);
          this.fabricCanvas.add(group);
          this.fabricCanvas.setActiveObject(group);
        }
      }

      this.fabricCanvas.requestRenderAll();
      this.handleSelectionUpdate();
      this.saveHistoryState();
      this.callbacks?.onCanvasChange();
    } catch (err) {
      console.warn('Erro ao criar grupo:', err);
    }
  }

  public ungroupSelected(): void {
    if (!this.fabricCanvas) return;
    try {
      const active = this.fabricCanvas.getActiveObject();
      if (!active || !(active instanceof FabricGroup)) return;

      const objects = [...active.getObjects()];
      this.fabricCanvas.remove(active);

      objects.forEach((obj) => {
        this.fabricCanvas?.add(obj);
        obj.setCoords();
      });

      if (objects.length > 0) {
        const sel = new ActiveSelection(objects, { canvas: this.fabricCanvas });
        this.fabricCanvas.setActiveObject(sel);
      }

      this.fabricCanvas.requestRenderAll();
      this.handleSelectionUpdate();
      this.saveHistoryState();
      this.callbacks?.onCanvasChange();
    } catch (err) {
      console.warn('Erro ao desagrupar:', err);
    }
  }

  public addCleanLayer(name?: string): void {
    if (!this.fabricCanvas) return;
    const count = this.fabricCanvas.getObjects().filter((o) => !o.get('isGroup')).length + 1;
    const layerName = name || `Camada ${count}`;

    const cleanLayer = new FabricRect({
      left: Math.round(this.pageDimensions.width * 0.1),
      top: Math.round(this.pageDimensions.height * 0.1),
      width: Math.round(this.pageDimensions.width * 0.8),
      height: Math.round(this.pageDimensions.height * 0.8),
      fill: 'transparent',
      stroke: 'transparent',
      strokeWidth: 0,
      name: layerName,
    });
    cleanLayer.set('isCleanLayer', true);

    this.fabricCanvas.add(cleanLayer);
    this.fabricCanvas.setActiveObject(cleanLayer);
    this.fabricCanvas.requestRenderAll();
    this.handleSelectionUpdate();
    this.saveHistoryState();
    this.callbacks?.onCanvasChange();
  }

  public deleteLayerByName(name: string): void {
    if (!this.fabricCanvas) return;
    const target = this.fabricCanvas.getObjects().find((obj) => obj.get('name') === name);
    if (!target) return;

    if (target.get('isGroup')) {
      const members = this.fabricCanvas.getObjects().filter((o) => o.get('groupName') === name);
      members.forEach((m) => this.fabricCanvas?.remove(m));
    } else {
      this.fabricCanvas.remove(target);
    }

    if (this.fabricCanvas.getActiveObject() === target) {
      this.fabricCanvas.discardActiveObject();
      this.handleSelectionCleared();
    }
    this.fabricCanvas.requestRenderAll();
    this.saveHistoryState();
    this.callbacks?.onCanvasChange();
  }

  // --- History & Undo / Redo ---

  private saveHistoryState(): void {
    if (!this.fabricCanvas || this.isHistoryLocked) return;
    try {
      const json = JSON.stringify(this.fabricCanvas.toJSON());
      // Truncate future states if we modified after undo
      if (this.historyIndex < this.historyStack.length - 1) {
        this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);
      }
      this.historyStack.push(json);
      if (this.historyStack.length > this.maxHistoryStates) {
        this.historyStack.shift();
      }
      this.historyIndex = this.historyStack.length - 1;
    } catch {
      // Ignored in headless/test environments
    }
  }

  public canUndo(): boolean {
    return this.historyIndex > 0;
  }

  public canRedo(): boolean {
    return this.historyIndex < this.historyStack.length - 1;
  }

  public async undo(): Promise<void> {
    if (!this.canUndo() || !this.fabricCanvas) return;
    this.historyIndex -= 1;
    const targetState = this.historyStack[this.historyIndex];
    if (targetState) {
      await this.loadJsonState(targetState);
    }
  }

  public async redo(): Promise<void> {
    if (!this.canRedo() || !this.fabricCanvas) return;
    this.historyIndex += 1;
    const targetState = this.historyStack[this.historyIndex];
    if (targetState) {
      await this.loadJsonState(targetState);
    }
  }

  private async loadJsonState(json: string): Promise<void> {
    if (!this.fabricCanvas) return;
    this.isHistoryLocked = true;
    try {
      await this.fabricCanvas.loadFromJSON(JSON.parse(json));
      this.fabricCanvas.requestRenderAll();
      this.handleSelectionUpdate();
      this.callbacks?.onCanvasChange();
    } finally {
      this.isHistoryLocked = false;
    }
  }

  // --- Export APIs ---

  public exportDataUrl(format: 'png' | 'jpeg' = 'png', quality = 0.95): string {
    if (!this.fabricCanvas) return '';
    const scale = this.currentScale || 1;
    const scaledMargin = Math.round(this.bleedMargin * scale);
    const scaledWidth = Math.round(this.pageDimensions.width * scale);
    const scaledHeight = Math.round(this.pageDimensions.height * scale);

    const offCanvas = document.createElement('canvas');
    offCanvas.width = this.pageDimensions.width;
    offCanvas.height = this.pageDimensions.height;
    const ctx = offCanvas.getContext('2d');
    if (!ctx) return '';

    // 1. Draw page background
    ctx.fillStyle = this.backgroundColor || '#FBFBFD';
    ctx.fillRect(0, 0, this.pageDimensions.width, this.pageDimensions.height);

    // 2. Draw artboard area from fabric canvas
    const src = this.fabricCanvas.lowerCanvasEl || this.fabricCanvas.getElement();
    if (src) {
      ctx.drawImage(
        src,
        scaledMargin,
        scaledMargin,
        scaledWidth,
        scaledHeight,
        0,
        0,
        this.pageDimensions.width,
        this.pageDimensions.height,
      );
    }

    return offCanvas.toDataURL(format === 'jpeg' ? 'image/jpeg' : 'image/png', quality);
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
    this.isMounted = false;
  }
}
