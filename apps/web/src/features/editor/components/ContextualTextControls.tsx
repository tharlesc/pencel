import type { ReactElement } from 'react';
import { Button, Icon, ToolbarDivider, ToolbarGroup } from '../../../components/ui/index.js';
import type { SelectedObjectProperties } from '../engine/FabricCanvasAdapter.js';
import { EXPANDED_FONT_CATALOG } from '../services/fontLoaderService.js';
import { ContextualColorPopover } from './ContextualColorPopover.js';
import { ContextualFontPopover } from './ContextualFontPopover.js';
import styles from './ContextualToolbar.module.css';

export interface ContextualTextControlsProps {
  readonly selectedObject: SelectedObjectProperties;
  readonly showColorPicker: 'fill' | 'stroke' | 'bg' | null;
  readonly onSetShowColorPicker: (mode: 'fill' | 'stroke' | 'bg' | null) => void;
  readonly showSpacingPopover: boolean;
  readonly onSetShowSpacingPopover: (show: boolean) => void;
  readonly showFontMenu: boolean;
  readonly onSetShowFontMenu: (show: boolean) => void;
  readonly onUpdateObject: (props: Partial<SelectedObjectProperties>) => void;
}

export function ContextualTextControls({
  selectedObject,
  showColorPicker,
  onSetShowColorPicker,
  showSpacingPopover,
  onSetShowSpacingPopover,
  showFontMenu,
  onSetShowFontMenu,
  onUpdateObject,
}: ContextualTextControlsProps): ReactElement {
  return (
    <div className={styles.group}>
      <div className={styles.fontPickerContainer}>
        <button
          type="button"
          className={styles.fontPickerTrigger}
          onClick={() => onSetShowFontMenu(!showFontMenu)}
          aria-label="Selecionar tipografia"
        >
          <span
            className={styles.fontPickerActiveLabel}
            style={{
              fontFamily: selectedObject.fontFamily ?? 'Inter, -apple-system, sans-serif',
            }}
          >
            {EXPANDED_FONT_CATALOG.find(
              (f) =>
                f.family === selectedObject.fontFamily || f.label === selectedObject.fontFamily,
            )?.label ??
              selectedObject.fontFamily ??
              'Inter'}
          </span>
          <Icon name="chevronDown" size="xs" tone="muted" />
        </button>
        {showFontMenu && (
          <ContextualFontPopover
            currentFamily={selectedObject.fontFamily ?? 'Inter'}
            onSelectFamily={(newFamily) => onUpdateObject({ fontFamily: newFamily })}
            onClose={() => onSetShowFontMenu(false)}
          />
        )}
      </div>

      <div className={styles.sizeControl}>
        <button
          type="button"
          className={styles.stepperBtn}
          onClick={() =>
            onUpdateObject({ fontSize: Math.max(10, (selectedObject.fontSize || 36) - 4) })
          }
          aria-label="Diminuir fonte"
        >
          <Icon name="minus" size="xs" />
        </button>
        <span className={styles.sizeDisplay}>{selectedObject.fontSize || 36}</span>
        <button
          type="button"
          className={styles.stepperBtn}
          onClick={() =>
            onUpdateObject({ fontSize: Math.min(200, (selectedObject.fontSize || 36) + 4) })
          }
          aria-label="Aumentar fonte"
        >
          <Icon name="plus" size="xs" />
        </button>
      </div>

      <ToolbarDivider />

      <div className={styles.colorPickerContainer}>
        <button
          type="button"
          className={styles.colorSwatchButton}
          style={{ backgroundColor: selectedObject.fill || '#18181B' }}
          onClick={() => onSetShowColorPicker(showColorPicker === 'fill' ? null : 'fill')}
          aria-label="Cor do texto"
        />
        {showColorPicker === 'fill' && (
          <ContextualColorPopover
            currentColor={selectedObject.fill || '#18181B'}
            onSelectColor={(c) => onUpdateObject({ fill: c })}
            onClose={() => onSetShowColorPicker(null)}
          />
        )}
      </div>

      <ToolbarGroup ariaLabel="Estilos de texto">
        <Button
          variant="toolbar"
          size="sm"
          icon="bold"
          active={
            selectedObject.fontWeight === 'bold' ||
            selectedObject.fontWeight === '700' ||
            selectedObject.fontWeight === 700
          }
          onClick={() =>
            onUpdateObject({
              fontWeight:
                selectedObject.fontWeight === 'bold' || selectedObject.fontWeight === 700
                  ? 'normal'
                  : 'bold',
            })
          }
          aria-label="Negrito"
        />
        <Button
          variant="toolbar"
          size="sm"
          icon="italic"
          active={selectedObject.fontStyle === 'italic'}
          onClick={() =>
            onUpdateObject({
              fontStyle: selectedObject.fontStyle === 'italic' ? 'normal' : 'italic',
            })
          }
          aria-label="Itálico"
        />
        <Button
          variant="toolbar"
          size="sm"
          icon="underline"
          active={Boolean(selectedObject.underline)}
          onClick={() => onUpdateObject({ underline: !selectedObject.underline })}
          aria-label="Sublinhado"
        />
      </ToolbarGroup>

      <ToolbarDivider />

      <ToolbarGroup ariaLabel="Alinhamento de texto">
        <Button
          variant="toolbar"
          size="sm"
          icon="alignLeft"
          active={selectedObject.textAlign === 'left'}
          onClick={() => onUpdateObject({ textAlign: 'left' })}
          aria-label="Alinhar à esquerda"
        />
        <Button
          variant="toolbar"
          size="sm"
          icon="alignCenter"
          active={selectedObject.textAlign === 'center' || !selectedObject.textAlign}
          onClick={() => onUpdateObject({ textAlign: 'center' })}
          aria-label="Centralizar texto"
        />
        <Button
          variant="toolbar"
          size="sm"
          icon="alignRight"
          active={selectedObject.textAlign === 'right'}
          onClick={() => onUpdateObject({ textAlign: 'right' })}
          aria-label="Alinhar à direita"
        />
      </ToolbarGroup>

      <ToolbarDivider />

      <div className={styles.spacingContainer}>
        <Button
          variant="toolbar"
          size="sm"
          icon="letterSpacing"
          active={showSpacingPopover}
          onClick={() => onSetShowSpacingPopover(!showSpacingPopover)}
          aria-label="Espaçamento de letras e linhas"
        />
        {showSpacingPopover && (
          <div className={styles.spacingPopover} onClick={(e) => e.stopPropagation()}>
            <div className={styles.spacingHeader}>
              <span className={styles.spacingHeaderTitle}>Espaçamento Tipográfico</span>
              <button
                type="button"
                className={styles.spacingResetBtn}
                onClick={() => onUpdateObject({ charSpacing: 0, lineHeight: 1.16 })}
                title="Restaurar padrão"
              >
                Redefinir
              </button>
            </div>

            <div className={styles.spacingRow}>
              <div className={styles.spacingLabelRow}>
                <span className={styles.spacingLabel}>Espaçamento de letras</span>
                <span className={styles.spacingBadge}>{selectedObject.charSpacing ?? 0}</span>
              </div>
              <input
                type="range"
                min={-50}
                max={300}
                step={5}
                value={selectedObject.charSpacing ?? 0}
                onChange={(e) =>
                  onUpdateObject({ charSpacing: Number.parseInt(e.target.value, 10) })
                }
                className={styles.appleRangeSlider}
                aria-label="Espaçamento entre letras"
              />
            </div>

            <div className={styles.spacingRow}>
              <div className={styles.spacingLabelRow}>
                <span className={styles.spacingLabel}>Altura da linha</span>
                <span className={styles.spacingBadge}>
                  {(selectedObject.lineHeight ?? 1.16).toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={0.8}
                max={2.5}
                step={0.05}
                value={selectedObject.lineHeight ?? 1.16}
                onChange={(e) => onUpdateObject({ lineHeight: Number.parseFloat(e.target.value) })}
                className={styles.appleRangeSlider}
                aria-label="Espaçamento entre linhas"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
