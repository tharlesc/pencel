import type { BooleanPathOperation } from '@pencel/editor-core';
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import {
  Button,
  ColorPicker,
  Icon,
  Input,
  ToolbarDivider,
  ToolbarGroup,
} from '../../../components/ui/index.js';
import type { SelectedObjectProperties } from '../engine/FabricCanvasAdapter.js';
import { CANVA_PALETTE_SWATCHES } from '../model/presetCatalog.js';
import { getColorShadesAndTints } from '../services/colorIntelligenceService.js';
import { EXPANDED_FONT_CATALOG, loadWebFont } from '../services/fontLoaderService.js';
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

interface ColorSpectrumPopoverProps {
  readonly currentColor: string;
  readonly onSelectColor: (color: string) => void;
  readonly onClose: () => void;
}

function ColorSpectrumPopover({
  currentColor,
  onSelectColor,
  onClose,
}: ColorSpectrumPopoverProps): ReactElement {
  const { tints, shades } = useMemo(() => {
    try {
      return getColorShadesAndTints(currentColor);
    } catch {
      return { tints: [], shades: [] };
    }
  }, [currentColor]);

  return (
    <div className={styles.palettePopover} onClick={(e) => e.stopPropagation()}>
      <ColorPicker
        color={currentColor.startsWith('#') && currentColor.length === 7 ? currentColor : '#0071E3'}
        onChange={onSelectColor}
        onClose={onClose}
      />

      <div className={styles.popoverDivider} />

      <span className={styles.swatchesSectionTitle}>Tons & Sombras</span>
      <div className={styles.shadesStrip}>
        {tints.map((tint) => (
          <button
            key={tint}
            type="button"
            className={styles.miniSwatch}
            style={{ backgroundColor: tint }}
            onClick={() => {
              onSelectColor(tint);
              onClose();
            }}
            title={`Tom claro: ${tint}`}
          />
        ))}
      </div>
      <div className={styles.shadesStrip} style={{ marginTop: '4px' }}>
        {shades.map((shade) => (
          <button
            key={shade}
            type="button"
            className={styles.miniSwatch}
            style={{ backgroundColor: shade }}
            onClick={() => {
              onSelectColor(shade);
              onClose();
            }}
            title={`Sombra: ${shade}`}
          />
        ))}
      </div>

      <div className={styles.popoverDivider} />

      <span className={styles.swatchesSectionTitle}>Cores Padrão</span>
      <div className={styles.paletteGrid}>
        {CANVA_PALETTE_SWATCHES.map((swatch) => (
          <button
            key={swatch.value}
            type="button"
            className={styles.paletteSwatch}
            style={{ backgroundColor: swatch.value }}
            onClick={() => {
              onSelectColor(swatch.value);
              onClose();
            }}
            title={`${swatch.label} (${swatch.value})`}
          />
        ))}
      </div>
    </div>
  );
}

interface FontSelectorPopoverProps {
  readonly currentFamily: string;
  readonly onSelectFamily: (family: string) => void;
  readonly onClose: () => void;
}

function FontSelectorPopover({
  currentFamily,
  onSelectFamily,
  onClose,
}: FontSelectorPopoverProps): ReactElement {
  const [fontSearch, setFontSearch] = useState('');

  const filteredCategories = useMemo(() => {
    const cats = ['Sans-Serif', 'Serif', 'Display', 'Script', 'Monospace'] as const;
    const query = fontSearch.trim().toLowerCase();
    return cats
      .map((cat) => {
        const fonts = EXPANDED_FONT_CATALOG.filter(
          (f) =>
            f.category === cat &&
            (f.label.toLowerCase().includes(query) || f.family.toLowerCase().includes(query)),
        );
        return { cat, fonts };
      })
      .filter((group) => group.fonts.length > 0);
  }, [fontSearch]);

  return (
    <div className={styles.fontMenuPopover} onClick={(e) => e.stopPropagation()}>
      <div className={styles.fontSearchContainer}>
        <Input
          prefixIcon="search"
          placeholder="Buscar fonte..."
          value={fontSearch}
          onChange={(e) => setFontSearch(e.target.value)}
          onClear={() => setFontSearch('')}
          autoFocus
        />
      </div>

      <div className={styles.fontMenuList}>
        {filteredCategories.map(({ cat, fonts }) => (
          <div key={cat} className={styles.fontMenuCategory}>
            <span className={styles.fontCategoryHeader}>{cat}</span>
            {fonts.map((font) => {
              const isSelected =
                font.family.toLowerCase() === currentFamily.toLowerCase() ||
                font.label.toLowerCase() === currentFamily.toLowerCase();
              return (
                <button
                  key={font.id}
                  type="button"
                  className={[styles.fontMenuItem, isSelected ? styles.fontMenuItemActive : '']
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => {
                    void loadWebFont(font);
                    onSelectFamily(font.family);
                    onClose();
                  }}
                  onMouseEnter={() => {
                    void loadWebFont(font);
                  }}
                  title={font.label}
                >
                  <span className={styles.fontSampleText} style={{ fontFamily: font.family }}>
                    {font.label}
                  </span>
                  {isSelected && <Icon name="check" size="xs" tone="accent" />}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ContextualToolbar({
  selectedObject,
  pageBackground,
  onPageBackgroundChange,
  onUpdateObject,
  onDeleteSelected,
  onDuplicateSelected,
  onBringForward: _onBringForward,
  onSendBackward: _onSendBackward,
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

  // When no object is selected, show page / canvas level controls
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
              <ColorSpectrumPopover
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
      {/* Text Specific Controls */}
      {isText && (
        <div className={styles.group}>
          {/* Custom Apple Liquid Glass Font Picker */}
          <div className={styles.fontPickerContainer}>
            <button
              type="button"
              className={styles.fontPickerTrigger}
              onClick={() => setShowFontMenu((v) => !v)}
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
              <FontSelectorPopover
                currentFamily={selectedObject.fontFamily ?? 'Inter'}
                onSelectFamily={(newFamily) => onUpdateObject({ fontFamily: newFamily })}
                onClose={() => setShowFontMenu(false)}
              />
            )}
          </div>

          {/* Font Size controls */}
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

          {/* Text Color Swatch */}
          <div className={styles.colorPickerContainer}>
            <button
              type="button"
              className={styles.colorSwatchButton}
              style={{ backgroundColor: selectedObject.fill || '#18181B' }}
              onClick={() => setShowColorPicker((prev) => (prev === 'fill' ? null : 'fill'))}
              aria-label="Cor do texto"
            />
            {showColorPicker === 'fill' && (
              <ColorSpectrumPopover
                currentColor={selectedObject.fill || '#18181B'}
                onSelectColor={(c) => onUpdateObject({ fill: c })}
                onClose={() => setShowColorPicker(null)}
              />
            )}
          </div>

          {/* Bold, Italic, Underline */}
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

          {/* Text Alignment */}
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

          {/* Text Spacing Controls (Letter spacing & Line spacing) */}
          <div className={styles.spacingContainer}>
            <Button
              variant="toolbar"
              size="sm"
              icon="letterSpacing"
              active={showSpacingPopover}
              onClick={() => setShowSpacingPopover((v) => !v)}
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
                    onChange={(e) =>
                      onUpdateObject({ lineHeight: Number.parseFloat(e.target.value) })
                    }
                    className={styles.appleRangeSlider}
                    aria-label="Espaçamento entre linhas"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shape Specific Controls */}
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
              <ColorSpectrumPopover
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
              <ColorSpectrumPopover
                currentColor={selectedObject.stroke || '#18181B'}
                onSelectColor={(c) => onUpdateObject({ stroke: c, strokeWidth: 3 })}
                onClose={() => setShowColorPicker(null)}
              />
            )}
          </div>
        </div>
      )}

      {/* Image Specific Controls: Remover Fundo, Recorte Não Destrutivo & Máscara */}
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

      {/* Multi-Selection Boolean Pathfinder Controls (Parte V) */}
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

      {/* Alignment Controls (Element to Element & Element to Artboard) */}
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
            icon="objectAlignCenter"
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
            icon="alignMiddle"
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

      {/* Common Controls: Opacity, Layering, Duplicate, Delete */}
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
    </div>
  );
}
