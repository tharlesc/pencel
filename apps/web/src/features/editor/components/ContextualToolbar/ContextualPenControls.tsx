import { useState, type ReactElement } from 'react';
import { Button, ToolbarDivider, ToolbarGroup } from '../../../../components/ui/index.js';
import { ContextualColorPopover } from './ContextualColorPopover.js';
import styles from './ContextualToolbar.module.css';

export interface ContextualPenControlsProps {
  readonly strokeWidth: number;
  readonly strokeColor: string;
  readonly onStrokeWidthChange: (width: number) => void;
  readonly onStrokeColorChange: (color: string) => void;
  readonly onFinishPath: (isClosed?: boolean) => void;
  readonly onExitPenMode: () => void;
}

export function ContextualPenControls({
  strokeWidth,
  strokeColor,
  onStrokeWidthChange,
  onStrokeColorChange,
  onFinishPath,
  onExitPenMode,
}: ContextualPenControlsProps): ReactElement {
  const [showColorPicker, setShowColorPicker] = useState(false);

  return (
    <div className={styles.bar} role="toolbar" aria-label="Controles da Caneta Bézier">
      <ToolbarGroup ariaLabel="Ferramenta ativa">
        <span className={styles.label}>Caneta Bézier:</span>
      </ToolbarGroup>

      <div className={styles.colorPickerContainer}>
        <button
          type="button"
          className={styles.colorSwatchButton}
          style={{ backgroundColor: strokeColor }}
          onClick={() => setShowColorPicker((prev) => !prev)}
          aria-label={`Cor do traçado: ${strokeColor}`}
          title="Cor do traçado da caneta"
        />
        {showColorPicker && (
          <ContextualColorPopover
            currentColor={strokeColor}
            onSelectColor={(c) => {
              onStrokeColorChange(c);
              setShowColorPicker(false);
            }}
            onClose={() => setShowColorPicker(false)}
          />
        )}
      </div>
      <span className={styles.colorHex}>{strokeColor}</span>

      <ToolbarDivider />

      <div className={styles.group}>
        <span className={styles.label}>Espessura:</span>
        <input
          type="range"
          min="1"
          max="48"
          value={strokeWidth}
          onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
          className={styles.spacingSlider}
          aria-label="Espessura do traçado da caneta"
        />
        <span className={styles.valueDisplay}>{strokeWidth}px</span>
      </div>

      <ToolbarDivider />

      <div className={styles.group}>
        <Button
          variant="primary"
          size="sm"
          icon="check"
          onClick={() => onFinishPath(true)}
          title="Fechar forma vetorial (Enter)"
        >
          Fechar Forma
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onFinishPath(false)}
          title="Concluir linha aberta (Enter/Esc)"
        >
          Linha Aberta
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onExitPenMode}
          title="Cancelar e sair do modo caneta (Esc)"
        >
          Sair
        </Button>
      </div>
    </div>
  );
}
