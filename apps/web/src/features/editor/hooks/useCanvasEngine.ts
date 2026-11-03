import type { BooleanPathOperation, ShapeVariant } from '@pencel/editor-core';
import type { Dimensions } from '@pencel/shared-types';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { CameraRawAdjustments } from '../engine/cameraRawEngine.js';
import {
  FabricCanvasAdapter,
  type EditorToolMode,
  type LayerItem,
  type SelectedObjectProperties,
} from '../engine/FabricCanvasAdapter.js';
import type { EngineLifecycleState } from '../types/editorUi.types.js';
import type { GeneratedLayoutDto } from '../services/aiLayoutService.js';

export interface UseCanvasEngineParams {
  readonly dimensions: Dimensions;
  readonly zoom: number;
  readonly backgroundColor: string;
  readonly onSelectionChange: (selected: SelectedObjectProperties | null) => void;
  readonly onLayersChange?: (layers: readonly LayerItem[]) => void;
}

export interface UseCanvasEngineResult {
  readonly canvasRef: RefObject<HTMLCanvasElement | null>;
  readonly engineState: EngineLifecycleState;
  readonly getAdapter: () => FabricCanvasAdapter | null;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly addText: (options: {
    text: string;
    fontSize?: number;
    fontWeight?: string | number;
    fontFamily?: string;
    fill?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    boxMode?: 'point' | 'area';
  }) => void;
  readonly addShape: (options: {
    shapeVariant: ShapeVariant;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  }) => void;
  readonly addImage: (url: string, fallbackUrl?: string) => Promise<void>;
  readonly addImageFromUrl: (url: string, altText?: string, fallbackUrl?: string) => Promise<void>;
  readonly applyTemplate: (templateId: string) => void;
  readonly applyGeneratedLayout: (layout: GeneratedLayoutDto) => void;
  readonly updateSelectedProperties: (props: Partial<SelectedObjectProperties>) => void;
  readonly deleteSelected: () => void;
  readonly duplicateSelected: () => void;
  readonly bringForward: () => void;
  readonly sendBackward: () => void;
  readonly clearCanvas: () => void;
  readonly undo: () => Promise<void>;
  readonly redo: () => Promise<void>;
  readonly exportImage: (format: 'png' | 'jpeg', quality?: number, maxDimension?: number) => string;
  readonly exportSvg: () => string;
  readonly loadDesignJson: (jsonStr: string) => Promise<boolean>;
  readonly selectObjectByName: (name: string) => void;
  readonly selectObjectsByNames: (names: readonly string[]) => void;
  readonly toggleLayerVisibility: (name: string) => void;
  readonly toggleLayerLock: (name: string) => void;
  readonly setLayerOpacity: (name: string, opacity: number) => void;
  readonly setLayerBlendMode: (name: string, blendMode: string) => void;
  readonly renameLayer: (oldName: string, newName: string) => void;
  readonly reorderLayer: (name: string, direction: 'up' | 'down') => void;
  readonly reorderLayerToIndex: (name: string, targetVisualIndex: number) => void;
  readonly createGroup: (name?: string) => void;
  readonly ungroupSelected: () => void;
  readonly assignLayerToGroup: (layerName: string, groupName: string | null) => void;
  readonly addCleanLayer: (name?: string) => void;
  readonly deleteLayerByName: (name: string) => void;
  readonly selectSubject: (
    mode?: 'select' | 'removeBg',
  ) => Promise<{ success: boolean; message: string }>;
  readonly deselectAll: () => void;
  readonly toolMode: EditorToolMode;
  readonly drawingTool: 'none' | 'brush' | 'eraser';
  readonly getToolMode: () => EditorToolMode;
  readonly setToolMode: (mode: EditorToolMode) => void;
  readonly finishPenPath: (isClosed?: boolean) => void;
  readonly getDrawingTool: () => 'none' | 'brush' | 'eraser';
  readonly getBrushWidth: () => number;
  readonly getBrushHardness: () => number;
  readonly getBrushSoftness: () => number;
  readonly getBrushSmoothness: () => number;
  readonly getBrushColor: () => string;
  readonly setDrawingMode: (
    enabled: boolean,
    mode?: 'brush' | 'eraser',
    options?: {
      color?: string;
      width?: number;
      smoothness?: number;
      hardness?: number;
      softness?: number;
    },
  ) => void;
  readonly alignSelected: (
    alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom',
    target?: 'artboard' | 'selection',
  ) => void;
  readonly distributeSelected: (direction: 'horizontal' | 'vertical') => void;
  readonly switchPage: (
    pageId: string,
    config?: { dimensions: Dimensions; displayScale: number; backgroundColor: string },
  ) => void;
  readonly toggleLayerMask: (layerName?: string, shape?: 'circle' | 'rounded' | 'ellipse') => void;
  readonly invertLayerMask: (layerName?: string) => void;
  readonly removeLayerMask: (layerName?: string) => void;
  readonly applyCropToSelected: (mode?: '1:1' | '4:3' | '16:9' | 'inset' | 'reset') => void;
  readonly performBooleanOperation: (operation: BooleanPathOperation) => void;
  readonly isClipToArtboard: () => boolean;
  readonly setClipToArtboard: (enabled: boolean) => void;
  readonly applyCameraRaw: (adjustments: CameraRawAdjustments) => void;
  readonly getCameraRaw: () => CameraRawAdjustments | null;
}

export function useCanvasEngine({
  dimensions,
  zoom,
  backgroundColor,
  onSelectionChange,
  onLayersChange,
}: UseCanvasEngineParams): UseCanvasEngineResult {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const adapterRef = useRef<FabricCanvasAdapter | null>(null);
  const [engineState, setEngineState] = useState<EngineLifecycleState>('initializing');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [drawingTool, setDrawingTool] = useState<'none' | 'brush' | 'eraser'>('none');
  const [toolMode, setToolModeState] = useState<EditorToolMode>('select');
  const [brushWidth, setBrushWidthState] = useState<number>(8);
  const [brushHardness, setBrushHardnessState] = useState<number>(100);
  const [brushSmoothness, setBrushSmoothnessState] = useState<number>(50);
  const [brushColor, setBrushColorState] = useState<string>('#1D1D1F');

  const callbacksRef = useRef({ onSelectionChange, onLayersChange });
  useEffect(() => {
    callbacksRef.current = { onSelectionChange, onLayersChange };
  }, [onSelectionChange, onLayersChange]);

  const syncHistoryState = useCallback(() => {
    if (adapterRef.current) {
      setCanUndo(adapterRef.current.canUndo());
      setCanRedo(adapterRef.current.canRedo());
      callbacksRef.current.onLayersChange?.(adapterRef.current.getLayers());
    }
  }, []);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const adapter = new FabricCanvasAdapter();
    adapterRef.current = adapter;

    const mounted = adapter.mount(
      canvasEl,
      {
        dimensions,
        displayScale: zoom,
        backgroundColor,
      },
      {
        onSelectionChange: (props: SelectedObjectProperties | null) => {
          callbacksRef.current.onSelectionChange(props);
          syncHistoryState();
        },
        onCanvasChange: () => {
          syncHistoryState();
        },
      },
    );

    setEngineState(mounted ? 'ready' : 'fallback');
    syncHistoryState();

    return () => {
      adapter.dispose();
      adapterRef.current = null;
      setEngineState('disposed');
    };
    // Lifecycle setup once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    adapterRef.current?.syncViewport({
      dimensions,
      displayScale: zoom,
      backgroundColor,
    });
  }, [dimensions, zoom, backgroundColor]);

  // Keyboard shortcut listener for canvas operations (Delete, Backspace, Ctrl+Z, Ctrl+Y, Ctrl+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Don't intercept if user is typing in an input or textarea
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        adapterRef.current?.deleteSelected();
        syncHistoryState();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          void adapterRef.current?.redo().then(syncHistoryState);
        } else {
          void adapterRef.current?.undo().then(syncHistoryState);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        void adapterRef.current?.redo().then(syncHistoryState);
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === 'd' || e.key.toLowerCase() === 'j')
      ) {
        e.preventDefault();
        void adapterRef.current?.duplicateSelected().then(syncHistoryState);
      } else if ((e.ctrlKey || e.metaKey) && e.key === ']') {
        e.preventDefault();
        adapterRef.current?.bringForward();
        syncHistoryState();
      } else if ((e.ctrlKey || e.metaKey) && e.key === '[') {
        e.preventDefault();
        adapterRef.current?.sendBackward();
        syncHistoryState();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        adapterRef.current?.layers.createGroup();
        syncHistoryState();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        // Copy active
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        // Paste active (duplicate)
        e.preventDefault();
        void adapterRef.current?.duplicateSelected().then(syncHistoryState);
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === 'i') {
        // Photoshop I shortcut: Eyedropper / Pipette
        if (typeof (window as unknown as { EyeDropper?: unknown }).EyeDropper !== 'undefined') {
          type EyeDropperInstance = { open: () => Promise<{ sRGBHex: string }> };
          type EyeDropperConstructor = new () => EyeDropperInstance;
          const EyeDropperClass = (window as unknown as { EyeDropper: EyeDropperConstructor })
            .EyeDropper;
          const dropper = new EyeDropperClass();
          dropper
            .open()
            .then((result) => {
              if (result.sRGBHex) {
                adapterRef.current?.updateSelectedProperties({ fill: result.sRGBHex });
                syncHistoryState();
              }
            })
            .catch(() => {});
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [syncHistoryState]);

  const addText = useCallback(
    (options: {
      text: string;
      fontSize?: number;
      fontWeight?: string | number;
      fontFamily?: string;
      fill?: string;
      textAlign?: 'left' | 'center' | 'right' | 'justify';
      boxMode?: 'point' | 'area';
    }) => {
      adapterRef.current?.addText(options);
      syncHistoryState();
    },
    [syncHistoryState],
  );

  const addShape = useCallback(
    (options: {
      shapeVariant: ShapeVariant;
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
    }) => {
      adapterRef.current?.addShape(options);
      syncHistoryState();
    },
    [syncHistoryState],
  );

  const addImage = useCallback(
    async (url: string, fallbackUrl?: string) => {
      await adapterRef.current?.addImageFromUrl(url, 'Imagem', fallbackUrl);
      syncHistoryState();
    },
    [syncHistoryState],
  );

  const applyTemplate = useCallback(
    (templateId: string) => {
      adapterRef.current?.applyTemplate(templateId);
      syncHistoryState();
    },
    [syncHistoryState],
  );

  const applyGeneratedLayout = useCallback(
    (layout: GeneratedLayoutDto) => {
      adapterRef.current?.applyGeneratedLayout(layout);
      syncHistoryState();
    },
    [syncHistoryState],
  );

  const updateSelectedProperties = useCallback(
    (props: Partial<SelectedObjectProperties>) => {
      adapterRef.current?.updateSelectedProperties(props);
      syncHistoryState();
    },
    [syncHistoryState],
  );

  const deleteSelected = useCallback(() => {
    adapterRef.current?.deleteSelected();
    syncHistoryState();
  }, [syncHistoryState]);

  const duplicateSelected = useCallback(() => {
    void adapterRef.current?.duplicateSelected().then(syncHistoryState);
  }, [syncHistoryState]);

  const bringForward = useCallback(() => {
    adapterRef.current?.bringForward();
    syncHistoryState();
  }, [syncHistoryState]);

  const sendBackward = useCallback(() => {
    adapterRef.current?.sendBackward();
    syncHistoryState();
  }, [syncHistoryState]);

  const clearCanvas = useCallback(() => {
    adapterRef.current?.clearObjects();
    syncHistoryState();
  }, [syncHistoryState]);

  const undo = useCallback(async () => {
    await adapterRef.current?.undo();
    syncHistoryState();
  }, [syncHistoryState]);

  const redo = useCallback(async () => {
    await adapterRef.current?.redo();
    syncHistoryState();
  }, [syncHistoryState]);

  const exportImage = useCallback(
    (format: 'png' | 'jpeg', quality = 0.95, maxDimension?: number) => {
      return adapterRef.current?.exportDataUrl(format, quality, maxDimension) || '';
    },
    [],
  );

  const exportSvg = useCallback(() => {
    return adapterRef.current?.exportSvg() ?? '';
  }, []);

  const loadDesignJson = useCallback(async (jsonStr: string) => {
    if (!adapterRef.current) return false;
    await adapterRef.current.loadJsonState(jsonStr);
    return true;
  }, []);

  const addImageFromUrl = useCallback(
    async (url: string, altText?: string, fallbackUrl?: string) => {
      await adapterRef.current?.addImageFromUrl(url, altText, fallbackUrl);
      syncHistoryState();
    },
    [syncHistoryState],
  );

  const assignLayerToGroup = useCallback((layerName: string, groupName: string | null) => {
    adapterRef.current?.layers.assignToGroup(layerName, groupName);
  }, []);

  const ungroupSelected = useCallback(() => {
    adapterRef.current?.layers.ungroupSelected();
  }, []);

  const selectObjectByName = useCallback((name: string) => {
    adapterRef.current?.selectObjectByName(name);
  }, []);

  const selectObjectsByNames = useCallback((names: readonly string[]) => {
    adapterRef.current?.selectObjectsByNames(names);
  }, []);

  const setToolMode = useCallback((mode: EditorToolMode) => {
    setToolModeState(mode);
    if (mode === 'brush' || mode === 'eraser') {
      setDrawingTool(mode);
    } else {
      setDrawingTool('none');
    }
    adapterRef.current?.setToolMode(mode);
  }, []);

  const getToolMode = useCallback(() => toolMode, [toolMode]);

  const finishPenPath = useCallback((isClosed = true) => {
    adapterRef.current?.finishPenPath(isClosed);
  }, []);

  const setDrawingMode = useCallback(
    (
      enabled: boolean,
      mode: 'brush' | 'eraser' = 'brush',
      options?: {
        color?: string;
        width?: number;
        smoothness?: number;
        hardness?: number;
        softness?: number;
      },
    ) => {
      const nextTool = enabled ? mode : 'none';
      setDrawingTool(nextTool);
      setToolModeState((prev) => {
        if (enabled) return mode;
        return prev === 'brush' || prev === 'eraser' ? 'select' : prev;
      });
      if (options?.width) setBrushWidthState(options.width);
      if (options?.color) setBrushColorState(options.color);
      if (options?.softness !== undefined) setBrushHardnessState(100 - options.softness);
      if (options?.hardness !== undefined) setBrushHardnessState(options.hardness);
      if (options?.smoothness !== undefined) setBrushSmoothnessState(options.smoothness);
      adapterRef.current?.setDrawingMode(enabled, mode, options);
    },
    [],
  );

  const alignSelected = useCallback(
    (
      alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom',
      target?: 'artboard' | 'selection',
    ) => {
      adapterRef.current?.alignSelected(alignment, target);
      syncHistoryState();
    },
    [syncHistoryState],
  );

  const distributeSelected = useCallback(
    (direction: 'horizontal' | 'vertical') => {
      adapterRef.current?.distributeSelected(direction);
      syncHistoryState();
    },
    [syncHistoryState],
  );

  const switchPage = useCallback(
    (
      pageId: string,
      config?: { dimensions: Dimensions; displayScale: number; backgroundColor: string },
    ) => {
      adapterRef.current?.switchPage(pageId, config);
      syncHistoryState();
    },
    [syncHistoryState],
  );

  const toggleLayerVisibility = useCallback((name: string) => {
    adapterRef.current?.layers.toggleVisibility(name);
  }, []);

  const toggleLayerLock = useCallback((name: string) => {
    adapterRef.current?.layers.toggleLock(name);
  }, []);

  const setLayerOpacity = useCallback((name: string, opacity: number) => {
    adapterRef.current?.layers.setOpacity(name, opacity);
  }, []);

  const setLayerBlendMode = useCallback((name: string, blendMode: string) => {
    adapterRef.current?.layers.setBlendMode(name, blendMode);
  }, []);

  const renameLayer = useCallback((oldName: string, newName: string) => {
    adapterRef.current?.layers.rename(oldName, newName);
  }, []);

  const reorderLayer = useCallback((name: string, direction: 'up' | 'down') => {
    adapterRef.current?.layers.reorder(name, direction);
  }, []);

  const reorderLayerToIndex = useCallback((name: string, targetVisualIndex: number) => {
    adapterRef.current?.layers.reorderToIndex(name, targetVisualIndex);
  }, []);

  const createGroup = useCallback((name?: string) => {
    adapterRef.current?.layers.createGroup(name);
  }, []);

  const addCleanLayer = useCallback((name?: string) => {
    adapterRef.current?.layers.addCleanLayer(name);
  }, []);

  const deleteLayerByName = useCallback((name: string) => {
    adapterRef.current?.layers.deleteByName(name);
  }, []);

  const toggleLayerMask = useCallback(
    (layerName?: string, shape: 'circle' | 'rounded' | 'ellipse' = 'circle') => {
      adapterRef.current?.toggleLayerMask(layerName, shape);
      syncHistoryState();
    },
    [syncHistoryState],
  );

  const invertLayerMask = useCallback(
    (layerName?: string) => {
      adapterRef.current?.invertLayerMask(layerName);
      syncHistoryState();
    },
    [syncHistoryState],
  );

  const removeLayerMask = useCallback(
    (layerName?: string) => {
      adapterRef.current?.removeLayerMask(layerName);
      syncHistoryState();
    },
    [syncHistoryState],
  );

  const applyCropToSelected = useCallback(
    (mode: '1:1' | '4:3' | '16:9' | 'inset' | 'reset' = 'inset') => {
      adapterRef.current?.applyCropToSelected(mode);
      syncHistoryState();
    },
    [syncHistoryState],
  );

  const performBooleanOperation = useCallback(
    (operation: BooleanPathOperation) => {
      adapterRef.current?.performBooleanOperation(operation);
      syncHistoryState();
    },
    [syncHistoryState],
  );

  const isClipToArtboard = useCallback(() => {
    return adapterRef.current?.isClipToArtboard() ?? true;
  }, []);

  const setClipToArtboard = useCallback((enabled: boolean) => {
    adapterRef.current?.setClipToArtboard(enabled);
  }, []);

  const selectSubject = useCallback(async (mode: 'select' | 'removeBg' = 'select') => {
    if (!adapterRef.current) return { success: false, message: 'Motor não inicializado' };
    return adapterRef.current.selectSubject(mode);
  }, []);

  const deselectAll = useCallback(() => {
    adapterRef.current?.discardActiveObject();
  }, []);

  const getDrawingTool = useCallback(() => {
    return drawingTool;
  }, [drawingTool]);

  const getBrushWidth = useCallback(() => {
    return brushWidth;
  }, [brushWidth]);

  const getBrushHardness = useCallback(() => {
    return brushHardness;
  }, [brushHardness]);

  const getBrushSoftness = useCallback(() => {
    return 100 - brushHardness;
  }, [brushHardness]);

  const getBrushSmoothness = useCallback(() => {
    return brushSmoothness;
  }, [brushSmoothness]);

  const getBrushColor = useCallback(() => {
    return brushColor;
  }, [brushColor]);

  const applyCameraRaw = useCallback((adjustments: CameraRawAdjustments) => {
    adapterRef.current?.applyCameraRaw(adjustments);
  }, []);

  const getCameraRaw = useCallback(() => {
    return adapterRef.current?.getCameraRaw() ?? null;
  }, []);

  const getAdapter = useCallback(() => adapterRef.current, []);

  return {
    canvasRef,
    engineState,
    getAdapter,
    canUndo,
    canRedo,
    applyCameraRaw,
    getCameraRaw,
    addText,
    addShape,
    addImage,
    addImageFromUrl,
    applyTemplate,
    applyGeneratedLayout,
    updateSelectedProperties,
    deleteSelected,
    duplicateSelected,
    bringForward,
    sendBackward,
    clearCanvas,
    undo,
    redo,
    exportImage,
    exportSvg,
    loadDesignJson,
    selectObjectByName,
    selectObjectsByNames,
    toggleLayerVisibility,
    toggleLayerLock,
    setLayerOpacity,
    setLayerBlendMode,
    renameLayer,
    reorderLayer,
    reorderLayerToIndex,
    createGroup,
    ungroupSelected,
    assignLayerToGroup,
    addCleanLayer,
    deleteLayerByName,
    selectSubject,
    deselectAll,
    toolMode,
    drawingTool,
    getToolMode,
    setToolMode,
    finishPenPath,
    getDrawingTool,
    getBrushWidth,
    getBrushHardness,
    getBrushSoftness,
    getBrushSmoothness,
    getBrushColor,
    setDrawingMode,
    alignSelected,
    distributeSelected,
    switchPage,
    toggleLayerMask,
    invertLayerMask,
    removeLayerMask,
    applyCropToSelected,
    performBooleanOperation,
    isClipToArtboard,
    setClipToArtboard,
  };
}
