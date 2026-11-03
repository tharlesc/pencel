import type { GuideLine } from '@pencel/editor-core';
import { useCallback, useRef, type MouseEvent as ReactMouseEvent, type ReactElement } from 'react';
import styles from './CanvasGuidesOverlay.module.css';

export interface ActiveGuideDragState {
  readonly id?: string; // undefined if creating a new guide
  readonly orientation: 'horizontal' | 'vertical';
  readonly currentDocPos: number;
  readonly isSnapped: boolean;
  readonly isDeleting: boolean;
  readonly snappedTarget?: string;
  readonly screenX: number;
  readonly screenY: number;
}

export interface CanvasGuidesOverlayProps {
  readonly guides: readonly GuideLine[];
  readonly activeGuideDrag: ActiveGuideDragState | null;
  readonly artboardOrigin: { readonly x: number; readonly y: number };
  readonly zoom: number;
  readonly onStartDragExistingGuide: (guide: GuideLine, e: ReactMouseEvent) => void;
  readonly onDeleteGuide?: (id: string) => void;
}

export function CanvasGuidesOverlay({
  guides,
  activeGuideDrag,
  artboardOrigin,
  zoom,
  onStartDragExistingGuide,
  onDeleteGuide,
}: CanvasGuidesOverlayProps): ReactElement {
  const lastClickRef = useRef<{ id: string; time: number } | null>(null);

  const handleGuideMouseDown = useCallback(
    (guide: GuideLine, e: ReactMouseEvent): void => {
      e.preventDefault();
      e.stopPropagation();

      const time = e.timeStamp;
      if (
        lastClickRef.current &&
        lastClickRef.current.id === guide.id &&
        time - lastClickRef.current.time < 450
      ) {
        lastClickRef.current = null;
        onDeleteGuide?.(guide.id);
        return;
      }

      lastClickRef.current = { id: guide.id, time };
      onStartDragExistingGuide(guide, e);
    },
    [onDeleteGuide, onStartDragExistingGuide],
  );

  return (
    <div className={styles.guidesOverlay} aria-hidden="true">
      {/* Existing guides */}
      {guides.map((guide) => {
        // If this guide is currently being dragged, don't render it statically
        if (activeGuideDrag?.id === guide.id) {
          return null;
        }

        if (guide.orientation === 'horizontal') {
          const screenY = Math.round(artboardOrigin.y + guide.position * zoom);
          return (
            <div
              key={guide.id}
              className={styles.guideHorizontal}
              style={{ top: `${screenY}px` }}
              onMouseDown={(e) => handleGuideMouseDown(guide, e)}
              onDoubleClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDeleteGuide?.(guide.id);
              }}
              title={`Guia horizontal em ${guide.position}px. Clique e arraste para mover; clique duplo para excluir.`}
            />
          );
        }

        const screenX = Math.round(artboardOrigin.x + guide.position * zoom);
        return (
          <div
            key={guide.id}
            className={styles.guideVertical}
            style={{ left: `${screenX}px` }}
            onMouseDown={(e) => handleGuideMouseDown(guide, e)}
            onDoubleClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDeleteGuide?.(guide.id);
            }}
            title={`Guia vertical em ${guide.position}px. Clique e arraste para mover; clique duplo para excluir.`}
          />
        );
      })}

      {/* Active dragging guide preview */}
      {activeGuideDrag && (
        <>
          {activeGuideDrag.orientation === 'horizontal' ? (
            <div
              className={[
                styles.guideHorizontal,
                styles.guideDragging,
                activeGuideDrag.isDeleting ? styles.guideDeleting : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{
                top: `${Math.round(artboardOrigin.y + activeGuideDrag.currentDocPos * zoom)}px`,
              }}
              onDoubleClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (activeGuideDrag.id) onDeleteGuide?.(activeGuideDrag.id);
              }}
            />
          ) : (
            <div
              className={[
                styles.guideVertical,
                styles.guideDragging,
                activeGuideDrag.isDeleting ? styles.guideDeleting : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{
                left: `${Math.round(artboardOrigin.x + activeGuideDrag.currentDocPos * zoom)}px`,
              }}
              onDoubleClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (activeGuideDrag.id) onDeleteGuide?.(activeGuideDrag.id);
              }}
            />
          )}

          {/* Coordinate / Snapping tooltip badge */}
          <div
            className={[
              styles.coordBadge,
              activeGuideDrag.isSnapped ? styles.coordBadgeSnapped : '',
              activeGuideDrag.isDeleting ? styles.coordBadgeDeleting : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{
              left: `${activeGuideDrag.screenX}px`,
              top: `${activeGuideDrag.screenY}px`,
            }}
          >
            {activeGuideDrag.isDeleting
              ? 'Solte para excluir a guia'
              : `${activeGuideDrag.orientation === 'horizontal' ? 'Y' : 'X'}: ${activeGuideDrag.currentDocPos} px${
                  activeGuideDrag.snappedTarget ? ` • ${activeGuideDrag.snappedTarget}` : ''
                }`}
          </div>
        </>
      )}
    </div>
  );
}
