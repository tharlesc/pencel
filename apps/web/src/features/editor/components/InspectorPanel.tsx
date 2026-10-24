import type { DesignDocument, DesignPage } from '@pencel/editor-core';
import type { Dimensions } from '@pencel/shared-types';
import type { ReactElement } from 'react';
import { Badge, Icon, Input, PanelSection } from '../../../components/ui/index.js';
import { STUDIO_BACKGROUND_SWATCHES } from '../model/presetCatalog.js';
import type { EditorToolMode } from '../types/editorUi.types.js';
import styles from './InspectorPanel.module.css';

export interface InspectorPanelProps {
  readonly document: DesignDocument;
  readonly page: DesignPage;
  readonly activeTool: EditorToolMode;
  readonly onDimensionsChange: (dimensions: Dimensions) => void;
  readonly onBackgroundChange: (color: string) => void;
}

export function InspectorPanel({
  document,
  page,
  activeTool,
  onDimensionsChange,
  onBackgroundChange,
}: InspectorPanelProps): ReactElement {
  const handleWidthChange = (raw: string): void => {
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isNaN(parsed)) {
      onDimensionsChange({ width: parsed, height: page.dimensions.height });
    }
  };

  const handleHeightChange = (raw: string): void => {
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isNaN(parsed)) {
      onDimensionsChange({ width: page.dimensions.width, height: parsed });
    }
  };

  return (
    <div className={styles.inspector}>
      <div className={styles.topHeader}>
        <div className={styles.topTitle}>
          <Icon name="inspector" size="sm" tone="muted" />
          <span>Inspetor de Propriedades</span>
        </div>
        <Badge tone="neutral">{document.presetId}</Badge>
      </div>

      <PanelSection title="Dimensões da Página" badge={<Badge tone="accent">px</Badge>}>
        <div className={styles.gridTwoCols}>
          <Input
            label="Largura (W)"
            suffix="px"
            type="number"
            min={64}
            max={8000}
            monospace
            value={page.dimensions.width}
            onChange={(event) => handleWidthChange(event.target.value)}
          />
          <Input
            label="Altura (H)"
            suffix="px"
            type="number"
            min={64}
            max={8000}
            monospace
            value={page.dimensions.height}
            onChange={(event) => handleHeightChange(event.target.value)}
          />
        </div>
      </PanelSection>

      <PanelSection title="Superfície da Prancheta">
        <div className={styles.swatchGrid} role="radiogroup" aria-label="Cor de fundo da página">
          {STUDIO_BACKGROUND_SWATCHES.map((swatch) => {
            const isSelected = page.backgroundColor.toLowerCase() === swatch.value.toLowerCase();
            return (
              <button
                key={swatch.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={`${swatch.label} (${swatch.value})`}
                className={[styles.swatchButton, isSelected ? styles.swatchActive : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onBackgroundChange(swatch.value)}
              >
                <span
                  className={styles.swatchCircle}
                  style={{ backgroundColor: swatch.value }}
                  aria-hidden="true"
                />
                <span className={styles.swatchMeta}>
                  <span className={styles.swatchName}>{swatch.label}</span>
                  <span className={styles.swatchHex}>{swatch.value}</span>
                </span>
              </button>
            );
          })}
        </div>
      </PanelSection>

      <PanelSection title="Contexto de Seleção">
        <dl className={styles.metaList}>
          <div className={styles.metaRow}>
            <dt>Ferramenta Ativa</dt>
            <dd className={styles.monoValue}>{activeTool}</dd>
          </div>
          <div className={styles.metaRow}>
            <dt>Página Ativa</dt>
            <dd className={styles.monoValue}>{page.id}</dd>
          </div>
          <div className={styles.metaRow}>
            <dt>Elementos na Página</dt>
            <dd className={styles.monoValue}>{page.elements.length}</dd>
          </div>
        </dl>
      </PanelSection>
    </div>
  );
}
