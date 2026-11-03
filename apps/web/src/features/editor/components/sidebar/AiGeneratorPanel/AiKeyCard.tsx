import type { ReactElement } from 'react';
import { Icon } from '../../../../../components/ui/index.js';
import { useI18n } from '../../../../../shared/i18n/index.js';
import {
  formatProviderDisplayName,
  getProviderDefinition,
  maskApiKey,
  setActiveAiKey,
  type AiUserConfig,
} from '../../../services/aiConfigService.js';
import styles from './AiGeneratorPanel.module.css';

export interface AiKeyCardProps {
  readonly aiConfig: AiUserConfig;
  readonly isEditingKey: boolean;
  readonly inlineKeyInput: string;
  readonly onKeyInputChange: (val: string) => void;
  readonly onSaveKey: () => void;
  readonly onChangeKey: () => void;
  readonly onSelectSavedKey?: (keyId: string) => void;
}

export function AiKeyCard({
  aiConfig,
  isEditingKey,
  inlineKeyInput,
  onKeyInputChange,
  onSaveKey,
  onChangeKey,
  onSelectSavedKey,
}: AiKeyCardProps): ReactElement {
  const { t } = useI18n();

  if (!aiConfig.apiKey || isEditingKey) {
    return (
      <div className={styles.apiKeyCard}>
        <div className={styles.apiKeyHeader}>
          <Icon name="key" size="xs" />
          <span className={styles.apiKeyTitle}>{t('ai.apiKeyRequired')}</span>
        </div>
        <p className={styles.apiKeyDesc}>{t('ai.apiKeyDesc')}</p>
        <div className={styles.apiKeyInputRow}>
          <input
            type="password"
            className={styles.apiKeyInput}
            placeholder={t('ai.apiKeyPlaceholder')}
            value={inlineKeyInput}
            onChange={(e) => onKeyInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveKey();
            }}
          />
          <button
            type="button"
            className={styles.apiKeySaveBtn}
            onClick={onSaveKey}
            disabled={!inlineKeyInput.trim()}
          >
            {t('ai.saveKey')}
          </button>
        </div>
        <a
          href={getProviderDefinition(aiConfig.provider).helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.apiKeyHelpLink}
        >
          <Icon name="link" size="xs" />
          <span>
            {t('ai.getKeyHelp')} ({getProviderDefinition(aiConfig.provider).helpLabel})
          </span>
        </a>
      </div>
    );
  }

  return (
    <div className={styles.apiKeySelectorWrapper}>
      {aiConfig.savedKeys.length > 1 ? (
        <select
          className={styles.apiKeySelect}
          value={aiConfig.activeKeyId}
          onChange={(e) => {
            if (e.target.value === '__manage__') {
              onChangeKey();
            } else {
              setActiveAiKey(e.target.value);
              onSelectSavedKey?.(e.target.value);
            }
          }}
          aria-label={t('ai.selectKeyPrompt')}
        >
          {aiConfig.savedKeys.map((item) => (
            <option key={item.id} value={item.id}>
              {formatProviderDisplayName(item.provider)}: {item.name} ({maskApiKey(item.apiKey)})
            </option>
          ))}
          <option value="__manage__">{t('ai.manageKeys')}...</option>
        </select>
      ) : null}

      <div className={styles.apiKeyStatusBadge}>
        <div className={styles.apiKeyStatusLeft}>
          <span className={styles.apiKeyStatusIcon}>
            <Icon name="check" size="xs" />
          </span>
          <span>
            {t('ai.keyActive')}: {formatProviderDisplayName(aiConfig.provider)} ({aiConfig.model})
          </span>
        </div>
        <button type="button" className={styles.apiKeyChangeBtn} onClick={onChangeKey}>
          {aiConfig.savedKeys.length > 1 ? t('ai.manageKeys') : t('ai.changeKey')}
        </button>
      </div>
    </div>
  );
}
