import type { ReactElement } from 'react';
import styles from './BrushCursorIndicator.module.css';

export interface BrushCursorIndicatorProps {
  readonly brushCursor: { readonly x: number; readonly y: number };
  readonly brushWidth: number;
  readonly brushHardness: number;
  readonly zoom: number;
}

export function BrushCursorIndicator({
  brushCursor,
  brushWidth,
  brushHardness,
  zoom,
}: BrushCursorIndicatorProps): ReactElement {
  const scaledWidth = Math.max(4, brushWidth * zoom);
  const coreWidth = Math.max(2, scaledWidth * (0.5 + 0.5 * (brushHardness / 100)));

  return (
    <div
      className={styles.brushCursorIndicator}
      style={{
        width: `${scaledWidth}px`,
        height: `${scaledWidth}px`,
        left: `${brushCursor.x}px`,
        top: `${brushCursor.y}px`,
      }}
      data-testid="brush-cursor-indicator"
    >
      {brushHardness < 100 && (
        <div
          className={styles.brushHardnessCore}
          style={{ width: `${coreWidth}px`, height: `${coreWidth}px` }}
          data-testid="brush-hardness-core"
        />
      )}
      <div className={styles.brushCursorCenterDot} />
    </div>
  );
}
