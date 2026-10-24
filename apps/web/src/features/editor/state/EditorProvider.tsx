import { useEffect, useMemo, type ReactElement, type ReactNode } from 'react';
import { useCanvasEngine } from '../hooks/useCanvasEngine.js';
import {
  EditorEngineContext,
  EditorLayersContext,
  EditorSelectionContext,
  EditorSessionContext,
  type EditorLayersContextValue,
  type EditorSelectionContextValue,
  type EditorSessionContextValue,
} from './editorContexts.js';
import { useEditorSession } from './useEditorSession.js';

export {
  useEditorEngineContext,
  useEditorLayersContext,
  useEditorLayersSelector,
  useEditorSelectionContext,
  useEditorSelectionSelector,
  useEditorSessionContext,
  useEditorSessionSelector,
  useOptionalEditorEngine,
  useOptionalEditorLayers,
  useOptionalEditorSelection,
  useOptionalEditorSession,
  type EditorLayersContextValue,
  type EditorSelectionContextValue,
  type EditorSessionContextValue,
} from './editorContexts.js';

export interface EditorProviderProps {
  readonly children: ReactNode;
}

export function EditorProvider({ children }: EditorProviderProps): ReactElement {
  const session = useEditorSession();

  const engine = useCanvasEngine({
    dimensions: session.activePage.dimensions,
    zoom: session.zoom,
    backgroundColor: session.activePage.backgroundColor,
    onSelectionChange: session.setSelectedObject,
    onLayersChange: session.setLayers,
  });

  const { switchPage } = engine;

  useEffect(() => {
    switchPage(session.activePage.id, {
      dimensions: session.activePage.dimensions,
      displayScale: session.zoom,
      backgroundColor: session.activePage.backgroundColor,
    });
  }, [
    session.activePage.id,
    session.activePage.dimensions,
    session.activePage.backgroundColor,
    session.zoom,
    switchPage,
  ]);

  const sessionValue = useMemo<EditorSessionContextValue>(
    () => ({
      document: session.document,
      activePage: session.activePage,
      activePageIndex: session.activePageIndex,
      pageCount: session.pageCount,
      sidebarCategory: session.sidebarCategory,
      isDrawerOpen: session.isDrawerOpen,
      zoom: session.zoom,
      isSchemaDialogOpen: session.isSchemaDialogOpen,
      isExportDialogOpen: session.isExportDialogOpen,
      serializedPreview: session.serializedPreview,
      setDocumentTitle: session.setDocumentTitle,
      selectPreset: session.selectPreset,
      setPageDimensions: session.setPageDimensions,
      setPageBackground: session.setPageBackground,
      setSidebarCategory: session.setSidebarCategory,
      toggleDrawer: session.toggleDrawer,
      setZoom: session.setZoom,
      zoomIn: session.zoomIn,
      zoomOut: session.zoomOut,
      resetZoomToFit: session.resetZoomToFit,
      openSchemaDialog: session.openSchemaDialog,
      closeSchemaDialog: session.closeSchemaDialog,
      openExportDialog: session.openExportDialog,
      closeExportDialog: session.closeExportDialog,
      addPage: session.addPage,
      duplicatePage: session.duplicatePage,
      deletePage: session.deletePage,
      setActivePage: session.setActivePage,
      nextPage: session.nextPage,
      prevPage: session.prevPage,
    }),
    [
      session.document,
      session.activePage,
      session.activePageIndex,
      session.pageCount,
      session.sidebarCategory,
      session.isDrawerOpen,
      session.zoom,
      session.isSchemaDialogOpen,
      session.isExportDialogOpen,
      session.serializedPreview,
      session.setDocumentTitle,
      session.selectPreset,
      session.setPageDimensions,
      session.setPageBackground,
      session.setSidebarCategory,
      session.toggleDrawer,
      session.setZoom,
      session.zoomIn,
      session.zoomOut,
      session.resetZoomToFit,
      session.openSchemaDialog,
      session.closeSchemaDialog,
      session.openExportDialog,
      session.closeExportDialog,
      session.addPage,
      session.duplicatePage,
      session.deletePage,
      session.setActivePage,
      session.nextPage,
      session.prevPage,
    ],
  );

  const selectionValue = useMemo<EditorSelectionContextValue>(
    () => ({
      selectedObject: session.selectedObject,
      setSelectedObject: session.setSelectedObject,
    }),
    [session.selectedObject, session.setSelectedObject],
  );

  const layersValue = useMemo<EditorLayersContextValue>(
    () => ({
      layers: session.layers,
      setLayers: session.setLayers,
    }),
    [session.layers, session.setLayers],
  );

  return (
    <EditorSessionContext.Provider value={sessionValue}>
      <EditorSelectionContext.Provider value={selectionValue}>
        <EditorLayersContext.Provider value={layersValue}>
          <EditorEngineContext.Provider value={engine}>{children}</EditorEngineContext.Provider>
        </EditorLayersContext.Provider>
      </EditorSelectionContext.Provider>
    </EditorSessionContext.Provider>
  );
}
