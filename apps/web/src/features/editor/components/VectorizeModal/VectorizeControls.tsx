import { useState, type ReactElement } from 'react';
import { Icon } from '../../../../components/ui/index.js';
import { VECTORIZE_PRESETS, type VectorizePresetKey } from '../../services/vtracerService.js';
import type { VTracerOptions } from 'vtracer-browser';
import styles from './VectorizeModal.module.css';

export interface VectorizeControlsProps {
  readonly activePreset: VectorizePresetKey;
  readonly options: VTracerOptions;
  readonly removeBackground: boolean;
  readonly disabled?: boolean;
  readonly onSelectPreset: (preset: VectorizePresetKey) => void;
  readonly onChangeOption: <K extends keyof VTracerOptions>(
    key: K,
    value: VTracerOptions[K],
  ) => void;
  readonly onToggleRemoveBackground: (val: boolean) => void;
  readonly onResetOptions: () => void;
}

export function VectorizeControls({
  activePreset,
  options,
  removeBackground,
  disabled = false,
  onSelectPreset,
  onChangeOption,
  onToggleRemoveBackground,
  onResetOptions,
}: VectorizeControlsProps): ReactElement {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isBinaryMode =
    activePreset === 'silhouette' || options.clustering === 'binary' || options.preset === 'bw';

  return (
    <div className={styles.controlsPanel}>
      <div className={styles.sectionTitleGroup}>
        <span className={styles.sectionTitle}>Predefinições de Vetorização</span>
        <button
          type="button"
          className={styles.resetButton}
          onClick={onResetOptions}
          disabled={disabled}
          title="Restaurar predefinições recomendadas"
        >
          <Icon name="undo" size="xs" />
          <span>Restaurar</span>
        </button>
      </div>

      <div
        className={styles.presetGrid}
        role="radiogroup"
        aria-label="Predefinições de vetorização"
      >
        {Object.values(VECTORIZE_PRESETS).map((p) => {
          const isSelected = activePreset === p.key;
          return (
            <button
              key={p.key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={[styles.presetCard, isSelected ? styles.presetCardActive : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelectPreset(p.key)}
              disabled={disabled}
            >
              <div className={styles.presetHeader}>
                <span className={styles.presetIconWrap}>
                  <Icon
                    name={p.iconName as 'shapes' | 'brush' | 'sparkles' | 'layers'}
                    size="sm"
                    tone={isSelected ? 'accent' : 'default'}
                  />
                </span>
                <span className={styles.presetName}>{p.label}</span>
              </div>
              <p className={styles.presetDesc}>{p.description}</p>
            </button>
          );
        })}
      </div>

      <div className={styles.toggleRow}>
        <label className={styles.checkboxLabelContainer}>
          <input
            type="checkbox"
            checked={removeBackground}
            disabled={disabled}
            onChange={(e) => onToggleRemoveBackground(e.target.checked)}
            className={styles.rangeInput}
            style={{ width: 'auto', margin: 0, cursor: 'pointer' }}
          />
          <span className={styles.sliderLabel}>Fundo Transparente (Sem Fundo)</span>
        </label>
        <span className={styles.sliderHelp}>
          Remove a camada de fundo sólida para inserir apenas os traços vetoriais.
        </span>
      </div>

      <div className={styles.advancedToggleRow}>
        <button
          type="button"
          className={styles.advancedToggleBtn}
          onClick={() => setShowAdvanced((prev) => !prev)}
          aria-expanded={showAdvanced}
        >
          <Icon name={showAdvanced ? 'chevronDown' : 'chevronRight'} size="xs" />
          <span>Ajustes Avançados de Curvas e Cor</span>
        </button>
      </div>

      {showAdvanced && (
        <div className={styles.advancedSection}>
          <div className={styles.sliderRow}>
            <div className={styles.sliderLabelGroup}>
              <span className={styles.sliderLabel}>Redução de Ruído (Speckle)</span>
              <span className={styles.sliderValue}>{options.filterSpeckle ?? 4}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={64}
              step={1}
              value={options.filterSpeckle ?? 4}
              disabled={disabled}
              onChange={(e) => onChangeOption('filterSpeckle', Number(e.target.value))}
              className={styles.rangeInput}
              aria-label="Filtro de ruído em pixels"
            />
            <span className={styles.sliderHelp}>
              Descarta manchas e detalhes isolados menores que o valor especificado.
            </span>
          </div>

          {!isBinaryMode && (
            <div className={styles.sliderRow}>
              <div className={styles.sliderLabelGroup}>
                <span className={styles.sliderLabel}>Precisão de Cores</span>
                <span className={styles.sliderValue}>{options.colorPrecision ?? 6} bits</span>
              </div>
              <input
                type="range"
                min={1}
                max={8}
                step={1}
                value={options.colorPrecision ?? 6}
                disabled={disabled}
                onChange={(e) => onChangeOption('colorPrecision', Number(e.target.value))}
                className={styles.rangeInput}
                aria-label="Precisão de quantização de cores"
              />
              <span className={styles.sliderHelp}>
                Bits por canal RGB. Valores mais baixos criam paletas simplificadas estilo pôster.
              </span>
            </div>
          )}

          {isBinaryMode && (
            <div className={styles.sliderRow}>
              <div className={styles.sliderLabelGroup}>
                <span className={styles.sliderLabel}>Limiar de Preto e Branco</span>
                <span className={styles.sliderValue}>{options.binaryThreshold ?? 128}</span>
              </div>
              <input
                type="range"
                min={0}
                max={255}
                step={1}
                value={options.binaryThreshold ?? 128}
                disabled={disabled}
                onChange={(e) => onChangeOption('binaryThreshold', Number(e.target.value))}
                className={styles.rangeInput}
                aria-label="Limiar de corte para traçado binário"
              />
              <span className={styles.sliderHelp}>
                Corte de luminância entre primeiro plano escuro e fundo claro.
              </span>
            </div>
          )}

          <div className={styles.sliderRow}>
            <div className={styles.sliderLabelGroup}>
              <span className={styles.sliderLabel}>Suavização de Cantos</span>
              <span className={styles.sliderValue}>{options.cornerThreshold ?? 60}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={180}
              step={5}
              value={options.cornerThreshold ?? 60}
              disabled={disabled}
              onChange={(e) => onChangeOption('cornerThreshold', Number(e.target.value))}
              className={styles.rangeInput}
              aria-label="Tolerância angular de cantos"
            />
            <span className={styles.sliderHelp}>
              Ângulos menores criam cantos vivos; ângulos maiores arredondam para curvas contínuas.
            </span>
          </div>

          <div className={styles.sliderRow}>
            <div className={styles.sliderLabelGroup}>
              <span className={styles.sliderLabel}>Geometria das Curvas</span>
              <span className={styles.sliderValue}>
                {options.mode === 'polygon' ? 'Poligonal' : 'Bézier Suave'}
              </span>
            </div>
            <div className={styles.modeSegmentedGroup}>
              <button
                type="button"
                className={[
                  styles.modeButton,
                  options.mode !== 'polygon' ? styles.modeButtonActive : '',
                ].join(' ')}
                onClick={() => onChangeOption('mode', 'spline')}
                disabled={disabled}
              >
                Spline Cúbico (Bézier)
              </button>
              <button
                type="button"
                className={[
                  styles.modeButton,
                  options.mode === 'polygon' ? styles.modeButtonActive : '',
                ].join(' ')}
                onClick={() => onChangeOption('mode', 'polygon')}
                disabled={disabled}
              >
                Arestas Retas (Polígono)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
