import type { BooleanPathOperation, ShapeVariant } from '@pencel/editor-core';
import type { Dimensions } from '@pencel/shared-types';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import {
  FabricCanvasAdapter,
  type LayerItem,
  type SelectedObjectProperties,
} from '../engine/FabricCanvasAdapter.js';
import type { EngineLifecycleState } from '../types/editorUi.types.js';

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
  readonly addImage: (url: string) => Promise<void>;
  readonly applyTemplate: (templateId: string) => void;
  readonly updateSelectedProperties: (props: Partial<SelectedObjectProperties>) => void;
  readonly deleteSelected: () => void;
  readonly duplicateSelected: () => void;
  readonly bringForward: () => void;
  readonly sendBackward: () => void;
  readonly clearCanvas: () => void;
  readonly undo: () => Promise<void>;
  readonly redo: () => Promise<void>;
  readonly exportImage: (format: 'png' | 'jpeg') => string;
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
  readonly addCleanLayer: (name?: string) => void;
  readonly deleteLayerByName: (name: string) => void;
  readonly selectSubject: (
    mode?: 'select' | 'removeBg',
  ) => Promise<{ success: boolean; message: string }>;
  readonly deselectAll: () => void;
  readonly getDrawingTool: () => 'none' | 'brush' | 'eraser';
  readonly setDrawingMode: (
    enabled: boolean,
    mode?: 'brush' | 'eraser',
    options?: { color?: string; width?: number },
  ) => void;
  readonly alignSelected: (
    alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom',
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
        onSelectionChange: (props) => {
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
        adapterRef.current?.createGroup();
        syncHistoryState();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        // Copy active
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        // Paste active (duplicate)
        e.preventDefault();
        void adapterRef.current?.duplicateSelected().then(syncHistoryState);
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === 'v') {
        // Photoshop V shortcut: Select tool
        adapterRef.current?.setDrawingMode(false);
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === 'b') {
        // Photoshop B shortcut: Brush tool
        adapterRef.current?.setDrawingMode(true, 'brush');
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === 'e') {
        // Photoshop E shortcut: Eraser tool
        adapterRef.current?.setDrawingMode(true, 'eraser');
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
    async (url: string) => {
      await adapterRef.current?.addImageFromUrl(url);
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

  const exportImage = useCallback((format: 'png' | 'jpeg') => {
    return adapterRef.current?.exportDataUrl(format) || '';
  }, []);

  const selectObjectByName = useCallback((name: string) => {
    adapterRef.current?.selectObjectByName(name);
  }, []);

  const selectObjectsByNames = useCallback((names: readonly string[]) => {
    adapterRef.current?.selectObjectsByNames(names);
  }, []);

  const setDrawingMode = useCallback(
    (
      enabled: boolean,
      mode: 'brush' | 'eraser' = 'brush',
      options?: { color?: string; width?: number },
    ) => {
      adapterRef.current?.setDrawingMode(enabled, mode, options);
    },
    [],
  );

  const alignSelected = useCallback(
    (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
      adapterRef.current?.alignSelected(alignment);
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
    adapterRef.current?.toggleLayerVisibility(name);
  }, []);

  const toggleLayerLock = useCallback((name: string) => {
    adapterRef.current?.toggleLayerLock(name);
  }, []);

  const setLayerOpacity = useCallback((name: string, opacity: number) => {
    adapterRef.current?.setLayerOpacity(name, opacity);
  }, []);

  const setLayerBlendMode = useCallback((name: string, blendMode: string) => {
    adapterRef.current?.setLayerBlendMode(name, blendMode);
  }, []);

  const renameLayer = useCallback((oldName: string, newName: string) => {
    adapterRef.current?.renameLayer(oldName, newName);
  }, []);

  const reorderLayer = useCallback((name: string, direction: 'up' | 'down') => {
    adapterRef.current?.reorderLayer(name, direction);
  }, []);

  const reorderLayerToIndex = useCallback((name: string, targetVisualIndex: number) => {
    adapterRef.current?.reorderLayerToIndex(name, targetVisualIndex);
  }, []);

  const createGroup = useCallback((name?: string) => {
    adapterRef.current?.createGroup(name);
  }, []);

  const addCleanLayer = useCallback((name?: string) => {
    adapterRef.current?.addCleanLayer(name);
  }, []);

  const deleteLayerByName = useCallback((name: string) => {
    adapterRef.current?.deleteLayerByName(name);
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
    return adapterRef.current?.getDrawingTool() ?? 'none';
  }, []);

  const getAdapter = useCallback(() => adapterRef.current, []);

  return {
    canvasRef,
    engineState,
    getAdapter,
    canUndo,
    canRedo,
    addText,
    addShape,
    addImage,
    applyTemplate,
    updateSelectedProperties,
    deleteSelected,
    duplicateSelected,
    bringForward,
    sendBackward,
    clearCanvas,
    undo,
    redo,
    exportImage,
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
    addCleanLayer,
    deleteLayerByName,
    selectSubject,
    deselectAll,
    getDrawingTool,
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
