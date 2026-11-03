import { useState, type ReactElement } from 'react';
import { Button, Icon } from '../../../../../components/ui/index.js';
import { useI18n } from '../../../../../shared/i18n/index.js';
import {
  AI_PROVIDERS,
  addSavedAiKey,
  clearStoredAiConfig,
  getDefaultModelForProvider,
  getProviderDefinition,
  getStoredAiConfig,
  removeSavedAiKey,
  saveStoredAiConfig,
  type AiProvider,
  type AiUserConfig,
} from '../../../services/aiConfigService.js';
import { LanguageSection } from './LanguageSection.js';
import { SavedKeysManager } from './SavedKeysManager.js';
import { StudioAdjustmentsSection } from './StudioAdjustmentsSection.js';
import styles from './SettingsPanel.module.css';

export interface SettingsPanelProps {
  readonly onPositionChange?: (position: 'bottom' | 'left') => void;
  readonly showRulers?: boolean;
  readonly onToggleRulers?: () => void;
  readonly showGuides?: boolean;
  readonly onToggleGuides?: () => void;
  readonly clipToArtboard?: boolean;
  readonly onToggleClipToArtboard?: () => void;
}

export function SettingsPanel({
  onPositionChange,
  showRulers = true,
  onToggleRulers,
  showGuides = true,
  onToggleGuides,
  clipToArtboard = true,
  onToggleClipToArtboard,
}: SettingsPanelProps): ReactElement {
  const { t, language, setLanguage } = useI18n();

  const [aiConfig, setAiConfig] = useState(() => getStoredAiConfig());
  const [inputKey, setInputKey] = useState(aiConfig.apiKey);
  const [showKey, setShowKey] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const [toolbarPosition, setToolbarPosition] = useState<'bottom' | 'left'>(() => {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('pencel_floating_toolbar_position');
      if (stored === 'left' || stored === 'bottom') return stored;
    }
    return 'bottom';
  });

  const handleSaveKey = (): void => {
    const updated = addSavedAiKey({
      provider: aiConfig.provider,
      apiKey: inputKey.trim(),
      model: aiConfig.model,
      makeActive: true,
    });
    setAiConfig(updated);
    setInputKey(updated.apiKey);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  const handleClearKey = (): void => {
    if (aiConfig.activeKeyId) {
      const updated = removeSavedAiKey(aiConfig.activeKeyId);
      setAiConfig(updated);
      setInputKey(updated.apiKey);
    } else {
      clearStoredAiConfig();
      setInputKey('');
      setAiConfig(getStoredAiConfig());
    }
  };

  const handleKeysConfigChange = (updated: AiUserConfig): void => {
    setAiConfig(updated);
    setInputKey(updated.apiKey);
  };

  const handleProviderChange = (newProvider: AiProvider): void => {
    const defaultModel = getDefaultModelForProvider(newProvider);
    const updated = saveStoredAiConfig({
      provider: newProvider,
      model: defaultModel,
    });
    setAiConfig(updated);
  };

  const handleModelChange = (newModel: string): void => {
    const updated = saveStoredAiConfig({
      model: newModel,
    });
    setAiConfig(updated);
  };

  const handlePositionToggle = (pos: 'bottom' | 'left'): void => {
    setToolbarPosition(pos);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pencel_floating_toolbar_position', pos);
      window.dispatchEvent(
        new CustomEvent('pencel_floating_toolbar_position_changed', { detail: pos }),
      );
    }
    onPositionChange?.(pos);
  };

  const isKeySaved = Boolean(aiConfig.apiKey.trim());

  return (
    <div className={styles.panel}>
      {/* 1. Language Selection */}
      <LanguageSection language={language} onSelectLanguage={setLanguage} />

      {/* 2. AI Key Configuration (BYOK) */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Icon name="sparkles" size="xs" />
          <span className={styles.sectionTitle}>{t('settings.aiSection')}</span>
        </div>
        <p className={styles.sectionDesc}>{t('settings.aiSectionDesc')}</p>

        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>{t('ai.provider')}</span>
          <select
            className={styles.selectInput}
            value={aiConfig.provider}
            onChange={(e) => handleProviderChange(e.target.value as AiProvider)}
          >
            {AI_PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>{t('ai.model')}</span>
          <select
            className={styles.selectInput}
            value={aiConfig.model}
            onChange={(e) => handleModelChange(e.target.value)}
          >
            {getProviderDefinition(aiConfig.provider).models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.fieldGroup}>
          <div className={styles.fieldHeaderRow}>
            <span className={styles.fieldLabel}>API Key</span>
            {isKeySaved ? (
              <span className={styles.keyStatusActive}>
                <Icon name="check" size="xs" />
                <span>{t('ai.keyActive')}</span>
              </span>
            ) : (
              <span className={styles.keyStatusMissing}>
                <Icon name="info" size="xs" />
                <span>{t('ai.apiKeyRequired')}</span>
              </span>
            )}
          </div>

          <div className={styles.inputRow}>
            <input
              type={showKey ? 'text' : 'password'}
              className={styles.textInput}
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder={t('ai.apiKeyPlaceholder')}
              autoComplete="off"
              spellCheck={false}
            />
            <Button
              variant="secondary"
              size="sm"
              icon={showKey ? 'eyeOff' : 'eye'}
              onClick={() => setShowKey(!showKey)}
              aria-label={showKey ? 'Ocultar chave' : 'Mostrar chave'}
            />
          </div>
        </div>

        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleSaveKey}
            disabled={!inputKey.trim() || inputKey === aiConfig.apiKey}
          >
            <Icon name="check" size="xs" />
            <span>{savedFeedback ? t('common.done') : t('ai.saveKey')}</span>
          </button>

          {isKeySaved && (
            <button
              type="button"
              className={[styles.actionBtn, styles.actionBtnDanger].join(' ')}
              onClick={handleClearKey}
            >
              <Icon name="trash" size="xs" />
              <span>{t('ai.removeKey')}</span>
            </button>
          )}
        </div>

        <div>
          <a
            href={getProviderDefinition(aiConfig.provider).helpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.linkHelp}
          >
            {getProviderDefinition(aiConfig.provider).helpLabel} ↗
          </a>
        </div>

        {/* 2.1 Saved Keys Manager (BYOK List & Selection) */}
        <SavedKeysManager aiConfig={aiConfig} onConfigChange={handleKeysConfigChange} />
      </section>

      {/* 3. Studio & Stage Layout Adjustments */}
      <StudioAdjustmentsSection
        toolbarPosition={toolbarPosition}
        onPositionToggle={handlePositionToggle}
        showRulers={showRulers}
        onToggleRulers={onToggleRulers}
        showGuides={showGuides}
        onToggleGuides={onToggleGuides}
        clipToArtboard={clipToArtboard}
        onToggleClipToArtboard={onToggleClipToArtboard}
      />
    </div>
  );
}
