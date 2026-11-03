import type { ReactElement } from 'react';
import { Button, Select, ToolbarDivider, ToolbarGroup } from '../../../../components/ui/index.js';
import type { SelectedObjectProperties } from '../../engine/FabricCanvasAdapter.js';
import styles from './ContextualToolbar.module.css';

const BLEND_MODE_OPTIONS = [
  { value: 'source-over', label: 'Normal' },
  { value: 'multiply', label: 'Multiplicação' },
  { value: 'screen', label: 'Divisão (Screen)' },
  { value: 'overlay', label: 'Sobrepor (Overlay)' },
  { value: 'darken', label: 'Escurecer' },
  { value: 'lighten', label: 'Clarear' },
  { value: 'color-dodge', label: 'Subexposição' },
  { value: 'color-burn', label: 'Superexposição' },
  { value: 'hard-light', label: 'Luz Direta' },
  { value: 'soft-light', label: 'Luz Indireta' },
  { value: 'difference', label: 'Diferença' },
  { value: 'exclusion', label: 'Exclusão' },
  { value: 'hue', label: 'Matiz' },
  { value: 'saturation', label: 'Saturação' },
  { value: 'color', label: 'Cor' },
  { value: 'luminosity', label: 'Luminosidade' },
] as const;

export interface ContextualAlignmentAndTrailingProps {
  readonly selectedObject: SelectedObjectProperties;
  readonly onAlignSelected?: (
    alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom',
    target?: 'artboard' | 'selection',
  ) => void;
  readonly onDistributeSelected?: (direction: 'horizontal' | 'vertical') => void;
  readonly onUpdateObject: (props: Partial<SelectedObjectProperties>) => void;
  readonly onDuplicateSelected: () => void;
  readonly onDeleteSelected: () => void;
}

export function ContextualAlignmentAndTrailing({
  selectedObject,
  onAlignSelected,
  onDistributeSelected,
  onUpdateObject,
  onDuplicateSelected,
  onDeleteSelected,
}: ContextualAlignmentAndTrailingProps): ReactElement {
  return (
    <>
      <div className={styles.group}>
        <ToolbarDivider />
        <ToolbarGroup ariaLabel="Alinhamento do elemento">
          <Button
            variant="toolbar"
            size="sm"
            icon="objectAlignLeft"
            onClick={() => onAlignSelected?.('left')}
            aria-label="Alinhar à esquerda"
          />
          <Button
            variant="toolbar"
            size="sm"
            icon="alignMiddle"
            onClick={() => onAlignSelected?.('center')}
            aria-label="Centralizar horizontalmente"
          />
          <Button
            variant="toolbar"
            size="sm"
            icon="objectAlignRight"
            onClick={() => onAlignSelected?.('right')}
            aria-label="Alinhar à direita"
          />
          <Button
            variant="toolbar"
            size="sm"
            icon="alignTop"
            onClick={() => onAlignSelected?.('top')}
            aria-label="Alinhar ao topo"
          />
          <Button
            variant="toolbar"
            size="sm"
            icon="objectAlignCenter"
            onClick={() => onAlignSelected?.('middle')}
            aria-label="Centralizar verticalmente"
          />
          <Button
            variant="toolbar"
            size="sm"
            icon="alignBottom"
            onClick={() => onAlignSelected?.('bottom')}
            aria-label="Alinhar à base"
          />
          {selectedObject.count && selectedObject.count >= 3 ? (
            <>
              <Button
                variant="toolbar"
                size="sm"
                icon="distributeHorizontally"
                onClick={() => onDistributeSelected?.('horizontal')}
                aria-label="Distribuir horizontalmente"
              />
              <Button
                variant="toolbar"
                size="sm"
                icon="distributeVertically"
                onClick={() => onDistributeSelected?.('vertical')}
                aria-label="Distribuir verticalmente"
              />
            </>
          ) : null}
        </ToolbarGroup>
      </div>

      <div className={styles.trailingGroup}>
        <div className={styles.opacityControl}>
          <span className={styles.label}>Opacidade:</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={selectedObject.opacity ?? 1}
            onChange={(e) => onUpdateObject({ opacity: Number.parseFloat(e.target.value) })}
            className={styles.rangeInput}
            aria-label="Opacidade"
          />
          <span className={styles.opacityValue}>
            {Math.round((selectedObject.opacity ?? 1) * 100)}%
          </span>
        </div>

        <div className={styles.blendModeControl}>
          <span className={styles.label}>Mesclagem:</span>
          <Select
            value={selectedObject.blendMode || 'source-over'}
            options={BLEND_MODE_OPTIONS}
            onChange={(val) => onUpdateObject({ blendMode: String(val) })}
            ariaLabel="Modo de mesclagem do elemento"
            size="sm"
          />
        </div>

        <ToolbarDivider />

        <ToolbarGroup ariaLabel="Ações do elemento">
          <Button
            variant="toolbar"
            size="sm"
            icon="copy"
            onClick={onDuplicateSelected}
            aria-label="Duplicar elemento"
          />
          <Button
            variant="toolbar"
            size="sm"
            icon="trash"
            onClick={onDeleteSelected}
            aria-label="Excluir elemento"
          />
        </ToolbarGroup>
      </div>
    </>
  );
}
