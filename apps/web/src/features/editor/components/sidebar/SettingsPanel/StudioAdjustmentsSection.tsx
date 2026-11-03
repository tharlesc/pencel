import type { ReactElement } from 'react';
import { Icon } from '../../../../../components/ui/index.js';
import { useI18n } from '../../../../../shared/i18n/index.js';
import styles from './SettingsPanel.module.css';

export interface StudioAdjustmentsSectionProps {
  readonly toolbarPosition: 'bottom' | 'left';
  readonly onPositionToggle: (pos: 'bottom' | 'left') => void;
  readonly showRulers?: boolean;
  readonly onToggleRulers?: () => void;
  readonly showGuides?: boolean;
  readonly onToggleGuides?: () => void;
  readonly clipToArtboard?: boolean;
  readonly onToggleClipToArtboard?: () => void;
}

export function StudioAdjustmentsSection({
  toolbarPosition,
  onPositionToggle,
  showRulers = true,
  onToggleRulers,
  showGuides = true,
  onToggleGuides,
  clipToArtboard = true,
  onToggleClipToArtboard,
}: StudioAdjustmentsSectionProps): ReactElement {
  const { t } = useI18n();

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <Icon name="settings" size="xs" />
        <span className={styles.sectionTitle}>{t('settings.canvasAdjustments')}</span>
      </div>

      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>{t('settings.toolbarPosition')}</span>
        <div className={styles.actionRow}>
          <button
            type="button"
            className={[
              styles.actionBtn,
              styles.actionBtnSecondary,
              toolbarPosition === 'bottom' ? styles.langBtnActive : '',
            ].join(' ')}
            onClick={() => onPositionToggle('bottom')}
          >
            <Icon name="orientationLandscape" size="xs" />
            <span>{t('settings.toolbarBottom')}</span>
          </button>

          <button
            type="button"
            className={[
              styles.actionBtn,
              styles.actionBtnSecondary,
              toolbarPosition === 'left' ? styles.langBtnActive : '',
            ].join(' ')}
            onClick={() => onPositionToggle('left')}
          >
            <Icon name="orientationPortrait" size="xs" />
            <span>{t('settings.toolbarLeft')}</span>
          </button>
        </div>
      </div>

      {onToggleRulers && (
        <label className={styles.toggleRow}>
          <span className={styles.toggleLabel}>
            <Icon name="ruler" size="xs" />
            <span>{t('settings.rulers')}</span>
          </span>
          <input
            type="checkbox"
            className={styles.toggleCheckbox}
            checked={showRulers}
            onChange={onToggleRulers}
          />
        </label>
      )}

      {onToggleGuides && (
        <label className={styles.toggleRow}>
          <span className={styles.toggleLabel}>
            <Icon name="grid" size="xs" />
            <span>{t('settings.guides')}</span>
          </span>
          <input
            type="checkbox"
            className={styles.toggleCheckbox}
            checked={showGuides}
            onChange={onToggleGuides}
          />
        </label>
      )}

      {onToggleClipToArtboard && (
        <label className={styles.toggleRow}>
          <span className={styles.toggleLabel}>
            <Icon name="crop" size="xs" />
            <span>{t('settings.clipArtboard')}</span>
          </span>
          <input
            type="checkbox"
            className={styles.toggleCheckbox}
            checked={clipToArtboard}
            onChange={onToggleClipToArtboard}
          />
        </label>
      )}
    </section>
  );
}
