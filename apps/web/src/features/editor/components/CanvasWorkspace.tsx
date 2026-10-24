import type { BooleanPathOperation, DesignPage } from '@pencel/editor-core';
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type RefObject,
} from 'react';
import type { SelectedObjectProperties } from '../engine/FabricCanvasAdapter.js';
import {
  useOptionalEditorEngine,
  useOptionalEditorLayers,
  useOptionalEditorSelection,
  useOptionalEditorSession,
} from '../state/EditorProvider.js';
import { CanvasBottomHud } from './CanvasBottomHud.js';
import styles from './CanvasWorkspace.module.css';
import { ContextualToolbar } from './ContextualToolbar.js';

export interface CanvasWorkspaceProps {
  readonly page?: DesignPage;
  readonly activePageIndex?: number;
  readonly pageCount?: number;
  readonly onNextPage?: () => void;
  readonly onPrevPage?: () => void;
  readonly onAddPage?: () => void;
  readonly onDuplicatePage?: () => void;
  readonly onDeletePage?: (pageId: string) => void;
  readonly zoom?: number;
  readonly canvasRef?: RefObject<HTMLCanvasElement | null>;
  readonly selectedObject?: SelectedObjectProperties | null;
  readonly elementCount?: number;
  readonly onZoomIn?: () => void;
  readonly onZoomOut?: () => void;
  readonly onResetZoom?: () => void;
  readonly onPageBackgroundChange?: (color: string) => void;
  readonly onUpdateObject?: (props: Partial<SelectedObjectProperties>) => void;
  readonly onDeleteSelected?: () => void;
  readonly onDuplicateSelected?: () => void;
  readonly onBringForward?: () => void;
  readonly onSendBackward?: () => void;
  readonly onClearCanvas?: () => void;
  readonly onSelectSubject?: (mode: 'select' | 'removeBg') => void;
  readonly onDeselectAll?: () => void;
  readonly onAlignSelected?: (
    alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom',
  ) => void;
  readonly onDistributeSelected?: (direction: 'horizontal' | 'vertical') => void;
  readonly onSetDrawingMode?: (enabled: boolean, mode?: 'brush' | 'eraser') => void;
  readonly currentDrawingTool?: 'none' | 'brush' | 'eraser';
  readonly onApplyCrop?: (mode: '1:1' | '4:3' | '16:9' | 'inset' | 'reset') => void;
  readonly onToggleLayerMask?: (
    layerName?: string,
    shape?: 'circle' | 'rounded' | 'ellipse',
  ) => void;
  readonly onPerformBooleanOperation?: (operation: BooleanPathOperation) => void;
  readonly onSetClipToArtboard?: (enabled: boolean) => void;
}

const NOOP = (): void => {};

export function CanvasWorkspace(props: CanvasWorkspaceProps): ReactElement {
  const session = useOptionalEditorSession();
  const selection = useOptionalEditorSelection();
  const layersCtx = useOptionalEditorLayers();
  const engine = useOptionalEditorEngine();
  const fallbackCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const page = props.page ??
    session?.activePage ?? {
      id: 'page-1',
      name: 'Página 1',
      dimensions: { width: 1080, height: 1080 },
      backgroundColor: '#FBFBFD',
      elements: [],
    };
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

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [clipArtboard, setClipArtboard] = useState(true);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const artboardRef = useRef<HTMLDivElement | null>(null);

  const displayWidth = Math.max(1, Math.round(page.dimensions.width * zoom));
  const displayHeight = Math.max(1, Math.round(page.dimensions.height * zoom));

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent): void => {
      if (e.altKey || e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) onZoomIn();
        else if (e.deltaY > 0) onZoomOut();
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [onZoomIn, onZoomOut]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.code === 'Space' && !e.repeat) {
        const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (targetTag === 'input' || targetTag === 'textarea') return;
        setIsSpaceDown(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent): void => {
      if (e.code === 'Space') {
        setIsSpaceDown(false);
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!isPanning) return;
    const handleWindowMouseMove = (e: MouseEvent): void => {
      setPan({
        x: Math.round(dragStartRef.current.panX + (e.clientX - dragStartRef.current.x)),
        y: Math.round(dragStartRef.current.panY + (e.clientY - dragStartRef.current.y)),
      });
    };
    const handleWindowMouseUp = (): void => setIsPanning(false);
    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isPanning]);

  const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>): void => {
    if (isSpaceDown || e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
      return;
    }
    const isInsideArtboard = Boolean(
      artboardRef.current && artboardRef.current.contains(e.target as Node),
    );
    if (!isInsideArtboard && e.button === 0) {
      onDeselectAll?.();
    }
  };

  return (
    <div className={styles.stageContainer}>
      <ContextualToolbar
        selectedObject={selectedObject}
        pageBackground={page.backgroundColor}
        onPageBackgroundChange={onPageBackgroundChange}
        onUpdateObject={props.onUpdateObject ?? engine?.updateSelectedProperties ?? (() => {})}
        onDeleteSelected={props.onDeleteSelected ?? engine?.deleteSelected ?? (() => {})}
        onDuplicateSelected={props.onDuplicateSelected ?? engine?.duplicateSelected ?? (() => {})}
        onBringForward={props.onBringForward ?? engine?.bringForward ?? (() => {})}
        onSendBackward={props.onSendBackward ?? engine?.sendBackward ?? (() => {})}
        onClearCanvas={props.onClearCanvas ?? engine?.clearCanvas ?? (() => {})}
        onSelectSubject={
          props.onSelectSubject ?? (engine ? (mode) => void engine.selectSubject(mode) : undefined)
        }
        onAlignSelected={props.onAlignSelected ?? engine?.alignSelected}
        onDistributeSelected={props.onDistributeSelected ?? engine?.distributeSelected}
        onApplyCrop={props.onApplyCrop ?? engine?.applyCropToSelected}
        onToggleLayerMask={props.onToggleLayerMask ?? engine?.toggleLayerMask}
        onPerformBooleanOperation={
          props.onPerformBooleanOperation ?? engine?.performBooleanOperation
        }
      />

      <div
        ref={viewportRef}
        className={[
          styles.viewportScroll,
          isPanning ? styles.viewportScrollPanning : '',
          isSpaceDown && !isPanning ? styles.viewportScrollGrab : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onMouseDown={handleMouseDown}
        role="region"
        aria-label="Palco interativo da prancheta"
      >
        <div
          ref={artboardRef}
          className={styles.artboardFrame}
          style={{
            width: `${displayWidth}px`,
            height: `${displayHeight}px`,
            backgroundColor: page.backgroundColor,
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            pointerEvents: isSpaceDown || isPanning ? 'none' : 'auto',
          }}
          data-testid="canvas-artboard-frame"
        >
          <div
            className={styles.canvasPositioner}
            style={{
              left: `-${Math.round(800 * zoom)}px`,
              top: `-${Math.round(800 * zoom)}px`,
              width: `${displayWidth + 2 * Math.round(800 * zoom)}px`,
              height: `${displayHeight + 2 * Math.round(800 * zoom)}px`,
            }}
          >
            <canvas ref={canvasRef} aria-label="Superfície interativa de desenho" />
          </div>
        </div>
      </div>

      <CanvasBottomHud
        page={page}
        activePageIndex={activePageIndex}
        pageCount={pageCount}
        zoom={zoom}
        elementCount={elementCount}
        currentDrawingTool={props.currentDrawingTool ?? engine?.getDrawingTool() ?? 'none'}
        clipArtboard={clipArtboard}
        onSetClipArtboard={(next) => {
          setClipArtboard(next);
          onSetClipToArtboard?.(next);
        }}
        onSetDrawingMode={props.onSetDrawingMode ?? engine?.setDrawingMode}
        onPageBackgroundChange={onPageBackgroundChange}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onReset={() => {
          setPan({ x: 0, y: 0 });
          onResetZoom();
        }}
        onNextPage={props.onNextPage ?? session?.nextPage}
        onPrevPage={props.onPrevPage ?? session?.prevPage}
        onAddPage={props.onAddPage ?? (session ? () => session.addPage() : undefined)}
        onDuplicatePage={props.onDuplicatePage ?? session?.duplicatePage}
        onDeletePage={props.onDeletePage ?? session?.deletePage}
      />
    </div>
  );
}
