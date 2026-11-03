import { useEffect, useState, type ReactElement } from 'react';
import { Icon } from '../../../../../components/ui/index.js';
import { useI18n } from '../../../../../shared/i18n/index.js';
import {
  addSavedAiKey,
  getStoredAiConfig,
  setActiveAiKey,
  type AiUserConfig,
} from '../../../services/aiConfigService.js';
import {
  requestAiLayoutGeneration,
  type GeneratedLayoutDto,
} from '../../../services/aiLayoutService.js';
import {
  useOptionalEditorEngine,
  useOptionalEditorSession,
} from '../../../state/EditorProvider.js';
import {
  QUICK_PROMPTS_BY_LOCALE,
  STYLE_OPTIONS_BY_LOCALE,
  type QuickPrompt,
  type StyleOption,
} from './aiGeneratorConstants.js';
import { AiKeyCard } from './AiKeyCard.js';
import styles from './AiGeneratorPanel.module.css';

export interface AiGeneratorPanelProps {
  readonly onGenerateSuccess?: (layout: GeneratedLayoutDto) => void;
  readonly onOpenSettings?: () => void;
}

export function AiGeneratorPanel({
  onGenerateSuccess,
  onOpenSettings,
}: AiGeneratorPanelProps): ReactElement {
  const { t, locale } = useI18n();
  const session = useOptionalEditorSession();
  const engine = useOptionalEditorEngine();

  const [aiConfig, setAiConfig] = useState<AiUserConfig>(getStoredAiConfig);
  const [inlineKeyInput, setInlineKeyInput] = useState('');
  const [isEditingKey, setIsEditingKey] = useState(false);

  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<StyleOption>('tech');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  useEffect(() => {
    const handleStorageChange = (e: Event): void => {
      const customEvent = e as CustomEvent<AiUserConfig>;
      setAiConfig(customEvent.detail ?? getStoredAiConfig());
    };

    window.addEventListener('pencel_ai_config_changed', handleStorageChange);
    return () => {
      window.removeEventListener('pencel_ai_config_changed', handleStorageChange);
    };
  }, []);

  const handleSaveInlineKey = (): void => {
    const trimmed = inlineKeyInput.trim();
    if (!trimmed) return;
    const updated = addSavedAiKey({
      apiKey: trimmed,
      provider: aiConfig.provider,
      model: aiConfig.model,
      makeActive: true,
    });
    setAiConfig(updated);
    setInlineKeyInput('');
    setIsEditingKey(false);
    setErrorMessage(null);
  };

  const currentStyles = STYLE_OPTIONS_BY_LOCALE[locale] ?? STYLE_OPTIONS_BY_LOCALE.en;
  const currentPrompts = QUICK_PROMPTS_BY_LOCALE[locale] ?? QUICK_PROMPTS_BY_LOCALE.en;

  const handleSelectQuickPrompt = (item: QuickPrompt): void => {
    setPrompt(item.prompt);
    setSelectedStyle(item.style);
    setErrorMessage(null);
    setSuccessInfo(null);
  };

  const handleGenerate = async (): Promise<void> => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      setErrorMessage(t('ai.promptPlaceholder'));
      return;
    }

    if (!aiConfig.apiKey) {
      setErrorMessage(t('ai.noKeyWarning'));
      setIsEditingKey(true);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessInfo(null);

    try {
      const dimensions = session?.activePage.dimensions ?? { width: 1080, height: 1080 };
      const response = await requestAiLayoutGeneration({
        prompt: trimmed,
        style: selectedStyle,
        dimensions,
        apiKey: aiConfig.apiKey,
        provider: aiConfig.provider,
        model: aiConfig.model,
      });

      if (!response.ok) {
        setErrorMessage(response.error);
        return;
      }

      const layout = response.layout;
      engine?.applyGeneratedLayout(layout);
      session?.setPageBackground(layout.backgroundColor);
      if (layout.title) {
        session?.setDocumentTitle(layout.title);
      }

      setSuccessInfo(layout.explanation || t('ai.successTitle'));
      onGenerateSuccess?.(layout);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t('ai.invalidKeyError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.introCard}>
        <div className={styles.introHeader}>
          <Icon name="sparkles" size="sm" />
          <span className={styles.introTitle}>{t('ai.title')}</span>
        </div>
        <p className={styles.introDesc}>{t('ai.subtitle')}</p>
      </div>

      <AiKeyCard
        aiConfig={aiConfig}
        isEditingKey={isEditingKey}
        inlineKeyInput={inlineKeyInput}
        onKeyInputChange={setInlineKeyInput}
        onSaveKey={handleSaveInlineKey}
        onSelectSavedKey={(keyId) => setAiConfig(setActiveAiKey(keyId))}
        onChangeKey={() => {
          if (onOpenSettings) {
            onOpenSettings();
          } else {
            setIsEditingKey(true);
          }
        }}
      />

      <div className={styles.section}>
        <span className={styles.sectionLabel}>{t('ai.quickInspirations')}</span>
        <div className={styles.chipsContainer}>
          {currentPrompts.map((item) => (
            <button
              key={item.label}
              type="button"
              className={styles.chipBtn}
              onClick={() => handleSelectQuickPrompt(item)}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <span className={styles.sectionLabel}>{t('ai.promptLabel')}</span>
        <div className={styles.textareaWrapper}>
          <textarea
            className={styles.textarea}
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder={t('ai.promptPlaceholder')}
            disabled={isLoading}
            rows={4}
          />
          <div className={styles.textareaFooter}>
            <span>
              {prompt.length} {t('ai.characters')}
            </span>
            {prompt.length > 0 && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={() => setPrompt('')}
                disabled={isLoading}
              >
                {t('ai.clear')}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <span className={styles.sectionLabel}>{t('ai.aestheticDirection')}</span>
        <div className={styles.styleGrid}>
          {currentStyles.map((style) => (
            <button
              key={style.id}
              type="button"
              className={[
                styles.styleCard,
                selectedStyle === style.id ? styles.styleCardActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => setSelectedStyle(style.id)}
              disabled={isLoading}
            >
              <span className={styles.styleCardTitle}>{style.label}</span>
              <span className={styles.styleCardDesc}>{style.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className={styles.submitBtn}
        onClick={() => void handleGenerate()}
        disabled={isLoading || !prompt.trim()}
      >
        {isLoading ? (
          <>
            <span className={styles.loadingSpinner} aria-hidden="true" />
            <span>{t('ai.generatingBtn')}</span>
          </>
        ) : (
          <>
            <Icon name="sparkles" size="sm" />
            <span>{t('ai.generateBtn')}</span>
          </>
        )}
      </button>

      {errorMessage && (
        <div className={styles.feedbackError} role="alert">
          <Icon name="info" size="xs" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successInfo && (
        <div className={styles.feedbackSuccess}>
          <div className={styles.feedbackSuccessTitle}>
            <Icon name="check" size="xs" />
            <span>{t('ai.successTitle')}</span>
          </div>
          <span>{successInfo}</span>
        </div>
      )}
    </div>
  );
}
