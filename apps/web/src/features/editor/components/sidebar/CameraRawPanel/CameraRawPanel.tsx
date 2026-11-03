import { useState, type ReactElement } from 'react';
import { Button, Icon } from '../../../../../components/ui/index.js';
import {
  DEFAULT_CAMERA_RAW_ADJUSTMENTS,
  type CameraRawAdjustments,
} from '../../../engine/cameraRawEngine.js';
import {
  useOptionalEditorEngine,
  useOptionalEditorSelection,
} from '../../../state/EditorProvider.js';
import styles from './CameraRawPanel.module.css';

interface ControlDef {
  readonly key: keyof CameraRawAdjustments;
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly trackClass?: string;
}

const LUZ_CONTROLS: readonly ControlDef[] = [
  { key: 'exposure', label: 'Exposição', min: -100, max: 100 },
  { key: 'contrast', label: 'Contraste', min: -100, max: 100 },
  { key: 'highlights', label: 'Realces', min: -100, max: 100 },
  { key: 'shadows', label: 'Sombras', min: -100, max: 100 },
  { key: 'whites', label: 'Brancos', min: -100, max: 100 },
  { key: 'blacks', label: 'Pretos', min: -100, max: 100 },
];

const COR_CONTROLS: readonly ControlDef[] = [
  {
    key: 'temperature',
    label: 'Temperatura',
    min: -100,
    max: 100,
    trackClass: styles.sliderTrackTemp,
  },
  { key: 'tint', label: 'Tonalidade', min: -100, max: 100, trackClass: styles.sliderTrackTint },
  { key: 'vibrance', label: 'Vibração', min: -100, max: 100 },
  { key: 'saturation', label: 'Saturação', min: -100, max: 100 },
];

const EFEITOS_BASICS: readonly ControlDef[] = [
  { key: 'texture', label: 'Textura', min: -100, max: 100 },
  { key: 'clarity', label: 'Claridade', min: -100, max: 100 },
  { key: 'dehaze', label: 'Remover névoa', min: -100, max: 100 },
];

const VINHETA_CONTROLS: readonly ControlDef[] = [
  { key: 'vignette', label: 'Quantidade', min: -100, max: 100 },
  { key: 'vignetteMidpoint', label: 'Ponto médio', min: 0, max: 100 },
  { key: 'vignetteRoundness', label: 'Arredondamento', min: -100, max: 100 },
  { key: 'vignetteFeather', label: 'Difusão', min: 0, max: 100 },
  { key: 'vignetteHighlights', label: 'Realces', min: 0, max: 100 },
];

const GRANULACAO_CONTROLS: readonly ControlDef[] = [
  { key: 'grainAmount', label: 'Quantidade', min: 0, max: 100 },
  { key: 'grainSize', label: 'Tamanho', min: 0, max: 100 },
];

export function CameraRawPanel(): ReactElement {
  const engine = useOptionalEditorEngine();
  const selection = useOptionalEditorSelection();
  const isImageSelected = selection?.selectedObject?.type === 'image';

  const [adjustments, setAdjustments] = useState<CameraRawAdjustments>(() => {
    return engine?.getCameraRaw() ?? DEFAULT_CAMERA_RAW_ADJUSTMENTS;
  });

  const [openLuz, setOpenLuz] = useState(true);
  const [openCor, setOpenCor] = useState(true);
  const [openEfeitos, setOpenEfeitos] = useState(true);

  const handleChange = (key: keyof CameraRawAdjustments, value: number): void => {
    const updated = { ...adjustments, [key]: value };
    setAdjustments(updated);
    engine?.applyCameraRaw(updated);
  };

  const handleReset = (): void => {
    setAdjustments(DEFAULT_CAMERA_RAW_ADJUSTMENTS);
    engine?.applyCameraRaw(DEFAULT_CAMERA_RAW_ADJUSTMENTS);
  };

  if (!isImageSelected) {
    return (
      <div className={styles.emptyState}>
        <Icon name="cameraRaw" size="xl" tone="muted" />
        <span className={styles.emptyTitle}>Nenhuma imagem selecionada</span>
        <span className={styles.emptyDesc}>
          Selecione uma foto ou elemento de imagem na prancheta para ajustar balanço, cor e
          iluminação.
        </span>
      </div>
    );
  }

  const renderSlider = (ctrl: ControlDef): ReactElement => {
    const val = Number(adjustments[ctrl.key] ?? 0);
    return (
      <div key={ctrl.key} className={styles.controlRow}>
        <div className={styles.labelRow}>
          <span className={styles.controlLabel}>{ctrl.label}</span>
          <input
            type="number"
            className={styles.numBox}
            value={val}
            min={ctrl.min}
            max={ctrl.max}
            onChange={(e) => handleChange(ctrl.key, Number(e.target.value) || 0)}
            aria-label={`${ctrl.label} numérico`}
          />
        </div>
        <input
          type="range"
          className={[styles.slider, ctrl.trackClass].filter(Boolean).join(' ')}
          min={ctrl.min}
          max={ctrl.max}
          value={val}
          onChange={(e) => handleChange(ctrl.key, Number(e.target.value))}
          aria-label={ctrl.label}
        />
      </div>
    );
  };

  return (
    <div className={styles.panel} data-testid="camera-raw-sidebar-panel">
      {/* Seção Luz */}
      <div className={styles.section}>
        <button
          type="button"
          className={styles.sectionHeader}
          onClick={() => setOpenLuz((p) => !p)}
          aria-expanded={openLuz}
        >
          <span
            className={[styles.sectionCarat, !openLuz ? styles.sectionCaratCollapsed : ''].join(
              ' ',
            )}
          >
            ▼
          </span>
          <span>Luz</span>
        </button>
        {openLuz && <div className={styles.sectionBody}>{LUZ_CONTROLS.map(renderSlider)}</div>}
      </div>

      {/* Seção Cor */}
      <div className={styles.section}>
        <button
          type="button"
          className={styles.sectionHeader}
          onClick={() => setOpenCor((p) => !p)}
          aria-expanded={openCor}
        >
          <span
            className={[styles.sectionCarat, !openCor ? styles.sectionCaratCollapsed : ''].join(
              ' ',
            )}
          >
            ▼
          </span>
          <span>Cor</span>
        </button>
        {openCor && (
          <div className={styles.sectionBody}>
            <span className={styles.subHeader}>Equilíbrio de branco: como fotografado</span>
            {COR_CONTROLS.map(renderSlider)}
          </div>
        )}
      </div>

      {/* Seção Efeitos */}
      <div className={styles.section}>
        <button
          type="button"
          className={styles.sectionHeader}
          onClick={() => setOpenEfeitos((p) => !p)}
          aria-expanded={openEfeitos}
        >
          <span
            className={[styles.sectionCarat, !openEfeitos ? styles.sectionCaratCollapsed : ''].join(
              ' ',
            )}
          >
            ▼
          </span>
          <span>Efeitos</span>
        </button>
        {openEfeitos && (
          <div className={styles.sectionBody}>
            {EFEITOS_BASICS.map(renderSlider)}
            <span className={styles.subGroupTitle}>Vinheta</span>
            {VINHETA_CONTROLS.map(renderSlider)}
            <span className={styles.subGroupTitle}>Granulação</span>
            {GRANULACAO_CONTROLS.map(renderSlider)}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          Redefinir
        </Button>
      </div>
    </div>
  );
}
