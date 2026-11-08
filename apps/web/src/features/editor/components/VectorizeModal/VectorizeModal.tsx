import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { Button, Icon } from '../../../../components/ui/index.js';
import { stripSvgBackground } from '../../engine/vectorTraceEngine.js';
import {
  VECTORIZE_PRESETS,
  vectorizeImageFromUrl,
  type VectorizePresetKey,
} from '../../services/vtracerService.js';
import type { VTracerOptions, VTracerProgress } from 'vtracer-browser';
import { VectorizeControls } from './VectorizeControls.js';
import { VectorizePreview } from './VectorizePreview.js';
import styles from './VectorizeModal.module.css';

export interface VectorizeModalProps {
  readonly isOpen: boolean;
  readonly imageSrc: string;
  readonly onApply: (svgString: string, mode: 'replace' | 'insert') => void;
  readonly onClose: () => void;
}

export function VectorizeModal({
  isOpen,
  imageSrc,
  onApply,
  onClose,
}: VectorizeModalProps): ReactElement | null {
  const [activePreset, setActivePreset] = useState<VectorizePresetKey>('logo');
  const [options, setOptions] = useState<VTracerOptions>(VECTORIZE_PRESETS.logo.options);
  const [removeBackground, setRemoveBackground] = useState<boolean>(true);
  const [debouncedConfig, setDebouncedConfig] = useState<{
    readonly preset: VectorizePresetKey;
    readonly options: VTracerOptions;
  }>({
    preset: 'logo',
    options: VECTORIZE_PRESETS.logo.options,
  });
  const [vectorSvg, setVectorSvg] = useState<string | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<VTracerProgress | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const runVectorization = useCallback(
    async (presetKey: VectorizePresetKey, currentOptions: VTracerOptions) => {
      if (!imageSrc) return;
      setIsProcessing(true);
      setErrorMessage(null);

      try {
        const result = await vectorizeImageFromUrl(imageSrc, {
          preset: presetKey,
          customOverrides: currentOptions,
          onProgress: (p) => {
            if (isMountedRef.current) setProgress(p);
          },
        });

        if (!isMountedRef.current) return;

        if (result.success && result.svgString) {
          setVectorSvg(result.svgString);
        } else {
          setErrorMessage(result.error ?? 'Falha ao processar vetorização da imagem.');
        }
      } catch (err) {
        if (!isMountedRef.current) return;
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMessage(msg);
      } finally {
        if (isMountedRef.current) {
          setIsProcessing(false);
          setProgress(undefined);
        }
      }
    },
    [imageSrc],
  );

  // Synchronize vectorization execution on debounced configuration changes
  useEffect(() => {
    isMountedRef.current = true;
    let cancelled = false;

    if (isOpen && imageSrc) {
      const initTimer = setTimeout(() => {
        if (!cancelled) {
          void runVectorization(debouncedConfig.preset, debouncedConfig.options);
        }
      }, 0);

      return () => {
        cancelled = true;
        clearTimeout(initTimer);
        isMountedRef.current = false;
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      };
    }

    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [isOpen, imageSrc, debouncedConfig, runVectorization]);

  // Handle preset selection
  const handleSelectPreset = (presetKey: VectorizePresetKey): void => {
    setActivePreset(presetKey);
    const newOpts = VECTORIZE_PRESETS[presetKey].options;
    setOptions(newOpts);
    setDebouncedConfig({ preset: presetKey, options: newOpts });
  };

  // Handle option slider changes with debounce
  const handleChangeOption = <K extends keyof VTracerOptions>(
    key: K,
    value: VTracerOptions[K],
  ): void => {
    const updated = { ...options, [key]: value };
    setOptions(updated);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedConfig({ preset: activePreset, options: updated });
    }, 600);
  };

  const handleResetOptions = (): void => {
    const defaultOpts = VECTORIZE_PRESETS[activePreset].options;
    setOptions(defaultOpts);
    setDebouncedConfig({ preset: activePreset, options: defaultOpts });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={styles.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="vectorize-modal-title"
      data-testid="vectorize-modal"
    >
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleGroup}>
            <Icon name="vectorize" size="sm" tone="accent" />
            <h2 id="vectorize-modal-title" className={styles.modalTitle}>
              Vetorizar Imagem (Image Trace)
            </h2>
            <span className={styles.badgePro}>WebAssembly VTracer</span>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fechar janela de vetorização"
          >
            <Icon name="close" size="xs" />
          </button>
        </div>

        <div className={styles.modalBody}>
          <VectorizePreview
            originalSrc={imageSrc}
            vectorSvg={vectorSvg}
            removeBackground={removeBackground}
            isProcessing={isProcessing}
            progressPhase={progress?.phase}
            progressFraction={progress?.fraction}
          />

          <VectorizeControls
            activePreset={activePreset}
            options={options}
            removeBackground={removeBackground}
            disabled={isProcessing}
            onSelectPreset={handleSelectPreset}
            onChangeOption={handleChangeOption}
            onToggleRemoveBackground={setRemoveBackground}
            onResetOptions={handleResetOptions}
          />
        </div>

        <div className={styles.modalFooter}>
          <div>
            {errorMessage && (
              <span style={{ fontSize: '12px', color: 'var(--color-danger, #ff3b30)' }}>
                {errorMessage}
              </span>
            )}
          </div>

          <div className={styles.footerActions}>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>

            <Button
              variant="secondary"
              size="sm"
              icon="plus"
              disabled={!vectorSvg || isProcessing}
              onClick={() => {
                if (vectorSvg) {
                  const finalSvg = removeBackground ? stripSvgBackground(vectorSvg) : vectorSvg;
                  onApply(finalSvg, 'insert');
                  onClose();
                }
              }}
              title="Adiciona o vetor como uma nova camada acima da imagem original"
            >
              Inserir como Nova Camada
            </Button>

            <Button
              variant="primary"
              size="sm"
              icon="check"
              disabled={!vectorSvg || isProcessing}
              onClick={() => {
                if (vectorSvg) {
                  const finalSvg = removeBackground ? stripSvgBackground(vectorSvg) : vectorSvg;
                  onApply(finalSvg, 'replace');
                  onClose();
                }
              }}
              title="Substitui a imagem bitmap selecionada pelo novo grupo vetorial"
            >
              Substituir Imagem
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
