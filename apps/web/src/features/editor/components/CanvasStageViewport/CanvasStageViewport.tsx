import type { GuideLine, Point2D } from '@pencel/editor-core';
import type { Dimensions } from '@pencel/shared-types';
import type { RefObject, ReactElement } from 'react';
import { BrushCursorIndicator } from '../BrushCursorIndicator/index.js';
import styles from './CanvasStageViewport.module.css';
import {
  CanvasGuidesOverlay,
  type ActiveGuideDragState,
} from '../Ruler/CanvasGuidesOverlay/index.js';
import { CanvasRulers } from '../Ruler/CanvasRulers/index.js';
import { computeDynamicBleedMargin } from '../../engine/viewportAndGuidesEngine.js';

export interface CanvasStageViewportProps {
  readonly viewportRef: RefObject<HTMLDivElement | null>;
  readonly artboardRef: RefObject<HTMLDivElement | null>;
  readonly canvasRef: RefObject<HTMLCanvasElement | null>;
  readonly isPanning: boolean;
  readonly isSpaceDown: boolean;
  readonly isDrawing: boolean;
  readonly brushCursor: { readonly x: number; readonly y: number } | null;
  readonly displayWidth: number;
  readonly displayHeight: number;
  readonly zoom: number;
  readonly pan: Point2D;
  readonly clipArtboard: boolean;
  readonly backgroundColor: string;
  readonly pageDimensions: Dimensions;
  readonly activeBrushWidth: number;
  readonly activeBrushHardness: number;
  readonly handleMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  readonly handleViewportMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  readonly setBrushCursor: (pos: { x: number; y: number } | null) => void;
  readonly handleViewportMouseLeave: () => void;
  readonly showGuides: boolean;
  readonly guides: readonly GuideLine[];
  readonly activeGuideDrag: ActiveGuideDragState | null;
  readonly artboardOrigin: Point2D;
  readonly handleStartDragExistingGuide: (guide: GuideLine, e: React.MouseEvent) => void;
  readonly handleDeleteGuide: (id: string) => void;
  readonly showRulers: boolean;
  readonly viewportDimensions: Dimensions;
  readonly mousePos: Point2D | null;
  readonly handleStartCreateGuide: (
    orientation: 'horizontal' | 'vertical',
    startClientPos: { clientX: number; clientY: number },
  ) => void;
  readonly handleResetOrigin: () => void;
}

export function CanvasStageViewport({
  viewportRef,
  artboardRef,
  canvasRef,
  isPanning,
  isSpaceDown,
  isDrawing,
  brushCursor,
  displayWidth,
  displayHeight,
  zoom,
  pan,
  clipArtboard,
  backgroundColor,
  pageDimensions,
  activeBrushWidth,
  activeBrushHardness,
  handleMouseDown,
  handleViewportMouseMove,
  setBrushCursor,
  handleViewportMouseLeave,
  showGuides,
  guides,
  activeGuideDrag,
  artboardOrigin,
  handleStartDragExistingGuide,
  handleDeleteGuide,
  showRulers,
  viewportDimensions,
  mousePos,
  handleStartCreateGuide,
  handleResetOrigin,
}: CanvasStageViewportProps): ReactElement {
  return (
    <div
      ref={viewportRef}
      className={[
        styles.viewportScroll,
        isPanning ? styles.viewportScrollPanning : '',
        isSpaceDown && !isPanning ? styles.viewportScrollGrab : '',
        isDrawing && brushCursor ? styles.viewportScrollDrawing : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onMouseDown={handleMouseDown}
      onMouseMove={(e) => {
        handleViewportMouseMove(e);
        if (isDrawing) setBrushCursor({ x: e.clientX, y: e.clientY });
        else if (brushCursor) setBrushCursor(null);
      }}
      onMouseEnter={(e) => {
        if (isDrawing) setBrushCursor({ x: e.clientX, y: e.clientY });
      }}
      onMouseLeave={() => {
        setBrushCursor(null);
        handleViewportMouseLeave();
      }}
    >
      {isDrawing && brushCursor && (
        <BrushCursorIndicator
          brushCursor={brushCursor}
          brushWidth={activeBrushWidth}
          brushHardness={activeBrushHardness}
          zoom={zoom}
        />
      )}

      <div
        ref={artboardRef}
        className={styles.artboardFrame}
        style={{
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
          backgroundColor,
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0)`,
          pointerEvents: isSpaceDown || isPanning ? 'none' : 'auto',
          overflow: clipArtboard ? 'hidden' : 'visible',
        }}
        data-testid="canvas-artboard-frame"
      >
        {(() => {
          const bleed = computeDynamicBleedMargin(pageDimensions);
          const scaledBleed = Math.round(bleed * zoom);
          return (
            <div
              className={styles.canvasPositioner}
              style={{
                left: `-${scaledBleed}px`,
                top: `-${scaledBleed}px`,
                width: `${displayWidth + 2 * scaledBleed}px`,
                height: `${displayHeight + 2 * scaledBleed}px`,
              }}
            >
              <canvas ref={canvasRef} aria-label="Superfície interativa de desenho" />
            </div>
          );
        })()}
      </div>

      {showGuides && (
        <CanvasGuidesOverlay
          guides={guides}
          activeGuideDrag={activeGuideDrag}
          artboardOrigin={artboardOrigin}
          zoom={zoom}
          onStartDragExistingGuide={handleStartDragExistingGuide}
          onDeleteGuide={handleDeleteGuide}
        />
      )}

      {showRulers && (
        <CanvasRulers
          zoom={zoom}
          pan={pan}
          pageSize={pageDimensions}
          viewportWidth={viewportDimensions.width}
          viewportHeight={viewportDimensions.height}
          artboardOrigin={artboardOrigin}
          mousePos={mousePos}
          onStartCreateGuide={handleStartCreateGuide}
          onResetOrigin={handleResetOrigin}
        />
      )}
    </div>
  );
}
