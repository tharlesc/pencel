import { useRef, useState, type ReactElement } from 'react';
import { useCanvasDropZone } from '../../hooks/useCanvasDropZone.js';
import { useCanvasGuides } from '../../hooks/useCanvasGuides.js';
import { useCanvasShortcuts } from '../../hooks/useCanvasShortcuts.js';
import { useCanvasViewportPan } from '../../hooks/useCanvasViewportPan.js';
import {
  useOptionalEditorEngine,
  useOptionalEditorLayers,
  useOptionalEditorSelection,
  useOptionalEditorSession,
} from '../../state/EditorProvider.js';
import type { CanvasWorkspaceProps } from '../../types/canvasWorkspace.types.js';
import {
  FALLBACK_PAGE,
  getSavedToolbarPosition,
  saveToolbarPosition,
} from '../../types/canvasWorkspace.types.js';
import { CanvasArtboardDrawer } from '../CanvasArtboardDrawer/index.js';
import { CanvasBottomHud } from '../CanvasBottomHud/index.js';
import { CanvasStageViewport } from '../CanvasStageViewport/index.js';
import styles from './CanvasWorkspace.module.css';
import { ContextualToolbar } from '../ContextualToolbar/index.js';
import { FloatingStudioToolbar } from '../FloatingStudioToolbar/index.js';
import { GuideLayoutModal } from '../GuideLayoutModal/index.js';
import { exportGuideSlices } from '../../engine/guideLayoutEngine.js';

export type { CanvasWorkspaceProps } from '../../types/canvasWorkspace.types.js';

const NOOP = (): void => {};

export function CanvasWorkspace(props: CanvasWorkspaceProps): ReactElement {
  const session = useOptionalEditorSession();
  const selection = useOptionalEditorSelection();
  const layersCtx = useOptionalEditorLayers();
  const engine = useOptionalEditorEngine();
  const fallbackCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const page = props.page ?? session?.activePage ?? FALLBACK_PAGE;
  const activePageIndex = props.activePageIndex ?? session?.activePageIndex ?? 0;
  const pageCount = props.pageCount ?? session?.pageCount ?? 1;
  const zoom = props.zoom ?? session?.zoom ?? 0.5;
  const canvasRef = props.canvasRef ?? engine?.canvasRef ?? fallbackCanvasRef;
  const selectedObject =
    props.selectedObject !== undefined ? props.selectedObject : (selection?.selectedObject ?? null);
  const elementCount = props.elementCount ?? layersCtx?.layers.length ?? 0;
  const onZoomIn = props.onZoomIn ?? session?.zoomIn ?? NOOP;
  const onZoomOut = props.onZoomOut ?? session?.zoomOut ?? NOOP;
  const onResetZoom = props.onResetZoom ?? session?.resetZoomToFit ?? NOOP;
  const onPageBackgroundChange = props.onPageBackgroundChange ?? session?.setPageBackground ?? NOOP;
  const onDeselectAll = props.onDeselectAll ?? engine?.deselectAll;
  const onSetClipToArtboard = props.onSetClipToArtboard ?? engine?.setClipToArtboard;

  const currentDrawingTool = engine?.drawingTool ?? props.currentDrawingTool ?? 'none';
  const currentToolMode = engine?.toolMode ?? 'select';
  const isDrawing = currentDrawingTool === 'brush' || currentDrawingTool === 'eraser';
  const [brushCursor, setBrushCursor] = useState<{ x: number; y: number } | null>(null);

  const activeBrushWidth = engine?.getBrushWidth() ?? 8;
  const activeBrushHardness = engine?.getBrushHardness() ?? 100;
  const activeBrushSmoothness = engine?.getBrushSmoothness() ?? 50;

  const [clipArtboard, setClipArtboard] = useState(true);
  const [showArtboardDrawer, setShowArtboardDrawer] = useState(false);
  const [floatingToolbarPosition, setFloatingToolbarPosition] = useState<'bottom' | 'left'>(
    getSavedToolbarPosition,
  );

  const handleFloatingToolbarPositionChange = (pos: 'bottom' | 'left'): void => {
    setFloatingToolbarPosition(pos);
    saveToolbarPosition(pos);
  };

  const artboardRef = useRef<HTMLDivElement | null>(null);

  const displayWidth = Math.max(1, Math.round(page.dimensions.width * zoom));
  const displayHeight = Math.max(1, Math.round(page.dimensions.height * zoom));

  const {
    viewportRef,
    pan,
    setPan,
    isPanning,
    isSpaceDown,
    handleSpaceStateChange,
    handleMouseDown,
  } = useCanvasViewportPan({ onZoomIn, onZoomOut, onDeselectAll, artboardRef });

  const {
    showRulers,
    showGuides,
    toggleRulers,
    toggleGuides,
    guides,
    activeGuideDrag,
    mousePos,
    viewportDimensions,
    artboardOrigin,
    handleStartCreateGuide,
    handleStartDragExistingGuide,
    handleDeleteGuide,
    setGuideLines,
    handleResetOrigin,
    handleViewportMouseMove,
    handleViewportMouseLeave,
  } = useCanvasGuides({
    viewportRef,
    artboardRef,
    pageDimensions: page.dimensions,
    zoom,
    pan,
    setPan,
    onResetZoom,
  });

  const [showGuideLayoutModal, setShowGuideLayoutModal] = useState(false);

  const { isDragOver, handleDragEnter, handleDragOver, handleDragLeave, handleDrop } =
    useCanvasDropZone({ engine, artboardRef, zoom });

  useCanvasShortcuts({
    engine,
    onSpaceStateChange: handleSpaceStateChange,
    onToggleRulers: toggleRulers,
    onToggleGuides: toggleGuides,
    onOpenNewDocumentModal: session?.openNewDocumentModal,
  });

  const handleBrushChange = (opts: {
    width?: number;
    hardness?: number;
    smoothness?: number;
    color?: string;
  }): void =>
    engine?.setDrawingMode(true, currentDrawingTool === 'eraser' ? 'eraser' : 'brush', opts);

  const handleReset = (): void => {
    setPan({ x: 0, y: 0 });
    onResetZoom();
  };

  return (
    <div className={styles.stageContainer}>
      <ContextualToolbar
        selectedObject={selectedObject}
        pageBackground={page.backgroundColor}
        onPageBackgroundChange={onPageBackgroundChange}
        onUpdateObject={props.onUpdateObject ?? engine?.updateSelectedProperties ?? NOOP}
        onDeleteSelected={props.onDeleteSelected ?? engine?.deleteSelected ?? NOOP}
        onDuplicateSelected={props.onDuplicateSelected ?? engine?.duplicateSelected ?? NOOP}
        onBringForward={props.onBringForward ?? engine?.bringForward ?? NOOP}
        onSendBackward={props.onSendBackward ?? engine?.sendBackward ?? NOOP}
        onClearCanvas={props.onClearCanvas ?? engine?.clearCanvas ?? NOOP}
        onOpenVectorize={session?.openVectorize}
        onSelectSubject={
          props.onSelectSubject ?? (engine ? (m) => engine.selectSubject(m) : undefined)
        }
        onAlignSelected={props.onAlignSelected ?? engine?.alignSelected}
        onDistributeSelected={props.onDistributeSelected ?? engine?.distributeSelected}
        onApplyCrop={props.onApplyCrop ?? engine?.applyCropToSelected}
        onToggleLayerMask={props.onToggleLayerMask ?? engine?.toggleLayerMask}
        onPerformBooleanOperation={
          props.onPerformBooleanOperation ?? engine?.performBooleanOperation
        }
        currentDrawingTool={currentDrawingTool}
        currentToolMode={currentToolMode}
        brushWidth={activeBrushWidth}
        brushHardness={activeBrushHardness}
        brushSmoothness={activeBrushSmoothness}
        brushColor={engine?.getBrushColor() ?? '#1D1D1F'}
        onBrushWidthChange={(width) => handleBrushChange({ width })}
        onBrushHardnessChange={(hardness) => handleBrushChange({ hardness })}
        onBrushSmoothnessChange={(smoothness) => handleBrushChange({ smoothness })}
        onBrushColorChange={(color) => handleBrushChange({ color })}
        onExitDrawingMode={() => engine?.setDrawingMode(false)}
        onFinishPenPath={engine?.finishPenPath}
        onExitPenMode={() => engine?.setToolMode('select')}
      />

      <CanvasStageViewport
        viewportRef={viewportRef}
        artboardRef={artboardRef}
        canvasRef={canvasRef}
        isPanning={isPanning}
        isSpaceDown={isSpaceDown}
        isDrawing={isDrawing}
        brushCursor={brushCursor}
        displayWidth={displayWidth}
        displayHeight={displayHeight}
        zoom={zoom}
        pan={pan}
        clipArtboard={clipArtboard}
        backgroundColor={page.backgroundColor}
        pageDimensions={page.dimensions}
        activeBrushWidth={activeBrushWidth}
        activeBrushHardness={activeBrushHardness}
        handleMouseDown={handleMouseDown}
        handleViewportMouseMove={handleViewportMouseMove}
        setBrushCursor={setBrushCursor}
        handleViewportMouseLeave={handleViewportMouseLeave}
        showGuides={showGuides}
        guides={guides}
        activeGuideDrag={activeGuideDrag}
        artboardOrigin={artboardOrigin}
        handleStartDragExistingGuide={handleStartDragExistingGuide}
        handleDeleteGuide={handleDeleteGuide}
        showRulers={showRulers}
        viewportDimensions={viewportDimensions}
        mousePos={mousePos}
        handleStartCreateGuide={handleStartCreateGuide}
        handleResetOrigin={handleResetOrigin}
        isDragOver={isDragOver}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />

      <FloatingStudioToolbar
        orientation={floatingToolbarPosition === 'left' ? 'vertical' : 'horizontal'}
        currentToolMode={currentToolMode}
        currentDrawingTool={currentDrawingTool}
        onSetToolMode={engine?.setToolMode}
        onSetDrawingMode={props.onSetDrawingMode ?? engine?.setDrawingMode}
        onCombineSelected={() => engine?.performBooleanOperation?.('union')}
        onAddShape={() => engine?.addShape?.({ shapeVariant: 'rectangle' })}
        onToggleArtboardDrawer={() => setShowArtboardDrawer((prev) => !prev)}
        onZoomIn={onZoomIn}
        onReset={handleReset}
        showRulers={showRulers}
        onToggleRulers={toggleRulers}
        showGuides={showGuides}
        onToggleGuides={toggleGuides}
        onOpenGuideLayout={() => setShowGuideLayoutModal(true)}
        hasSelection={Boolean(selectedObject)}
        onDeleteSelected={props.onDeleteSelected ?? engine?.deleteSelected}
      />

      <CanvasBottomHud
        page={page}
        activePageIndex={activePageIndex}
        pageCount={pageCount}
        zoom={zoom}
        elementCount={elementCount}
        currentDrawingTool={currentDrawingTool}
        currentToolMode={currentToolMode}
        clipArtboard={clipArtboard}
        onSetClipArtboard={(next) => {
          setClipArtboard(next);
          onSetClipToArtboard?.(next);
        }}
        onSetDrawingMode={props.onSetDrawingMode ?? engine?.setDrawingMode}
        onSetToolMode={engine?.setToolMode}
        onCombineSelected={() => engine?.performBooleanOperation?.('union')}
        onPageBackgroundChange={onPageBackgroundChange}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onReset={handleReset}
        onNextPage={props.onNextPage ?? session?.nextPage}
        onPrevPage={props.onPrevPage ?? session?.prevPage}
        onAddPage={props.onAddPage ?? (session ? () => session.addPage() : undefined)}
        onToggleArtboardDrawer={() => setShowArtboardDrawer((prev) => !prev)}
        floatingToolbarPosition={floatingToolbarPosition}
        onFloatingToolbarPositionChange={handleFloatingToolbarPositionChange}
        showRulers={showRulers}
        onToggleRulers={toggleRulers}
        showGuides={showGuides}
        onToggleGuides={toggleGuides}
      />

      <CanvasArtboardDrawer
        open={showArtboardDrawer}
        onClose={() => setShowArtboardDrawer(false)}
        page={page}
        activePageIndex={activePageIndex}
        elementCount={elementCount}
        engine={engine}
        session={session}
      />

      <GuideLayoutModal
        isOpen={showGuideLayoutModal}
        pageDimensions={page.dimensions}
        existingGuides={guides}
        onApplyGuides={(newGuides) => setGuideLines(newGuides)}
        onExportSlices={() => {
          const fc = engine?.getAdapter()?.getFabricCanvas();
          if (fc) exportGuideSlices(fc, page.dimensions, guides);
        }}
        onClose={() => setShowGuideLayoutModal(false)}
      />
    </div>
  );
}
