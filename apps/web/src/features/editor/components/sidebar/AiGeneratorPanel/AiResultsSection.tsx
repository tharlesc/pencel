import type { Dimensions } from '@pencel/shared-types';
import type { ReactElement } from 'react';
import { Icon } from '../../../../../components/ui/index.js';
import { useI18n } from '../../../../../shared/i18n/index.js';
import type { GeneratedLayoutDto } from '../../../services/aiLayoutService.js';
import { LayoutPreviewCard } from './LayoutPreviewCard.js';
import styles from './AiGeneratorPanel.module.css';

const VARIATION_LABELS = ['A', 'B', 'C'] as const;

export interface AiResultsSectionProps {
  readonly dimensions: Dimensions;
  readonly errorMessage: string | null;
  readonly successInfo: string | null;
  readonly lastSource: 'llm' | 'autonomous' | null;
  readonly generatedConcepts: readonly GeneratedLayoutDto[];
  readonly activeConceptId: string | null;
  readonly sessionHistory: readonly GeneratedLayoutDto[];
  readonly isLoading: boolean;
  readonly hasPrompt: boolean;
  readonly canCreateArtboard: boolean;
  readonly onSelectLayout: (layout: GeneratedLayoutDto, targetNewArtboard: boolean) => void;
  readonly onRegenerateVariation: () => void;
  readonly onSwitchToRefine: () => void;
}

export function AiResultsSection({
  dimensions,
  errorMessage,
  successInfo,
  lastSource,
  generatedConcepts,
  activeConceptId,
  sessionHistory,
  isLoading,
  hasPrompt,
  canCreateArtboard,
  onSelectLayout,
  onRegenerateVariation,
  onSwitchToRefine,
}: AiResultsSectionProps): ReactElement {
  const { t } = useI18n();
  const activeConcept =
    generatedConcepts.find((c) => (c.id ?? c.title) === activeConceptId) ?? generatedConcepts[0];

  return (
    <>
      {errorMessage ? (
        <div className={styles.feedbackError} role="alert">
          <Icon name="info" size="xs" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {successInfo ? (
        <div className={styles.feedbackSuccess}>
          <div className={styles.feedbackSuccessHeader}>
            <div className={styles.feedbackSuccessTitle}>
              <Icon name="check" size="xs" />
              <span>{t('ai.successTitle')}</span>
            </div>
            {lastSource ? (
              <span className={styles.sourceBadge}>
                {lastSource === 'llm' ? t('ai.sourceLlmBadge') : t('ai.sourceLocalBadge')}
              </span>
            ) : null}
          </div>
          <span>{successInfo}</span>
          {activeConcept?.artDirection ? (
            <div className={styles.artDirectionCard}>
              <div className={styles.artDirectionHeader}>
                <span className={styles.artDirectionLabel}>{t('ai.artDirectionApplied')}</span>
                <span className={styles.artDirectionTag}>
                  {activeConcept.artDirection.typographyVoice}
                </span>
              </div>
              <span className={styles.artDirectionGrid}>
                {activeConcept.artDirection.domain} · {activeConcept.artDirection.gridSystem}
              </span>
              <span className={styles.artDirectionNote}>
                {activeConcept.artDirection.gestaltPrinciple}
              </span>
            </div>
          ) : null}
          <div className={styles.resultQuickActions}>
            <button
              type="button"
              className={styles.resultActionBtn}
              onClick={onRegenerateVariation}
              disabled={isLoading || !hasPrompt}
            >
              <Icon name="refresh" size="xs" />
              <span>{t('ai.regenerateVariation')}</span>
            </button>
            <button
              type="button"
              className={styles.resultActionBtn}
              onClick={onSwitchToRefine}
              disabled={isLoading}
            >
              <Icon name="wand" size="xs" />
              <span>{t('ai.refineThis')}</span>
            </button>
            {activeConcept && canCreateArtboard ? (
              <button
                type="button"
                className={styles.resultActionBtn}
                onClick={() => onSelectLayout(activeConcept, true)}
                disabled={isLoading}
              >
                <Icon name="filePlus" size="xs" />
                <span>{t('ai.applyToNewArtboard')}</span>
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {generatedConcepts.length > 0 ? (
        <div className={styles.section}>
          <span className={styles.sectionLabel}>{t('ai.conceptsTitle')}</span>
          <div className={styles.conceptsGrid}>
            {generatedConcepts.map((concept, idx) => (
              <LayoutPreviewCard
                key={concept.id ?? `${concept.title}-${idx}`}
                layout={concept}
                dimensions={dimensions}
                label={generatedConcepts.length > 1 ? VARIATION_LABELS[idx] : undefined}
                isActive={(concept.id ?? concept.title) === activeConceptId}
                onSelect={(selected) => onSelectLayout(selected, false)}
                onApplyToNewArtboard={
                  canCreateArtboard ? (selected) => onSelectLayout(selected, true) : undefined
                }
              />
            ))}
          </div>
        </div>
      ) : null}

      {sessionHistory.length > 1 ? (
        <div className={styles.section}>
          <span className={styles.sectionLabel}>{t('ai.historyTitle')}</span>
          <div className={styles.historyList}>
            {sessionHistory.map((item, idx) => {
              const isCurrent = (item.id ?? item.title) === activeConceptId;
              return (
                <button
                  key={item.id ?? `hist-${idx}`}
                  type="button"
                  className={[styles.historyItem, isCurrent ? styles.historyItemActive : '']
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => onSelectLayout(item, false)}
                  aria-pressed={isCurrent}
                >
                  <span
                    className={styles.historySwatch}
                    style={{ backgroundColor: item.backgroundColor }}
                    aria-hidden="true"
                  />
                  <span className={styles.historyTitle}>{item.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </>
  );
}
