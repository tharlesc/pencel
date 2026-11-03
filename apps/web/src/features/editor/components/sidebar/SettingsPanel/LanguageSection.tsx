import type { ReactElement } from 'react';
import { Icon } from '../../../../../components/ui/index.js';
import { useI18n } from '../../../../../shared/i18n/index.js';
import styles from './SettingsPanel.module.css';

export interface LanguageSectionProps {
  readonly language: 'en' | 'pt' | 'es';
  readonly onSelectLanguage: (lang: 'en' | 'pt' | 'es') => void;
}

export function LanguageSection({
  language,
  onSelectLanguage,
}: LanguageSectionProps): ReactElement {
  const { t } = useI18n();

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <Icon name="palette" size="xs" />
        <span className={styles.sectionTitle}>{t('settings.language')}</span>
      </div>
      <p className={styles.sectionDesc}>{t('settings.languageDesc')}</p>

      <div className={styles.languageGrid}>
        <button
          type="button"
          className={[styles.langBtn, language === 'en' ? styles.langBtnActive : '']
            .filter(Boolean)
            .join(' ')}
          onClick={() => onSelectLanguage('en')}
          aria-pressed={language === 'en'}
        >
          <span className={styles.langBadge}>EN</span>
          <span>English</span>
        </button>

        <button
          type="button"
          className={[styles.langBtn, language === 'pt' ? styles.langBtnActive : '']
            .filter(Boolean)
            .join(' ')}
          onClick={() => onSelectLanguage('pt')}
          aria-pressed={language === 'pt'}
        >
          <span className={styles.langBadge}>PT</span>
          <span>Português</span>
        </button>

        <button
          type="button"
          className={[styles.langBtn, language === 'es' ? styles.langBtnActive : '']
            .filter(Boolean)
            .join(' ')}
          onClick={() => onSelectLanguage('es')}
          aria-pressed={language === 'es'}
        >
          <span className={styles.langBadge}>ES</span>
          <span>Español</span>
        </button>
      </div>
    </section>
  );
}
