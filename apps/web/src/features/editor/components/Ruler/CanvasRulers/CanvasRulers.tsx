import { calculateRulerTicks, type RulerTick } from '@pencel/editor-core';
import { useMemo, type MouseEvent as ReactMouseEvent, type ReactElement } from 'react';
import styles from './CanvasRulers.module.css';

export interface CanvasRulersProps {
  readonly zoom: number;
  readonly pan: { readonly x: number; readonly y: number };
  readonly pageSize: { readonly width: number; readonly height: number };
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly artboardOrigin?: { readonly x: number; readonly y: number };
  readonly mousePos: { readonly x: number; readonly y: number } | null;
  readonly onStartCreateGuide: (
    orientation: 'horizontal' | 'vertical',
    startClientPos: { clientX: number; clientY: number },
  ) => void;
  readonly onResetOrigin?: () => void;
}

const RULER_THICKNESS = 24;

export function CanvasRulers({
  zoom,
  pan,
  pageSize,
  viewportWidth,
  viewportHeight,
  artboardOrigin,
  mousePos,
  onStartCreateGuide,
  onResetOrigin,
}: CanvasRulersProps): ReactElement | null {
  const displayWidth = Math.max(1, Math.round(pageSize.width * zoom));
  const displayHeight = Math.max(1, Math.round(pageSize.height * zoom));

  const artboardOriginX =
    artboardOrigin !== undefined ? artboardOrigin.x : viewportWidth / 2 + pan.x - displayWidth / 2;
  const artboardOriginY =
    artboardOrigin !== undefined
      ? artboardOrigin.y
      : viewportHeight / 2 + pan.y - displayHeight / 2;

  const horizontalLength = Math.max(0, viewportWidth - RULER_THICKNESS);
  const verticalLength = Math.max(0, viewportHeight - RULER_THICKNESS);

  const horizontalOrigin = Math.round(artboardOriginX - RULER_THICKNESS);
  const verticalOrigin = Math.round(artboardOriginY - RULER_THICKNESS);

  const hTicks = useMemo<readonly RulerTick[]>(() => {
    if (horizontalLength <= 0) return [];
    return calculateRulerTicks({
      origin: horizontalOrigin,
      zoom,
      length: horizontalLength,
      minPixelSpacing: 55,
      startOffset: 0,
    });
  }, [horizontalOrigin, zoom, horizontalLength]);

  const vTicks = useMemo<readonly RulerTick[]>(() => {
    if (verticalLength <= 0) return [];
    return calculateRulerTicks({
      origin: verticalOrigin,
      zoom,
      length: verticalLength,
      minPixelSpacing: 55,
      startOffset: 0,
    });
  }, [verticalOrigin, zoom, verticalLength]);

  const cursorX = mousePos ? mousePos.x - RULER_THICKNESS : null;
  const cursorY = mousePos ? mousePos.y - RULER_THICKNESS : null;

  return (
    <div className={styles.rulerContainer} aria-hidden="true">
      {/* Corner origin box */}
      <div
        className={styles.cornerBox}
        onClick={onResetOrigin}
        title="Origem (0, 0) em pixels. Clique para redefinir."
      >
        px
      </div>

      {/* Horizontal top ruler */}
      <div
        className={styles.horizontalRuler}
        onMouseDown={(e: ReactMouseEvent) => {
          e.preventDefault();
          onStartCreateGuide('horizontal', { clientX: e.clientX, clientY: e.clientY });
        }}
        title="Régua horizontal. Clique e arraste para baixo para criar uma linha guia."
      >
        <svg className={styles.rulerSvg} width={horizontalLength} height={RULER_THICKNESS}>
          {hTicks.map((tick, index) => {
            const tickHeight = tick.type === 'major' ? 14 : tick.type === 'medium' ? 8 : 4;
            const y1 = RULER_THICKNESS - tickHeight;
            const y2 = RULER_THICKNESS;

            return (
              <g key={`h-${tick.value}-${index}`}>
                <line
                  x1={Math.round(tick.position)}
                  y1={y1}
                  x2={Math.round(tick.position)}
                  y2={y2}
                  className={tick.type === 'major' ? styles.tickLineMajor : styles.tickLine}
                />
                {tick.type === 'major' && tick.label !== undefined && (
                  <text
                    x={Math.round(tick.position) + 3}
                    y={3}
                    dominantBaseline="hanging"
                    className={styles.tickLabel}
                  >
                    {tick.label}
                  </text>
                )}
              </g>
            );
          })}
          {cursorX !== null && cursorX >= 0 && cursorX <= horizontalLength && (
            <line
              x1={cursorX}
              y1={0}
              x2={cursorX}
              y2={RULER_THICKNESS}
              className={styles.cursorTracker}
            />
          )}
        </svg>
      </div>

      {/* Vertical left ruler */}
      <div
        className={styles.verticalRuler}
        onMouseDown={(e: ReactMouseEvent) => {
          e.preventDefault();
          onStartCreateGuide('vertical', { clientX: e.clientX, clientY: e.clientY });
        }}
        title="Régua vertical. Clique e arraste para a direita para criar uma linha guia."
      >
        <svg className={styles.rulerSvg} width={RULER_THICKNESS} height={verticalLength}>
          {vTicks.map((tick, index) => {
            const tickWidth = tick.type === 'major' ? 14 : tick.type === 'medium' ? 8 : 4;
            const x1 = RULER_THICKNESS - tickWidth;
            const x2 = RULER_THICKNESS;

            return (
              <g key={`v-${tick.value}-${index}`}>
                <line
                  x1={x1}
                  y1={Math.round(tick.position)}
                  x2={x2}
                  y2={Math.round(tick.position)}
                  className={tick.type === 'major' ? styles.tickLineMajor : styles.tickLine}
                />
                {tick.type === 'major' && tick.label !== undefined && (
                  <text
                    x={2}
                    y={Math.round(tick.position) + 3}
                    dominantBaseline="hanging"
                    className={styles.tickLabel}
                  >
                    {tick.label}
                  </text>
                )}
              </g>
            );
          })}
          {cursorY !== null && cursorY >= 0 && cursorY <= verticalLength && (
            <line
              x1={0}
              y1={cursorY}
              x2={RULER_THICKNESS}
              y2={cursorY}
              className={styles.cursorTracker}
            />
          )}
        </svg>
      </div>
    </div>
  );
}
