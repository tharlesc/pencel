import { useState, type ReactElement } from 'react';
import { Button, Icon } from '../../../../components/ui/index.js';
import {
  DEFAULT_CAMERA_RAW_ADJUSTMENTS,
  type CameraRawAdjustments,
} from '../../engine/cameraRawEngine.js';
import styles from './CameraRawModal.module.css';

export interface CameraRawModalProps {
  readonly isOpen: boolean;
  readonly initialAdjustments?: CameraRawAdjustments;
  readonly onApply: (adjustments: CameraRawAdjustments) => void;
  readonly onLivePreview?: (adjustments: CameraRawAdjustments) => void;
  readonly onClose: () => void;
}

interface CameraRawFormProps {
  readonly initialAdjustments?: CameraRawAdjustments;
  readonly onApply: (adjustments: CameraRawAdjustments) => void;
  readonly onLivePreview?: (adjustments: CameraRawAdjustments) => void;
  readonly onClose: () => void;
}

function CameraRawForm({
  initialAdjustments,
  onApply,
  onLivePreview,
  onClose,
}: CameraRawFormProps): ReactElement {
  const [adjustments, setAdjustments] = useState<CameraRawAdjustments>(
    initialAdjustments ?? DEFAULT_CAMERA_RAW_ADJUSTMENTS,
  );

  const handleChange = (key: keyof CameraRawAdjustments, value: number): void => {
    const updated = { ...adjustments, [key]: value };
    setAdjustments(updated);
    onLivePreview?.(updated);
  };

  const handleReset = (): void => {
    setAdjustments(DEFAULT_CAMERA_RAW_ADJUSTMENTS);
    onLivePreview?.(DEFAULT_CAMERA_RAW_ADJUSTMENTS);
  };

  const handleApply = (): void => {
    onApply(adjustments);
    onClose();
  };

  return (
    <div
      className={styles.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-raw-title"
      data-testid="camera-raw-modal"
    >
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleGroup}>
            <Icon name="cameraRaw" size="sm" tone="accent" />
            <h2 id="camera-raw-title" className={styles.modalTitle}>
              Filtro Camera Raw
            </h2>
            <span className={styles.badgePro}>Grading IA</span>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fechar painel Camera Raw"
          >
            <Icon name="close" size="xs" />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div>
            <div className={styles.sectionHeader}>Luz & Exposição</div>
            <div className={styles.sliderGrid}>
              <div className={styles.sliderRow}>
                <span className={styles.sliderLabel}>Exposição</span>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={adjustments.exposure}
                  onChange={(e) => handleChange('exposure', Number(e.target.value))}
                  className={styles.rangeInput}
                  aria-label="Ajustar exposição"
                />
                <span className={styles.sliderValue}>{adjustments.exposure}</span>
              </div>

              <div className={styles.sliderRow}>
                <span className={styles.sliderLabel}>Contraste</span>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={adjustments.contrast}
                  onChange={(e) => handleChange('contrast', Number(e.target.value))}
                  className={styles.rangeInput}
                  aria-label="Ajustar contraste"
                />
                <span className={styles.sliderValue}>{adjustments.contrast}</span>
              </div>

              <div className={styles.sliderRow}>
                <span className={styles.sliderLabel}>Realces</span>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={adjustments.highlights}
                  onChange={(e) => handleChange('highlights', Number(e.target.value))}
                  className={styles.rangeInput}
                  aria-label="Ajustar realces"
                />
                <span className={styles.sliderValue}>{adjustments.highlights}</span>
              </div>

              <div className={styles.sliderRow}>
                <span className={styles.sliderLabel}>Sombras</span>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={adjustments.shadows}
                  onChange={(e) => handleChange('shadows', Number(e.target.value))}
                  className={styles.rangeInput}
                  aria-label="Ajustar sombras"
                />
                <span className={styles.sliderValue}>{adjustments.shadows}</span>
              </div>
            </div>
          </div>

          <div>
            <div className={styles.sectionHeader}>Cor & Balanço de Branco</div>
            <div className={styles.sliderGrid}>
              <div className={styles.sliderRow}>
                <span className={styles.sliderLabel}>Temperatura</span>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={adjustments.temperature}
                  onChange={(e) => handleChange('temperature', Number(e.target.value))}
                  className={styles.rangeInput}
                  aria-label="Ajustar temperatura"
                />
                <span className={styles.sliderValue}>{adjustments.temperature}</span>
              </div>

              <div className={styles.sliderRow}>
                <span className={styles.sliderLabel}>Colorir (Tint)</span>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={adjustments.tint}
                  onChange={(e) => handleChange('tint', Number(e.target.value))}
                  className={styles.rangeInput}
                  aria-label="Ajustar coloração"
                />
                <span className={styles.sliderValue}>{adjustments.tint}</span>
              </div>

              <div className={styles.sliderRow}>
                <span className={styles.sliderLabel}>Vibração</span>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={adjustments.vibrance}
                  onChange={(e) => handleChange('vibrance', Number(e.target.value))}
                  className={styles.rangeInput}
                  aria-label="Ajustar vibração"
                />
                <span className={styles.sliderValue}>{adjustments.vibrance}</span>
              </div>

              <div className={styles.sliderRow}>
                <span className={styles.sliderLabel}>Saturação</span>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={adjustments.saturation}
                  onChange={(e) => handleChange('saturation', Number(e.target.value))}
                  className={styles.rangeInput}
                  aria-label="Ajustar saturação"
                />
                <span className={styles.sliderValue}>{adjustments.saturation}</span>
              </div>
            </div>
          </div>

          <div>
            <div className={styles.sectionHeader}>Efeitos & Detalhes</div>
            <div className={styles.sliderGrid}>
              <div className={styles.sliderRow}>
                <span className={styles.sliderLabel}>Clareza</span>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={adjustments.clarity}
                  onChange={(e) => handleChange('clarity', Number(e.target.value))}
                  className={styles.rangeInput}
                  aria-label="Ajustar clareza"
                />
                <span className={styles.sliderValue}>{adjustments.clarity}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Redefinir Padrões
          </Button>
          <div className={styles.footerActions}>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" onClick={handleApply}>
              Aplicar Filtro
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CameraRawModal(props: CameraRawModalProps): ReactElement | null {
  if (!props.isOpen) return null;

  return (
    <CameraRawForm
      key={props.isOpen ? 'open' : 'closed'}
      initialAdjustments={props.initialAdjustments}
      onApply={props.onApply}
      onLivePreview={props.onLivePreview}
      onClose={props.onClose}
    />
  );
}
