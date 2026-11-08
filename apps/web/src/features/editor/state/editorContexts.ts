import type { DesignDocument, DesignPage } from '@pencel/editor-core';
import type { Dimensions, PresetId } from '@pencel/shared-types';
import { createContext, useContext } from 'react';
import type { LayerItem, SelectedObjectProperties } from '../engine/FabricCanvasAdapter.js';
import type { UseCanvasEngineResult } from '../hooks/useCanvasEngine.js';
import type { SidebarCategory } from '../types/editorUi.types.js';

export interface EditorSessionContextValue {
  readonly document: DesignDocument;
  readonly activePage: DesignPage;
  readonly activePageIndex: number;
  readonly pageCount: number;
  readonly sidebarCategory: SidebarCategory;
  readonly isDrawerOpen: boolean;
  readonly zoom: number;
  readonly isSchemaDialogOpen: boolean;
  readonly isExportDialogOpen: boolean;
  readonly isCameraRawOpen: boolean;
  readonly isNewDocumentModalOpen: boolean;
  readonly isVectorizeOpen: boolean;
  readonly serializedPreview: string;
  readonly setDocumentTitle: (title: string) => void;
  readonly createNewDocument: (
    dimensions: Dimensions,
    title?: string,
    backgroundColor?: string,
  ) => void;
  readonly selectPreset: (presetId: PresetId) => void;
  readonly setPageDimensions: (dimensions: Dimensions) => void;
  readonly setPageBackground: (color: string) => void;
  readonly setSidebarCategory: (category: SidebarCategory) => void;
  readonly toggleDrawer: () => void;
  readonly setZoom: (zoom: number) => void;
  readonly zoomIn: () => void;
  readonly zoomOut: () => void;
  readonly resetZoomToFit: () => void;
  readonly openSchemaDialog: () => void;
  readonly closeSchemaDialog: () => void;
  readonly openExportDialog: () => void;
  readonly closeExportDialog: () => void;
  readonly openCameraRaw: () => void;
  readonly closeCameraRaw: () => void;
  readonly openNewDocumentModal: () => void;
  readonly closeNewDocumentModal: () => void;
  readonly openVectorize: () => void;
  readonly closeVectorize: () => void;
  readonly addPage: (options?: {
    name?: string;
    dimensions?: Dimensions;
    backgroundColor?: string;
  }) => void;
  readonly duplicatePage: () => void;
  readonly deletePage: (pageId: string) => void;
  readonly renamePage: (pageId: string, name: string) => void;
  readonly setActivePage: (pageId: string) => void;
  readonly nextPage: () => void;
  readonly prevPage: () => void;
}

export interface EditorSelectionContextValue {
  readonly selectedObject: SelectedObjectProperties | null;
  readonly setSelectedObject: (props: SelectedObjectProperties | null) => void;
}

export interface EditorLayersContextValue {
  readonly layers: readonly LayerItem[];
  readonly setLayers: (layers: readonly LayerItem[]) => void;
}

export const EditorSessionContext = createContext<EditorSessionContextValue | null>(null);
export const EditorSelectionContext = createContext<EditorSelectionContextValue | null>(null);
export const EditorLayersContext = createContext<EditorLayersContextValue | null>(null);
export const EditorEngineContext = createContext<UseCanvasEngineResult | null>(null);

export function useEditorSessionContext(): EditorSessionContextValue {
  const ctx = useContext(EditorSessionContext);
  if (!ctx) {
    throw new Error('useEditorSessionContext must be used within an <EditorProvider>.');
  }
  return ctx;
}

export function useEditorSessionSelector<T>(selector: (state: EditorSessionContextValue) => T): T {
  const ctx = useEditorSessionContext();
  return selector(ctx);
}

export function useEditorSelectionContext(): EditorSelectionContextValue {
  const ctx = useContext(EditorSelectionContext);
  if (!ctx) {
    throw new Error('useEditorSelectionContext must be used within an <EditorProvider>.');
  }
  return ctx;
}

export function useEditorSelectionSelector<T>(
  selector: (state: EditorSelectionContextValue) => T,
): T {
  const ctx = useEditorSelectionContext();
  return selector(ctx);
}

export function useEditorLayersContext(): EditorLayersContextValue {
  const ctx = useContext(EditorLayersContext);
  if (!ctx) {
    throw new Error('useEditorLayersContext must be used within an <EditorProvider>.');
  }
  return ctx;
}

export function useEditorLayersSelector<T>(selector: (state: EditorLayersContextValue) => T): T {
  const ctx = useEditorLayersContext();
  return selector(ctx);
}

export function useEditorEngineContext(): UseCanvasEngineResult {
  const ctx = useContext(EditorEngineContext);
  if (!ctx) {
    throw new Error('useEditorEngineContext must be used within an <EditorProvider>.');
  }
  return ctx;
}

export function useOptionalEditorSession(): EditorSessionContextValue | null {
  return useContext(EditorSessionContext);
}

export function useOptionalEditorSelection(): EditorSelectionContextValue | null {
  return useContext(EditorSelectionContext);
}

export function useOptionalEditorLayers(): EditorLayersContextValue | null {
  return useContext(EditorLayersContext);
}

export function useOptionalEditorEngine(): UseCanvasEngineResult | null {
  return useContext(EditorEngineContext);
}
