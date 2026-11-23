import type { ReactElement } from 'react';
import { useI18n } from '../../../../../shared/i18n/index.js';
import type {
  CreativePieceType,
  LayoutCompositionArchetype,
  LayoutGenerationMode,
} from '../../../services/aiLayoutService.js';
import type {
  LocalizedArchetype,
  LocalizedPieceType,
  LocalizedStyle,
  StyleOption,
} from './aiGeneratorConstants.js';
import styles from './AiGeneratorPanel.module.css';

export interface AiDirectionControlsProps {
  readonly mode: LayoutGenerationMode;
  readonly pieceTypesList: readonly LocalizedPieceType[];
  readonly selectedPieceType: CreativePieceType;
  readonly onSelectPieceType: (pieceType: CreativePieceType) => void;
  readonly stylesList: readonly LocalizedStyle[];
  readonly selectedStyle: StyleOption;
  readonly onSelectStyle: (style: StyleOption) => void;
  readonly archetypesList: readonly LocalizedArchetype[];
  readonly selectedArchetype: LayoutCompositionArchetype;
  readonly onSelectArchetype: (archetype: LayoutCompositionArchetype) => void;
  readonly variationsCount: 1 | 3;
  readonly onChangeVariationsCount: (count: 1 | 3) => void;
  readonly disabled: boolean;
}

export function AiDirectionControls({
  mode,
  pieceTypesList,
  selectedPieceType,
  onSelectPieceType,
  stylesList,
  selectedStyle,
  onSelectStyle,
  archetypesList,
  selectedArchetype,
  onSelectArchetype,
  variationsCount,
  onChangeVariationsCount,
  disabled,
}: AiDirectionControlsProps): ReactElement {
  const { t } = useI18n();

  return (
    <>
      {mode === 'create' ? (
        <div className={styles.section}>
          <span className={styles.sectionLabel}>{t('ai.pieceTypeLabel')}</span>
          <div className={styles.pieceTypeRow}>
            {pieceTypesList.map((piece) => (
              <button
                key={piece.id}
                type="button"
                className={[
                  styles.archetypeChip,
                  selectedPieceType === piece.id ? styles.archetypeChipActive : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onSelectPieceType(piece.id)}
                disabled={disabled}
                aria-pressed={selectedPieceType === piece.id}
              >
                {piece.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className={styles.section}>
        <span className={styles.sectionLabel}>{t('ai.aestheticDirection')}</span>
        <div className={styles.styleGrid}>
          {stylesList.map((style) => (
            <button
              key={style.id}
              type="button"
              className={[
                styles.styleCard,
                selectedStyle === style.id ? styles.styleCardActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelectStyle(style.id)}
              disabled={disabled}
              aria-pressed={selectedStyle === style.id}
            >
              <div className={styles.styleCardHeader}>
                <span className={styles.styleCardTitle}>{style.label}</span>
                <span className={styles.swatchDotsRow} aria-hidden="true">
                  {style.swatches.map((hex) => (
                    <span key={hex} className={styles.swatchDot} style={{ backgroundColor: hex }} />
                  ))}
                </span>
              </div>
              <span className={styles.styleCardDesc}>{style.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {mode === 'create' ? (
        <div className={styles.section}>
          <div className={styles.rowBetween}>
            <span className={styles.sectionLabel}>{t('ai.compositionLabel')}</span>
            <div
              className={styles.variationToggle}
              role="group"
              aria-label={t('ai.variationsLabel')}
            >
              <button
                type="button"
                className={[
                  styles.variationBtn,
                  variationsCount === 1 ? styles.variationBtnActive : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onChangeVariationsCount(1)}
                disabled={disabled}
                aria-pressed={variationsCount === 1}
              >
                {t('ai.variationSingle')}
              </button>
              <button
                type="button"
                className={[
                  styles.variationBtn,
                  variationsCount === 3 ? styles.variationBtnActive : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onChangeVariationsCount(3)}
                disabled={disabled}
                aria-pressed={variationsCount === 3}
              >
                {t('ai.variationTriple')}
              </button>
            </div>
          </div>

          <div className={styles.archetypeRow}>
            {archetypesList.map((arch) => (
              <button
                key={arch.id}
                type="button"
                className={[
                  styles.archetypeChip,
                  selectedArchetype === arch.id ? styles.archetypeChipActive : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onSelectArchetype(arch.id)}
                disabled={disabled}
                aria-pressed={selectedArchetype === arch.id}
              >
                {arch.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
