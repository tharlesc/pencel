import {
  addPageToDocument,
  createEmptyDocument,
  deletePageFromDocument,
  duplicateActivePage,
  getActivePage,
  renamePageInDocument,
  serializeDocument,
  setActivePageInDocument,
  updateActivePageBackground,
  updateActivePageDimensions,
  updateDocumentPreset,
  type DesignDocument,
  type DesignPage,
} from '@pencel/editor-core';
import type { Dimensions, PresetId } from '@pencel/shared-types';
import { useCallback, useMemo, useState } from 'react';
import type { LayerItem, SelectedObjectProperties } from '../engine/FabricCanvasAdapter.js';
import type { SidebarCategory } from '../types/editorUi.types.js';
import { ZOOM_STEP, clampZoom, computeRecommendedZoom } from '../utils/zoomUtils.js';

export interface EditorSessionController {
  readonly document: DesignDocument;
  readonly activePage: DesignPage;
  readonly activePageIndex: number;
  readonly pageCount: number;
  readonly sidebarCategory: SidebarCategory;
  readonly isDrawerOpen: boolean;
  readonly selectedObject: SelectedObjectProperties | null;
  readonly layers: readonly LayerItem[];
  readonly zoom: number;
  readonly isSchemaDialogOpen: boolean;
  readonly isExportDialogOpen: boolean;
  readonly isCameraRawOpen: boolean;
  readonly isNewDocumentModalOpen: boolean;
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
  readonly setSelectedObject: (props: SelectedObjectProperties | null) => void;
  readonly setLayers: (layers: readonly LayerItem[]) => void;
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

export function useEditorSession(): EditorSessionController {
  const [document, setDocument] = useState<DesignDocument>(() =>
    createEmptyDocument({
      title: 'Design Criativo - Canva Style',
      presetId: 'instagram-post',
    }),
  );
  const [sidebarCategory, setSidebarCategoryState] = useState<SidebarCategory>('design');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true);
  const [selectedObject, setSelectedObject] = useState<SelectedObjectProperties | null>(null);
  const [layers, setLayers] = useState<readonly LayerItem[]>([]);

  const activePage = useMemo(() => getActivePage(document), [document]);
  const activePageIndex = useMemo(
    () => document.pages.findIndex((p) => p.id === document.activePageId),
    [document.pages, document.activePageId],
  );
  const pageCount = document.pages.length;

  const [zoom, setZoomState] = useState<number>(() =>
    computeRecommendedZoom(activePage.dimensions),
  );

  const [isSchemaDialogOpen, setIsSchemaDialogOpen] = useState<boolean>(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState<boolean>(false);
  const [isCameraRawOpen, setIsCameraRawOpen] = useState<boolean>(false);
  const [isNewDocumentModalOpen, setIsNewDocumentModalOpen] = useState<boolean>(false);

  const openNewDocumentModal = useCallback(() => {
    setIsNewDocumentModalOpen(true);
  }, []);

  const closeNewDocumentModal = useCallback(() => {
    setIsNewDocumentModalOpen(false);
  }, []);

  const setDocumentTitle = useCallback((title: string) => {
    setDocument((prev) => ({
      ...prev,
      title,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const selectPreset = useCallback((presetId: PresetId) => {
    setDocument((prev) => {
      const nextDoc = updateDocumentPreset(prev, presetId);
      const nextPage = getActivePage(nextDoc);
      setZoomState(computeRecommendedZoom(nextPage.dimensions));
      return nextDoc;
    });
  }, []);

  const createNewDocument = useCallback(
    (dimensions: Dimensions, title?: string, backgroundColor?: string) => {
      const nextDoc = createEmptyDocument({
        title: title ?? `Documento sem título`,
      });
      const updated = updateActivePageDimensions(nextDoc, dimensions);
      const finalDoc = backgroundColor
        ? updateActivePageBackground(updated, backgroundColor)
        : updated;
      setDocument(finalDoc);
      setZoomState(computeRecommendedZoom(dimensions));
    },
    [],
  );

  const setPageDimensions = useCallback((dimensions: Dimensions) => {
    setDocument((prev) => updateActivePageDimensions(prev, dimensions));
    setZoomState(computeRecommendedZoom(dimensions));
  }, []);

  const setPageBackground = useCallback((color: string) => {
    setDocument((prev) => updateActivePageBackground(prev, color));
  }, []);

  const setSidebarCategory = useCallback((category: SidebarCategory) => {
    setSidebarCategoryState(category);
    setIsDrawerOpen(true);
  }, []);

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen((prev) => !prev);
  }, []);

  const setZoom = useCallback((newZoom: number) => {
    setZoomState(clampZoom(newZoom));
  }, []);

  const zoomIn = useCallback(() => {
    setZoomState((prev) => clampZoom(prev + ZOOM_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomState((prev) => clampZoom(prev - ZOOM_STEP));
  }, []);

  const resetZoomToFit = useCallback(() => {
    setZoomState(computeRecommendedZoom(activePage.dimensions));
  }, [activePage.dimensions]);

  const openSchemaDialog = useCallback(() => setIsSchemaDialogOpen(true), []);
  const closeSchemaDialog = useCallback(() => setIsSchemaDialogOpen(false), []);

  const openExportDialog = useCallback(() => setIsExportDialogOpen(true), []);
  const closeExportDialog = useCallback(() => setIsExportDialogOpen(false), []);

  const openCameraRaw = useCallback(() => {
    setSidebarCategory('cameraRaw');
    setIsDrawerOpen(true);
    setIsCameraRawOpen(true);
  }, [setSidebarCategory]);
  const closeCameraRaw = useCallback(() => {
    setIsCameraRawOpen(false);
  }, []);

  const addPage = useCallback(
    (options?: { name?: string; dimensions?: Dimensions; backgroundColor?: string }) => {
      setDocument((prev) => addPageToDocument(prev, options));
    },
    [],
  );

  const duplicatePage = useCallback(() => {
    setDocument((prev) => duplicateActivePage(prev));
  }, []);

  const deletePage = useCallback((pageId: string) => {
    setDocument((prev) => deletePageFromDocument(prev, pageId));
  }, []);

  const renamePage = useCallback((pageId: string, name: string) => {
    setDocument((prev) => renamePageInDocument(prev, pageId, name));
  }, []);

  const setActivePage = useCallback((pageId: string) => {
    setDocument((prev) => setActivePageInDocument(prev, pageId));
  }, []);

  const nextPage = useCallback(() => {
    setDocument((prev) => {
      const idx = prev.pages.findIndex((p) => p.id === prev.activePageId);
      if (idx >= 0 && idx < prev.pages.length - 1) {
        return setActivePageInDocument(prev, prev.pages[idx + 1]!.id);
      }
      return prev;
    });
  }, []);

  const prevPage = useCallback(() => {
    setDocument((prev) => {
      const idx = prev.pages.findIndex((p) => p.id === prev.activePageId);
      if (idx > 0) {
        return setActivePageInDocument(prev, prev.pages[idx - 1]!.id);
      }
      return prev;
    });
  }, []);

  const serializedPreview = useMemo(() => serializeDocument(document), [document]);

  return {
    document,
    activePage,
    activePageIndex: Math.max(0, activePageIndex),
    pageCount,
    sidebarCategory,
    isDrawerOpen,
    selectedObject,
    layers,
    zoom,
    isSchemaDialogOpen,
    isExportDialogOpen,
    isCameraRawOpen,
    isNewDocumentModalOpen,
    serializedPreview,
    setDocumentTitle,
    createNewDocument,
    selectPreset,
    setPageDimensions,
    setPageBackground,
    setSidebarCategory,
    toggleDrawer,
    setSelectedObject,
    setLayers,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoomToFit,
    openSchemaDialog,
    closeSchemaDialog,
    openExportDialog,
    closeExportDialog,
    openCameraRaw,
    closeCameraRaw,
    openNewDocumentModal,
    closeNewDocumentModal,
    addPage,
    duplicatePage,
    deletePage,
    renamePage,
    setActivePage,
    nextPage,
    prevPage,
  };
}
