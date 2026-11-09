import { useEffect, useState, type ReactElement } from 'react';
import { Button, ToolbarGroup } from '../../../../components/ui/index.js';
import { ContextualAlignmentAndTrailing } from './ContextualAlignmentAndTrailing.js';
import { ContextualBrushControls } from './ContextualBrushControls.js';
import { ContextualColorPopover } from './ContextualColorPopover.js';
import { ContextualPenControls } from './ContextualPenControls.js';
import { ContextualTextControls } from './ContextualTextControls.js';
import { ContextualToolbarProps } from './ContextualToolbar.types.js';
import { ContextualVectorControls } from './ContextualVectorControls.js';
import styles from './ContextualToolbar.module.css';

export type { ContextualToolbarProps };

export function ContextualToolbar({
  selectedObject,
  pageBackground,
  onPageBackgroundChange,
  onUpdateObject,
  onDeleteSelected,
  onDuplicateSelected,
  onClearCanvas,
  onOpenVectorize,
  onSelectSubject,
  onAlignSelected,
  onDistributeSelected,
  onApplyCrop,
  onToggleLayerMask,
  onPerformBooleanOperation,
  currentDrawingTool = 'none',
  currentToolMode = 'select',
  brushWidth = 8,
  brushHardness = 100,
  brushSmoothness = 50,
  brushColor = '#1D1D1F',
  onBrushWidthChange,
  onBrushHardnessChange,
  onBrushSmoothnessChange,
  onBrushColorChange,
  onExitDrawingMode,
  onFinishPenPath,
  onExitPenMode,
}: ContextualToolbarProps): ReactElement {
  const [showColorPicker, setShowColorPicker] = useState<'fill' | 'stroke' | 'bg' | null>(null);
  const [showSpacingPopover, setShowSpacingPopover] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [isProcessingSubject, setIsProcessingSubject] = useState(false);

  const handleSelectSubject = async (mode: 'select' | 'removeBg'): Promise<void> => {
    if (!onSelectSubject || isProcessingSubject) return;
    setIsProcessingSubject(true);
    try {
      await onSelectSubject(mode);
    } finally {
      setIsProcessingSubject(false);
    }
  };

  useEffect(() => {
    if (!showColorPicker && !showSpacingPopover && !showFontMenu) return;

    const handlePointerDown = (event: Event): void => {
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

    window.addEventListener('pointerdown', handlePointerDown, true);
    return () => window.removeEventListener('pointerdown', handlePointerDown, true);
  }, [showColorPicker, showSpacingPopover, showFontMenu]);

  if (currentDrawingTool === 'brush' || currentDrawingTool === 'eraser') {
    return (
      <ContextualBrushControls
        currentDrawingTool={currentDrawingTool}
        brushWidth={brushWidth}
        brushHardness={brushHardness}
        brushSmoothness={brushSmoothness}
        brushColor={brushColor}
        onBrushWidthChange={onBrushWidthChange ?? (() => {})}
        onBrushHardnessChange={onBrushHardnessChange}
        onBrushSmoothnessChange={onBrushSmoothnessChange ?? (() => {})}
        onBrushColorChange={onBrushColorChange ?? (() => {})}
        onExitDrawingMode={onExitDrawingMode ?? (() => {})}
      />
    );
  }

  if (currentToolMode === 'pen') {
    return (
      <ContextualPenControls
        strokeWidth={brushWidth}
        strokeColor={brushColor}
        onStrokeWidthChange={onBrushWidthChange ?? (() => {})}
        onStrokeColorChange={onBrushColorChange ?? (() => {})}
        onFinishPath={onFinishPenPath ?? (() => {})}
        onExitPenMode={onExitPenMode ?? (() => {})}
      />
    );
  }

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
        <ContextualVectorControls
          selectedObject={selectedObject}
          showColorPicker={showColorPicker}
          onSetShowColorPicker={setShowColorPicker}
          onUpdateObject={onUpdateObject}
        />
      )}

      {isImage && (
        <div className={styles.group}>
          <Button
            variant="toolbar"
            size="sm"
            icon="wand"
            disabled={isProcessingSubject}
            onClick={() => void handleSelectSubject('removeBg')}
            aria-label="Remover Fundo da Imagem via IA"
          >
            {isProcessingSubject ? 'Removendo Fundo...' : 'Remover Fundo'}
          </Button>
          {onOpenVectorize && (
            <Button
              variant="toolbar"
              size="sm"
              icon="vectorize"
              onClick={onOpenVectorize}
              aria-label="Vetorizar Imagem para SVG"
              title="Converter imagem bitmap em caminhos vetoriais com curvas de Bézier"
            >
              Vetorizar
            </Button>
          )}
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
