import type { BooleanPathOperation, DesignPage } from '@pencel/editor-core';
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type RefObject,
} from 'react';
import { Button, ToolbarDivider, ToolbarGroup } from '../../../components/ui/index.js';
import type { SelectedObjectProperties } from '../engine/FabricCanvasAdapter.js';
import { formatZoomPercentage } from '../utils/zoomUtils.js';
import styles from './CanvasWorkspace.module.css';
import { ContextualToolbar } from './ContextualToolbar.js';

export interface CanvasWorkspaceProps {
  readonly page: DesignPage;
  readonly activePageIndex?: number;
  readonly pageCount?: number;
  readonly onNextPage?: () => void;
  readonly onPrevPage?: () => void;
  readonly onAddPage?: () => void;
  readonly onDuplicatePage?: () => void;
  readonly onDeletePage?: (pageId: string) => void;
  readonly zoom: number;
  readonly canvasRef: RefObject<HTMLCanvasElement | null>;
  readonly selectedObject: SelectedObjectProperties | null;
  readonly elementCount: number;
  readonly onZoomIn: () => void;
  readonly onZoomOut: () => void;
  readonly onResetZoom: () => void;
  readonly onPageBackgroundChange: (color: string) => void;
  readonly onUpdateObject: (props: Partial<SelectedObjectProperties>) => void;
  readonly onDeleteSelected: () => void;
  readonly onDuplicateSelected: () => void;
  readonly onBringForward: () => void;
  readonly onSendBackward: () => void;
  readonly onClearCanvas: () => void;
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

export function CanvasWorkspace({
  page,
  activePageIndex,
  pageCount,
  onNextPage,
  onPrevPage,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
  zoom,
  canvasRef,
  selectedObject,
  elementCount,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onPageBackgroundChange,
  onUpdateObject,
  onDeleteSelected,
  onDuplicateSelected,
  onBringForward,
  onSendBackward,
  onClearCanvas,
  onSelectSubject,
  onDeselectAll,
  onAlignSelected,
  onDistributeSelected,
  onSetDrawingMode,
  currentDrawingTool = 'none',
  onApplyCrop,
  onToggleLayerMask,
  onPerformBooleanOperation,
  onSetClipToArtboard,
}: CanvasWorkspaceProps): ReactElement {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [clipArtboard, setClipArtboard] = useState(true);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const artboardRef = useRef<HTMLDivElement | null>(null);

  const displayWidth = Math.max(1, Math.round(page.dimensions.width * zoom));
  const displayHeight = Math.max(1, Math.round(page.dimensions.height * zoom));

  // Alt + Mouse Wheel Zoom (Scroll forward = Zoom In, Scroll backward = Zoom Out)
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent): void => {
      // Zoom on Alt key (or Ctrl/Cmd key)
      if (e.altKey || e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          onZoomIn();
        } else if (e.deltaY > 0) {
          onZoomOut();
        }
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [onZoomIn, onZoomOut]);

  // Spacebar key listener for Pan tool mode
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

  // Global window mouse move and up listeners while panning
  useEffect(() => {
    if (!isPanning) return;

    const handleWindowMouseMove = (e: MouseEvent): void => {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPan({
        x: Math.round(dragStartRef.current.panX + dx),
        y: Math.round(dragStartRef.current.panY + dy),
      });
    };

    const handleWindowMouseUp = (): void => {
      setIsPanning(false);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isPanning]);

  // Pan & Deselect Mouse Handlers
  const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>): void => {
    // Pan trigger: Space held, or middle mouse button (1)
    if (isSpaceDown || e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      return;
    }

    const isInsideArtboard = Boolean(
      artboardRef.current && artboardRef.current.contains(e.target as Node),
    );

    // Left click outside artboard deselects the active element
    if (!isInsideArtboard && e.button === 0) {
      onDeselectAll?.();
    }
  };

  const handleReset = (): void => {
    setPan({ x: 0, y: 0 });
    onResetZoom();
  };

  return (
    <div className={styles.stageContainer}>
      {/* 1. Contextual Action Bar directly above the artboard (Canva Style) */}
      <ContextualToolbar
        selectedObject={selectedObject}
        pageBackground={page.backgroundColor}
        onPageBackgroundChange={onPageBackgroundChange}
        onUpdateObject={onUpdateObject}
        onDeleteSelected={onDeleteSelected}
        onDuplicateSelected={onDuplicateSelected}
        onBringForward={onBringForward}
        onSendBackward={onSendBackward}
        onClearCanvas={onClearCanvas}
        onSelectSubject={onSelectSubject}
        onAlignSelected={onAlignSelected}
        onDistributeSelected={onDistributeSelected}
        onApplyCrop={onApplyCrop}
        onToggleLayerMask={onToggleLayerMask}
        onPerformBooleanOperation={onPerformBooleanOperation}
      />

      {/* 2. Interactive Pan & Zoom Canvas Viewport */}
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
              position: 'absolute',
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

      {/* 3. Bottom Canvas Controls Bar (Zoom, Dimensions & Stats) */}
      <footer className={styles.bottomBar}>
        <div className={styles.bottomLeft}>
          {/* Photoshop / Studio Canvas Tools (Mouse, Brush, Eraser, Pipette) */}
          <ToolbarGroup ariaLabel="Ferramentas interativas de estúdio">
            <Button
              variant="toolbar"
              size="sm"
              icon="select"
              active={currentDrawingTool === 'none'}
              onClick={() => onSetDrawingMode?.(false)}
              aria-label="Ferramenta Seleção (V)"
              title="Seleção / Mover (V)"
            />
            <Button
              variant="toolbar"
              size="sm"
              icon="brush"
              active={currentDrawingTool === 'brush'}
              onClick={() => onSetDrawingMode?.(currentDrawingTool !== 'brush', 'brush')}
              aria-label="Pincel Livre (B)"
              title="Pincel Livre (B)"
            />
            <Button
              variant="toolbar"
              size="sm"
              icon="eraser"
              active={currentDrawingTool === 'eraser'}
              onClick={() => onSetDrawingMode?.(currentDrawingTool !== 'eraser', 'eraser')}
              aria-label="Borracha (E)"
              title="Borracha (E)"
            />
            <Button
              variant="toolbar"
              size="sm"
              icon="pipette"
              onClick={async () => {
                if (
                  typeof (window as unknown as { EyeDropper?: unknown }).EyeDropper !== 'undefined'
                ) {
                  try {
                    type EyeDropperInstance = { open: () => Promise<{ sRGBHex: string }> };
                    type EyeDropperConstructor = new () => EyeDropperInstance;
                    const EyeDropperClass = (
                      window as unknown as { EyeDropper: EyeDropperConstructor }
                    ).EyeDropper;
                    const dropper = new EyeDropperClass();
                    const res = await dropper.open();
                    if (res?.sRGBHex) {
                      onPageBackgroundChange(res.sRGBHex.toUpperCase());
                    }
                  } catch {
                    // Cancelled
                  }
                }
              }}
              aria-label="Conta-gotas (I)"
              title="Conta-gotas da tela (I)"
            />
          </ToolbarGroup>

          <ToolbarDivider />

          <span className={styles.statTag}>
            {page.dimensions.width} × {page.dimensions.height} px
          </span>
          <span className={styles.statDivider}>•</span>
          <span className={styles.statTag}>
            {elementCount} {elementCount === 1 ? 'elemento' : 'elementos'}
          </span>
        </div>

        <div className={styles.bottomCenter}>
          <ToolbarGroup ariaLabel="Controles de zoom do palco">
            <Button
              variant="toolbar"
              size="sm"
              icon="zoomOut"
              onClick={onZoomOut}
              aria-label="Reduzir zoom"
            />
            <span className={styles.zoomReadout} aria-live="polite">
              {formatZoomPercentage(zoom)}
            </span>
            <Button
              variant="toolbar"
              size="sm"
              icon="zoomIn"
              onClick={onZoomIn}
              aria-label="Aumentar zoom"
            />
            <ToolbarDivider />
            <Button
              variant="toolbar"
              size="sm"
              icon="fitScreen"
              onClick={handleReset}
              aria-label="Ajustar zoom e centralizar prancheta"
            >
              Ajustar
            </Button>
            {onSetClipToArtboard && (
              <Button
                variant="toolbar"
                size="sm"
                icon={clipArtboard ? 'eye' : 'eyeOff'}
                active={clipArtboard}
                onClick={() => {
                  const next = !clipArtboard;
                  setClipArtboard(next);
                  onSetClipToArtboard(next);
                }}
                aria-label="Alternar recorte de conteúdo da prancheta"
                title={
                  clipArtboard
                    ? 'Recorte da prancheta ativo (apenas alças visíveis fora da prancheta)'
                    : 'Mostrando conteúdo completo fora da prancheta'
                }
              >
                Recorte
              </Button>
            )}
          </ToolbarGroup>
        </div>

        {/* 4. Multi-Artboard / Page Navigation (Canva Style) */}
        {pageCount !== undefined && pageCount > 0 && (
          <div className={styles.bottomRight}>
            <ToolbarGroup ariaLabel="Navegação e páginas da prancheta">
              <Button
                variant="toolbar"
                size="sm"
                icon="chevronLeft"
                disabled={activePageIndex === 0}
                onClick={onPrevPage}
                aria-label="Página anterior"
              />
              <span className={styles.pageIndicator}>
                Página {(activePageIndex ?? 0) + 1} de {pageCount}
              </span>
              <Button
                variant="toolbar"
                size="sm"
                icon="chevronRight"
                disabled={(activePageIndex ?? 0) >= pageCount - 1}
                onClick={onNextPage}
                aria-label="Próxima página"
              />
              <ToolbarDivider />
              <Button
                variant="toolbar"
                size="sm"
                icon="filePlus"
                onClick={onAddPage}
                aria-label="Adicionar nova página"
              >
                Adicionar Página
              </Button>
              <Button
                variant="toolbar"
                size="sm"
                icon="copy"
                onClick={onDuplicatePage}
                aria-label="Duplicar página atual"
              />
              {pageCount > 1 && (
                <Button
                  variant="toolbar"
                  size="sm"
                  icon="trash"
                  onClick={() => onDeletePage?.(page.id)}
                  aria-label="Excluir página atual"
                />
              )}
            </ToolbarGroup>
          </div>
        )}
      </footer>
    </div>
  );
}
