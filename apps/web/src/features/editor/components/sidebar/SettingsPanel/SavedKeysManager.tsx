import { useState, type ReactElement } from 'react';
import { Button, Icon } from '../../../../../components/ui/index.js';
import { useI18n } from '../../../../../shared/i18n/index.js';
import {
  AI_PROVIDERS,
  addSavedAiKey,
  getDefaultModelForProvider,
  getProviderDefinition,
  maskApiKey,
  removeSavedAiKey,
  setActiveAiKey,
  type AiProvider,
  type AiUserConfig,
  type SavedAiKey,
} from '../../../services/aiConfigService.js';
import styles from './SavedKeysManager.module.css';

export interface SavedKeysManagerProps {
  readonly aiConfig: AiUserConfig;
  readonly onConfigChange?: (nextConfig: AiUserConfig) => void;
}

export function SavedKeysManager({
  aiConfig,
  onConfigChange,
}: SavedKeysManagerProps): ReactElement {
  const { t } = useI18n();
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [newName, setNewName] = useState('');
  const [newProvider, setNewProvider] = useState<AiProvider>('gemini');
  const [newModel, setNewModel] = useState(() => getDefaultModelForProvider('gemini'));
  const [newKey, setNewKey] = useState('');
  const [showKeyText, setShowKeyText] = useState(false);

  const handleProviderSelect = (provider: AiProvider): void => {
    setNewProvider(provider);
    setNewModel(getDefaultModelForProvider(provider));
  };

  const handleSaveNewKey = (): void => {
    if (!newKey.trim()) return;

    const updated = addSavedAiKey({
      name: newName.trim(),
      provider: newProvider,
      apiKey: newKey.trim(),
      model: newModel,
      makeActive: true,
    });

    onConfigChange?.(updated);
    setNewName('');
    setNewKey('');
    setIsAddingKey(false);
  };

  const handleSelectKey = (keyItem: SavedAiKey): void => {
    const updated = setActiveAiKey(keyItem.id);
    onConfigChange?.(updated);
  };

  const handleDeleteKey = (id: string): void => {
    const updated = removeSavedAiKey(id);
    onConfigChange?.(updated);
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <span className={styles.title}>{t('ai.savedKeysTitle')}</span>
        {!isAddingKey && (
          <button
            type="button"
            className={styles.addToggleBtn}
            onClick={() => setIsAddingKey(true)}
            aria-label={t('ai.addKeyBtn')}
          >
            <Icon name="plus" size="xs" />
            <span>{t('ai.addKeyBtn')}</span>
          </button>
        )}
      </div>

      <p className={styles.desc}>{t('ai.savedKeysDesc')}</p>

      {/* Form to add a new key */}
      {isAddingKey && (
        <div className={styles.formCard}>
          <h4 className={styles.formTitle}>{t('ai.addKeyBtn')}</h4>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t('ai.keyName')}</label>
            <input
              type="text"
              className={styles.formInput}
              placeholder={t('ai.keyNamePlaceholder')}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t('ai.provider')}</label>
            <select
              className={styles.formSelect}
              value={newProvider}
              onChange={(e) => handleProviderSelect(e.target.value as AiProvider)}
            >
              {AI_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t('ai.model')}</label>
            <select
              className={styles.formSelect}
              value={newModel}
              onChange={(e) => setNewModel(e.target.value)}
            >
              {getProviderDefinition(newProvider).models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>API Key</label>
            <div className={styles.inputWithBtn}>
              <input
                type={showKeyText ? 'text' : 'password'}
                className={styles.formInput}
                placeholder={t('ai.apiKeyPlaceholder')}
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
              <Button
                variant="secondary"
                size="sm"
                icon={showKeyText ? 'eyeOff' : 'eye'}
                onClick={() => setShowKeyText(!showKeyText)}
                aria-label={showKeyText ? 'Ocultar chave' : 'Mostrar chave'}
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => {
                setIsAddingKey(false);
                setNewKey('');
              }}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className={styles.submitBtn}
              onClick={handleSaveNewKey}
              disabled={!newKey.trim()}
            >
              <Icon name="check" size="xs" />
              <span>{t('ai.saveKey')}</span>
            </button>
          </div>
        </div>
      )}

      {/* List of saved keys */}
      <div className={styles.keyList}>
        {aiConfig.savedKeys.length === 0 ? (
          <div className={styles.emptyState}>{t('ai.noSavedKeys')}</div>
        ) : (
          aiConfig.savedKeys.map((item) => {
            const isActive =
              item.id === aiConfig.activeKeyId ||
              (item.apiKey === aiConfig.apiKey && item.provider === aiConfig.provider);

            return (
              <div
                key={item.id}
                className={[styles.keyCard, isActive ? styles.keyCardActive : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className={styles.cardTop}>
                  <div className={styles.keyNameRow}>
                    <Icon name="key" size="xs" />
                    <span className={styles.keyName}>{item.name}</span>
                  </div>
                  {isActive ? (
                    <span className={styles.badgeActive}>
                      <Icon name="check" size="xs" />
                      <span>{t('ai.activeBadge')}</span>
                    </span>
                  ) : null}
                </div>

                <div className={styles.cardMeta}>
                  <span className={styles.maskedKey}>{maskApiKey(item.apiKey)}</span>
                  <span className={styles.modelBadge}>{item.model}</span>
                </div>

                <div className={styles.cardActions}>
                  {!isActive && (
                    <button
                      type="button"
                      className={styles.useBtn}
                      onClick={() => handleSelectKey(item)}
                    >
                      <Icon name="check" size="xs" />
                      <span>{t('ai.useThisKey')}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => handleDeleteKey(item.id)}
                    aria-label={`${t('common.delete')} ${item.name}`}
                  >
                    <Icon name="trash" size="xs" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
