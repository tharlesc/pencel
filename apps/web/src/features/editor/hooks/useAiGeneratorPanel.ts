import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../../shared/i18n/index.js';
import type { AiBriefState } from '../components/sidebar/AiGeneratorPanel/AiBriefDrawer.js';
import type {
  QuickPrompt,
  StyleOption,
} from '../components/sidebar/AiGeneratorPanel/aiGeneratorConstants.js';
import {
  addSavedAiKey,
  getStoredAiConfig,
  setActiveAiKey,
  type AiUserConfig,
} from '../services/aiConfigService.js';
import {
  requestAiLayoutGeneration,
  type CreativeBriefInput,
  type CreativePieceType,
  type GeneratedLayoutDto,
  type LayoutCompositionArchetype,
  type LayoutGenerationMode,
} from '../services/aiLayoutService.js';
import {
  useOptionalEditorEngine,
  useOptionalEditorLayers,
  useOptionalEditorSession,
} from '../state/EditorProvider.js';

const DEFAULT_BRIEF: AiBriefState = {
  headline: '',
  ctaText: '',
  brandName: '',
  useBrandColor: false,
  brandColor: '#0066CC',
  includeImagery: false,
  createNewArtboard: false,
};

const ARCHETYPE_CYCLE: readonly LayoutCompositionArchetype[] = [
  'poster-impact',
  'swiss-editorial',
  'carousel-cover',
  'product-spotlight',
  'photo-overlay',
];

export interface UseAiGeneratorPanelParams {
  readonly onGenerateSuccess?: (layout: GeneratedLayoutDto) => void;
}

export function useAiGeneratorPanel({ onGenerateSuccess }: UseAiGeneratorPanelParams) {
  const { t, locale } = useI18n();
  const session = useOptionalEditorSession();
  const engine = useOptionalEditorEngine();
  const layersCtx = useOptionalEditorLayers();

  const [aiConfig, setAiConfig] = useState<AiUserConfig>(getStoredAiConfig);
  const [inlineKeyInput, setInlineKeyInput] = useState('');
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [useLocalEngine, setUseLocalEngine] = useState(false);

  const [mode, setMode] = useState<LayoutGenerationMode>('create');
  const [prompt, setPrompt] = useState('');
  const [selectedPieceType, setSelectedPieceType] = useState<CreativePieceType>('auto');
  const [selectedStyle, setSelectedStyle] = useState<StyleOption>('tech');
  const [selectedArchetype, setSelectedArchetype] = useState<LayoutCompositionArchetype>('auto');
  const [variationsCount, setVariationsCount] = useState<1 | 3>(1);
  const [isBriefOpen, setIsBriefOpen] = useState(false);
  const [brief, setBrief] = useState<AiBriefState>(DEFAULT_BRIEF);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [lastSource, setLastSource] = useState<'llm' | 'autonomous' | null>(null);

  const [generatedConcepts, setGeneratedConcepts] = useState<readonly GeneratedLayoutDto[]>([]);
  const [activeConceptId, setActiveConceptId] = useState<string | null>(null);
  const [sessionHistory, setSessionHistory] = useState<readonly GeneratedLayoutDto[]>([]);

  const abortRef = useRef<AbortController | null>(null);

  const pageWidth = session?.activePage.dimensions.width ?? 1080;
  const pageHeight = session?.activePage.dimensions.height ?? 1080;
  const pageBackgroundColor = session?.activePage.backgroundColor;
  const documentTitle = session?.document.title;
  const dimensions = useMemo(
    () => ({ width: pageWidth, height: pageHeight }),
    [pageWidth, pageHeight],
  );
  const hasCanvasLayers = (layersCtx?.layers.length ?? 0) > 0;

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

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const applyLayoutToCanvas = useCallback(
    async (layout: GeneratedLayoutDto, targetNewArtboard = false): Promise<void> => {
      if (targetNewArtboard && session) {
        session.addPage({
          name: layout.title.slice(0, 28) || 'AI Concept',
          dimensions,
          backgroundColor: layout.backgroundColor,
        });
        await new Promise<void>((resolve) => setTimeout(resolve, 40));
      }

      if (engine) {
        await engine.applyGeneratedLayout(layout);
      }
      session?.setPageBackground(layout.backgroundColor);
      if (layout.title) {
        session?.setDocumentTitle(layout.title);
      }
      setActiveConceptId(layout.id ?? layout.title);
      setSuccessInfo(layout.explanation || t('ai.successTitle'));
    },
    [dimensions, engine, session, t],
  );

  const handleSaveInlineKey = useCallback((): void => {
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
    setUseLocalEngine(false);
    setErrorMessage(null);
  }, [aiConfig.model, aiConfig.provider, inlineKeyInput]);

  const handleSelectSavedKey = useCallback((keyId: string): void => {
    setUseLocalEngine(false);
    setAiConfig(setActiveAiKey(keyId));
  }, []);

  const handleToggleLocalEngine = useCallback(
    (enabled: boolean): void => {
      setUseLocalEngine(enabled);
      setIsEditingKey(!enabled && !aiConfig.apiKey);
      setErrorMessage(null);
    },
    [aiConfig.apiKey],
  );

  const handleSelectQuickPrompt = useCallback((item: QuickPrompt): void => {
    setMode('create');
    setPrompt(item.prompt);
    setSelectedStyle(item.style);
    setSelectedPieceType(item.pieceType ?? 'auto');
    if (item.archetype) {
      setSelectedArchetype(item.archetype);
    }
    if (item.includeImagery !== undefined) {
      setBrief((prev) => ({ ...prev, includeImagery: Boolean(item.includeImagery) }));
    }
    setErrorMessage(null);
    setSuccessInfo(null);
  }, []);

  const handleCancelGeneration = useCallback((): void => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
  }, []);

  const handleGenerate = useCallback(
    async (overrideArchetype?: LayoutCompositionArchetype): Promise<void> => {
      const trimmed = prompt.trim();
      if (!trimmed) {
        setErrorMessage(t('ai.promptPlaceholder'));
        return;
      }

      if (!aiConfig.apiKey && !useLocalEngine) {
        setErrorMessage(t('ai.noKeyWarning'));
        setIsEditingKey(true);
        return;
      }

      const currentLayoutSnapshot =
        mode === 'refine'
          ? (engine?.getLayoutSnapshot(pageBackgroundColor, documentTitle) ?? undefined)
          : undefined;

      if (
        mode === 'refine' &&
        (!currentLayoutSnapshot || currentLayoutSnapshot.elements.length === 0)
      ) {
        setErrorMessage(t('ai.refineEmptyCanvas'));
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setErrorMessage(null);
      setSuccessInfo(null);

      try {
        const effectiveArchetype = overrideArchetype ?? selectedArchetype;
        const briefPayload: CreativeBriefInput = {
          ...(brief.headline.trim() ? { headline: brief.headline.trim() } : {}),
          ...(brief.ctaText.trim() ? { ctaText: brief.ctaText.trim() } : {}),
          ...(brief.brandName.trim() ? { brandName: brief.brandName.trim() } : {}),
          ...(brief.useBrandColor && brief.brandColor ? { brandColor: brief.brandColor } : {}),
          ...(brief.includeImagery ? { includeImagery: true } : {}),
          language: locale,
        };

        const response = await requestAiLayoutGeneration(
          {
            prompt: trimmed,
            style: selectedStyle,
            archetype: effectiveArchetype,
            pieceType: selectedPieceType,
            mode,
            variationsCount: mode === 'refine' ? 1 : variationsCount,
            brief: briefPayload,
            ...(currentLayoutSnapshot ? { currentLayout: currentLayoutSnapshot } : {}),
            dimensions,
            ...(useLocalEngine
              ? { useLocalEngine: true }
              : {
                  apiKey: aiConfig.apiKey,
                  provider: aiConfig.provider,
                  model: aiConfig.model,
                }),
          },
          controller.signal,
        );

        if (!response.ok) {
          if (!response.aborted) {
            setErrorMessage(response.error);
          }
          return;
        }

        const concepts =
          response.variations && response.variations.length > 0
            ? response.variations
            : [response.layout];
        const primary = concepts[0]!;

        setGeneratedConcepts(concepts);
        setLastSource(response.source ?? (useLocalEngine ? 'autonomous' : 'llm'));
        setSessionHistory((prev) =>
          [primary, ...prev.filter((item) => item.id !== primary.id)].slice(0, 6),
        );

        await applyLayoutToCanvas(primary, brief.createNewArtboard);
        onGenerateSuccess?.(primary);
      } catch (err) {
        if (!controller.signal.aborted) {
          setErrorMessage(err instanceof Error ? err.message : t('ai.invalidKeyError'));
        }
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
        setIsLoading(false);
      }
    },
    [
      aiConfig,
      applyLayoutToCanvas,
      brief,
      dimensions,
      documentTitle,
      engine,
      locale,
      mode,
      onGenerateSuccess,
      pageBackgroundColor,
      prompt,
      selectedArchetype,
      selectedPieceType,
      selectedStyle,
      t,
      useLocalEngine,
      variationsCount,
    ],
  );

  const handleRegenerateVariation = useCallback((): void => {
    const activeLayout = generatedConcepts.find((c) => (c.id ?? c.title) === activeConceptId);
    const currentIdx = activeLayout?.archetype
      ? ARCHETYPE_CYCLE.indexOf(activeLayout.archetype)
      : -1;
    const nextArchetype = ARCHETYPE_CYCLE[(currentIdx + 1) % ARCHETYPE_CYCLE.length]!;
    setSelectedArchetype(nextArchetype);
    void handleGenerate(nextArchetype);
  }, [activeConceptId, generatedConcepts, handleGenerate]);

  const handleSwitchToRefine = useCallback((): void => {
    setMode('refine');
    setPrompt('');
    setErrorMessage(null);
  }, []);

  return {
    t,
    locale,
    canCreateArtboard: Boolean(session),
    dimensions,
    hasCanvasLayers,
    aiConfig,
    inlineKeyInput,
    setInlineKeyInput,
    isEditingKey,
    setIsEditingKey,
    useLocalEngine,
    mode,
    setMode,
    prompt,
    setPrompt,
    selectedPieceType,
    setSelectedPieceType,
    selectedStyle,
    setSelectedStyle,
    selectedArchetype,
    setSelectedArchetype,
    variationsCount,
    setVariationsCount,
    isBriefOpen,
    setIsBriefOpen,
    brief,
    setBrief,
    isLoading,
    errorMessage,
    setErrorMessage,
    successInfo,
    lastSource,
    generatedConcepts,
    activeConceptId,
    sessionHistory,
    applyLayoutToCanvas,
    handleSaveInlineKey,
    handleSelectSavedKey,
    handleToggleLocalEngine,
    handleSelectQuickPrompt,
    handleCancelGeneration,
    handleGenerate,
    handleRegenerateVariation,
    handleSwitchToRefine,
  };
}
