import type { ReactElement } from 'react';
import { Select, ToolbarDivider } from '../../../../components/ui/index.js';
import type { SelectedObjectProperties } from '../../engine/FabricCanvasAdapter.js';
import { ContextualColorPopover } from './ContextualColorPopover.js';
import styles from './ContextualToolbar.module.css';

export interface ContextualVectorControlsProps {
  readonly selectedObject: SelectedObjectProperties;
  readonly showColorPicker: 'fill' | 'stroke' | 'bg' | null;
  readonly onSetShowColorPicker: (type: 'fill' | 'stroke' | 'bg' | null) => void;
  readonly onUpdateObject: (props: Partial<SelectedObjectProperties>) => void;
}

const DASH_PRESETS: Array<{ label: string; value: string; array: number[] | null }> = [
  { label: 'Sólido', value: 'solid', array: null },
  { label: 'Tracejado', value: 'dashed', array: [8, 6] },
  { label: 'Pontilhado', value: 'dotted', array: [2, 4] },
  { label: 'Traço-Ponto', value: 'dash-dot', array: [12, 6, 2, 6] },
];

export function ContextualVectorControls({
  selectedObject,
  showColorPicker,
  onSetShowColorPicker,
  onUpdateObject,
}: ContextualVectorControlsProps): ReactElement {
  const currentStrokeWidth = selectedObject.strokeWidth ?? 0;
  const currentDash = selectedObject.strokeDashArray;

  let currentDashKey = 'solid';
  if (Array.isArray(currentDash) && currentDash.length > 0) {
    if (currentDash[0] === 2) currentDashKey = 'dotted';
    else if (currentDash.length === 4) currentDashKey = 'dash-dot';
    else currentDashKey = 'dashed';
  }

  const handleDashChange = (key: string): void => {
    const found = DASH_PRESETS.find((p) => p.value === key);
    onUpdateObject({
      strokeDashArray: found?.array ?? null,
      strokeWidth: currentStrokeWidth === 0 ? 3 : currentStrokeWidth,
      stroke: selectedObject.stroke ?? '#18181B',
    });
  };

  return (
    <div className={styles.group}>
      <span className={styles.label}>Preenchimento:</span>
      <div className={styles.colorPickerContainer}>
        <button
          type="button"
          className={styles.colorSwatchButton}
          style={{ backgroundColor: selectedObject.fill || '#0071E3' }}
          onClick={() => onSetShowColorPicker(showColorPicker === 'fill' ? null : 'fill')}
          aria-label="Cor de preenchimento vetorial"
        />
        {showColorPicker === 'fill' && (
          <ContextualColorPopover
            currentColor={selectedObject.fill || '#0071E3'}
            onSelectColor={(c) => onUpdateObject({ fill: c })}
            onClose={() => onSetShowColorPicker(null)}
          />
        )}
      </div>

      <ToolbarDivider />

      <span className={styles.label}>Traçado:</span>
      <div className={styles.colorPickerContainer}>
        <button
          type="button"
          className={styles.colorSwatchButton}
          style={{ backgroundColor: selectedObject.stroke || 'transparent' }}
          onClick={() => onSetShowColorPicker(showColorPicker === 'stroke' ? null : 'stroke')}
          aria-label="Cor de borda ou traçado vetorial"
        />
        {showColorPicker === 'stroke' && (
          <ContextualColorPopover
            currentColor={selectedObject.stroke || '#18181B'}
            onSelectColor={(c) =>
              onUpdateObject({
                stroke: c,
                strokeWidth: currentStrokeWidth === 0 ? 3 : currentStrokeWidth,
              })
            }
            onClose={() => onSetShowColorPicker(null)}
          />
        )}
      </div>

      <span className={styles.label}>Espessura:</span>
      <input
        type="range"
        min={0}
        max={48}
        value={currentStrokeWidth}
        onChange={(e) => {
          const w = Number(e.target.value);
          onUpdateObject({
            strokeWidth: w,
            stroke: w > 0 && !selectedObject.stroke ? '#18181B' : selectedObject.stroke,
          });
        }}
        className={styles.appleRangeSlider}
        style={{ width: '64px' }}
        aria-label="Espessura do traçado"
      />
      <span className={styles.valueReadout} style={{ fontVariantNumeric: 'tabular-nums' }}>
        {currentStrokeWidth}px
      </span>

      <ToolbarDivider />

      <span className={styles.label}>Estilo:</span>
      <Select
        value={currentDashKey}
        options={DASH_PRESETS.map((p) => ({ label: p.label, value: p.value }))}
        onChange={(val) => handleDashChange(String(val))}
        ariaLabel="Estilo do traçado (contínuo, tracejado ou pontilhado)"
      />

      <span className={styles.label}>Canto:</span>
      <Select
        value={selectedObject.strokeLineJoin ?? 'miter'}
        options={[
          { label: 'Ângulo', value: 'miter' },
          { label: 'Redondo', value: 'round' },
          { label: 'Chanfrado', value: 'bevel' },
        ]}
        onChange={(val) =>
          onUpdateObject({
            strokeLineJoin: val as 'miter' | 'round' | 'bevel',
          })
        }
        ariaLabel="Junção dos cantos do traçado"
      />
    </div>
  );
}
