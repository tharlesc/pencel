import { useState, type ReactElement } from 'react';
import { Button, ToolbarDivider, ToolbarGroup } from '../../../../components/ui/index.js';
import { ContextualColorPopover } from './ContextualColorPopover.js';
import styles from './ContextualToolbar.module.css';

export interface ContextualBrushControlsProps {
  readonly currentDrawingTool: 'brush' | 'eraser';
  readonly brushWidth: number;
  readonly brushHardness?: number;
  readonly brushSoftness?: number;
  readonly brushSmoothness: number;
  readonly brushColor: string;
  readonly onBrushWidthChange: (width: number) => void;
  readonly onBrushHardnessChange?: (hardness: number) => void;
  readonly onBrushSoftnessChange?: (softness: number) => void;
  readonly onBrushSmoothnessChange: (smoothness: number) => void;
  readonly onBrushColorChange: (color: string) => void;
  readonly onExitDrawingMode: () => void;
}

export function ContextualBrushControls({
  currentDrawingTool,
  brushWidth,
  brushHardness = 100,
  brushSoftness,
  brushSmoothness,
  brushColor,
  onBrushWidthChange,
  onBrushHardnessChange,
  onBrushSoftnessChange,
  onBrushSmoothnessChange,
  onBrushColorChange,
  onExitDrawingMode,
}: ContextualBrushControlsProps): ReactElement {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const isBrush = currentDrawingTool === 'brush';
  const softnessValue = brushSoftness !== undefined ? brushSoftness : 100 - brushHardness;

  const handleSoftnessChange = (s: number): void => {
    onBrushSoftnessChange?.(s);
    onBrushHardnessChange?.(100 - s);
  };

  return (
    <div className={styles.bar} role="toolbar" aria-label="Controles do Pincel e Borracha">
      <ToolbarGroup ariaLabel="Modo de pintura ativo">
        <span className={styles.label}>{isBrush ? 'Pincel Ativo' : 'Borracha Ativa'}:</span>
      </ToolbarGroup>

      {isBrush && (
        <>
          <div className={styles.colorPickerContainer}>
            <button
              type="button"
              className={styles.colorSwatchButton}
              style={{ backgroundColor: brushColor }}
              onClick={() => setShowColorPicker((prev) => !prev)}
              aria-label={`Cor do pincel: ${brushColor}`}
              title="Cor do traço do pincel"
            />
            {showColorPicker && (
              <ContextualColorPopover
                currentColor={brushColor}
                onSelectColor={(c) => {
                  onBrushColorChange(c);
                  setShowColorPicker(false);
                }}
                onClose={() => setShowColorPicker(false)}
              />
            )}
          </div>
          <span className={styles.colorHex}>{brushColor}</span>
          <ToolbarDivider />
        </>
      )}

      <div className={styles.group}>
        <span className={styles.label}>Espessura:</span>
        <input
          type="range"
          min="1"
          max="120"
          value={brushWidth}
          onChange={(e) => onBrushWidthChange(Number(e.target.value))}
          className={styles.spacingSlider}
          aria-label="Espessura do traço do pincel"
        />
        <span className={styles.valueDisplay}>{brushWidth}px</span>
      </div>

      <ToolbarDivider />

      <div className={styles.group}>
        <span
          className={styles.label}
          title="Suavidade da borda do traço (0% Nítido / 100% Difuso)"
        >
          Suavidade:
        </span>
        <input
          type="range"
          min="0"
          max="100"
          value={softnessValue}
          onChange={(e) => handleSoftnessChange(Number(e.target.value))}
          className={styles.spacingSlider}
          aria-label="Suavidade da borda do pincel"
          title={`Suavidade: ${softnessValue}% (0% Nítido / 100% Difuso)`}
        />
        <span
          className={styles.valueDisplay}
          title={
            softnessValue === 0
              ? 'Borda Nítida'
              : softnessValue === 100
                ? 'Borda Difusa (Aerógrafo)'
                : `Difusão: ${softnessValue}%`
          }
        >
          {softnessValue}%
        </span>
      </div>

      <ToolbarDivider />

      <div className={styles.group}>
        <span className={styles.label} title="Estabilização contra tremores">
          Estabilização:
        </span>
        <input
          type="range"
          min="0"
          max="100"
          value={brushSmoothness}
          onChange={(e) => onBrushSmoothnessChange(Number(e.target.value))}
          className={styles.spacingSlider}
          aria-label="Estabilização do traço do pincel"
          title={`Estabilização: ${brushSmoothness}%`}
        />
        <span className={styles.valueDisplay}>{brushSmoothness}%</span>
      </div>

      <ToolbarDivider />

      <div className={styles.group}>
        <Button
          variant="secondary"
          size="sm"
          icon="check"
          onClick={onExitDrawingMode}
          aria-label="Concluir desenho (V)"
          title="Concluir desenho e voltar para Seleção (V)"
        >
          Concluir
        </Button>
      </div>
    </div>
  );
}
