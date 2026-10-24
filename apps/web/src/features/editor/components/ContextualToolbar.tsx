import type { BooleanPathOperation } from '@pencel/editor-core';
import { useEffect, useState, type ReactElement } from 'react';
import { Button, ToolbarDivider, ToolbarGroup } from '../../../components/ui/index.js';
import type { SelectedObjectProperties } from '../engine/FabricCanvasAdapter.js';
import { ContextualAlignmentAndTrailing } from './ContextualAlignmentAndTrailing.js';
import { ContextualColorPopover } from './ContextualColorPopover.js';
import { ContextualTextControls } from './ContextualTextControls.js';
import styles from './ContextualToolbar.module.css';

export interface ContextualToolbarProps {
  readonly selectedObject: SelectedObjectProperties | null;
  readonly pageBackground: string;
  readonly onPageBackgroundChange: (color: string) => void;
  readonly onUpdateObject: (props: Partial<SelectedObjectProperties>) => void;
  readonly onDeleteSelected: () => void;
  readonly onDuplicateSelected: () => void;
  readonly onBringForward?: () => void;
  readonly onSendBackward?: () => void;
  readonly onClearCanvas: () => void;
  readonly onSelectSubject?: (mode: 'select' | 'removeBg') => void;
  readonly onAlignSelected?: (
    alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom',
  ) => void;
  readonly onDistributeSelected?: (direction: 'horizontal' | 'vertical') => void;
  readonly onApplyCrop?: (mode: '1:1' | '4:3' | '16:9' | 'inset' | 'reset') => void;
  readonly onToggleLayerMask?: (
    layerName?: string,
    shape?: 'circle' | 'rounded' | 'ellipse',
  ) => void;
  readonly onPerformBooleanOperation?: (operation: BooleanPathOperation) => void;
}

export function ContextualToolbar({
  selectedObject,
  pageBackground,
  onPageBackgroundChange,
  onUpdateObject,
  onDeleteSelected,
  onDuplicateSelected,
  onClearCanvas,
  onSelectSubject,
  onAlignSelected,
  onDistributeSelected,
  onApplyCrop,
  onToggleLayerMask,
  onPerformBooleanOperation,
}: ContextualToolbarProps): ReactElement {
  const [showColorPicker, setShowColorPicker] = useState<'fill' | 'stroke' | 'bg' | null>(null);
  const [showSpacingPopover, setShowSpacingPopover] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);

  useEffect(() => {
    if (!showColorPicker && !showSpacingPopover && !showFontMenu) return;

    const handlePointerDown = (event: MouseEvent): void => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest(`.${styles.colorPickerContainer}`)) {
        setShowColorPicker(null);
      }
      if (!target?.closest(`.${styles.spacingContainer}`)) {
        setShowSpacingPopover(false);
      }
      if (!target?.closest(`.${styles.fontPickerContainer}`)) {
        setShowFontMenu(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [showColorPicker, showSpacingPopover, showFontMenu]);

  if (!selectedObject) {
    return (
      <div className={styles.bar}>
        <div className={styles.group}>
          <span className={styles.label}>Fundo da Prancheta:</span>
          <div className={styles.colorPickerContainer}>
            <button
              type="button"
              className={styles.colorSwatchButton}
              style={{ backgroundColor: pageBackground }}
              onClick={() => setShowColorPicker((prev) => (prev === 'bg' ? null : 'bg'))}
              aria-label={`Cor do fundo: ${pageBackground}`}
            />
            {showColorPicker === 'bg' && (
              <ContextualColorPopover
                currentColor={pageBackground}
                onSelectColor={onPageBackgroundChange}
                onClose={() => setShowColorPicker(null)}
              />
            )}
          </div>
          <span className={styles.colorHex}>{pageBackground}</span>
        </div>

        <div className={styles.group}>
          <Button variant="ghost" size="sm" icon="trash" onClick={onClearCanvas}>
            Limpar Prancheta
          </Button>
        </div>
      </div>
    );
  }

  const isText = selectedObject.type === 'textbox';
  const isShape = ['rect', 'circle', 'triangle', 'polygon', 'path'].includes(selectedObject.type);
  const isImage = selectedObject.type === 'image';
  const isMulti = selectedObject.type === 'activeselection';

  return (
    <div className={styles.bar}>
      {isText && (
        <ContextualTextControls
          selectedObject={selectedObject}
          showColorPicker={showColorPicker}
          onSetShowColorPicker={setShowColorPicker}
          showSpacingPopover={showSpacingPopover}
          onSetShowSpacingPopover={setShowSpacingPopover}
          showFontMenu={showFontMenu}
          onSetShowFontMenu={setShowFontMenu}
          onUpdateObject={onUpdateObject}
        />
      )}

      {isShape && (
        <div className={styles.group}>
          <span className={styles.label}>Preenchimento:</span>
          <div className={styles.colorPickerContainer}>
            <button
              type="button"
              className={styles.colorSwatchButton}
              style={{ backgroundColor: selectedObject.fill || '#0071E3' }}
              onClick={() => setShowColorPicker((prev) => (prev === 'fill' ? null : 'fill'))}
              aria-label="Cor da forma"
            />
            {showColorPicker === 'fill' && (
              <ContextualColorPopover
                currentColor={selectedObject.fill || '#0071E3'}
                onSelectColor={(c) => onUpdateObject({ fill: c })}
                onClose={() => setShowColorPicker(null)}
              />
            )}
          </div>

          <ToolbarDivider />

          <span className={styles.label}>Borda:</span>
          <div className={styles.colorPickerContainer}>
            <button
              type="button"
              className={styles.colorSwatchButton}
              style={{
                backgroundColor: selectedObject.stroke || 'transparent',
              }}
              onClick={() => setShowColorPicker((prev) => (prev === 'stroke' ? null : 'stroke'))}
              aria-label="Cor da borda"
            />
            {showColorPicker === 'stroke' && (
              <ContextualColorPopover
                currentColor={selectedObject.stroke || '#18181B'}
                onSelectColor={(c) => onUpdateObject({ stroke: c, strokeWidth: 3 })}
                onClose={() => setShowColorPicker(null)}
              />
            )}
          </div>
        </div>
      )}

      {isImage && (
        <div className={styles.group}>
          <Button
            variant="toolbar"
            size="sm"
            icon="wand"
            onClick={() => onSelectSubject?.('removeBg')}
            aria-label="Remover Fundo da Imagem"
          >
            Remover Fundo
          </Button>
          {onApplyCrop && (
            <>
              <Button
                variant="toolbar"
                size="sm"
                icon="square"
                active={Boolean(selectedObject.isCropped)}
                onClick={() => onApplyCrop(selectedObject.isCropped ? 'reset' : '1:1')}
                aria-label="Recortar 1:1 ou Restaurar Recorte"
              >
                {selectedObject.isCropped ? 'Restaurar' : 'Recorte 1:1'}
              </Button>
              <Button
                variant="toolbar"
                size="sm"
                icon="circle"
                active={Boolean(selectedObject.hasMask && !selectedObject.isCropped)}
                onClick={() => onToggleLayerMask?.(undefined, 'circle')}
                aria-label="Máscara Circular Não Destrutiva"
              >
                Máscara
              </Button>
            </>
          )}
        </div>
      )}

      {isMulti && onPerformBooleanOperation && (
        <div className={styles.group}>
          <ToolbarGroup ariaLabel="Operações booleanas vetoriais">
            <Button
              variant="toolbar"
              size="sm"
              onClick={() => onPerformBooleanOperation('union')}
              aria-label="Unir formas"
            >
              Unir
            </Button>
            <Button
              variant="toolbar"
              size="sm"
              onClick={() => onPerformBooleanOperation('intersect')}
              aria-label="Interseção de formas"
            >
              Interseção
            </Button>
            <Button
              variant="toolbar"
              size="sm"
              onClick={() => onPerformBooleanOperation('subtract')}
              aria-label="Subtrair formas"
            >
              Subtrair
            </Button>
          </ToolbarGroup>
        </div>
      )}

      <ContextualAlignmentAndTrailing
        selectedObject={selectedObject}
        onAlignSelected={onAlignSelected}
        onDistributeSelected={onDistributeSelected}
        onUpdateObject={onUpdateObject}
        onDuplicateSelected={onDuplicateSelected}
        onDeleteSelected={onDeleteSelected}
      />
    </div>
  );
}
