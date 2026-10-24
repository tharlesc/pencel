import { useEffect, type ReactElement } from 'react';
import { EditorShell } from '../../components/layout/EditorShell.js';
import { Dialog } from '../../components/ui/index.js';
import { CanvasWorkspace } from '../../features/editor/components/CanvasWorkspace.js';
import { ExportDialog } from '../../features/editor/components/ExportDialog.js';
import { SidebarNav } from '../../features/editor/components/SidebarNav.js';
import { TopToolbar } from '../../features/editor/components/TopToolbar.js';
import { useCanvasEngine } from '../../features/editor/hooks/useCanvasEngine.js';
import { useEditorSession } from '../../features/editor/state/useEditorSession.js';
import { useTheme } from '../providers/ThemeProvider.js';

export function EditorRoute(): ReactElement {
  const { theme, toggleTheme } = useTheme();
  const session = useEditorSession();

  const engine = useCanvasEngine({
    dimensions: session.activePage.dimensions,
    zoom: session.zoom,
    backgroundColor: session.activePage.backgroundColor,
    onSelectionChange: session.setSelectedObject,
    onLayersChange: session.setLayers,
  });

  const { switchPage } = engine;

  // Switch canvas artboard context whenever active page changes
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

  return (
    <>
      <EditorShell
        topBar={
          <TopToolbar
            documentTitle={session.document.title}
            onTitleChange={session.setDocumentTitle}
            canUndo={engine.canUndo}
            canRedo={engine.canRedo}
            onUndo={engine.undo}
            onRedo={engine.redo}
            theme={theme}
            onToggleTheme={toggleTheme}
            onOpenSchemaDialog={session.openSchemaDialog}
            onOpenExportDialog={session.openExportDialog}
            isSidebarOpen={session.isDrawerOpen}
            onToggleSidebar={session.toggleDrawer}
            presetId={session.document.presetId}
            dimensions={session.activePage.dimensions}
          />
        }
        sidebar={
          <SidebarNav
            activeCategory={session.sidebarCategory}
            onSelectCategory={session.setSidebarCategory}
            isDrawerOpen={session.isDrawerOpen}
            onToggleDrawer={session.toggleDrawer}
            activePresetId={session.document.presetId}
            onSelectPreset={session.selectPreset}
            onApplyTemplate={engine.applyTemplate}
            onAddText={engine.addText}
            onAddShape={engine.addShape}
            onAddImage={engine.addImage}
            pageBackground={session.activePage.backgroundColor}
            onPageBackgroundChange={session.setPageBackground}
            layers={session.layers}
            selectedObject={session.selectedObject}
            onSelectLayer={engine.selectObjectByName}
            onSelectMultipleLayers={engine.selectObjectsByNames}
            onDeleteSelected={engine.deleteSelected}
            onBringForward={engine.bringForward}
            onSendBackward={engine.sendBackward}
            onToggleLayerVisibility={engine.toggleLayerVisibility}
            onToggleLayerLock={engine.toggleLayerLock}
            onSetLayerOpacity={engine.setLayerOpacity}
            onSetLayerBlendMode={engine.setLayerBlendMode}
            onRenameLayer={engine.renameLayer}
            onReorderLayer={engine.reorderLayer}
            onReorderLayerToIndex={engine.reorderLayerToIndex}
            onAddGroup={engine.createGroup}
            onAddCleanLayer={engine.addCleanLayer}
            onDeleteLayerByName={engine.deleteLayerByName}
            onDuplicateSelected={engine.duplicateSelected}
            onCustomDimensionsCreate={(dim) => session.setPageDimensions(dim)}
            onToggleLayerMask={engine.toggleLayerMask}
            onInvertLayerMask={engine.invertLayerMask}
            onRemoveLayerMask={engine.removeLayerMask}
            onPerformBooleanOperation={engine.performBooleanOperation}
          />
        }
        workspace={
          <CanvasWorkspace
            page={session.activePage}
            activePageIndex={session.activePageIndex}
            pageCount={session.pageCount}
            onNextPage={session.nextPage}
            onPrevPage={session.prevPage}
            onAddPage={() => session.addPage()}
            onDuplicatePage={session.duplicatePage}
            onDeletePage={(id) => session.deletePage(id)}
            zoom={session.zoom}
            canvasRef={engine.canvasRef}
            selectedObject={session.selectedObject}
            elementCount={session.layers.length}
            onZoomIn={session.zoomIn}
            onZoomOut={session.zoomOut}
            onResetZoom={session.resetZoomToFit}
            onPageBackgroundChange={session.setPageBackground}
            onUpdateObject={engine.updateSelectedProperties}
            onDeleteSelected={engine.deleteSelected}
            onDuplicateSelected={engine.duplicateSelected}
            onBringForward={engine.bringForward}
            onSendBackward={engine.sendBackward}
            onClearCanvas={engine.clearCanvas}
            onSelectSubject={engine.selectSubject}
            onDeselectAll={engine.deselectAll}
            onAlignSelected={engine.alignSelected}
            onDistributeSelected={engine.distributeSelected}
            onSetDrawingMode={engine.setDrawingMode}
            currentDrawingTool={engine.getDrawingTool()}
            onApplyCrop={engine.applyCropToSelected}
            onToggleLayerMask={engine.toggleLayerMask}
            onPerformBooleanOperation={engine.performBooleanOperation}
            onSetClipToArtboard={engine.setClipToArtboard}
          />
        }
      />

      {/* Canva Style Download / Export Dialog */}
      <ExportDialog
        open={session.isExportDialogOpen}
        onClose={session.closeExportDialog}
        dimensions={session.activePage.dimensions}
        documentTitle={session.document.title}
        onExportImage={engine.exportImage}
        serializedJson={session.serializedPreview}
      />

      {/* JSON Schema Inspection Modal */}
      <Dialog
        open={session.isSchemaDialogOpen}
        title="Modelo Serializado do Documento (@pencel/editor-core)"
        description="Representação JSON pura e versionada (schemaVersion: 1), independente da instância do Fabric.js."
        onClose={session.closeSchemaDialog}
      >
        <pre
          style={{
            margin: 0,
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-surface-secondary)',
            border: 'var(--border-width-hairline) solid var(--color-border-subtle)',
            fontFamily: 'var(--font-family-mono)',
            fontSize: 'var(--font-size-xs)',
            overflowX: 'auto',
          }}
        >
          <code>{session.serializedPreview}</code>
        </pre>
      </Dialog>
    </>
  );
}
