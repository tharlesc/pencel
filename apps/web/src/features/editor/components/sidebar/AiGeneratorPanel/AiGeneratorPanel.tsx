import { useRef, type ReactElement } from 'react';
import { Icon } from '../../../../../components/ui/index.js';
import { useAiGeneratorPanel } from '../../../hooks/useAiGeneratorPanel.js';
import type { GeneratedLayoutDto } from '../../../services/aiLayoutService.js';
import { AiBriefDrawer } from './AiBriefDrawer.js';
import { AiDirectionControls } from './AiDirectionControls.js';
import {
  ARCHETYPE_OPTIONS_BY_LOCALE,
  formatArtboardRatioLabel,
  PIECE_TYPE_OPTIONS_BY_LOCALE,
  QUICK_PROMPTS_BY_LOCALE,
  STYLE_OPTIONS_BY_LOCALE,
} from './aiGeneratorConstants.js';
import { AiKeyCard } from './AiKeyCard.js';
import { AiResultsSection } from './AiResultsSection.js';
import styles from './AiGeneratorPanel.module.css';

export interface AiGeneratorPanelProps {
  readonly onGenerateSuccess?: (layout: GeneratedLayoutDto) => void;
  readonly onOpenSettings?: () => void;
}

export function AiGeneratorPanel({
  onGenerateSuccess,
  onOpenSettings,
}: AiGeneratorPanelProps): ReactElement {
  const promptTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const ctrl = useAiGeneratorPanel({ onGenerateSuccess });
  const { t, locale } = ctrl;

  const currentPieceTypes = PIECE_TYPE_OPTIONS_BY_LOCALE[locale] ?? PIECE_TYPE_OPTIONS_BY_LOCALE.en;
  const currentStyles = STYLE_OPTIONS_BY_LOCALE[locale] ?? STYLE_OPTIONS_BY_LOCALE.en;
  const currentArchetypes = ARCHETYPE_OPTIONS_BY_LOCALE[locale] ?? ARCHETYPE_OPTIONS_BY_LOCALE.en;
  const currentPrompts = QUICK_PROMPTS_BY_LOCALE[locale] ?? QUICK_PROMPTS_BY_LOCALE.en;

  return (
    <div className={styles.panel}>
      <div className={styles.introCard}>
        <div className={styles.introTopRow}>
          <div className={styles.introHeader}>
            <Icon name="sparkles" size="sm" />
            <span className={styles.introTitle}>{t('ai.title')}</span>
          </div>
          <span className={styles.formatPill}>{formatArtboardRatioLabel(ctrl.dimensions)}</span>
        </div>
        <p className={styles.introDesc}>{t('ai.subtitle')}</p>
      </div>

      <AiKeyCard
        aiConfig={ctrl.aiConfig}
        isEditingKey={ctrl.isEditingKey}
        inlineKeyInput={ctrl.inlineKeyInput}
        useLocalEngine={ctrl.useLocalEngine}
        onToggleLocalEngine={ctrl.handleToggleLocalEngine}
        onKeyInputChange={ctrl.setInlineKeyInput}
        onSaveKey={ctrl.handleSaveInlineKey}
        onSelectSavedKey={ctrl.handleSelectSavedKey}
        onChangeKey={() => {
          if (onOpenSettings) {
            onOpenSettings();
          } else {
            ctrl.handleToggleLocalEngine(false);
            ctrl.setIsEditingKey(true);
          }
        }}
      />

      <div className={styles.modeSwitch} role="tablist" aria-label={t('ai.title')}>
        <button
          type="button"
          role="tab"
          aria-selected={ctrl.mode === 'create'}
          className={[styles.modeTab, ctrl.mode === 'create' ? styles.modeTabActive : '']
            .filter(Boolean)
            .join(' ')}
          onClick={() => {
            ctrl.setMode('create');
            ctrl.setErrorMessage(null);
          }}
        >
          <Icon name="sparkles" size="xs" />
          <span>{t('ai.modeCreate')}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={ctrl.mode === 'refine'}
          className={[styles.modeTab, ctrl.mode === 'refine' ? styles.modeTabActive : '']
            .filter(Boolean)
            .join(' ')}
          onClick={() => {
            ctrl.setMode('refine');
            ctrl.setErrorMessage(null);
          }}
        >
          <Icon name="wand" size="xs" />
          <span>{t('ai.modeRefine')}</span>
        </button>
      </div>

      {ctrl.mode === 'create' ? (
        <div className={styles.section}>
          <span className={styles.sectionLabel}>{t('ai.quickInspirations')}</span>
          <div className={styles.chipsContainer}>
            {currentPrompts.map((item) => (
              <button
                key={item.label}
                type="button"
                className={styles.chipBtn}
                onClick={() => ctrl.handleSelectQuickPrompt(item)}
                disabled={ctrl.isLoading}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.refineNotice}>
          <Icon name="layers" size="xs" />
          <span>{ctrl.hasCanvasLayers ? t('ai.refineHint') : t('ai.refineEmptyCanvas')}</span>
        </div>
      )}

      <div className={styles.section}>
        <label htmlFor="ai-prompt-input" className={styles.sectionLabel}>
          {t('ai.promptLabel')}
        </label>
        <div className={styles.textareaWrapper}>
          <textarea
            ref={promptTextareaRef}
            id="ai-prompt-input"
            className={styles.textarea}
            value={ctrl.prompt}
            onChange={(e) => {
              ctrl.setPrompt(e.target.value);
              if (ctrl.errorMessage) ctrl.setErrorMessage(null);
            }}
            onKeyDown={(e) => {
              if (
                (e.ctrlKey || e.metaKey) &&
                e.key === 'Enter' &&
                !ctrl.isLoading &&
                ctrl.prompt.trim()
              ) {
                e.preventDefault();
                void ctrl.handleGenerate();
              }
            }}
            placeholder={
              ctrl.mode === 'refine' ? t('ai.refinePromptPlaceholder') : t('ai.promptPlaceholder')
            }
            disabled={ctrl.isLoading}
            rows={4}
          />
          <div className={styles.textareaFooter}>
            <span className={styles.tabularMeta}>
              {ctrl.prompt.length} {t('ai.characters')}
            </span>
            <div className={styles.textareaFooterRight}>
              <span className={styles.shortcutLabel}>{t('ai.shortcutHint')}</span>
              {ctrl.prompt.length > 0 ? (
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => ctrl.setPrompt('')}
                  disabled={ctrl.isLoading}
                >
                  {t('ai.clear')}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <AiDirectionControls
        mode={ctrl.mode}
        pieceTypesList={currentPieceTypes}
        selectedPieceType={ctrl.selectedPieceType}
        onSelectPieceType={ctrl.setSelectedPieceType}
        stylesList={currentStyles}
        selectedStyle={ctrl.selectedStyle}
        onSelectStyle={ctrl.setSelectedStyle}
        archetypesList={currentArchetypes}
        selectedArchetype={ctrl.selectedArchetype}
        onSelectArchetype={ctrl.setSelectedArchetype}
        variationsCount={ctrl.variationsCount}
        onChangeVariationsCount={ctrl.setVariationsCount}
        disabled={ctrl.isLoading}
      />

      <AiBriefDrawer
        isOpen={ctrl.isBriefOpen}
        onToggle={() => ctrl.setIsBriefOpen((prev) => !prev)}
        brief={ctrl.brief}
        onChange={ctrl.setBrief}
        disabled={ctrl.isLoading}
      />

      <div className={styles.submitRow}>
        <button
          type="button"
          className={styles.submitBtn}
          onClick={() => void ctrl.handleGenerate()}
          disabled={ctrl.isLoading || !ctrl.prompt.trim()}
        >
          {ctrl.isLoading ? (
            <>
              <span className={styles.loadingSpinner} aria-hidden="true" />
              <span>{t('ai.generatingBtn')}</span>
            </>
          ) : (
            <>
              <Icon name={ctrl.mode === 'refine' ? 'wand' : 'sparkles'} size="sm" />
              <span>{ctrl.mode === 'refine' ? t('ai.refineBtn') : t('ai.generateBtn')}</span>
            </>
          )}
        </button>

        {ctrl.isLoading ? (
          <button type="button" className={styles.cancelBtn} onClick={ctrl.handleCancelGeneration}>
            {t('ai.cancelGeneration')}
          </button>
        ) : null}
      </div>

      <AiResultsSection
        dimensions={ctrl.dimensions}
        errorMessage={ctrl.errorMessage}
        successInfo={ctrl.successInfo}
        lastSource={ctrl.lastSource}
        generatedConcepts={ctrl.generatedConcepts}
        activeConceptId={ctrl.activeConceptId}
        sessionHistory={ctrl.sessionHistory}
        isLoading={ctrl.isLoading}
        hasPrompt={Boolean(ctrl.prompt.trim())}
        canCreateArtboard={ctrl.canCreateArtboard}
        onSelectLayout={(selected, newPage) => void ctrl.applyLayoutToCanvas(selected, newPage)}
        onRegenerateVariation={ctrl.handleRegenerateVariation}
        onSwitchToRefine={() => {
          ctrl.handleSwitchToRefine();
          promptTextareaRef.current?.focus();
        }}
      />
    </div>
  );
}
