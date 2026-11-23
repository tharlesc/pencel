import type { ReactElement } from 'react';
import { Icon } from '../../../../../components/ui/index.js';
import { useI18n } from '../../../../../shared/i18n/index.js';
import styles from './AiGeneratorPanel.module.css';

export interface AiBriefState {
  readonly headline: string;
  readonly ctaText: string;
  readonly brandName: string;
  readonly useBrandColor: boolean;
  readonly brandColor: string;
  readonly includeImagery: boolean;
  readonly createNewArtboard: boolean;
}

export interface AiBriefDrawerProps {
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  readonly brief: AiBriefState;
  readonly onChange: (next: AiBriefState) => void;
  readonly disabled?: boolean;
}

export function AiBriefDrawer({
  isOpen,
  onToggle,
  brief,
  onChange,
  disabled = false,
}: AiBriefDrawerProps): ReactElement {
  const { t } = useI18n();

  const activeFieldsCount =
    (brief.headline.trim() ? 1 : 0) +
    (brief.ctaText.trim() ? 1 : 0) +
    (brief.brandName.trim() ? 1 : 0) +
    (brief.useBrandColor ? 1 : 0) +
    (brief.includeImagery ? 1 : 0) +
    (brief.createNewArtboard ? 1 : 0);

  return (
    <div className={styles.briefContainer}>
      <button
        type="button"
        className={styles.briefToggleBtn}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className={styles.briefToggleLeft}>
          <Icon name="inspector" size="xs" />
          <span>{t('ai.briefToggle')}</span>
          {activeFieldsCount > 0 ? (
            <span className={styles.briefCountPill}>{activeFieldsCount}</span>
          ) : null}
        </span>
        <Icon name={isOpen ? 'chevronDown' : 'chevronRight'} size="xs" />
      </button>

      {isOpen ? (
        <div className={styles.briefBody}>
          <div className={styles.briefField}>
            <label htmlFor="ai-brief-headline" className={styles.briefLabel}>
              {t('ai.briefHeadline')}
            </label>
            <input
              id="ai-brief-headline"
              type="text"
              className={styles.briefInput}
              value={brief.headline}
              onChange={(e) => onChange({ ...brief, headline: e.target.value })}
              placeholder={t('ai.briefHeadlinePlaceholder')}
              disabled={disabled}
            />
          </div>

          <div className={styles.briefTwoCol}>
            <div className={styles.briefField}>
              <label htmlFor="ai-brief-cta" className={styles.briefLabel}>
                {t('ai.briefCta')}
              </label>
              <input
                id="ai-brief-cta"
                type="text"
                className={styles.briefInput}
                value={brief.ctaText}
                onChange={(e) => onChange({ ...brief, ctaText: e.target.value })}
                placeholder={t('ai.briefCtaPlaceholder')}
                disabled={disabled}
              />
            </div>

            <div className={styles.briefField}>
              <label htmlFor="ai-brief-brand" className={styles.briefLabel}>
                {t('ai.briefBrand')}
              </label>
              <input
                id="ai-brief-brand"
                type="text"
                className={styles.briefInput}
                value={brief.brandName}
                onChange={(e) => onChange({ ...brief, brandName: e.target.value })}
                placeholder={t('ai.briefBrandPlaceholder')}
                disabled={disabled}
              />
            </div>
          </div>

          <div className={styles.briefColorRow}>
            <label className={styles.briefCheckboxLabel}>
              <input
                type="checkbox"
                checked={brief.useBrandColor}
                onChange={(e) => onChange({ ...brief, useBrandColor: e.target.checked })}
                disabled={disabled}
              />
              <span>{t('ai.briefAccentColor')}</span>
            </label>

            {brief.useBrandColor ? (
              <div className={styles.briefColorPickerWrap}>
                <input
                  type="color"
                  className={styles.briefColorInput}
                  value={brief.brandColor}
                  onChange={(e) => onChange({ ...brief, brandColor: e.target.value.toUpperCase() })}
                  disabled={disabled}
                  aria-label={t('ai.briefAccentColor')}
                />
                <span className={styles.briefColorHex}>{brief.brandColor.toUpperCase()}</span>
              </div>
            ) : null}
          </div>

          <label className={styles.briefCheckboxLabel}>
            <input
              type="checkbox"
              checked={brief.includeImagery}
              onChange={(e) => onChange({ ...brief, includeImagery: e.target.checked })}
              disabled={disabled}
            />
            <span>{t('ai.briefIncludePhoto')}</span>
          </label>

          <label className={styles.briefCheckboxLabel}>
            <input
              type="checkbox"
              checked={brief.createNewArtboard}
              onChange={(e) => onChange({ ...brief, createNewArtboard: e.target.checked })}
              disabled={disabled}
            />
            <span>{t('ai.briefNewArtboard')}</span>
          </label>
        </div>
      ) : null}
    </div>
  );
}
