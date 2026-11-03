import type { GuideLine } from '@pencel/editor-core';
import type { Dimensions } from '@pencel/shared-types';
import { useState, type ReactElement } from 'react';
import { Button, Icon } from '../../../../components/ui/index.js';
import {
  DEFAULT_GUIDE_LAYOUT_CONFIG,
  MARGIN_INPUTS,
  PRESET_OPTIONS,
  generateGuideLayout,
  type GuideLayoutConfig,
} from '../../engine/guideLayoutEngine.js';
import styles from './GuideLayoutModal.module.css';

export interface GuideLayoutModalProps {
  readonly isOpen: boolean;
  readonly pageDimensions: Dimensions;
  readonly existingGuides: readonly GuideLine[];
  readonly onApplyGuides: (guides: readonly GuideLine[]) => void;
  readonly onExportSlices?: () => void;
  readonly onClose: () => void;
}

export function GuideLayoutModal({
  isOpen,
  pageDimensions,
  existingGuides,
  onApplyGuides,
  onExportSlices,
  onClose,
}: GuideLayoutModalProps): ReactElement | null {
  const [config, setConfig] = useState<GuideLayoutConfig>(DEFAULT_GUIDE_LAYOUT_CONFIG);

  if (!isOpen) return null;

  const handleApplyPreset = (p: (typeof PRESET_OPTIONS)[number]): void => {
    setConfig({
      ...config,
      preset: p.id,
      columns: p.cols,
      columnGutter: p.colGutter,
      rows: p.rows,
      rowGutter: p.rowGutter,
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
    });
  };

  const handleApply = (): void => {
    const newGuides = generateGuideLayout(pageDimensions, config);
    onApplyGuides(config.clearExisting ? newGuides : [...existingGuides, ...newGuides]);
    onClose();
  };

  return (
    <div
      className={styles.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-layout-title"
      data-testid="guide-layout-modal"
    >
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleGroup}>
            <Icon name="grid" size="sm" tone="accent" />
            <h2 id="guide-layout-title" className={styles.modalTitle}>
              Layout de Guias & Fatiamento
            </h2>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fechar modal de guias"
          >
            <Icon name="close" size="xs" />
          </button>
        </div>

        <div className={styles.modalBodyHorizontal}>
          <div className={styles.presetsSidebar}>
            <div className={styles.sectionHeader}>Modelos Rápidos</div>
            {PRESET_OPTIONS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={[
                  styles.presetCard,
                  config.preset === p.id ? styles.presetCardActive : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handleApplyPreset(p)}
              >
                <span className={styles.presetName}>{p.name}</span>
                <span className={styles.presetDesc}>{p.desc}</span>
              </button>
            ))}
          </div>

          <div className={styles.controlsMain}>
            <div>
              <div className={styles.sectionHeader}>Colunas & Linhas</div>
              <div className={styles.gridTwoCols}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="guide-cols">
                    Número de Colunas
                  </label>
                  <input
                    id="guide-cols"
                    type="number"
                    min={0}
                    max={64}
                    value={config.columns}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        preset: 'custom',
                        columns: Math.max(0, Number(e.target.value)),
                      })
                    }
                    className={styles.numberInput}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="guide-col-gutter">
                    Espaçamento Colunas (px)
                  </label>
                  <input
                    id="guide-col-gutter"
                    type="number"
                    min={0}
                    max={200}
                    value={config.columnGutter}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        preset: 'custom',
                        columnGutter: Math.max(0, Number(e.target.value)),
                      })
                    }
                    className={styles.numberInput}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="guide-rows">
                    Número de Linhas
                  </label>
                  <input
                    id="guide-rows"
                    type="number"
                    min={0}
                    max={64}
                    value={config.rows}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        preset: 'custom',
                        rows: Math.max(0, Number(e.target.value)),
                      })
                    }
                    className={styles.numberInput}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="guide-row-gutter">
                    Espaçamento Linhas (px)
                  </label>
                  <input
                    id="guide-row-gutter"
                    type="number"
                    min={0}
                    max={200}
                    value={config.rowGutter}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        preset: 'custom',
                        rowGutter: Math.max(0, Number(e.target.value)),
                      })
                    }
                    className={styles.numberInput}
                  />
                </div>
              </div>
            </div>

            <div>
              <div className={styles.sectionHeader}>Margens da Prancheta (px)</div>
              <div className={styles.gridFourCols}>
                {MARGIN_INPUTS.map((m) => (
                  <div key={m.key} className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor={`guide-${m.key}`}>
                      {m.label}
                    </label>
                    <input
                      id={`guide-${m.key}`}
                      type="number"
                      min={0}
                      value={config[m.key]}
                      onChange={(e) =>
                        setConfig({ ...config, [m.key]: Math.max(0, Number(e.target.value)) })
                      }
                      className={styles.numberInput}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={config.clearExisting}
                  onChange={(e) => setConfig({ ...config, clearExisting: e.target.checked })}
                />
                <span>Limpar guias existentes antes de aplicar</span>
              </label>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          {onExportSlices ? (
            <Button
              variant="secondary"
              size="sm"
              icon="export"
              onClick={() => {
                onExportSlices();
                onClose();
              }}
              title="Fatiar a partir das guias atuais e exportar fatias individuais"
            >
              Exportar Fatias das Guias
            </Button>
          ) : (
            <div />
          )}

          <div className={styles.footerActions}>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" onClick={handleApply}>
              Aplicar Layout de Guias
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
